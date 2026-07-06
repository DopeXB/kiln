const rateLimit = require('express-rate-limit');

// Auth endpoints: guards against password-guessing and signup spam.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

// Chat endpoint: the credit system already limits total spend, but this
// stops one account/script from hammering the API in a tight loop.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Sending messages too fast — slow down a moment.' },
});

module.exports = { authLimiter, chatLimiter };
