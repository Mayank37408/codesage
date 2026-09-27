import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import MonthlyActivityGraph from '../components/MonthlyActivityGraph';
import CRTWarp from '../components/CRTWarp';
import { fetchRealUserActivities, computeDashboardAnalytics } from '../services/activityService';

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'code' | 'repo'

  // Load real user activities directly from database
  const loadData = async () => {
    setLoading(true);
    try {
      const realList = await fetchRealUserActivities(user?.uid);
      setActivities(realList);
    } catch (err) {
      console.warn('Failed to load user reviews from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const analytics = computeDashboardAnalytics(activities);

  // Filtered recent activities
  const filteredActivities = activities.filter((act) => {
    if (feedFilter === 'code') return act.type === 'code';
    if (feedFilter === 'repo') return act.type === 'repo';
    return true;
  });

  const handleOpenReview = (act) => {
    const mockResult = {
      overallScore: act.score,
      score: act.score,
      summary: act.summary,
      stats: act.stats,
      language: act.language,
      issues: [
        {
          id: 'ISS-001',
          title: 'Audit Record Finding',
          severity: act.stats.high > 0 ? 'high' : 'medium',
          line: 12,
          description: act.summary,
          fix: 'Review implementation guidelines in repository.'
        }
      ]
    };
    sessionStorage.setItem('codesage_result', JSON.stringify(mockResult));
    navigate('/results');
  };

  // Determine user creation date or member tenure
  const memberDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric'
      })
    : '2026';

  const userInitial = (user?.displayName || user?.email || 'Developer').charAt(0).toUpperCase();

  return (
    <div className={`min-h-screen flex flex-col pt-16 transition-colors duration-200 ${
      isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* User Identity Hero Section */}
        <section
          className={`relative rounded-3xl overflow-hidden p-6 sm:p-8 border shadow-2xl transition-all duration-300 ${
            isDark
              ? 'border-white/15 bg-[#05010a]'
              : 'border-slate-200 bg-white/80 shadow-slate-200/50'
          }`}
        >
          {/* Ambient CRT Warp Shader in Background */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
            <CRTWarp
              color={isDark ? '#c755f7' : '#9333ea'}
              backgroundColor={isDark ? '#05010a' : '#faf5ff'}
              speed={0.2}
              curvature={0.15}
              scanlineStrength={0.15}
              scanlineFrequency={150}
              waveAmplitude={0.15}
              waveFrequency={2}
              bloom={1.2}
              bloomRadius={1}
              noise={0.05}
              brightness={1.1}
              mouseReact={false}
              fps={24}
              paused={false}
            />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Avatar & User Details */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User Avatar'}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-2 border-purple-500/60 object-cover shadow-[0_0_25px_rgba(199,85,247,0.3)]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center font-extrabold text-3xl border shadow-xl ${
                      isDark
                        ? 'bg-gradient-to-br from-purple-600/40 to-indigo-900/60 border-purple-400/50 text-white shadow-purple-500/20'
                        : 'bg-gradient-to-br from-purple-100 to-indigo-200 border-purple-300 text-purple-800'
                    }`}
                  >
                    {userInitial}
                  </div>
                )}
                <span
                  className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-black p-1 rounded-full border-2 border-black"
                  title="Verified Account"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {user?.displayName || 'Active Developer'}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider border ${
                      isDark
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-purple-100 text-purple-700 border-purple-300'
                    }`}
                  >
                    Verified Reviewer
                  </span>
                </div>

                <p className={`text-xs sm:text-sm font-mono ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                  {user?.email || 'developer@codesage.internal'}
                </p>

                <div className="flex items-center gap-4 text-[11px] font-mono pt-1 text-white/40">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Member since {memberDate}
                  </span>
                  <span>•</span>
                  <span>Database: {activities.length} Records</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className={`px-3 py-2 rounded-xl text-xs font-mono transition-all border flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-white/80 border-white/15'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
                title="Reload authentic reviews from database"
              >
                <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span>{loading ? 'Syncing...' : 'Sync DB'}</span>
              </button>

              {user && (
                <button
                  type="button"
                  onClick={logout}
                  className={`px-3 py-2 rounded-xl text-xs font-mono transition-colors border cursor-pointer ${
                    isDark
                      ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                      : 'border-red-200 text-red-600 hover:bg-red-50'
                  }`}
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 4 Core Metric KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Stat 1: Code Reviews */}
          <div
            className={`rounded-3xl p-5 border relative overflow-hidden transition-all duration-200 hover:scale-[1.01] ${
              isDark
                ? 'bg-gradient-to-br from-[#120822] to-[#080512] border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.08)]'
                : 'bg-white border-purple-200 shadow-lg shadow-purple-100/50'
            }`}
          >
            <div className="flex items-center justify-between text-purple-400 mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                Code Snippets
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {analytics.codeCount}
              </span>
              <span className="text-xs font-mono text-purple-400 font-semibold">audits</span>
            </div>
            <p className={`text-xs mt-2 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
              Single-file code snippets submitted for AI rule analysis.
            </p>
          </div>

          {/* Stat 2: Repositories Reviewed */}
          <div
            className={`rounded-3xl p-5 border relative overflow-hidden transition-all duration-200 hover:scale-[1.01] ${
              isDark
                ? 'bg-gradient-to-br from-[#061824] to-[#040c14] border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.08)]'
                : 'bg-white border-cyan-200 shadow-lg shadow-cyan-100/50'
            }`}
          >
            <div className="flex items-center justify-between text-cyan-400 mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                Repositories
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="6" y1="3" x2="6" y2="15" />
                  <circle cx="18" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <path d="M18 9a9 9 0 0 1-9 9" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {analytics.repoCount}
              </span>
              <span className="text-xs font-mono text-cyan-400 font-semibold">repos</span>
            </div>
            <p className={`text-xs mt-2 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
              Full GitHub repositories cloned and evaluated end-to-end.
            </p>
          </div>

          {/* Stat 3: Total Submissions */}
          <div
            className={`rounded-3xl p-5 border relative overflow-hidden transition-all duration-200 hover:scale-[1.01] ${
              isDark
                ? 'bg-gradient-to-br from-[#1a140a] to-[#0a0702] border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.08)]'
                : 'bg-white border-amber-200 shadow-lg shadow-amber-100/50'
            }`}
          >
            <div className="flex items-center justify-between text-amber-400 mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                Total Audits
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {analytics.totalCount}
              </span>
              <span className="text-xs font-mono text-amber-400 font-semibold">runs</span>
            </div>
            <p className={`text-xs mt-2 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
              Lifetime security audits & vulnerability assessments.
            </p>
          </div>

          {/* Stat 4: Average Score */}
          <div
            className={`rounded-3xl p-5 border relative overflow-hidden transition-all duration-200 hover:scale-[1.01] ${
              isDark
                ? 'bg-gradient-to-br from-[#081a12] to-[#030d07] border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.08)]'
                : 'bg-white border-emerald-200 shadow-lg shadow-emerald-100/50'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-400 mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                Average Health
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {analytics.totalCount > 0 ? analytics.avgScore : 'N/A'}
              </span>
              {analytics.totalCount > 0 && (
                <span className="text-xs font-mono text-emerald-400 font-semibold">/ 100</span>
              )}
            </div>
            <p className={`text-xs mt-2 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
              Overall code security, readability, and reliability index.
            </p>
          </div>
        </section>

        {/* Central Interactive Monthly Activity Graph */}
        <section>
          <MonthlyActivityGraph monthlyData={analytics.monthlyData} />
        </section>

        {/* Activity Feed Section */}
        <section
          className={`rounded-3xl p-6 sm:p-8 border transition-all duration-300 ${
            isDark
              ? 'bg-[#080512]/90 border-white/15'
              : 'bg-white border-slate-200 shadow-xl'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b pb-5 border-white/10">
            <div>
              <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Recent Submissions History
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                Review log of single-file snippets and repository audits requested.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl border text-xs font-mono self-start sm:self-auto border-white/10 bg-black/40">
              <button
                type="button"
                onClick={() => setFeedFilter('all')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  feedFilter === 'all'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                All ({activities.length})
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('code')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  feedFilter === 'code'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Code ({analytics.codeCount})
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('repo')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  feedFilter === 'repo'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Repos ({analytics.repoCount})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3 font-mono">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
              <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                Querying database records for this account...
              </p>
            </div>
          ) : activities.length === 0 ? (
            <div className="py-14 text-center space-y-3 font-mono">
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-white/5 border border-white/10 text-white/40">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <p className={`text-sm font-semibold ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
                No reviews saved in database for this account yet.
              </p>
              <p className={`text-xs max-w-md mx-auto leading-relaxed ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                Go to the Home page to submit code snippets or GitHub repositories for review. Every audit is saved directly to the database and will immediately reflect here.
              </p>
              <div className="pt-2">
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md"
                >
                  <span>Submit Your First Code Review</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-12 text-center text-sm font-mono text-white/40">
              No reviews found under this filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((act) => {
                const isRepo = act.type === 'repo';
                const actDate = new Date(act.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={act.id}
                    className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isDark
                        ? 'bg-white/3 hover:bg-white/6 border-white/10 hover:border-purple-500/40'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center border ${
                          isRepo
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                            : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                        }`}
                      >
                        {isRepo ? (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="6" y1="3" x2="6" y2="15" />
                            <circle cx="18" cy="6" r="3" />
                            <circle cx="6" cy="18" r="3" />
                            <path d="M18 9a9 9 0 0 1-9 9" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="16 18 22 12 16 6" />
                            <polyline points="8 6 2 12 8 18" />
                          </svg>
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-sm tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {act.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-semibold ${
                              isRepo
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            {isRepo ? 'Repository' : act.language || 'Code'}
                          </span>
                        </div>

                        <p className={`text-xs line-clamp-1 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                          {act.summary}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] font-mono text-white/40">
                          <span>{actDate}</span>
                          <span>•</span>
                          <span className={act.stats?.high > 0 ? 'text-rose-400 font-semibold' : ''}>
                            {act.stats?.total || 0} findings ({act.stats?.high || 0} High)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score Badge & Action */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <div
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border text-center ${
                          act.score >= 85
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : act.score >= 70
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {act.score}/100
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenReview(act)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all border ${
                          isDark
                            ? 'bg-white/5 hover:bg-white/10 text-white/80 border-white/15'
                            : 'bg-white hover:bg-slate-200 text-slate-800 border-slate-300'
                        }`}
                      >
                        View Report →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
