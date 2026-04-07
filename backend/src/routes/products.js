const router = require('express').Router();
const { prisma } = require('../config/database');
const { optionalAuth, authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/products — list with filters
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      category, search, minPrice, maxPrice, sort = 'createdAt_desc',
      page = 1, limit = 12, featured,
    } = req.query;

    const where = { isActive: true };
    if (category) where.category = { slug: category };
    if (featured === 'true') where.isFeatured = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }
    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = parseFloat(minPrice);
      if (maxPrice) where.basePrice.lte = parseFloat(maxPrice);
    }

    const [sortField, sortDir] = sort.split('_');
    const orderBy = sortField === 'price'
      ? { basePrice: sortDir === 'asc' ? 'asc' : 'desc' }
      : sortField === 'name'
      ? { name: sortDir }
      : { createdAt: 'desc' };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          category: { select: { name: true, slug: true } },
          _count: { select: { reviews: { where: { status: 'APPROVED' } } } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Attach average ratings
    const productIds = products.map((p) => p.id);
    const ratings = await prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds }, status: 'APPROVED' },
      _avg: { rating: true },
    });
    const ratingMap = Object.fromEntries(ratings.map((r) => [r.productId, r._avg.rating]));

    const normalizedProducts = products.map((p) => ({
      ...p,
      price: p.basePrice,
      comparePrice: p.compareAtPrice,
      specs: p.specifications,
      avgRating: ratingMap[p.id] || 0,
      reviewCount: p._count.reviews,
      variants: (p.variants || []).map((v) => ({
        ...v,
        stock: v.inventory,
        comparePrice: v.compareAtPrice,
      })),
    }));

    const lim = parseInt(limit);
    res.json({
      success: true,
      products: normalizedProducts,
      total,
      totalPages: Math.ceil(total / lim),
      page: parseInt(page),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:slug
router.get('/:slug', optionalAuth, async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        category: true,
        reviews: {
          where: { status: 'APPROVED' },
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const ratingData = await prisma.review.aggregate({
      where: { productId: product.id, status: 'APPROVED' },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const normalized = {
      ...product,
      price: product.basePrice,
      comparePrice: product.compareAtPrice,
      specs: product.specifications,
      avgRating: ratingData._avg.rating || 0,
      reviewCount: ratingData._count.rating,
      variants: (product.variants || []).map((v) => ({
        ...v,
        stock: v.inventory,
        comparePrice: v.compareAtPrice,
      })),
    };

    res.json({ success: true, product: normalized });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id/reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId: req.params.id, status: 'APPROVED' },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.review.count({ where: { productId: req.params.id, status: 'APPROVED' } }),
    ]);

    res.json({
      success: true,
      data: reviews,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/products/:id/reviews
router.post('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const { rating, title, body } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(422).json({ success: false, message: 'Rating must be 1-5' });
    }
    if (!body) return res.status(422).json({ success: false, message: 'Review body required' });

    // Check if user purchased this product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: req.params.id,
        order: { userId: req.user.id, paymentStatus: 'PAID' },
      },
    });

    const review = await prisma.review.upsert({
      where: { productId_userId: { productId: req.params.id, userId: req.user.id } },
      update: { rating, title, body, status: 'PENDING' },
      create: {
        productId: req.params.id,
        userId: req.user.id,
        rating,
        title,
        body,
        isVerified: !!hasPurchased,
      },
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/categories/all
router.get('/categories/all', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
