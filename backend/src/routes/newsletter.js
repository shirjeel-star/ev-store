const router = require('express').Router();
const { prisma } = require('../config/database');

router.post('/subscribe', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    await prisma.newsletter.upsert({
      where: { email },
      update: { isActive: true },
      create: { email },
    });
    res.json({ success: true, message: 'Subscribed successfully' });
  } catch (err) { next(err); }
});

router.post('/unsubscribe', async (req, res, next) => {
  try {
    const { email } = req.body;
    await prisma.newsletter.updateMany({ where: { email }, data: { isActive: false } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
