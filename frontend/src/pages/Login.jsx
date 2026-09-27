import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SpecularButton from '../components/SpecularButton';
import GoogleButton from '../components/GoogleButton';

export default function Login() {
  const navigate = useNavigate();
  const { user, signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already authenticated, redirect to /app
  useEffect(() => {
    if (user) {
      navigate('/app', { replace: true });
    }
  }, [user, navigate]);

  const mapFirebaseError = (err) => {
    const code = err?.code || (typeof err === 'string' && err.includes('auth/') ? err : '');
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/invalid-email':
        return 'Please enter a valid email';
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again later';
      case 'auth/invalid-credential':
        return 'Incorrect email or password';
      default:
        return err?.message || err?.error || 'Failed to sign in. Please check your credentials.';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await signIn(email.trim(), password);
      if (res && res.success) {
        navigate('/app');
      } else {
        setErrorMessage(mapFirebaseError(res));
      }
    } catch (err) {
      setErrorMessage(mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrorMessage('');

    try {
      await signInWithGoogle();
      navigate('/app');
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      let msg = err.message || 'Google sign-in failed.';
      if (err.code === 'auth/popup-blocked') {
        msg = 'Sign-in popup was blocked by your browser. Please allow popups for localhost:5173.';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'Domain not authorized in Firebase Console (Authentication > Settings > Authorized domains).';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Google provider is disabled in Firebase Console (Authentication > Sign-in method).';
      }
      setErrorMessage(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col justify-center items-center px-4 relative">
      {/* Centered Glass Card */}
      <div className="relative z-10 w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* CodeSage Logo & Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center mb-2 group">
            <span className="text-2xl font-bold tracking-tight text-white group-hover:text-white/80 transition-colors">
              CodeSage
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-white/50">
            Sign in to inspect code and access review history.
          </p>
        </div>

        {/* Google Authentication Button */}
        <div className="space-y-4">
          <GoogleButton
            onClick={handleGoogleLogin}
            loading={googleLoading}
            disabled={loading}
            text="Continue with Google"
          />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-white/40">
              or continue with email
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider block text-white/70">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
              className="w-full px-4 py-3 rounded-xl font-mono text-xs sm:text-sm bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider block text-white/70">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
              className="w-full px-4 py-3 rounded-xl font-mono text-xs sm:text-sm bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div className="pt-2">
            <SpecularButton
              size="lg"
              radius={14}
              bg="#ffffff"
              textColor="#000000"
              lineColor="#000000"
              baseColor="#ffffff"
              intensity={1.2}
              disabled={loading || googleLoading}
              onClick={handleLogin}
              className="w-full py-3.5 font-bold text-sm tracking-wide bg-white text-black shadow-lg hover:bg-white/90 transition-all"
            >
              {loading ? 'Signing in...' : 'Sign In with Email'}
            </SpecularButton>
          </div>

          {/* Error Message: red glass card below button */}
          {errorMessage && (
            <div className="rounded-xl p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono leading-relaxed backdrop-blur-md animate-fade-in">
              {errorMessage}
            </div>
          )}
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs font-mono text-white/50 pt-2">
          Don't have an account?{' '}
          <Link to="/signup" className="text-white font-semibold underline hover:text-white/80 transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
