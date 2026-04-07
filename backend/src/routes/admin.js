const router = require('express').Router();
const { prisma } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendShippingConfirmation } = require('../services/emailService');
const stripe = require('../config/stripe');
const slugify = require('slugify');

// All admin routes require admin auth
router.use(authenticate, requireAdmin);

// ─────────────────────────────────────────
// DASHBOARD / ANALYTICS
// ─────────────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
  try {
    const now      = new Date();
    const d30ago   = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const d30prev  = new Date(now - 60 * 24 * 60 * 60 * 1000);
    const today    = new Date(now.toDateString());

    const [
      totalOrders, totalRevenue, totalCustomers, totalProducts,
      ordersThisMonth, revenueThisMonth, ordersLastMonth, revenueLastMonth,
      ordersByStatus, recentOrders, topProducts, revenueByDay,
      pendingPartners, pendingReviews,
    ] = await Promise.all([
      prisma.order.count({ where: { paymentStatus: 'PAID' } }),
      prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { total: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count({ where: { paymentStatus: 'PAID', createdAt: { gte: d30ago } } }),
      prisma.order.aggregate({ where: { paymentStatus: 'PAID', createdAt: { gte: d30ago } }, _sum: { total: true } }),
      prisma.order.count({ where: { paymentStatus: 'PAID', createdAt: { gte: d30prev, lt: d30ago } } }),
      prisma.order.aggregate({ where: { paymentStatus: 'PAID', createdAt: { gte: d30prev, lt: d30ago } }, _sum: { total: true } }),
      prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
      prisma.$queryRaw`
        SELECT DATE_TRUNC('day', created_at) AS day, SUM(total) AS revenue, COUNT(*) AS orders
        FROM orders WHERE payment_status = 'PAID' AND created_at >= ${d30ago}
        GROUP BY day ORDER BY day ASC
      `,
      prisma.partner.count({ where: { status: 'PENDING' } }),
      prisma.review.count({ where: { status: 'PENDING' } }),
    ]);

    // Enrich top products
    const productDetails = await prisma.product.findMany({
      where: { id: { in: topProducts.map((p) => p.productId) } },
      select: { id: true, name: true, images: { where: { isPrimary: true }, take: 1 } },
    });

    const enrichedTopProducts = topProducts.map((tp) => ({
      ...tp,
      product: productDetails.find((p) => p.id === tp.productId),
    }));

    const prevRev = Number(revenueLastMonth._sum.total || 0);
    const currRev = Number(revenueThisMonth._sum.total || 0);

    res.json({
      success: true,
      data: {
        totals: {
          orders: totalOrders,
          revenue: Number(totalRevenue._sum.total || 0),
          customers: totalCustomers,
          products: totalProducts,
        },
        thisMonth: {
          orders: ordersThisMonth,
          revenue: currRev,
          ordersGrowth: ordersLastMonth > 0 ? (((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100).toFixed(1) : null,
          revenueGrowth: prevRev > 0 ? (((currRev - prevRev) / prevRev) * 100).toFixed(1) : null,
        },
        ordersByStatus,
        recentOrders,
        topProducts: enrichedTopProducts,
        revenueByDay,
        alerts: { pendingPartners, pendingReviews },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// PRODUCTS CRUD
// ─────────────────────────────────────────
router.get('/products', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category, active } = req.query;
    const where = {};
    if (active !== undefined) where.isActive = active === 'true';
    if (category) where.category = { slug: category };
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: true,
          category: { select: { name: true, slug: true } },
          _count: { select: { reviews: true, orderItems: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ success: true, data: products, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    next(err);
  }
});

router.post('/products', async (req, res, next) => {
  try {
    const { name, description, shortDescription, categoryId, basePrice, compareAtPrice,
      isFeatured, isActive, isTaxable, requiresShipping, weight, tags,
      specifications, useCases, metaTitle, metaDescription, variants, images } = req.body;

    const slug = slugify(name, { lower: true, strict: true });
    const sku  = `VS-${slug.toUpperCase().slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;

    const product = await prisma.product.create({
      data: {
        name, slug, sku, description, shortDescription, categoryId,
        basePrice, compareAtPrice, isFeatured, isActive: isActive ?? true,
        isTaxable: isTaxable ?? true, requiresShipping: requiresShipping ?? true,
        weight, tags: tags || [], specifications, useCases, metaTitle, metaDescription,
        images: images ? { create: images } : undefined,
        variants: variants ? {
          create: variants.map((v, i) => ({
            ...v,
            sku: `${sku}-${i + 1}`,
            sortOrder: i,
          })),
        } : undefined,
      },
      include: { images: true, variants: true, category: true },
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

router.put('/products/:id', async (req, res, next) => {
  try {
    const { variants, images, ...data } = req.body;
    if (data.name) {
      data.slug = slugify(data.name, { lower: true, strict: true });
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: { images: true, variants: true, category: true },
    });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    next(err);
  }
});

// Variants
router.post('/products/:id/variants', async (req, res, next) => {
  try {
    const variant = await prisma.productVariant.create({
      data: { ...req.body, productId: req.params.id },
    });
    res.status(201).json({ success: true, data: variant });
  } catch (err) {
    next(err);
  }
});

router.put('/products/:id/variants/:vid', async (req, res, next) => {
  try {
    const variant = await prisma.productVariant.update({
      where: { id: req.params.vid },
      data: req.body,
    });
    res.json({ success: true, data: variant });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────
router.get('/orders', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ success: true, data: orders, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    next(err);
  }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        items: { include: { product: true, variant: true } },
        commissions: { include: { partner: { include: { user: true } } } },
      },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

router.patch('/orders/:id', async (req, res, next) => {
  try {
    const { status, trackingNumber, trackingUrl, adminNote, shippedAt } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status,
        trackingNumber,
        trackingUrl,
        adminNote,
        shippedAt: shippedAt ? new Date(shippedAt) : undefined,
        fulfillmentStatus: status === 'SHIPPED' ? 'FULFILLED' : undefined,
      },
      include: { user: true, items: { include: { product: true } } },
    });

    // Send shipping email
    if (status === 'SHIPPED' && order.user?.email) {
      sendShippingConfirmation(order.user.email, order).catch(() => {});
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// Admin refund
router.post('/orders/:id/refund', async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason || 'requested_by_customer',
    });

    const totalRefunded = refund.amount / 100;
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: totalRefunded >= Number(order.total) ? 'REFUNDED' : 'PARTIALLY_PAID',
        status: totalRefunded >= Number(order.total) ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      },
    });

    res.json({ success: true, data: refund });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────
router.get('/customers', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const where = {};
    if (search) where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: users, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    next(err);
  }
});

router.get('/customers/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 10 },
        addresses: true,
        reviews: true,
        partner: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, message: 'Customer not found' });
    const { passwordHash, resetToken, emailVerifyToken, ...safe } = user;
    res.json({ success: true, data: safe });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────
router.get('/reviews', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          product: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.review.count({ where }),
    ]);

    res.json({ success: true, data: reviews, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    next(err);
  }
});

router.patch('/reviews/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
});

router.delete('/reviews/:id', async (req, res, next) => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// BLOG
// ─────────────────────────────────────────
router.get('/blog', async (req, res, next) => {
  try {
    const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
});

router.post('/blog', async (req, res, next) => {
  try {
    const { title, ...rest } = req.body;
    const slug = slugify(title, { lower: true, strict: true });
    const post = await prisma.blogPost.create({ data: { title, slug, ...rest } });
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
});

router.put('/blog/:id', async (req, res, next) => {
  try {
    const post = await prisma.blogPost.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
});

router.delete('/blog/:id', async (req, res, next) => {
  try {
    await prisma.blogPost.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// FAQs
// ─────────────────────────────────────────
router.get('/faqs', async (req, res, next) => {
  try {
    const faqs = await prisma.fAQ.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, data: faqs });
  } catch (err) { next(err); }
});

router.post('/faqs', async (req, res, next) => {
  try {
    const faq = await prisma.fAQ.create({ data: req.body });
    res.status(201).json({ success: true, data: faq });
  } catch (err) { next(err); }
});

router.put('/faqs/:id', async (req, res, next) => {
  try {
    const faq = await prisma.fAQ.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: faq });
  } catch (err) { next(err); }
});

router.delete('/faqs/:id', async (req, res, next) => {
  try {
    await prisma.fAQ.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// DISCOUNTS
// ─────────────────────────────────────────
router.get('/discounts', async (req, res, next) => {
  try {
    const discounts = await prisma.discount.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: discounts });
  } catch (err) { next(err); }
});

router.post('/discounts', async (req, res, next) => {
  try {
    const d = await prisma.discount.create({
      data: { ...req.body, code: req.body.code.toUpperCase() },
    });
    res.status(201).json({ success: true, data: d });
  } catch (err) { next(err); }
});

router.put('/discounts/:id', async (req, res, next) => {
  try {
    const d = await prisma.discount.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: d });
  } catch (err) { next(err); }
});

router.delete('/discounts/:id', async (req, res, next) => {
  try {
    await prisma.discount.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────
router.get('/categories', async (req, res, next) => {
  try {
    const cats = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, data: cats });
  } catch (err) { next(err); }
});

router.post('/categories', async (req, res, next) => {
  try {
    const { name, ...rest } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    const cat = await prisma.category.create({ data: { name, slug, ...rest } });
    res.status(201).json({ success: true, data: cat });
  } catch (err) { next(err); }
});

router.put('/categories/:id', async (req, res, next) => {
  try {
    const cat = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: cat });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// NEWSLETTER
// ─────────────────────────────────────────
router.get('/newsletter', async (req, res, next) => {
  try {
    const subs = await prisma.newsletter.findMany({
      where: { isActive: true },
      orderBy: { subscribedAt: 'desc' },
    });
    res.json({ success: true, data: subs, count: subs.length });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    res.json({ success: true, data: map });
  } catch (err) { next(err); }
});

router.post('/settings', async (req, res, next) => {
  try {
    const entries = Object.entries(req.body);
    const ops = entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );
    await Promise.all(ops);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
