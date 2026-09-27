import React, { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Reads and returns the current private mode setting from localStorage.
 *
 * @returns {boolean}
 */
export const getPrivateMode = () => {
  try {
    return localStorage.getItem('codesage_private') === 'true';
  } catch (e) {
    return false;
  }
};

/**
 * Toggle component to switch between Public and Private review mode.
 *
 * @param {object} props
 * @param {boolean} props.isPrivate - Whether private mode is enabled.
 * @param {Function} props.onChange - Handler called when toggle value changes.
 */
export default function PrivateToggle({ isPrivate, onChange }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    try {
      const saved = localStorage.getItem('codesage_private');
      if (saved !== null) {
        onChange(saved === 'true');
      }
    } catch (e) {
      console.warn('Could not read codesage_private from localStorage:', e);
    }
  }, []);

  const handleToggle = () => {
    const nextVal = !isPrivate;
    onChange(nextVal);
    try {
      localStorage.setItem('codesage_private', String(nextVal));
    } catch (e) {
      console.warn('Could not save codesage_private to localStorage:', e);
    }
  };

  const getButtonBg = () => {
    if (isDark) {
      return isPrivate ? 'bg-white' : 'bg-white/10 hover:bg-white/20';
    }
    return isPrivate ? 'bg-black' : 'bg-black/10 hover:bg-black/20';
  };

  const getThumbBg = () => {
    if (isDark) {
      return isPrivate ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white/40';
    }
    return isPrivate ? 'translate-x-5 bg-white' : 'translate-x-0 bg-white shadow-sm';
  };

  return (
    <div className="flex items-center gap-2.5 select-none">
      <button
        type="button"
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 ${
          isDark ? 'focus:ring-white/20' : 'focus:ring-black/20'
        } ${getButtonBg()}`}
        aria-label="Toggle private mode"
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md transition duration-200 ease-in-out ${getThumbBg()}`}
        />
      </button>

      {isPrivate ? (
        <span className={`flex items-center gap-1.5 text-xs font-semibold ${
          isDark ? 'text-white' : 'text-black'
        }`}>
          <svg className="w-3.5 h-3.5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Private Mode</span>
        </span>
      ) : (
        <span className={`flex items-center gap-1.5 text-xs font-medium ${
          isDark ? 'text-white/40' : 'text-black'
        }`}>
          <svg className="w-3.5 h-3.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>Public</span>
        </span>
      )}
    </div>
  );
}
