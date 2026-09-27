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
  if (!admin.apps.length) {
    let credential = null;

    // 1. Try loading from environment variable as JSON string (supports FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_JSON)
    const envJsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT;
    if (envJsonStr && envJsonStr.trim().startsWith('{')) {
      try {
        const serviceAccount = JSON.parse(envJsonStr);
        credential = admin.credential.cert(serviceAccount);
        console.log('[Firebase] Admin SDK initialized using environment variable JSON.');
      } catch (e) {
        console.warn('[Firebase] Failed to parse JSON from env variable:', e.message);
      }
    }

    // 2. Try loading from file path specified in FIREBASE_SERVICE_ACCOUNT
    if (!credential && process.env.FIREBASE_SERVICE_ACCOUNT) {
      const filePath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT);
      if (fs.existsSync(filePath)) {
        try {
          const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          credential = admin.credential.cert(serviceAccount);
          console.log(`[Firebase] Admin SDK initialized using file path: ${filePath}`);
        } catch (e) {
          console.warn('[Firebase] Failed to read service account file:', e.message);
        }
      }
    }

    // 3. Fallback: Search local candidate files (local dev)
    if (!credential) {
      const candidatePaths = [
        path.resolve(process.cwd(), 'codesage-4026e-firebase-adminsdk-fbsvc-df0949928f.json'),
        path.resolve(process.cwd(), 'codesage-4026e-firebase-adminsdk-fbsvc-f75ca1cd1b.json'),
        path.resolve(__dirname, '..', '..', 'codesage-4026e-firebase-adminsdk-fbsvc-df0949928f.json'),
        path.resolve(__dirname, '..', '..', 'codesage-4026e-firebase-adminsdk-fbsvc-f75ca1cd1b.json'),
        path.resolve(process.cwd(), 'firebase-service-account.json'),
        path.resolve(__dirname, '..', 'firebase-service-account.json')
      ];

      for (const candidate of candidatePaths) {
        if (fs.existsSync(candidate)) {
          try {
            const serviceAccount = JSON.parse(fs.readFileSync(candidate, 'utf8'));
            credential = admin.credential.cert(serviceAccount);
            console.log(`[Firebase] Admin SDK initialized using candidate file: ${candidate}`);
            break;
          } catch (e) {}
        }
      }
    }

    // 4. Initialize Admin App
    if (credential) {
      admin.initializeApp({ credential });
    } else {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'codesage-4026e'
      });
      console.log('[Firebase] Admin SDK initialized using default project configuration.');
    }
  }

  db = admin.firestore();
} catch (err) {
  console.log('[Firebase] Init failed:', err.message);
}

/**
 * Persists a code review record to Firestore.
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

    // Place 1 — Existing flat "reviews" collection:
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
        await userRef.set({
          displayName,
          email: emailStr,
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
          totalReviews: admin.firestore.FieldValue.increment(1)
        }, { merge: true });

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
 */
async function getRecentReviews(userId) {
  try {
    if (!db) {
      return [];
    }

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
            timestamp: reviewedAtDate
          });
        });

        return reviews;
      } catch (userErr) {
        console.warn('Failed to query user subcollection reviews:', userErr.message);
      }
    }

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
 * Retrieves all review records for a specific authenticated user.
 */
async function getUserReviews(userId) {
  try {
    if (!db || !userId) {
      return [];
    }

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
    } catch (e) { }

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
