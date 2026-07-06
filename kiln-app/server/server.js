require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const usageRoutes = require('./routes/usage');
const { router: billingRoutes, webhookHandler } = require('./routes/billing');
const { authLimiter, chatLimiter } = require('./middleware/rateLimit');

const REQUIRED_ENV = ['ANTHROPIC_API_KEY', 'JWT_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.warn(`Warning: missing env vars: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
}

const app = express();
app.use(cors());

// Stripe webhook needs the raw body for signature verification, so it must
// be registered BEFORE express.json() runs on this path.
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), webhookHandler);

app.use(express.json());

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/usage', usageRoutes);

// Serve the frontend
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Kiln server running at http://localhost:${PORT}`);
});
