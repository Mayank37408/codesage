/**
 * @file activityService.js
 * @description Real user activity service for saving and retrieving code & repository reviews
 * directly to/from the database (Firestore & backend API) with zero hardcoded/mock stats.
 */

import { saveReviewToFirestore, getUserReviewsFromFirestore } from './firebase';
import { getUserReviewHistory } from './api';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Returns the storage key for a given user's cached real reviews.
 *
 * @param {string} [userId]
 * @returns {string}
 */
function getStorageKey(userId) {
  return `codesage_real_user_reviews_${userId || 'guest'}`;
}

/**
 * Saves a real review to the database (Firestore) and local cache.
 *
 * @param {object} params
 * @param {string} [params.userId]
 * @param {'code'|'repo'} params.type
 * @param {string} params.title
 * @param {string} [params.language]
 * @param {string} [params.repoUrl]
 * @param {number} params.score
 * @param {object} params.stats
 * @param {string} params.summary
 * @returns {Promise<object>} The created activity item
 */
export async function saveRealReview({
  userId,
  type = 'code',
  title,
  language = 'javascript',
  repoUrl = '',
  score = 0,
  stats = { total: 0, high: 0, medium: 0, low: 0 },
  summary = ''
}) {
  const newActivity = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: userId || null,
    type,
    title: title || (type === 'repo' ? repoUrl : `${language.toUpperCase()} Snippet`),
    language,
    repoUrl,
    score: typeof score === 'number' ? score : 0,
    stats: stats || { total: 0, high: 0, medium: 0, low: 0 },
    summary: summary || '',
    date: new Date().toISOString()
  };

  // 1. Save to Firestore database if authenticated
  if (userId) {
    try {
      const docId = await saveReviewToFirestore(userId, newActivity);
      if (docId) {
        newActivity.id = docId;
      }
    } catch (err) {
      console.warn('Firestore database write warning:', err);
    }
  }

  // 2. Cache in local user storage
  try {
    const key = getStorageKey(userId);
    const existing = getCachedReviews(userId);
    const updated = [newActivity, ...existing];
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.warn('Local storage cache write warning:', err);
  }

  return newActivity;
}

/**
 * Retrieves cached reviews from local storage (real reviews only, zero seeds).
 *
 * @param {string} [userId]
 * @returns {Array<object>}
 */
export function getCachedReviews(userId) {
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    return [];
  } catch (err) {
    return [];
  }
}

/**
 * Fetches the user's authentic review records from the database (Firestore + backend API)
 * and falls back to local cache if offline.
 *
 * @param {string} [userId]
 * @returns {Promise<Array<object>>}
 */
export async function fetchRealUserActivities(userId) {
  if (!userId) {
    return getCachedReviews(null);
  }

  const reviewMap = new Map();

  // Step 1: Fetch from Firestore database
  try {
    const firestoreReviews = await getUserReviewsFromFirestore(userId);
    if (Array.isArray(firestoreReviews) && firestoreReviews.length > 0) {
      firestoreReviews.forEach((item) => {
        const uniqueKey = item.id || `${item.title}_${item.date}`;
        reviewMap.set(uniqueKey, item);
      });
    }
  } catch (err) {
    console.warn('Could not query Firestore reviews:', err);
  }

  // Step 2: Fetch from backend database API
  try {
    const backendReviews = await getUserReviewHistory(userId);
    if (Array.isArray(backendReviews) && backendReviews.length > 0) {
      backendReviews.forEach((item) => {
        const uniqueKey = item.id || `${item.title}_${item.date}`;
        if (!reviewMap.has(uniqueKey)) {
          reviewMap.set(uniqueKey, item);
        }
      });
    }
  } catch (err) {
    console.warn('Could not query backend API reviews:', err);
  }

  // Step 3: Combine with local cache
  const localCached = getCachedReviews(userId);
  localCached.forEach((item) => {
    const uniqueKey = item.id || `${item.title}_${item.date}`;
    if (!reviewMap.has(uniqueKey)) {
      reviewMap.set(uniqueKey, item);
    }
  });

  const combined = Array.from(reviewMap.values());
  combined.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // Sync back to local storage
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(combined));
  } catch (e) {}

  return combined;
}

/**
 * Computes strictly authentic aggregated dashboard stats and monthly breakdown
 * directly from real review records.
 *
 * @param {Array<object>} activities - Real user activities
 * @param {number} [targetYear] - Target calendar year
 * @returns {object} Real dashboard metrics
 */
export function computeDashboardAnalytics(activities = [], targetYear = new Date().getFullYear()) {
  let codeCount = 0;
  let repoCount = 0;
  let totalScoreSum = 0;
  let totalHigh = 0;
  let totalMedium = 0;
  let totalLow = 0;

  const languageTally = {};

  // Initialize 12 monthly slots (all start at 0)
  const monthlySlots = MONTH_NAMES.map((name, index) => ({
    monthIndex: index,
    name,
    codeCount: 0,
    repoCount: 0,
    totalCount: 0,
    scoreSum: 0,
    avgScore: 0
  }));

  activities.forEach((act) => {
    const isRepo = act.type === 'repo';
    if (isRepo) {
      repoCount += 1;
    } else {
      codeCount += 1;
    }

    const score = typeof act.score === 'number' ? act.score : 0;
    totalScoreSum += score;

    if (act.stats) {
      totalHigh += act.stats.high || 0;
      totalMedium += act.stats.medium || 0;
      totalLow += act.stats.low || 0;
    }

    const lang = act.language ? act.language.trim().toLowerCase() : 'unknown';
    languageTally[lang] = (languageTally[lang] || 0) + 1;

    // Place into real month
    const actDate = new Date(act.date || Date.now());
    if (actDate.getFullYear() === targetYear) {
      const monthIdx = actDate.getMonth();
      if (monthIdx >= 0 && monthIdx < 12) {
        if (isRepo) {
          monthlySlots[monthIdx].repoCount += 1;
        } else {
          monthlySlots[monthIdx].codeCount += 1;
        }
        monthlySlots[monthIdx].totalCount += 1;
        monthlySlots[monthIdx].scoreSum += score;
      }
    }
  });

  // Calculate real monthly averages
  monthlySlots.forEach((slot) => {
    slot.avgScore = slot.totalCount > 0 ? Math.round(slot.scoreSum / slot.totalCount) : 0;
  });

  const totalCount = codeCount + repoCount;
  const avgScore = totalCount > 0 ? Math.round(totalScoreSum / totalCount) : 0;

  // Busiest month from actual data
  let busiest = null;
  monthlySlots.forEach((m) => {
    if (m.totalCount > 0 && (!busiest || m.totalCount > busiest.totalCount)) {
      busiest = m;
    }
  });

  // Top language from actual data
  let topLang = 'None';
  let maxLangCount = 0;
  Object.entries(languageTally).forEach(([lang, count]) => {
    if (count > maxLangCount) {
      maxLangCount = count;
      topLang = lang.charAt(0).toUpperCase() + lang.slice(1);
    }
  });

  return {
    codeCount,
    repoCount,
    totalCount,
    avgScore,
    totalVulnerabilities: totalHigh + totalMedium + totalLow,
    vulnerabilities: {
      high: totalHigh,
      medium: totalMedium,
      low: totalLow
    },
    monthlyData: monthlySlots,
    busiestMonth: busiest ? `${busiest.name} (${busiest.totalCount} reviews)` : 'No reviews yet',
    topLanguage: topLang,
    recentActivities: activities.slice(0, 15)
  };
}
