const router = require('express').Router();
const { prisma } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// GET /api/reviews — public reviews for a product (redirected from products route too)
router.get('/', async (req, res, next) => {
  try {
    const { productId, page = 1, limit = 10 } = req.query;
    if (!productId) return res.status(400).json({ success: false, message: 'productId required' });
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId, status: 'APPROVED' },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.review.count({ where: { productId, status: 'APPROVED' } }),
    ]);
    res.json({ success: true, reviews, total, totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

module.exports = router;
