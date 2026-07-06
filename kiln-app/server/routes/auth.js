const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendMail } = require('../mailer');

const router = express.Router();

const FREE_STARTING_CREDITS = 20;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function issueToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function publicUser(user) {
  return { id: user.id, email: user.email, credits: user.credits };
}

router.post('/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (db.getUserByEmail(email)) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = db.createUser({
    id: crypto.randomUUID(),
    email,
    passwordHash,
    startingCredits: FREE_STARTING_CREDITS,
  });

  const token = issueToken(user.id);
  res.json({ token, user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  const token = issueToken(user.id);
  res.json({ token, user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.getUserById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(user) });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  // Always return the same generic response whether or not the account
  // exists — this keeps the endpoint from being usable to find out which
  // emails are registered.
  const genericResponse = { message: 'If an account exists for that email, a reset link has been sent.' };

  const user = db.getUserByEmail(email);
  if (!user) return res.json(genericResponse);

  const token = crypto.randomBytes(32).toString('hex');
  db.setResetToken(email, token, Date.now() + RESET_TOKEN_TTL_MS);

  const resetUrl = `${process.env.CLIENT_URL}/?resetToken=${token}`;
  try {
    await sendMail({
      to: email,
      subject: 'Reset your Kiln password',
      text: `Someone (hopefully you) asked to reset the password on this Kiln account.\n\n` +
        `Reset it here (this link works for 1 hour): ${resetUrl}\n\n` +
        `If you didn't request this, you can ignore this email.`,
    });
  } catch (err) {
    console.error('Failed to send reset email:', err.message);
  }

  res.json(genericResponse);
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const user = db.getUserByResetToken(token);
  if (!user) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  db.updatePassword(user.id, passwordHash);

  const freshToken = issueToken(user.id);
  res.json({ token: freshToken, user: publicUser(user) });
});

module.exports = router;
