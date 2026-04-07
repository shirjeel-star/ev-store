const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  appInfo: { name: 'VoltStore', version: '1.0.0' },
});

module.exports = stripe;
