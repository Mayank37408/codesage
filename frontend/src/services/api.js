/**
 * @file api.js
 * @description API client services for CodeSage code review and history endpoints.
 */

/**
 * Submits code for automated AI code review.
 *
 * @param {string} code - The source code to inspect.
 * @param {string} language - Target programming language.
 * @param {boolean} isPrivate - Whether the review should remain private.
 * @param {string} [userId='anonymous'] - Optional user UID.
 * @param {string} [userEmail='anonymous'] - Optional user email.
 * @returns {Promise<object>} The code review response payload.
 */
export async function reviewCode(code, language, isPrivate, userId = 'anonymous', userEmail = 'anonymous') {
  try {
    const response = await fetch('/api/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        language,
        isPrivate: Boolean(isPrivate),
        userId: userId || 'anonymous',
        userEmail: userEmail || 'anonymous'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Review failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error('API reviewCode error:', err);
    throw err;
  }
}

/**
 * Submits a public GitHub repository URL for automated whole-repo code review.
 *
 * @param {string} repoUrl - Public GitHub repository URL.
 * @param {boolean} isPrivate - Whether the review should remain private.
 * @param {string} [userId='anonymous'] - Optional user UID.
 * @param {string} [userEmail='anonymous'] - Optional user email.
 * @returns {Promise<object>} The code review response payload.
 */
export async function reviewRepo(repoUrl, isPrivate, userId = 'anonymous', userEmail = 'anonymous') {
  try {
    const response = await fetch('/api/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        repoUrl,
        isPrivate: Boolean(isPrivate),
        userId: userId || 'anonymous',
        userEmail: userEmail || 'anonymous'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Repo review failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error('API reviewRepo error:', err);
    throw err;
  }
}

/**
 * Retrieves review history from the database.
 * If userId is provided, queries the user's specific history via ?userId= query string.
 *
 * @param {string} [userId] - User UID
 * @returns {Promise<{ reviews: Array<object> }>} The history object containing reviews.
 */
export async function getHistory(userId = null) {
  try {
    const url = userId ? `/api/history?userId=${encodeURIComponent(userId)}` : '/api/history';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `History request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error('API getHistory error:', err);
    throw err;
  }
}

/**
 * Retrieves review records submitted by the specified authenticated user.
 *
 * @param {string} userId - The user UID.
 * @returns {Promise<Array<object>>}
 */
export async function getUserReviewHistory(userId) {
  if (!userId) return [];
  try {
    const response = await fetch(`/api/history/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user review history');
    }

    return data.reviews || [];
  } catch (err) {
    console.warn('API getUserReviewHistory warning:', err.message);
    return [];
  }
}
