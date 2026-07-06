const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const CREDIT_COST_PER_MESSAGE = 1;

const PERSONA = "You are Wick, the assistant built into Kiln, a workbench for turning raw ideas into finished things. " +
  "Personality: direct, low-ego, quietly confident — like a good foreman who's seen a thousand half-formed ideas and knows which ones are worth the material. " +
  "You don't do hype or corporate cheerleading ('exciting opportunity!', 'let's dive in!'). You do plain, useful, occasionally dry. " +
  "You'd rather tell someone their idea has a hole in it now than let them find out later. You use workshop/craft language sparingly and only when it fits naturally — never forced. " +
  "You keep a bit of warmth under the bluntness; you're rooting for the person, you just don't perform it. Get to the point fast, then go deep if the task needs it.";

const systemPrompts = {
  chat: PERSONA + " Right now you're in General mode: help with whatever the person brings, clearly and without padding.",
  code: PERSONA + " Right now you're in Code mode: help write, debug, and explain code. Be precise about what it does and what's actually wrong with it — no vague reassurance. Prefer corrected code blocks over long prose explanations.",
  business: PERSONA + " Right now you're in Business mode, working with founders and small operators. Give concrete, structured, actionable output — real frameworks, sharp questions, real next steps. If an idea or plan has a weak point, name it plainly instead of softening it. Use clear headers and short sections.",
};

router.post('/', requireAuth, async (req, res) => {
  const { mode, messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array.' });
  }
  const system = systemPrompts[mode] || systemPrompts.chat;

  // Check + reserve credits BEFORE calling the model, so a slow/failed
  // request can't be used to dodge the charge.
  const result = db.deductCredit(req.userId, CREDIT_COST_PER_MESSAGE);
  if (!result) return res.status(404).json({ error: 'User not found.' });
  if (result.insufficient) {
    return res.status(402).json({ error: 'Out of credits. Buy more to keep going.', credits: result.user.credits });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      // Refund the credit since the call failed on our side.
      db.addCredits(req.userId, CREDIT_COST_PER_MESSAGE);
      return res.status(502).json({ error: 'The model API returned an error.', detail: errText });
    }

    const data = await response.json();
    const reply = (data.content || [])
      .map(block => (block.type === 'text' ? block.text : ''))
      .filter(Boolean)
      .join('\n');

    const lastUserMessage = messages[messages.length - 1];
    const preview = typeof lastUserMessage?.content === 'string'
      ? lastUserMessage.content.slice(0, 90)
      : '';

    db.addUsageEntry({
      id: require('crypto').randomUUID(),
      userId: req.userId,
      mode: mode || 'chat',
      credits: CREDIT_COST_PER_MESSAGE,
      preview,
      timestamp: new Date().toISOString(),
    });

    const updatedUser = db.getUserById(req.userId);
    res.json({ reply, credits: updatedUser.credits });
  } catch (err) {
    db.addCredits(req.userId, CREDIT_COST_PER_MESSAGE);
    res.status(500).json({ error: 'Server error reaching the model.', detail: err.message });
  }
});

module.exports = router;
