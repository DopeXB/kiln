const express = require('express');
const Stripe = require('stripe');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Credit packs. Edit prices/credits here — no need to pre-create Products
// in the Stripe dashboard, since we use price_data to define them inline.
const PACKS = {
  starter: { name: 'Starter — 100 credits', credits: 100, amountCents: 500 },
  builder: { name: 'Builder — 500 credits', credits: 500, amountCents: 2000 },
  pro: { name: 'Pro — 2000 credits', credits: 2000, amountCents: 6000 },
};

router.get('/packs', (req, res) => {
  res.json({ packs: PACKS });
});

router.post('/create-checkout-session', requireAuth, async (req, res) => {
  const { packId } = req.body || {};
  const pack = PACKS[packId];
  if (!pack) return res.status(400).json({ error: 'Unknown credit pack.' });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: pack.name },
            unit_amount: pack.amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: req.userId,
        packId,
        credits: String(pack.credits),
      },
      success_url: `${process.env.CLIENT_URL}/?purchase=success`,
      cancel_url: `${process.env.CLIENT_URL}/?purchase=cancelled`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Could not start checkout.', detail: err.message });
  }
});

// NOTE: this route is mounted with express.raw() in server.js, not
// express.json() — Stripe's signature check needs the raw request body.
async function webhookHandler(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature check failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, credits } = session.metadata || {};
    if (userId && credits) {
      db.addCredits(userId, parseInt(credits, 10));
      console.log(`Credited ${credits} credits to user ${userId}`);
    }
  }

  res.json({ received: true });
}

module.exports = { router, webhookHandler };
