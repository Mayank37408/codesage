import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard component that blocks access to unauthorized users.
 * Displays a full-screen dark spinner while verifying credentials.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black select-none">
        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4" />
        <span className="text-white font-mono text-sm tracking-widest uppercase opacity-80">
          Authenticating...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
