'use strict';

/**
 * @file review.js
 * @description REST API routes for code review and review history.
 */

const express = require('express');
const { reviewCode, reviewRepo } = require('../services/reviewer');
const { getRecentReviews, getUserReviews, saveReview } = require('../services/firebase');
const { detectLanguage } = require('../services/languageDetector');

const router = express.Router();

const SUPPORTED_LANGUAGES = [
  'javascript', 'js',
  'typescript', 'ts',
  'python', 'py',
  'java',
  'c',
  'cpp', 'c++',
  'php',
  'rust', 'rs',
  'go', 'golang',
  'swift',
  'kotlin', 'kt',
  'ruby', 'rb',
  'react', 'jsx', 'tsx',
  'dart',
  'flutter',
  'sql',
  'postgresql', 'postgres',
  'webassembly', 'wasm',
  'r',
  'scala',
  'haskell',
  'lua',
  'perl',
  'bash', 'shell', 'sh',
  'csharp', 'c#', 'cs',
  'objectivec', 'objc'
];

/**
 * Normalizes input language string with automatic code heuristic fallback.
 *
 * @param {string} [lang] - Raw language input.
 * @param {string} [code=''] - Source code to inspect if lang is omitted or 'auto'.
 * @returns {string} Normalized language string.
 */
function normalizeLanguage(lang, code = '') {
  if (!lang || typeof lang !== 'string' || lang.trim() === '' || lang.trim().toLowerCase() === 'auto') {
    return detectLanguage(code);
  }

  const clean = lang.trim().toLowerCase();
  return clean;
}

/**
 * POST /api/review
 * Validates submitted code and generates an automated code review.
 *
 * @route POST /api/review
 * @param {import('express').Request} req - Express request with { code, repoUrl, language, isPrivate, userId, userEmail }.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<void>}
 */
router.post('/review', async (req, res) => {
  try {
    const { code, repoUrl, language: rawLanguage, isPrivate = false, userId = null, userEmail = null } = req.body || {};

    // Branch 1: Whole Repository Review
    if (repoUrl && typeof repoUrl === 'string') {
      const result = await reviewRepo(repoUrl, Boolean(isPrivate));

      // Persist repository review simultaneously to flat collection and user subcollection
      saveReview(
        result,
        'Repository',
        Boolean(isPrivate),
        userId,
        userEmail
      ).catch((err) => {
        console.warn('[Firebase] Background repo save warning:', err.message);
      });

      return res.status(200).json(result);
    }

    // Branch 2: Single File Code Review
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Either "repoUrl" or "code" string must be provided.'
      });
    }

    const trimmedCode = code.trim();
    if (trimmedCode.length < 10) {
      return res.status(400).json({
        error: 'Code is too short to review — paste at least 10 characters.'
      });
    }

    if (code.length > 20000) {
      return res.status(400).json({
        error: 'Code exceeds the maximum reviewable length of 20,000 characters.'
      });
    }

    const targetLanguage = normalizeLanguage(rawLanguage, code);

    const result = await reviewCode(code, targetLanguage, Boolean(isPrivate));

    // Persist single code review simultaneously to flat collection and user subcollection
    saveReview(
      result,
      targetLanguage,
      Boolean(isPrivate),
      userId,
      userEmail
    ).catch((err) => {
      console.warn('[Firebase] Background code save warning:', err.message);
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error handling POST /api/review:', err);
    return res.status(500).json({ error: err.message || 'Internal review processing failed' });
  }
});

/**
 * GET /api/history
 * Fetches recent code reviews from the database. Supports optional ?userId query param.
 *
 * @route GET /api/history
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<void>}
 */
router.get('/history', async (req, res) => {
  try {
    const { userId } = req.query;
    const reviews = await getRecentReviews(userId || null);
    return res.status(200).json({ reviews });
  } catch (err) {
    console.error('Error handling GET /api/history:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch review history' });
  }
});

/**
 * GET /api/history/user/:userId
 * Fetches reviews specifically submitted by the authenticated user from the database.
 *
 * @route GET /api/history/user/:userId
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<void>}
 */
router.get('/history/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await getUserReviews(userId);
    return res.status(200).json({ reviews });
  } catch (err) {
    console.error('Error handling GET /api/history/user/:userId:', err);
    return res.status(500).json({ error: 'Failed to fetch user review history' });
  }
});

module.exports = router;
