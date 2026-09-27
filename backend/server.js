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
 * Force CORS headers on EVERY response — including 500 errors.
 * This raw middleware runs before everything else so even crash
 * responses carry the Access-Control-Allow-Origin header.
 */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/**
 * cors() package as secondary layer.
 */
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
 * Mount review router at /api
 * Provides /api/review and /api/history
 */
app.use('/api', reviewRouter);

/**
 * Global error handler — always sends CORS headers even on unhandled errors.
 */
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message);
  res.header('Access-Control-Allow-Origin', '*');
  res.status(500).json({ error: err.message || 'Internal server error' });
});

/**
 * Start Express HTTP server listener.
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
