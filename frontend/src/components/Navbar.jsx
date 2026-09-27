import React from 'react';
import { Link } from 'react-router-dom';
import PrivateToggle from './PrivateToggle';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import GlassSurface from './GlassSurface';

/**
 * Top navigation bar featuring floating GlassSurface islands:
 * 1. Brand identity island (CodeSage)
 * 2. Settings & controls island (Theme switcher + User displayName/email + Private toggle)
 *
 * @param {object} props
 * @param {boolean} props.isPrivate - Current private mode status.
 * @param {Function} props.onPrivateChange - Callback when privacy status toggles.
 */
export default function Navbar({ isPrivate, onPrivateChange }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full pointer-events-none px-4 sm:px-8 py-3 sm:py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Surface 1: Brand & Logo */}
        <GlassSurface
          width="auto"
          height="auto"
          borderRadius={24}
          borderWidth={0.03}
          blur={6}
          brightness={isDark ? 25 : 95}
          opacity={isDark ? 0.7 : 0.85}
          backgroundOpacity={isDark ? 0.05 : 0.6}
          saturation={1.3}
          className="pointer-events-auto shadow-md transition-transform hover:scale-[1.01] duration-200"
        >
          <Link to="/" className="flex items-center gap-3 px-3 py-1 group select-none">
            <span
              className={`text-base sm:text-lg font-bold tracking-tight transition-colors ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              CodeSage
            </span>
          </Link>
        </GlassSurface>

        {/* Surface 2: Controls & Auth */}
        <GlassSurface
          width="auto"
          height="auto"
          borderRadius={24}
          borderWidth={0.03}
          blur={6}
          brightness={isDark ? 25 : 95}
          opacity={isDark ? 0.7 : 0.85}
          backgroundOpacity={isDark ? 0.05 : 0.6}
          saturation={1.3}
          className="pointer-events-auto shadow-md transition-transform hover:scale-[1.01] duration-200"
        >
          <div className="flex items-center gap-2 sm:gap-3 px-2 py-1 text-xs font-mono">
            <ThemeToggle />
            <div className={`h-4 w-px ${isDark ? 'bg-white/15' : 'bg-black/20'}`} />

            {/* If user is logged in: show user's displayName or email on the right side (before PrivateToggle) */}
            {user && (
              <>
                <Link
                  to="/profile"
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-xl transition-all ${
                    isDark
                      ? 'hover:bg-white/10 text-white/90 hover:text-white'
                      : 'hover:bg-slate-100 text-slate-800 hover:text-slate-900'
                  }`}
                  title={user.email || user.displayName || 'Profile'}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      isDark
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                        : 'bg-purple-100 text-purple-700 border border-purple-300'
                    }`}
                  >
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="inline-block max-w-[130px] truncate text-xs font-mono font-medium">
                    {user.displayName || user.email}
                  </span>
                </Link>
                <div className={`h-4 w-px ${isDark ? 'bg-white/15' : 'bg-black/20'}`} />
              </>
            )}

            {/* PrivateToggle or Launch App */}
            {onPrivateChange ? (
              <PrivateToggle isPrivate={isPrivate} onChange={onPrivateChange} />
            ) : (
              <Link
                to="/app"
                className={`font-semibold px-3 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  isDark
                    ? 'bg-white text-black hover:bg-white/90 shadow-sm'
                    : 'bg-black text-white hover:bg-black/90 shadow-sm'
                }`}
              >
                <span>Launch App</span>
                <span>→</span>
              </Link>
            )}

            {/* Auth Action: Sign In link if not logged in */}
            {!user && (
              <>
                <div className={`h-4 w-px ${isDark ? 'bg-white/15' : 'bg-black/20'}`} />
                <Link
                  to="/login"
                  className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-medium transition-all ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </GlassSurface>
      </div>
    </header>
  );
}
