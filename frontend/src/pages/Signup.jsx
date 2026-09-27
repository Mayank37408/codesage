import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SpecularButton from '../components/SpecularButton';
import GoogleButton from '../components/GoogleButton';

export default function Signup() {
  const navigate = useNavigate();
  const { user, signUp, signInWithGoogle } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 8 characters.';
      default:
        return err?.message || err?.error || 'Failed to create account. Please try again.';
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await signUp(email.trim(), password, name.trim());
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

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setErrorMessage('');

    try {
      await signInWithGoogle();
      navigate('/app');
    } catch (err) {
      console.error('Google sign-up error:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      let msg = err.message || 'Google sign-up failed.';
      if (err.code === 'auth/popup-blocked') {
        msg = 'Sign-up popup was blocked by your browser. Please allow popups for localhost:5173.';
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
            Create your account
          </h1>
          <p className="text-xs sm:text-sm text-white/50">
            Sign up to inspect code repositories and track review findings.
          </p>
        </div>

        {/* Google Authentication Button */}
        <div className="space-y-4">
          <GoogleButton
            onClick={handleGoogleSignup}
            loading={googleLoading}
            disabled={loading}
            text="Sign up with Google"
          />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-white/40">
              or sign up with email
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider block text-white/70">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrorMessage(''); }}
              className="w-full px-4 py-3 rounded-xl font-mono text-xs sm:text-sm bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

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
              Password (min 8 characters)
            </label>
            <input
              type="password"
              required
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
              className="w-full px-4 py-3 rounded-xl font-mono text-xs sm:text-sm bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider block text-white/70">
              Confirm Password
            </label>
            <input
              type="password"
              required
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setErrorMessage(''); }}
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
              onClick={handleSignup}
              className="w-full py-3.5 font-bold text-sm tracking-wide bg-white text-black shadow-lg hover:bg-white/90 transition-all"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </SpecularButton>
          </div>

          {/* Error Message: red glass card */}
          {errorMessage && (
            <div className="rounded-xl p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono leading-relaxed backdrop-blur-md animate-fade-in">
              {errorMessage}
            </div>
          )}
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs font-mono text-white/50 pt-2">
          Already have an account?{' '}
          <Link to="/login" className="text-white font-semibold underline hover:text-white/80 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
