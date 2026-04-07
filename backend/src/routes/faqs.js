const router = require('express').Router();
const { prisma } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const where = { isActive: true };
    if (category) where.category = category;
    const faqs = await prisma.fAQ.findMany({ where, orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, faqs });
  } catch (err) { next(err); }
});

module.exports = router;
