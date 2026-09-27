'use strict';

/**
 * @file server.js
 * @description Main Express application server for CodeSage.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const reviewRouter = require('./routes/review');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Configure Cross-Origin Resource Sharing (CORS)
 * Allows requests originating from specified frontend development and production origins.
 */
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true
}));

/**
 * Parse incoming JSON requests with a 50kb payload limit.
 */
app.use(express.json({ limit: '50kb' }));

/**
 * In-memory rate limiting configuration:
 * 20 requests per IP per 60-second sliding window.
 */
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20;
const rateLimitMap = new Map();

// Periodic cleanup of stale rate-limit records
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now >= data.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS).unref();

/**
 * Express middleware to enforce IP-based rate limiting.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The next middleware callback.
 * @returns {void}
 */
function rateLimiter(req, res, next) {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now >= entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return next();
    }

    if (entry.count >= RATE_LIMIT_MAX) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    entry.count += 1;
    return next();
  } catch (err) {
    console.error('Rate limiter encountered an unexpected error:', err);
    return next();
  }
}

app.use(rateLimiter);

/**
 * Serve static files from ../frontend/dist if directory exists (for production builds)
 */
const staticDistPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(staticDistPath));

/**
 * Mount review router at /api
 * Provides /api/review and /api/history
 */
app.use('/api', reviewRouter);

/**
 * Start Express HTTP server listener.
 *
 * @returns {void}
 */
function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`CodeSage running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start CodeSage server:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
