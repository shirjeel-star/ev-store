const router = require('express').Router();
const { prisma } = require('../config/database');
const { authenticate, requireAdmin, requirePartner } = require('../middleware/auth');
const { sendPartnerWelcome } = require('../services/emailService');

// POST /api/partners/apply
router.post('/apply', authenticate, async (req, res, next) => {
  try {
    const { companyName, website, description } = req.body;

    const existing = await prisma.partner.findUnique({ where: { userId: req.user.id } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Partner application already exists' });
    }

    // Generate unique referral code
    const base = req.user.firstName.slice(0, 3).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    const referralCode = `VS${base}`;

    const partner = await prisma.partner.create({
      data: {
        userId: req.user.id,
        companyName,
        website,
        description,
        referralCode,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Partner application submitted. We will review and notify you shortly.',
      data: partner,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/partners/dashboard
router.get('/dashboard', authenticate, requirePartner, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { userId: req.user.id },
      include: {
        commissions: {
          include: { order: { select: { orderNumber: true, total: true, createdAt: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        referrals: { orderBy: { createdAt: 'desc' }, take: 10 },
        orders: {
          select: { id: true, orderNumber: true, total: true, createdAt: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const stats = await prisma.commission.aggregate({
      where: { partnerId: partner.id },
      _sum: { amount: true },
      _count: { id: true },
    });

    const monthlyEarnings = await prisma.commission.groupBy({
      by: ['createdAt'],
      where: { partnerId: partner.id, status: { in: ['APPROVED', 'PAID'] } },
      _sum: { amount: true },
    });

    res.json({
      success: true,
      data: {
        partner,
        stats: {
          totalCommissions: stats._count.id,
          totalEarnings: stats._sum.amount || 0,
          pendingEarnings: partner.pendingEarnings,
          paidEarnings: partner.paidEarnings,
          referralLink: `${process.env.FRONTEND_URL}/?ref=${partner.referralCode}`,
        },
        monthlyEarnings,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/partners/referrals
router.get('/referrals', authenticate, requirePartner, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({ where: { userId: req.user.id } });
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const { page = 1, limit = 20 } = req.query;
    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        where: { partnerId: partner.id },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.referral.count({ where: { partnerId: partner.id } }),
    ]);

    res.json({ success: true, data: referrals, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    next(err);
  }
});

// POST /api/partners/track — track a referral visit
router.post('/track', async (req, res, next) => {
  try {
    const { referralCode, landingPage } = req.body;
    if (!referralCode) return res.status(400).json({ success: false, message: 'referralCode required' });

    const partner = await prisma.partner.findUnique({ where: { referralCode } });
    if (!partner || partner.status !== 'APPROVED') {
      return res.status(404).json({ success: false, message: 'Invalid referral code' });
    }

    await prisma.referral.create({
      data: {
        partnerId: partner.id,
        visitorIp: req.ip,
        userAgent: req.headers['user-agent'],
        landingPage,
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Admin — GET all partners
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          _count: { select: { commissions: true, referrals: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.partner.count({ where }),
    ]);

    res.json({ success: true, data: partners, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    next(err);
  }
});

// Admin — PATCH /api/partners/:id/approve
router.patch('/:id/approve', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { commissionRate } = req.body;
    const partner = await prisma.partner.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        commissionRate: commissionRate || 10,
      },
      include: { user: true },
    });

    await prisma.user.update({ where: { id: partner.userId }, data: { role: 'PARTNER' } });
    sendPartnerWelcome(partner.user.email, partner, partner.user).catch(() => {});

    res.json({ success: true, data: partner });
  } catch (err) {
    next(err);
  }
});

// Admin — PATCH /api/partners/:id/reject
router.patch('/:id/reject', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const partner = await prisma.partner.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
    });
    res.json({ success: true, data: partner });
  } catch (err) {
    next(err);
  }
});

// Admin — PATCH /api/partners/:id/commissions/:commId/pay
router.patch('/:id/commissions/:commId/pay', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const commission = await prisma.commission.update({
      where: { id: req.params.commId, partnerId: req.params.id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    await prisma.partner.update({
      where: { id: req.params.id },
      data: {
        pendingEarnings: { decrement: commission.amount },
        paidEarnings: { increment: commission.amount },
      },
    });

    res.json({ success: true, data: commission });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
