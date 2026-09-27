import React, { useEffect, useState } from 'react';
import { getHistory } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

/**
 * Sidebar panel displaying user's recent code reviews fetched from the server.
 */
export default function HistoryPanel() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRecent() {
      try {
        setLoading(true);
        const data = await getHistory(user?.uid);
        if (isMounted && data && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      } catch (err) {
        console.warn('Could not load review history:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRecent();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`rounded-2xl transition-all duration-200 p-4 sm:p-5 flex flex-col gap-3 ${
        isDark
          ? 'bg-white/3 border border-white/10 backdrop-blur-sm'
          : 'bg-white border border-slate-200 shadow-sm'
      }`}
    >
      {/* User Context Header */}
      {user?.email && (
        <div
          className={`text-[11px] font-mono truncate pb-2 border-b ${
            isDark ? 'text-white/30 border-white/10' : 'text-slate-500 border-slate-200'
          }`}
        >
          Signed in as {user.email}
        </div>
      )}

      <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <h3 className={`text-xs uppercase tracking-widest font-semibold flex items-center gap-2 ${
          isDark ? 'text-white/50' : 'text-slate-600'
        }`}>
          <svg className="w-3.5 h-3.5 opacity-70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Recent Reviews</span>
        </h3>
        <span className={`text-[11px] font-mono ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
          {reviews.length} total
        </span>
      </div>

      {loading ? (
        <div className={`py-6 text-center text-xs animate-pulse ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
          Loading history...
        </div>
      ) : reviews.length === 0 ? (
        <div className={`py-8 text-center text-xs italic ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
          No review history yet. Public reviews will appear here.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {reviews.map((rev) => (
            <div
              key={rev.id || Math.random()}
              onClick={() => setSelectedReview(selectedReview?.id === rev.id ? null : rev)}
              className={`cursor-pointer rounded-xl p-3 transition-all ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                  : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase ${
                    isDark ? 'bg-white/10 text-white/60' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {rev.language || 'Code'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    isDark
                      ? 'bg-white/10 text-white border-white/10'
                      : 'bg-slate-100 text-slate-800 border-slate-300'
                  }`}
                >
                  {rev.score}/100
                </span>
              </div>

              <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                {rev.summary || 'Code analysis completed.'}
              </p>

              <div className={`mt-2 flex items-center justify-between text-[10px] font-mono ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                <span>{rev.stats?.total ? `${rev.stats.total} findings` : '0 findings'}</span>
                <span>{formatTime(rev.reviewedAt || rev.timestamp)}</span>
              </div>

              {selectedReview?.id === rev.id && (
                <div
                  className={`mt-2.5 pt-2 border-t text-xs p-2.5 rounded-lg space-y-1 ${
                    isDark
                      ? 'border-white/10 text-white/80 bg-black/60'
                      : 'border-slate-200 text-slate-800 bg-slate-100'
                  }`}
                >
                  <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Executive Summary:
                  </div>
                  <div className="leading-relaxed">{rev.summary}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
