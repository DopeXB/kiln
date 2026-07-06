// Sends transactional email (currently just password resets).
//
// If SMTP_HOST/SMTP_USER/SMTP_PASS are set in .env, real email goes out
// through that SMTP server (works with SendGrid, Postmark, Gmail app
// passwords, AWS SES SMTP, etc — anything that speaks SMTP).
//
// If they're not set, this just logs the email to the console instead of
// sending it, so password reset is fully testable with zero email setup.

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, text }) {
  const t = getTransporter();
  if (!t) {
    console.log('--- DEV EMAIL (no SMTP configured in .env) ---');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log(text);
    console.log('-----------------------------------------------');
    return;
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || 'Kiln <no-reply@kiln.app>',
    to,
    subject,
    text,
  });
}

module.exports = { sendMail };
