'use strict';

/**
 * @file firebase.js
 * @description Firebase Admin SDK integration service for persisting reviews.
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

let db = null;

let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    );
    console.log('[Firebase] Using env variable credentials');
  } else {
    const fs = require('fs');
    const path = require('path');
    const filePath = process.env.FIREBASE_SERVICE_ACCOUNT || 
      './firebase-service-account.json';
    serviceAccount = JSON.parse(
      fs.readFileSync(path.resolve(filePath), 'utf8')
    );
    console.log('[Firebase] Using file credentials');
  }
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('[Firebase] Admin initialized successfully');
  }
  db = admin.firestore();
} catch (err) {
  console.log('[Firebase] Init failed:', err.message);
}

/**
 * Persists a code review record to Firestore.
 * Saves simultaneously to the flat "reviews" collection and the user's subcollection "users/{userId}/reviews".
 *
 * @param {object} reviewData - Full review result payload
 * @param {string} language - Programming language
 * @param {boolean} isPrivate - Whether private mode is enabled
 * @param {string} userId - User UID
 * @param {string} userEmail - User Email address
 * @returns {Promise<string|null>} Created review document ID or null
 */
async function saveReview(reviewData, language, isPrivate, userId, userEmail) {
  try {
    if (isPrivate) {
      console.log('[Firebase] Skipping save - private mode');
      return null;
    }

    console.log('[Firebase] Saving review to Firestore');

    if (!db) {
      return null;
    }

    const emailStr = userEmail || 'anonymous';
    const uidStr = userId || 'anonymous';
    const effectiveLanguage = language || reviewData.language || 'Unknown';
    const effectiveScore = typeof reviewData.score === 'number' ? reviewData.score : (reviewData.overallScore || 0);
    const effectiveSummary = reviewData.summary || '';
    const effectiveStats = reviewData.stats || { total: 0, high: 0, medium: 0, low: 0 };

    // Place 1 — Existing flat "reviews" collection (keep as is):
    const flatDocData = {
      userId: uidStr,
      userEmail: emailStr,
      type: reviewData.type || 'code',
      title: reviewData.title || (reviewData.type === 'repo' ? (reviewData.repoUrl || 'Repository') : `${effectiveLanguage} Snippet`),
      language: effectiveLanguage,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      summary: effectiveSummary,
      score: effectiveScore,
      stats: effectiveStats,
      isPrivate: false,
      result: reviewData
    };
    const flatSavePromise = db.collection('reviews').add(flatDocData);

    // Place 2 — NEW user subcollection: users/{userId}/reviews/{auto-id}
    let userSubSavePromise = Promise.resolve(null);
    if (uidStr && uidStr !== 'anonymous') {
      const userRef = db.collection('users').doc(uidStr);
      const displayName = emailStr.includes('@') ? emailStr.split('@')[0] : (emailStr || 'Developer');

      userSubSavePromise = (async () => {
        // Upsert the user document at users/{userId}
        await userRef.set({
          displayName,
          email: emailStr,
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
          totalReviews: admin.firestore.FieldValue.increment(1)
        }, { merge: true });

        // Create document in users/{userId}/reviews/
        const subDocData = {
          language: effectiveLanguage,
          score: effectiveScore,
          summary: effectiveSummary,
          isPrivate: false,
          stats: effectiveStats,
          reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
          result: reviewData
        };

        const subDocRef = await userRef.collection('reviews').add(subDocData);
        return subDocRef.id;
      })();
    }

    const [flatDocRef, subDocId] = await Promise.all([flatSavePromise, userSubSavePromise]);
    return subDocId || flatDocRef?.id || null;
  } catch (err) {
    console.error('Failed to save review in Firebase:', err.message);
    return null;
  }
}

/**
 * Retrieves the 10 most recent reviews.
 * If userId is provided, queries users/{userId}/reviews ordered by reviewedAt desc.
 * If no userId is provided, falls back to the existing flat "reviews" collection query.
 *
 * @param {string} [userId] - Optional User UID
 * @returns {Promise<Array<object>>}
 */
