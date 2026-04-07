const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SENDGRID_API_KEY) {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else {
    // Fallback: standard SMTP or Ethereal for dev
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  try {
    const info = await getTransporter().sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'VoltStore'}" <${process.env.EMAIL_FROM || 'noreply@voltstore.com'}>`,
      to,
      subject,
      html,
      text,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error('Email send failed', err);
    throw err;
  }
}

module.exports = { sendMail };
