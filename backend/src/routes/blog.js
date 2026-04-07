const router = require('express').Router();
const { prisma } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status = 'PUBLISHED' } = req.query;
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: { status },
        orderBy: { publishedAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.blogPost.count({ where: { status } }),
    ]);
    res.json({ success: true, posts, total });
  } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findUnique({ where: { slug: req.params.slug } });
    if (!post || post.status !== 'PUBLISHED') return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) { next(err); }
});

module.exports = router;
