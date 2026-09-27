import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider, 
  signInWithPopup
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

// Reads from Vite environment variables (VITE_FIREBASE_*) with placeholder fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

/**
 * Checks if the Firebase configuration has been populated with valid keys.
 */
export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
    firebaseConfig.authDomain &&
    firebaseConfig.authDomain !== 'YOUR_AUTH_DOMAIN'
  );
};

let app = null;
let auth = null;
let googleProvider = null;
let db = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  db = getFirestore(app);
} catch (e) {
  console.warn('Firebase client init warning:', e.message);
}

/**
 * Creates a new user account with email and password and sets their display name.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @returns {Promise<{ success: boolean, user?: object, error?: string, code?: string }>}
 */
export async function signUpWithEmail(email, password, displayName) {
  if (!auth) {
    return { success: false, error: 'Firebase Auth is not initialized. Please verify your credentials in .env.' };
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName && displayName.trim()) {
      await updateProfile(userCredential.user, { displayName: displayName.trim() });
    }
    return { success: true, user: userCredential.user };
  } catch (err) {
    return { success: false, error: err.message, code: err.code };
  }
}

/**
 * Signs in an existing user with email and password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ success: boolean, user?: object, error?: string, code?: string }>}
 */
export async function signInWithEmail(email, password) {
  if (!auth) {
    return { success: false, error: 'Firebase Auth is not initialized. Please verify your credentials in .env.' };
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { success: true, user: userCredential.user };
  } catch (err) {
    return { success: false, error: err.message, code: err.code };
  }
}

/**
 * Signs out the currently authenticated user and clears local auth storage.
 *
 * @returns {Promise<void>}
 */
export async function signOut() {
  try {
    if (auth) {
      await firebaseSignOut(auth);
    }
  } finally {
    try {
      localStorage.removeItem('codesage_user');
      localStorage.removeItem('codesage_auth');
    } catch (e) {
      console.warn('Could not clear auth data from localStorage:', e);
    }
  }
}

/**
 * Returns current Firebase auth user or null.
 *
 * @returns {Promise<import('firebase/auth').User|null>}
 */
export async function getCurrentUser() {
  if (!auth) return null;
  return auth.currentUser;
}

/**
 * Subscribes to Firebase auth state changes.
 *
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChanged(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Triggers Google Sign-In via popup.
 *
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth is not initialized. Please verify your credentials in .env.');
  }
  return await signInWithPopup(auth, googleProvider);
};

/**
 * Signs out the currently authenticated user (backwards compatibility).
 */
export const logoutUser = async () => {
  return await signOut();
};

/**
 * Saves an authentic user review to Firestore.
 *
 * @param {string} userId - User UID
 * @param {object} reviewData - Review properties
 * @returns {Promise<string|null>} Created document ID
 */
export const saveReviewToFirestore = async (userId, reviewData) => {
  if (!db || !userId) {
    return null;
  }
  try {
    const docRef = await addDoc(collection(db, 'user_reviews'), {
      userId,
      type: reviewData.type || 'code',
      title: reviewData.title || (reviewData.type === 'repo' ? (reviewData.repoUrl || 'Repository') : `${reviewData.language || 'Code'} Snippet`),
      language: reviewData.language || 'Unknown',
      repoUrl: reviewData.repoUrl || '',
      score: typeof reviewData.score === 'number' ? reviewData.score : (reviewData.overallScore || 0),
      stats: reviewData.stats || { total: 0, high: 0, medium: 0, low: 0 },
      summary: reviewData.summary || '',
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (err) {
    console.warn('Firestore save review notice:', err.message);
    return null;
  }
};

/**
 * Fetches all real reviews for a specific user from Firestore.
 *
 * @param {string} userId - User UID
 * @returns {Promise<Array<object>>}
 */
export const getUserReviewsFromFirestore = async (userId) => {
  if (!db || !userId) {
    return [];
  }
  try {
    const q = query(
      collection(db, 'user_reviews'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        ...data,
        date: data.createdAt || (data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString())
      });
    });
    list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return list;
  } catch (err) {
    console.warn('Firestore get user reviews notice:', err.message);
    return [];
  }
};

export { auth, googleProvider, db };
