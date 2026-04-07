const router = require('express').Router();
const { prisma } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// GET wishlist
router.get('/', authenticate, async (req, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { images: { where: { isPrimary: true }, take: 1 }, variants: { take: 1 } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

// POST add to wishlist
router.post('/:productId', authenticate, async (req, res, next) => {
  try {
    const item = await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
      update: {},
      create: { userId: req.user.id, productId: req.params.productId },
    });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// DELETE remove from wishlist
router.delete('/:productId', authenticate, async (req, res, next) => {
  try {
    await prisma.wishlistItem.deleteMany({
      where: { userId: req.user.id, productId: req.params.productId },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
