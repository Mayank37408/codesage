const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function reviewCode(code, language, isPrivate, userId = 'anonymous', userEmail = 'anonymous') {
  try {
    const response = await fetch(`${BASE_URL}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        language,
        isPrivate: Boolean(isPrivate),
        userId: userId || 'anonymous',
        userEmail: userEmail || 'anonymous'
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Review failed with status ${response.status}`);
    return data;
  } catch (err) {
    console.error('API reviewCode error:', err);
    throw err;
  }
}

export async function reviewRepo(repoUrl, isPrivate, userId = 'anonymous', userEmail = 'anonymous') {
  try {
    const response = await fetch(`${BASE_URL}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repoUrl,
        isPrivate: Boolean(isPrivate),
        userId: userId || 'anonymous',
        userEmail: userEmail || 'anonymous'
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Repo review failed with status ${response.status}`);
    return data;
  } catch (err) {
    console.error('API reviewRepo error:', err);
    throw err;
  }
}

export async function getHistory(userId = null) {
  try {
    const url = userId 
      ? `${BASE_URL}/history?userId=${encodeURIComponent(userId)}` 
      : `${BASE_URL}/history`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `History failed with status ${response.status}`);
    return data;
  } catch (err) {
    console.error('API getHistory error:', err);
    throw err;
  }
}

export async function getUserReviewHistory(userId) {
  if (!userId) return [];
  try {
    const response = await fetch(`${BASE_URL}/history/user/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch user review history');
    return data.reviews || [];
  } catch (err) {
    console.warn('API getUserReviewHistory warning:', err.message);
    return [];
  }
}
