const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const { signAccess, signRefresh, verifyRefresh } = require('../config/jwt');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerRules, loginRules } = require('../middleware/validators');
const { sendMail } = require('../config/email');
const stripe = require('../config/stripe');
const logger = require('../config/logger');

// ── Helpers
function setRefreshCookie(res, token) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// POST /api/auth/register
router.post('/register', registerRules, validate, async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const emailVerifyToken = uuidv4();

    // Create Stripe customer
    let stripeCustomerId;
    try {
      const customer = await stripe.customers.create({ email, name: `${firstName} ${lastName}` });
      stripeCustomerId = customer.id;
    } catch (stripeErr) {
      logger.error('Stripe customer creation failed', stripeErr);
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        emailVerifyToken,
        stripeCustomerId,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    // Send verification email (non-blocking)
    sendMail({
      to: email,
      subject: 'Welcome to VoltStore — Verify your email',
      html: `
        <h2>Welcome to VoltStore, ${firstName}!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${process.env.FRONTEND_URL}/verify-email?token=${emailVerifyToken}">Verify Email</a>
        <p>This link expires in 24 hours.</p>
      `,
    }).catch(() => {});

    const accessToken  = signAccess({ userId: user.id, role: user.role });
    const refreshToken = signRefresh({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, refreshToken);

    res.status(201).json({ success: true, data: { user, accessToken } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken  = signAccess({ userId: user.id, role: user.role });
    const refreshToken = signRefresh({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });

    const payload = verifyRefresh(token);

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { token } });
    const newRefreshToken = signRefresh({ userId: user.id });
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = signAccess({ userId: user.id, role: user.role });
    setRefreshCookie(res, newRefreshToken);

    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } }).catch(() => {});
    }
    res.clearCookie('refresh_token');
    res.clearCookie('access_token');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, emailVerified: true, createdAt: true,
        addresses: true,
      },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });

    const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid token' });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null },
    });

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond OK to prevent email enumeration
    if (user) {
      const resetToken = uuidv4();
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) },
      });

      sendMail({
        to: email,
        subject: 'VoltStore — Reset your password',
        html: `
          <h2>Password Reset</h2>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">Reset Password</a>
        `,
      }).catch(() => {});
    }

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password required' });
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
