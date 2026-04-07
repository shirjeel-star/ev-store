const router = require('express').Router();
const { prisma } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const where = { isActive: true };
    if (category) where.category = category;
    const docs = await prisma.supportDoc.findMany({ where, orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, docs });
  } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const doc = await prisma.supportDoc.findUnique({ where: { slug: req.params.slug } });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, ...doc });
  } catch (err) { next(err); }
});

module.exports = router;