async function getRecentReviews(userId) {
  try {
    if (!db) {
      return [];
    }

    // Branch 1: If userId is provided, query users/{userId}/reviews
    if (userId && userId !== 'anonymous') {
      try {
        const snapshot = await db.collection('users')
          .doc(userId)
          .collection('reviews')
          .orderBy('reviewedAt', 'desc')
          .limit(10)
          .get();

        const reviews = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const reviewedAtDate = data.reviewedAt
            ? (data.reviewedAt.toDate ? data.reviewedAt.toDate().toISOString() : data.reviewedAt)
            : new Date().toISOString();

          reviews.push({
            id: doc.id,
            language: data.language || 'Unknown',
            score: typeof data.score === 'number' ? data.score : 0,
            summary: data.summary || '',
            stats: data.stats || { total: 0, high: 0, medium: 0, low: 0 },
            reviewedAt: reviewedAtDate,
            timestamp: reviewedAtDate // alias for backwards compatibility
          });
        });

        return reviews;
      } catch (userErr) {
        console.warn('Failed to query user subcollection reviews:', userErr.message);
        // Fall back to flat collection if subcollection fails
      }
    }

    // Branch 2: Fall back to existing flat "reviews" collection query
    let snapshot;
    try {
      snapshot = await db.collection('reviews')
        .where('isPrivate', '==', false)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();
    } catch (queryErr) {
      try {
        snapshot = await db.collection('reviews')
          .orderBy('timestamp', 'desc')
          .limit(20)
          .get();
      } catch (orderErr) {
        snapshot = await db.collection('reviews')
          .limit(25)
          .get();
      }
    }

    const reviews = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isPrivate) return;
      const ts = data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toISOString() : data.timestamp) : null;
      reviews.push({
        id: doc.id,
        language: data.language || 'Unknown',
        timestamp: ts,
        reviewedAt: ts,
        summary: data.summary || '',
        score: typeof data.score === 'number' ? data.score : 0,
        stats: data.stats || { total: 0, high: 0, medium: 0, low: 0 }
      });
    });

    reviews.sort((a, b) => new Date(b.reviewedAt || b.timestamp || 0) - new Date(a.reviewedAt || a.timestamp || 0));
    return reviews.slice(0, 10);
  } catch (err) {
    console.error('Failed to retrieve recent reviews from Firebase:', err.message);
    return [];
  }
}

/**
 * Retrieves all review records for a specific authenticated user (for profile analytics).
 *
 * @param {string} userId - The user UID to query.
 * @returns {Promise<Array<object>>}
 */
async function getUserReviews(userId) {
  try {
    if (!db || !userId) {
      return [];
    }

    // First try user subcollection
    try {
      const subSnap = await db.collection('users').doc(userId).collection('reviews').orderBy('reviewedAt', 'desc').get();
      if (!subSnap.empty) {
        const reviews = [];
        subSnap.forEach((doc) => {
          const data = doc.data();
          reviews.push({
            id: doc.id,
            userId,
            language: data.language || 'Unknown',
            score: typeof data.score === 'number' ? data.score : 0,
            stats: data.stats || { total: 0, high: 0, medium: 0, low: 0 },
            summary: data.summary || '',
            date: data.reviewedAt ? (data.reviewedAt.toDate ? data.reviewedAt.toDate().toISOString() : data.reviewedAt) : new Date().toISOString()
          });
        });
        return reviews;
      }
    } catch (e) {}

    // Fall back to querying flat reviews with userId == userId
    const snapshot = await db.collection('reviews').where('userId', '==', userId).get();
    const reviews = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail || 'anonymous',
        type: data.type || 'code',
        title: data.title || (data.type === 'repo' ? 'Repository Audit' : `${data.language} Snippet`),
        language: data.language || 'Unknown',
        score: typeof data.score === 'number' ? data.score : 0,
        stats: data.stats || { total: 0, high: 0, medium: 0, low: 0 },
        summary: data.summary || '',
        date: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toISOString() : data.timestamp) : new Date().toISOString()
      });
    });

    reviews.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return reviews;
  } catch (err) {
    console.error('Failed to fetch user reviews from Firebase:', err.message);
    return [];
  }
}

module.exports = {
  saveReview,
  getUserReviews,
  getRecentReviews
};
