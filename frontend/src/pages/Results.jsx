import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ReviewCard from '../components/ReviewCard';
import HistoryPanel from '../components/HistoryPanel';
import { useTheme } from '../context/ThemeContext';

/**
 * Results page displaying detailed code review diagnostics, severity breakdown, and strengths.
 */
export default function Results() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const [review, setReview] = useState(null);
  const [filter, setFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    try {
      const savedPrivate = localStorage.getItem('codesage_private');
      if (savedPrivate !== null) {
        setIsPrivate(savedPrivate === 'true');
      }
    } catch (e) {
      console.warn('Could not read private preference:', e);
    }

    try {
      const raw = sessionStorage.getItem('codesage_result');
      if (!raw) {
        navigate('/app');
        return;
      }
      const parsed = JSON.parse(raw);
      setReview(parsed);
    } catch (err) {
      console.error('Failed to parse codesage_result:', err);
      navigate('/app');
    }
  }, [navigate]);

  if (!review) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black text-white/40' : 'bg-slate-50 text-slate-400'}`}>
        <span className="font-mono text-sm animate-pulse">Loading inspection findings...</span>
      </div>
    );
  }

  const score = typeof review.overallScore === 'number' ? review.overallScore : (typeof review.score === 'number' ? review.score : 0);
  const stats = review.stats || {
    total: review.issues?.length || 0,
    high: (review.issues || []).filter(i => (i.severity || '').toLowerCase() === 'high').length,
    medium: (review.issues || []).filter(i => (i.severity || '').toLowerCase() === 'medium').length,
    low: (review.issues || []).filter(i => (i.severity || '').toLowerCase() === 'low').length
  };

  const getScoreStyles = (s) => {
    if (isDark) {
      if (s >= 80) return { border: 'border-white', text: 'text-white' };
      if (s >= 60) return { border: 'border-white/60', text: 'text-white/60' };
      return { border: 'border-red-500', text: 'text-red-400' };
    }
    if (s >= 80) return { border: 'border-slate-900', text: 'text-slate-900' };
    if (s >= 60) return { border: 'border-slate-400', text: 'text-slate-600' };
    return { border: 'border-red-600', text: 'text-red-600' };
  };

  const scoreStyles = getScoreStyles(score);

  const allIssues = Array.isArray(review.issues) ? review.issues : [];
  const filteredIssues = filter === 'all'
    ? allIssues
    : allIssues.filter((i) => (i.severity || '').toLowerCase() === filter);

  const handleCopyReport = () => {
    const reportLines = [
      `=== CODESAGE CODE REVIEW REPORT ===`,
      review.owner && review.repo ? `Repository: ${review.owner}/${review.repo} (${review.branch || 'main'})` : '',
      `Language: ${review.language || 'Unknown'}`,
      `Quality Score: ${score}/100`,
      `Total Issues: ${stats.total} (High: ${stats.high}, Medium: ${stats.medium}, Low: ${stats.low})`,
      `Reviewed At: ${review.reviewedAt || new Date().toISOString()}`,
      `\n--- SUMMARY ---`,
      review.aiSummary || review.summary || 'No summary provided.',
      `\n--- STRENGTHS ---`,
      ...(review.strengths && review.strengths.length > 0
        ? review.strengths.map((s, idx) => `${idx + 1}. ${s}`)
        : ['None recorded']),
      `\n--- FINDINGS (${allIssues.length}) ---`,
      ...allIssues.map((issue, idx) =>
        `[${issue.id || `ISS-${idx + 1}`}] [${(issue.severity || 'low').toUpperCase()}] ${issue.file ? `${issue.file} · ` : ''}Line ${issue.line}: ${issue.title}\nDescription: ${issue.description}\nRemediation: ${issue.fix || issue.suggestion || 'N/A'}\n`
      )
    ].filter(Boolean);

    const fullReportText = reportLines.join('\n');
    navigator.clipboard.writeText(fullReportText).then(() => {
      setToastMessage('Report copied!');
      setTimeout(() => setToastMessage(''), 2000);
    }).catch((err) => {
      console.error('Failed to copy report:', err);
    });
  };

  return (
    <div className={`min-h-screen flex flex-col pt-16 transition-colors duration-200 ${
      isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <Navbar isPrivate={isPrivate} onPrivateChange={setIsPrivate} />

      {/* Copy Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-2xl animate-fade-in flex items-center gap-2 ${
            isDark ? 'bg-white text-black' : 'bg-slate-900 text-white'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT SIDEBAR */}
          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24 space-y-6">
            <div
              className={`rounded-3xl p-6 space-y-6 shadow-xl transition-all duration-200 border ${
                isDark
                  ? 'bg-[#18181c] border-white/15'
                  : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
              }`}
            >
              {/* Score Circle Display */}
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div
                  className={`relative flex items-center justify-center w-36 h-36 rounded-full border-4 shadow-inner ${
                    scoreStyles.border
                  } ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}
                >
                  <div className="text-center font-mono">
                    <span className={`text-4xl font-extrabold ${scoreStyles.text}`}>
                      {score}
                    </span>
                    <span className={`text-xs block ${isDark ? 'text-white/40' : 'text-slate-400'}`}>/100</span>
                  </div>
                </div>
                <span className={`text-xs font-mono uppercase tracking-widest pt-1 ${
                  isDark ? 'text-white/40' : 'text-slate-500'
                }`}>
                  Quality Score
                </span>
              </div>

              {/* Target Language Indicator */}
              <div className={`flex items-center justify-between border-t pt-4 ${
                isDark ? 'border-white/10' : 'border-slate-200'
              }`}>
                <span className={`text-xs font-mono ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                  Target Context
                </span>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold uppercase ${
                    isDark
                      ? 'bg-white/10 text-white/60'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {review.language || 'Generic'}
                </span>
              </div>

              {/* Finding Statistics Grid */}
              <div className={`border-t pt-4 space-y-2 text-xs font-mono ${
                isDark ? 'border-white/10' : 'border-slate-200'
              }`}>
                <div
                  className={`flex justify-between items-center p-2 rounded-lg border ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white/70'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>Total findings</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.total}</span>
                </div>
                <div
                  className={`flex justify-between items-center p-2 rounded-lg border ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-red-400'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <span>High severity</span>
                  <span className="font-bold">{stats.high}</span>
                </div>
                <div
                  className={`flex justify-between items-center p-2 rounded-lg border ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-yellow-400'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <span>Medium severity</span>
                  <span className="font-bold">{stats.medium}</span>
                </div>
                <div
                  className={`flex justify-between items-center p-2 rounded-lg border ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white/50'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span>Low severity</span>
                  <span className="font-bold">{stats.low}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/app')}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-center gap-2 border ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  <span>←</span>
                  <span>Review New Code</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyReport}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-white text-black hover:bg-white/90'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy Full Report</span>
                </button>
              </div>

            </div>

            <HistoryPanel />
          </aside>

          {/* MAIN AREA */}
          <section className="flex-1 w-full space-y-6">

            {/* Fatal Execution Error Banner */}
            {review.executionWillFail && (
              <div className="w-full bg-red-500/10 border border-red-500/30 backdrop-blur-sm rounded-2xl p-4 mb-4 flex items-start gap-3 shadow-lg">
                <span className="text-xl sm:text-2xl shrink-0 select-none">⚠️</span>
                <div className="space-y-1">
                  <h3 className="text-red-400 font-bold text-sm sm:text-base tracking-tight">
                    Code Will Not Execute
                  </h3>
                  <p className="text-red-300/70 text-xs sm:text-sm leading-relaxed">
                    {review.fatalErrorSummary || 'Fatal errors detected that will cause this code to crash upon execution.'}
                  </p>
                </div>
              </div>
            )}

            {/* Repo Owner/Repo/Branch Header Banner */}
            {review.owner && review.repo && (
              <div className="flex items-center gap-2.5 font-mono text-sm text-purple-300 font-semibold bg-purple-500/10 border border-purple-500/20 px-4 py-3 rounded-2xl shadow-md">
                <svg className="w-4 h-4 shrink-0 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                <span>{review.owner} / {review.repo}</span>
                {review.branch && <span className="text-xs text-white/50">({review.branch})</span>}
              </div>
            )}

            {/* AI Summary Banner */}
            <div
              className={`rounded-3xl p-6 sm:p-7 space-y-3 shadow-xl border ${
                isDark
                  ? 'bg-[#18181c] border-white/15'
                  : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className={`flex items-center gap-2 text-sm font-semibold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <svg className="w-4 h-4 shrink-0 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  <span>Executive AI Verdict</span>
                </div>

                {review.geminiAvailable ? (
                  <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs px-2 py-0.5 rounded-full font-mono shrink-0">
                    🤖 AI Enhanced
                  </span>
                ) : (
                  <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs px-2 py-0.5 rounded-full font-mono shrink-0">
                    ⚡ Static Analysis Only
                  </span>
                )}
              </div>
              <p className={`text-sm sm:text-base leading-relaxed font-normal ${
                isDark ? 'text-white/70' : 'text-slate-600'
              }`}>
                {review.aiSummary || review.summary || 'Analysis complete with no summary remarks.'}
              </p>
            </div>

            {/* "Explain This File" Collapsible Section */}
            {review.fileExplanations && review.fileExplanations.length > 0 && (
              <div
                className={`rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl border ${
                  isDark
                    ? 'bg-[#18181c] border-white/15'
                    : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
                }`}
              >
                <h3 className={`text-sm sm:text-base font-semibold flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <svg className="w-4 h-4 shrink-0 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  <span>Explain This File</span>
                </h3>
                <div className="space-y-2.5">
                  {review.fileExplanations.map((item, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl p-4 space-y-1 border ${
                        isDark
                          ? 'bg-white/5 border-white/10'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="font-mono text-xs font-bold text-purple-400 block">{item.path}</span>
                      <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                        {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Severity Filter Tabs */}
            <div className={`flex flex-wrap items-center gap-2 border-b pb-3 ${
              isDark ? 'border-white/10' : 'border-slate-200'
            }`}>
              {[
                { id: 'all', label: 'All', count: stats.total },
                { id: 'high', label: 'High', count: stats.high },
                { id: 'medium', label: 'Medium', count: stats.medium },
                { id: 'low', label: 'Low', count: stats.low },
              ].map((tab) => {
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                      isActive
                        ? isDark
                          ? 'bg-white text-black shadow-md'
                          : 'bg-slate-900 text-white shadow-md'
                        : isDark
                          ? 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                );
              })}
            </div>

            {/* Findings List */}
            <div className="space-y-4">
              {filteredIssues.length === 0 ? (
                <div
                  className={`rounded-3xl p-10 text-center space-y-3 border ${
                    isDark
                      ? 'bg-[#18181c] border-white/15'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className={`text-4xl ${isDark ? 'text-white' : 'text-emerald-500'}`}>✓</div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    No issues found! Great code. ✓
                  </h3>
                  <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    {filter === 'all'
                      ? 'No security, logic, or stylistic defects were detected.'
                      : `No issues detected with "${filter.toUpperCase()}" severity.`}
                  </p>
                </div>
              ) : (
                filteredIssues.map((issue, idx) => (
                  <ReviewCard key={issue.id || idx} issue={issue} />
                ))
              )}
            </div>

            {/* Strengths Section */}
            {review.strengths && review.strengths.length > 0 && (
              <div
                className={`rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl border ${
                  isDark
                    ? 'bg-[#18181c] border-white/15'
                    : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
                }`}
              >
                <h3 className={`text-sm sm:text-base font-semibold flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <svg className="w-4 h-4 shrink-0 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>Positive Architectural Patterns</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {review.strengths.map((str, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl p-3 text-xs sm:text-sm flex items-start gap-2.5 border ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white/80'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className={`font-bold shrink-0 ${isDark ? 'text-white' : 'text-emerald-600'}`}>✓</span>
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </section>

        </div>
      </main>
    </div>
  );
}
