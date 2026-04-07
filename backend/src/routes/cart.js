const router = require('express').Router();
const { prisma } = require('../config/database');
const { optionalAuth, authenticate } = require('../middleware/auth');

// Helper — get or create cart
async function getOrCreateCart(req) {
  const userId    = req.user?.id;
  const sessionId = req.headers['x-session-id'];

  if (userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: cartInclude(),
    });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId }, include: cartInclude() });
    }
    return cart;
  }

  if (sessionId) {
    let cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: cartInclude(),
    });
    if (!cart) {
      cart = await prisma.cart.create({ data: { sessionId }, include: cartInclude() });
    }
    return cart;
  }

  throw Object.assign(new Error('Session ID or auth required'), { status: 400 });
}

function cartInclude() {
  return {
    items: {
      include: {
        product: {
          include: { images: { where: { isPrimary: true }, take: 1 } },
        },
        variant: true,
      },
      orderBy: { createdAt: 'asc' },
    },
  };
}

function calcTotals(cart) {
  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const discount = Number(cart.discountAmount) || 0;
  const shipping = subtotal > 0 ? (subtotal >= 45 ? 0 : 9.99) : 0;
  const tax = (subtotal - discount) * 0.08;
  return {
    subtotal: +subtotal.toFixed(2),
    discountAmount: +discount.toFixed(2),
    shipping: +shipping.toFixed(2),
    tax: +tax.toFixed(2),
    total: +(subtotal - discount + shipping + tax).toFixed(2),
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

// GET /api/cart
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req);
    res.json({ success: true, data: { cart, totals: calcTotals(cart) } });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/items
router.post('/items', optionalAuth, async (req, res, next) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'productId required' });

    // Validate product & variant
    const variant = variantId
      ? await prisma.productVariant.findUnique({ where: { id: variantId } })
      : null;
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const price = variant ? Number(variant.price) : Number(product.basePrice);
    const inventory = variant ? variant.inventory : 9999;
    if (inventory < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient inventory' });
    }

    const cart = await getOrCreateCart(req);

    // Check if item already in cart
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: variantId || null } },
    });

    let item;
    if (existing) {
      item = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      item = await prisma.cartItem.create({
        data: { cartId: cart.id, productId, variantId: variantId || null, quantity, price },
      });
    }

    // Update cart timestamp to reset abandoned cart timer
    await prisma.cart.update({
      where: { id: cart.id },
      data: { abandonedAt: null, recoveryEmailSentAt: null },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude(),
    });

    res.json({ success: true, data: { cart: updatedCart, totals: calcTotals(updatedCart) } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/cart/items/:id
router.patch('/items/:id', optionalAuth, async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'quantity must be >= 1' });
    }

    const cart = await getOrCreateCart(req);
    const item = await prisma.cartItem.findFirst({
      where: { id: req.params.id, cartId: cart.id },
    });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude(),
    });
    res.json({ success: true, data: { cart: updatedCart, totals: calcTotals(updatedCart) } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart/items/:id
router.delete('/items/:id', optionalAuth, async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req);
    const item = await prisma.cartItem.findFirst({
      where: { id: req.params.id, cartId: cart.id },
    });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    await prisma.cartItem.delete({ where: { id: item.id } });

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude(),
    });
    res.json({ success: true, data: { cart: updatedCart, totals: calcTotals(updatedCart) } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart — clear
router.delete('/', optionalAuth, async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { discountCode: null, discountAmount: 0 },
    });
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude(),
    });
    res.json({ success: true, data: { cart: updatedCart, totals: calcTotals(updatedCart) } });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/discount
router.post('/discount', optionalAuth, async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Discount code required' });

    const discount = await prisma.discount.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discount || !discount.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid discount code' });
    }
    if (discount.expiresAt && discount.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Discount code has expired' });
    }
    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return res.status(400).json({ success: false, message: 'Discount code usage limit reached' });
    }

    const cart = await getOrCreateCart(req);
    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    if (discount.minOrderAmount && subtotal < Number(discount.minOrderAmount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of $${discount.minOrderAmount} required`,
      });
    }

    let discountAmount = 0;
    if (discount.type === 'PERCENTAGE') {
      discountAmount = (subtotal * Number(discount.value)) / 100;
    } else if (discount.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(Number(discount.value), subtotal);
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { discountCode: code.toUpperCase(), discountAmount },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude(),
    });
    res.json({
      success: true,
      message: 'Discount applied',
      data: { cart: updatedCart, totals: calcTotals(updatedCart), discount },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/merge — merge guest cart into user cart on login
router.post('/merge', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.json({ success: true });

    const guestCart = await prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });
    if (!guestCart || guestCart.items.length === 0) return res.json({ success: true });

    let userCart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!userCart) {
      userCart = await prisma.cart.create({ data: { userId: req.user.id } });
    }

    const operations = guestCart.items.map((item) =>
      prisma.cartItem.upsert({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId || '' } },
        update: { quantity: { increment: item.quantity } },
        create: {
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        },
      })
    );
    await Promise.all(operations);
    await prisma.cart.delete({ where: { id: guestCart.id } });

    const merged = await prisma.cart.findUnique({
      where: { id: userCart.id },
      include: cartInclude(),
    });
    res.json({ success: true, data: { cart: merged, totals: calcTotals(merged) } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
