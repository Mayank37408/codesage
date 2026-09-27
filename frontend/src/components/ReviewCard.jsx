import React from 'react';
import SeverityBadge from './SeverityBadge';
import { useTheme } from '../context/ThemeContext';

/**
 * Detailed card representing a single code review finding.
 *
 * @param {object} props
 * @param {object} props.issue - Finding data object.
 */
export default function ReviewCard({ issue }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const normSeverity = (issue.severity || 'low').toLowerCase();

  let borderAccent = isDark ? 'border-l-white/30' : 'border-l-slate-400';
  if (normSeverity === 'high' || normSeverity === 'critical') {
    borderAccent = isDark ? 'border-l-red-500' : 'border-l-red-600';
  } else if (normSeverity === 'medium' || normSeverity === 'warning') {
    borderAccent = isDark ? 'border-l-yellow-500' : 'border-l-amber-500';
  }

  return (
    <div
      className={`rounded-xl transition-all duration-200 border-l-4 ${borderAccent} p-5 space-y-3.5 ${
        isDark
          ? 'bg-white/3 border border-white/10 backdrop-blur-sm'
          : 'bg-white border border-slate-200 shadow-sm'
      }`}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <SeverityBadge severity={issue.severity} />
          
          {issue.source === 'gemini-fatal' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-600 text-white shadow-sm">
              FATAL
            </span>
          )}

          {issue.source === 'verified-cve' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
              Verified
            </span>
          )}

          {issue.source === 'duplication-detected' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Duplicate
            </span>
          )}

          <h3 className={`text-base font-semibold tracking-tight flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <span>{issue.title}</span>
            {issue.source === 'gemini' && (
              <span className="text-xs opacity-75 select-none" title="Gemini AI">🤖</span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {issue.id && (
            <span className={`font-mono text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
              {issue.id}
            </span>
          )}
          <span
            className={`px-2.5 py-0.5 rounded-md text-xs font-mono ${
              isDark
                ? 'bg-white/10 text-white/60'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {issue.file ? `${issue.file} · Line ${issue.line || '—'}` : `Line ${issue.line || '—'}`}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className={`text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
        {issue.description}
      </p>

      {/* Problematic Code Snippet */}
      {issue.code && (
        <div
          className={`rounded-lg p-3 overflow-x-auto ${
            isDark ? 'bg-black border border-white/10' : 'bg-slate-900 border border-slate-800'
          }`}
        >
          <div
            className={`flex items-center justify-between text-[11px] font-mono mb-1 select-none ${
              isDark ? 'text-white/40' : 'text-slate-400'
            }`}
          >
            <span>Context Snippet</span>
            <span>Line {issue.line}</span>
          </div>
          <pre
            className={`font-mono text-xs whitespace-pre ${
              isDark ? 'text-white/80' : 'text-slate-100'
            }`}
          >
            <code>{issue.code}</code>
          </pre>
        </div>
      )}

      {/* Fix Recommendation / Suggestion */}
      {(issue.fix || issue.suggestion) && (
        <div
          className={`rounded-lg p-3 space-y-1 border ${
            isDark
              ? 'bg-white/5 border-white/20'
              : 'bg-emerald-50/70 border-emerald-200'
          }`}
        >
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold ${
              isDark ? 'text-white/80' : 'text-emerald-800'
            }`}
          >
            <svg className="w-3.5 h-3.5 opacity-80 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
            </svg>
            <span>Suggested Remediation:</span>
          </div>
          <div
            className={`font-mono text-xs leading-relaxed whitespace-pre-wrap ${
              isDark ? 'text-white/70' : 'text-emerald-900'
            }`}
          >
            {issue.fix || issue.suggestion}
          </div>
        </div>
      )}

      {/* Corrected Code */}
      {issue.correctedCode && issue.correctedCode.trim() !== '' && (
        <div className="rounded-lg p-3 overflow-x-auto bg-green-500/5 border border-green-500/20">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1 select-none text-green-400/80">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Corrected Code</span>
            </span>
            {issue.line && <span>Line {issue.line}</span>}
          </div>
          <pre className="text-green-300 font-mono text-sm whitespace-pre">
            <code>{issue.correctedCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
