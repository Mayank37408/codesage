import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged,
  signInWithEmail,
  signUpWithEmail,
  signOut as firebaseSignOut,
  signInWithGoogle as firebaseGoogleSignIn,
  isFirebaseConfigured 
} from '../services/firebase';

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  logout: async () => {},
  signInWithGoogle: async () => {},
  isConfigured: false
});

/**
 * Authentication Provider wrapping the application to manage auth state.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isFirebaseConfigured());

  useEffect(() => {
    setIsConfigured(isFirebaseConfigured());
    setLoading(true);

    try {
      const unsubscribe = onAuthStateChanged((currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Failed to attach auth state listener:', err);
      setLoading(false);
    }
  }, []);

  const signIn = async (email, password) => {
    return await signInWithEmail(email, password);
  };

  const signUp = async (email, password, displayName) => {
    return await signUpWithEmail(email, password, displayName);
  };

  const signOut = async () => {
    await firebaseSignOut();
    setUser(null);
  };

  const signInWithGoogle = async () => {
    return await firebaseGoogleSignIn();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        logout: signOut,
        signInWithGoogle,
        isConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context.
 */
export function useAuth() {
  return useContext(AuthContext);
}
