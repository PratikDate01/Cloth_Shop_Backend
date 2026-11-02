const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust reverse proxy (AWS ELB, Render, Railway, Nginx, Cloudflare)
app.set('trust proxy', 1);

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Gzip Compression for high-throughput responses
app.use(compression());

// Request logger: Combined format in production, dev colored format in development
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// CORS configuration supporting single or comma-separated origins
const clientUrls = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://the-unique-mens-wear.vercel.app',
  'https://cloth-shop-frontend-beta.vercel.app',
];
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...clientUrls]));

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        if (process.env.NODE_ENV === 'production') {
          callback(new Error(`Origin '${origin}' not permitted by CORS policy`));
        } else {
          callback(null, true); // Permissive in dev to avoid local frontend port mismatches
        }
      }
    },
    credentials: true,
  })
);

// Global API Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});
app.use('/api', globalLimiter);

// Dedicated Stricter Rate Limiter for Authentication endpoints to prevent brute-forcing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please wait 15 minutes before trying again.',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/change-password', authLimiter);

// Capture raw body specifically for Razorpay Webhook signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      if (req.originalUrl.includes('/api/payments/razorpay/webhook')) {
        req.rawBody = buf.toString();
      }
    },
    limit: '15mb',
  })
);
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static directory for uploaded files (for local upload fallback)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Production-ready Health Check Endpoint with Database Diagnostic Check
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  const isDbHealthy = dbState === 1;

  const healthData = {
    status: isDbHealthy ? 'healthy' : 'degraded',
    service: 'Cloth Shop Fashion E-Commerce API',
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: isDbHealthy,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown',
    },
    memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    timestamp: new Date().toISOString(),
  };

  const statusCode = isDbHealthy ? 200 : 503;
  res.status(statusCode).json(healthData);
});

// Route Mounts
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/addresses', require('./routes/addressRoutes'));

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot find ${req.method} ${req.originalUrl} on this server`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
