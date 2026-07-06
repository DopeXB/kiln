# Kiln

A standalone AI workbench: login, a credit system, and Wick (an AI assistant
with a fixed personality) working across three modes — General, Code, and
Business. This is a real, runnable starter project, not a demo.

## How it's built

```
kiln-app/
├── server/            Node/Express backend — the only thing that touches
│   ├── server.js       your Anthropic API key and your Stripe secret key
│   ├── db.js           simple JSON-file datastore (swap for real DB later)
│   ├── mailer.js        sends password-reset emails (or logs them in dev)
│   ├── routes/
│   │   ├── auth.js     register / login / me / forgot+reset password
│   │   ├── chat.js     proxies to Claude, deducts a credit, logs usage
│   │   ├── billing.js  Stripe checkout + webhook
│   │   └── usage.js    per-user message history + credit-spend summary
│   └── middleware/
│       ├── auth.js      JWT verification
│       └── rateLimit.js rate limits on auth + chat endpoints
└── public/            Frontend — plain HTML/CSS/JS, no build step
    ├── index.html
    └── app.js
```

The browser never sees your API keys. It logs in, gets a JWT, and every
request to Claude goes: **browser → your server → Anthropic**. Same for
payments: the browser never touches your Stripe secret key.

## 1. Install

```bash
cd server
npm install
```

## 2. Configure

```bash
cp .env.example .env
```

Fill in `.env`:
- `ANTHROPIC_API_KEY` — from https://console.anthropic.com
- `JWT_SECRET` — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `STRIPE_SECRET_KEY` — from https://dashboard.stripe.com/apikeys (use a **test** key while developing — it starts with `sk_test_`)
- `STRIPE_WEBHOOK_SECRET` — see step 4 below
- `CLIENT_URL` — `http://localhost:3000` while developing

## 3. Run it

```bash
npm start
```

Open http://localhost:3000. Create an account — new accounts start with 20
free credits — and start talking to Wick.

## 4. Wire up Stripe payments

Credits are bought through Stripe Checkout. To test this locally you need
Stripe to be able to reach your webhook, which the [Stripe CLI](https://docs.stripe.com/stripe-cli) handles without deploying anything:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/billing/webhook
```

That command prints a `whsec_...` value — put it in `STRIPE_WEBHOOK_SECRET`
in your `.env` and restart the server. Now:

1. Click "Buy more" in the app, pick a pack, and check out using Stripe's
   test card `4242 4242 4242 4242`, any future expiry, any CVC.
2. After checkout, Stripe calls your webhook and the credits land on your
   account automatically — refresh and you'll see the new balance.

Credit packs are defined in `server/routes/billing.js` (`PACKS`) — edit the
names, prices, and credit amounts there.

## Password reset

Click "Forgot your password?" on the login screen, enter an email, and a
reset link gets sent. With no SMTP configured, the email is just printed to
your server console (look for `--- DEV EMAIL ---`) — copy the link from
there and open it to set a new password. Set `SMTP_HOST` / `SMTP_USER` /
`SMTP_PASS` in `.env` to send real emails instead (works with SendGrid,
Postmark, AWS SES SMTP, a Gmail app password, etc).

Reset links expire after 1 hour (`RESET_TOKEN_TTL_MS` in `routes/auth.js`).

## Rate limiting

`server/middleware/rateLimit.js` applies two limits:
- **Auth routes** (`/api/auth/*`): 20 requests per 15 minutes per IP — slows
  down password-guessing and signup spam.
- **Chat route** (`/api/chat`): 30 requests per minute per IP — a backstop
  against a script hammering the endpoint, on top of the credit system.

Adjust `windowMs`/`max` in that file to taste.

## Usage dashboard

Every chat message is logged (mode, timestamp, credits spent, and a short
preview of what was asked) and shown in-app via the "View usage" button in
the sidebar — total messages, total credits spent, a breakdown by mode, and
a scrollable history. The data comes from `GET /api/usage/me`, backed by
`getUsageForUser()` in `db.js`.

## Adjusting the credit cost per message

`CREDIT_COST_PER_MESSAGE` in `server/routes/chat.js` is currently a flat 1
credit per message regardless of length. If you want cost to track actual
usage, `data.usage.input_tokens` / `data.usage.output_tokens` come back in
the Anthropic API response — you could deduct proportionally to that
instead.

## Before you take real payments from real people

This project is built to be genuinely usable, but a few things are
deliberately simple so it runs with zero external services. Upgrade these
before you have real users and real money moving through it:

- **Database**: `server/db.js` is a JSON file. Fine for testing, not for
  concurrent users at any scale — swap it for Postgres, MySQL, or similar.
  The function signatures (`getUserByEmail`, `createUser`, `addCredits`,
  `deductCredit`) are the contract the rest of the app relies on, so you can
  reimplement just this file.
- **Stripe live mode**: switch `STRIPE_SECRET_KEY` to your live key and set
  up a real webhook endpoint in the Stripe dashboard (Developers → Webhooks)
  pointing at `https://yourdomain.com/api/billing/webhook`, instead of using
  the CLI tunnel.
- **HTTPS**: required in production — don't send passwords or tokens over
  plain HTTP.
- **Email verification / password reset**: not included here. Worth adding
  before a public launch.
- **Rate limiting**: nothing currently stops one account from hammering
  `/api/chat`. Consider `express-rate-limit` on top of the credit system.
- **Hosting**: this runs anywhere Node runs — Render, Railway, Fly.io, a
  plain VPS, etc. Set the same environment variables there that you have in
  your local `.env`.

## Customizing Wick

Wick's personality lives in `PERSONA` at the top of `server/routes/chat.js`
— edit that string to change the assistant's tone, and edit `systemPrompts`
to change what each mode (General/Code/Business) asks Wick to focus on.
