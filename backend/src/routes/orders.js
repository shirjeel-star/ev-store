const router = require('express').Router();
const { prisma } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendOrderConfirmation } = require('../services/emailService');

function generateOrderNumber() {
  return `VS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// GET /api/orders — list user orders
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
              variant: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ success: true, orders, total });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        items: {
          include: {
            product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
            variant: true,
          },
        },
        discount: true,
      },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders — create order (called after successful payment)
// This is an internal endpoint called by the payments webhook
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      cartId, shippingAddress, billingAddress, shippingMethod,
      paymentIntentId, discountCode, referralCode,
    } = req.body;

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty or not found' });
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity, 0
    );
    const discountAmount = Number(cart.discountAmount) || 0;
    const shippingAmount = subtotal >= 45 ? 0 : 9.99;
    const taxAmount = (subtotal - discountAmount) * 0.08;
    const total = subtotal - discountAmount + shippingAmount + taxAmount;

    // Resolve discount
    let discountId = null;
    if (discountCode) {
      const discount = await prisma.discount.findUnique({
        where: { code: discountCode.toUpperCase() },
      });
      if (discount) {
        discountId = discount.id;
        await prisma.discount.update({
          where: { id: discount.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // Resolve partner
    let partnerId = null;
    if (referralCode) {
      const partner = await prisma.partner.findUnique({ where: { referralCode } });
      if (partner && partner.status === 'APPROVED') partnerId = partner.id;
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user.id,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        stripePaymentIntentId: paymentIntentId,
        subtotal,
        discountAmount,
        shippingAmount,
        taxAmount,
        total,
        currency: 'USD',
        shippingSnapshot: shippingAddress,
        billingSnapshot: billingAddress,
        shippingMethod,
        discountCode,
        discountId,
        partnerId,
        referralCode,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.product.name,
            sku: item.variant?.sku || item.product.sku,
            variantName: item.variant?.name,
            quantity: item.quantity,
            price: item.price,
            total: Number(item.price) * item.quantity,
            imageUrl: null,
            options: item.variant?.options,
          })),
        },
      },
      include: { items: true },
    });

    // Decrement inventory
    for (const item of cart.items) {
      if (item.variantId) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { inventory: { decrement: item.quantity } },
        });
      }
    }

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/cancel
router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled' });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
