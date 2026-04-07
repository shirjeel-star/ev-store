const { verifyAccess } = require('../config/jwt');
const { prisma } = require('../config/database');

// Authenticate — requires valid JWT
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const payload = verifyAccess(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true, firstName: true, lastName: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// Optional auth — attaches user if token present, doesn't fail if not
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.access_token;

    if (token) {
      const payload = verifyAccess(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true, isActive: true, firstName: true, lastName: true },
      });
      if (user && user.isActive) req.user = user;
    }
  } catch (_) {
    // Silently ignore token errors in optional auth
  }
  next();
}

// Role guard factory
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
}

const requireAdmin       = requireRole('ADMIN', 'SUPER_ADMIN');
const requireSuperAdmin  = requireRole('SUPER_ADMIN');
const requirePartner     = requireRole('PARTNER', 'ADMIN', 'SUPER_ADMIN');

module.exports = { authenticate, optionalAuth, requireRole, requireAdmin, requireSuperAdmin, requirePartner };
