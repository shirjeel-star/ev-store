const router = require('express').Router();
const stripe = require('../config/stripe');
const { prisma } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { sendOrderConfirmation } = require('../services/emailService');
const logger = require('../config/logger');

// ─────────────────────────────────────────
// POST /api/payments/intent
// Creates a Stripe PaymentIntent for checkout
// ─────────────────────────────────────────
router.post('/intent', optionalAuth, async (req, res, next) => {
  try {
    const { cartId, shippingAddress, billingAddress, shippingMethod, referralCode } = req.body;

    if (!cartId) return res.status(400).json({ success: false, message: 'cartId required' });

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: { include: { product: true, variant: true } },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity, 0
    );
    const discountAmount = Number(cart.discountAmount) || 0;
    const shippingCost   = subtotal >= 45 ? 0 : 9.99;
    const tax            = (subtotal - discountAmount) * 0.08;
    const total          = Math.round((subtotal - discountAmount + shippingCost + tax) * 100); // cents

    // Get or create Stripe customer
    let customerId;
    if (req.user?.stripeCustomerId) {
      customerId = req.user.stripeCustomerId;
    } else if (req.user) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: `${req.user.firstName} ${req.user.lastName}`,
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: req.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Build line_items metadata for display
    const lineItemsMetadata = cart.items
      .map((i) => `${i.quantity}x ${i.product.name}${i.variant ? ` (${i.variant.name})` : ''}`)
      .join('; ')
      .slice(0, 500);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        cartId,
        userId: req.user?.id || 'guest',
        orderItems: lineItemsMetadata,
        discountCode: cart.discountCode || '',
        referralCode: referralCode || '',
      },
      description: `VoltStore order — ${cart.items.length} item(s)`,
      receipt_email: req.user?.email || shippingAddress?.email,
      shipping: shippingAddress
        ? {
            name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
            address: {
              line1: shippingAddress.line1,
              line2: shippingAddress.line2 || '',
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.zip,
              country: shippingAddress.country || 'US',
            },
          }
        : undefined,
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        totals: {
          subtotal: +subtotal.toFixed(2),
          discountAmount: +discountAmount.toFixed(2),
          shipping: +shippingCost.toFixed(2),
          tax: +tax.toFixed(2),
          total: +(total / 100).toFixed(2),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /api/payments/confirm
// Called by frontend after payment succeeds — creates the Order record
// ─────────────────────────────────────────
router.post('/confirm', optionalAuth, async (req, res, next) => {
  try {
    const { paymentIntentId, cartId, shippingAddress, billingAddress, shippingMethod, referralCode } = req.body;

    if (!paymentIntentId || !cartId) {
      return res.status(400).json({ success: false, message: 'paymentIntentId and cartId required' });
    }

    // Verify payment on Stripe side
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: `Payment not completed (status: ${pi.status})` });
    }

    // Idempotency — check if order already created
    const existing = await prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (existing) {
      return res.json({ success: true, data: existing });
    }

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: { include: { product: true, variant: true } },
      },
    });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart not found' });
    }

    const subtotal      = cart.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
    const discountAmount = Number(cart.discountAmount) || 0;
    const shippingAmt   = subtotal >= 45 ? 0 : 9.99;
    const taxAmt        = (subtotal - discountAmount) * 0.08;
    const total         = subtotal - discountAmount + shippingAmt + taxAmt;

    // Resolve discount
    let discountId = null;
    if (cart.discountCode) {
      const disc = await prisma.discount.findUnique({ where: { code: cart.discountCode } });
      if (disc) {
        discountId = disc.id;
        await prisma.discount.update({
          where: { id: disc.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // Resolve partner from referral code
    let partnerId = null;
    if (referralCode) {
      const partner = await prisma.partner.findUnique({ where: { referralCode } });
      if (partner && partner.status === 'APPROVED') partnerId = partner.id;
    }

    function makeOrderNumber() {
      return `VS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: makeOrderNumber(),
        userId: req.user?.id || null,
        guestEmail: !req.user ? shippingAddress?.email : null,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: pi.latest_charge,
        subtotal,
        discountAmount,
        shippingAmount: shippingAmt,
        taxAmount: taxAmt,
        total,
        currency: 'USD',
        shippingSnapshot: shippingAddress,
        billingSnapshot: billingAddress,
        shippingMethod: shippingMethod || 'standard',
        discountCode: cart.discountCode,
        discountId,
        partnerId,
        referralCode,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.product.name,
            sku: item.variant?.sku || item.product.sku,
            variantName: item.variant?.name || null,
            quantity: item.quantity,
            price: item.price,
            total: Number(item.price) * item.quantity,
            options: item.variant?.options || null,
          })),
        },
      },
      include: { items: { include: { product: true, variant: true } } },
    });

    // Decrement inventory
    for (const item of cart.items) {
      if (item.variantId) {
        await prisma.productVariant
          .update({
            where: { id: item.variantId },
            data: { inventory: { decrement: item.quantity } },
          })
          .catch(() => {});
      }
    }

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { discountCode: null, discountAmount: 0 },
    });

    // Create commission if partner
    if (partnerId) {
      const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
      if (partner) {
        const commAmt = +(total * (Number(partner.commissionRate) / 100)).toFixed(2);
        await prisma.commission.create({
          data: { partnerId, orderId: order.id, amount: commAmt, rate: partner.commissionRate },
        });
        await prisma.partner.update({
          where: { id: partnerId },
          data: { pendingEarnings: { increment: commAmt } },
        });
      }
    }

    // Send confirmation email (non-blocking)
    const email = req.user?.email || shippingAddress?.email;
    if (email) {
      sendOrderConfirmation(email, order).catch((e) => logger.error('Order email failed', e));
    }

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /api/payments/webhook
// Stripe webhook — raw body required (registered in app.js)
// ─────────────────────────────────────────
async function webhookHandler(req, res) {
  const sig     = req.headers['stripe-signature'];
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info(`Stripe webhook event: ${event.type}`);

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      // Update order payment status if created via webhook path
      await prisma.order
        .updateMany({
          where: { stripePaymentIntentId: pi.id, paymentStatus: 'UNPAID' },
          data: { paymentStatus: 'PAID', status: 'CONFIRMED', stripeChargeId: pi.latest_charge },
        })
        .catch(() => {});
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      await prisma.order
        .updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { paymentStatus: 'FAILED', status: 'CANCELLED' },
        })
        .catch(() => {});
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object;
      await prisma.order
        .updateMany({
          where: { stripeChargeId: charge.id },
          data: {
            paymentStatus: charge.amount_refunded === charge.amount ? 'REFUNDED' : 'PARTIALLY_PAID',
            status: charge.amount_refunded === charge.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          },
        })
        .catch(() => {});
      break;
    }

    default:
      logger.debug(`Unhandled Stripe event: ${event.type}`);
  }

  res.json({ received: true });
}

// GET /api/payments/setup-intent — for saving cards
router.get('/setup-intent', authenticate, async (req, res, next) => {
  try {
    let customerId = req.user.stripeCustomerId;
    if (!customerId) {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: req.user.id }, data: { stripeCustomerId: customerId } });
    }
    const si = await stripe.setupIntents.create({ customer: customerId });
    res.json({ success: true, data: { clientSecret: si.client_secret } });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/refund
router.post('/refund', authenticate, async (req, res, next) => {
  try {
    const { orderId, amount, reason } = req.body;
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user.id, paymentStatus: 'PAID' },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason || 'requested_by_customer',
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: amount && amount < Number(order.total) ? 'PARTIALLY_PAID' : 'REFUNDED',
        status: amount && amount < Number(order.total) ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
      },
    });

    res.json({ success: true, data: refund });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.webhookHandler = webhookHandler;
