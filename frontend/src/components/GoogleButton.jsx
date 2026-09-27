import React from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Premium Google Sign-In button with official brand iconography,
 * reactive dark/light mode theming, and smooth interactive states.
 *
 * @param {object} props
 * @param {Function} props.onClick - Click handler to trigger Google Auth
 * @param {boolean} [props.loading] - Whether auth action is currently in progress
 * @param {boolean} [props.disabled] - Whether button is disabled
 * @param {string} [props.text="Continue with Google"] - Button label text
 * @param {string} [props.className] - Optional extra class names
 */
export default function GoogleButton({
  onClick,
  loading = false,
  disabled = false,
  text = 'Continue with Google',
  className = ''
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`group relative w-full py-3.5 px-4 rounded-2xl font-mono text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-200 outline-none select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        isDark
          ? 'bg-[#0f0b18]/90 hover:bg-[#171226] text-white border border-white/20 hover:border-purple-400/60 shadow-[0_0_20px_rgba(199,85,247,0.08)] hover:shadow-[0_0_25px_rgba(199,85,247,0.22)] active:scale-[0.99]'
          : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-purple-500 shadow-sm hover:shadow-md active:scale-[0.99]'
      } ${className}`}
    >
      {/* Background glow highlight */}
      <span
        className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 ${
          isDark
            ? 'bg-gradient-to-r from-purple-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100'
            : 'bg-gradient-to-r from-purple-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100'
        }`}
      />

      {loading ? (
        <svg
          className="animate-spin w-4 h-4 text-purple-400 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}

      <span className="relative z-10 tracking-wide">
        {loading ? 'Connecting with Google...' : text}
      </span>
    </button>
  );
}
