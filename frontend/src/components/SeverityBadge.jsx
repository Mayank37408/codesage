import React from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Visual pill badge displaying issue severity with color-coded styling.
 *
 * @param {object} props
 * @param {'high'|'medium'|'low'|string} props.severity - Severity category.
 */
export default function SeverityBadge({ severity }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const norm = (severity || 'low').toLowerCase();

  let styles = isDark ? 'bg-white/10 text-white/50 border-white/20' : 'bg-slate-100 text-slate-700 border-slate-200';
  let label = 'LOW';

  if (norm === 'high' || norm === 'critical') {
    styles = isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200';
    label = 'HIGH';
  } else if (norm === 'medium' || norm === 'warning') {
    styles = isDark ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-amber-50 text-amber-800 border-amber-200';
    label = 'MEDIUM';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase border ${styles}`}
    >
      {label}
    </span>
  );
}
