const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireAuth, (req, res) => {
  const entries = db.getUsageForUser(req.userId);
  const totalMessages = entries.length;
  const totalCredits = entries.reduce((sum, e) => sum + (e.credits || 0), 0);
  const byMode = entries.reduce((acc, e) => {
    acc[e.mode] = (acc[e.mode] || 0) + 1;
    return acc;
  }, {});

  res.json({
    summary: { totalMessages, totalCredits, byMode },
    entries: entries.slice(0, 200), // most recent 200
  });
});

module.exports = router;
