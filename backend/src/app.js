const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');

const app = express();

// ── Security headers
app.use(helmet());

// ── CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ── Stripe webhook needs raw body — must come BEFORE express.json()
const { webhookHandler } = require('./routes/payments');
app.post('/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler
);

// ── Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// ── HTTP logging
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ── Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

// ── Routes
const authRoutes      = require('./routes/auth');
const productRoutes   = require('./routes/products');
const cartRoutes      = require('./routes/cart');
const orderRoutes     = require('./routes/orders');
const paymentRoutes   = require('./routes/payments');
const reviewRoutes    = require('./routes/reviews');
const partnerRoutes   = require('./routes/partners');
const userRoutes      = require('./routes/users');
const blogRoutes      = require('./routes/blog');
const faqRoutes       = require('./routes/faqs');
const mediaRoutes     = require('./routes/media');
const adminRoutes     = require('./routes/admin');
const wishlistRoutes  = require('./routes/wishlist');
const newsletterRoutes = require('./routes/newsletter');
const supportRoutes   = require('./routes/support');

app.use('/api/auth',       authLimiter, authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/cart',       cartRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/payments',   paymentRoutes);
app.use('/api/reviews',    reviewRoutes);
app.use('/api/partners',   partnerRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/blog',       blogRoutes);
app.use('/api/faqs',       faqRoutes);
app.use('/api/media',      mediaRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/wishlist',   wishlistRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/support',    supportRoutes);

// ── Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Global error handler
app.use((err, req, res, next) => {
  logger.error(err.stack || err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
