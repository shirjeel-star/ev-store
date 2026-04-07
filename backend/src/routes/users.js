const router = require('express').Router();
const { prisma } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// GET /api/users/profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { addresses: true },
    });
    const { passwordHash, resetToken, emailVerifyToken, refreshTokens, ...safe } = user;
    res.json({ success: true, data: safe });
  } catch (err) { next(err); }
});

// PATCH /api/users/profile
router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { firstName, lastName, phone },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PATCH /api/users/password
router.patch('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: hash } });
    res.json({ success: true, message: 'Password updated' });
  } catch (err) { next(err); }
});

// GET /api/users/addresses
router.get('/addresses', authenticate, async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { isDefault: 'desc' },
    });
    res.json({ success: true, addresses });
  } catch (err) { next(err); }
});

// Addresses
router.post('/addresses', authenticate, async (req, res, next) => {
  try {
    if (req.body.isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    }
    const addr = await prisma.address.create({ data: { ...req.body, userId: req.user.id } });
    res.status(201).json({ success: true, data: addr });
  } catch (err) { next(err); }
});

router.put('/addresses/:id', authenticate, async (req, res, next) => {
  try {
    if (req.body.isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    }
    const addr = await prisma.address.update({
      where: { id: req.params.id, userId: req.user.id },
      data: req.body,
    });
    res.json({ success: true, data: addr });
  } catch (err) { next(err); }
});

router.delete('/addresses/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.address.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
