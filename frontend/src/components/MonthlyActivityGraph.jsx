import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Interactive, high-fidelity SVG Monthly Activity Graph.
 * Visualizes Code vs Repository review frequency across all 12 months with
 * interactive hover tooltips, smooth area curves, and responsive filtering.
 *
 * @param {object} props
 * @param {Array<object>} props.monthlyData - Array of 12 month items
 * @param {number} [props.activeYear=2026] - The year being visualized
 */
export default function MonthlyActivityGraph({ monthlyData = [], activeYear = new Date().getFullYear() }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'code' | 'repo'
  const [hoveredMonth, setHoveredMonth] = useState(null);

  // Determine maximum value for dynamic Y-axis scaling
  const maxMonthlyVal = Math.max(
    ...monthlyData.map((d) => {
      if (activeFilter === 'code') return d.codeCount;
      if (activeFilter === 'repo') return d.repoCount;
      return d.totalCount;
    }),
    6 // minimum ceiling so graph never flattens when empty
  );

  const chartHeight = 180;
  const chartWidth = 760;
  const paddingX = 40;
  const paddingBottom = 40;
  const paddingTop = 25;

  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingTop;

  // Calculate coordinates for monthly points
  const points = monthlyData.map((d, index) => {
    const x = paddingX + (index / (monthlyData.length - 1)) * usableWidth;
    let val = d.totalCount;
    if (activeFilter === 'code') val = d.codeCount;
    if (activeFilter === 'repo') val = d.repoCount;

    const y = paddingTop + usableHeight - (val / maxMonthlyVal) * usableHeight;
    return { ...d, x, y, val };
  });

  // Generate smooth SVG curve path for area backdrop
  const buildSmoothPath = (pts) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const smoothLine = buildSmoothPath(points);
  const areaPath = points.length > 0
    ? `${smoothLine} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
    : '';

  const colWidth = usableWidth / monthlyData.length;
  const barWidth = 14;

  const hasData = monthlyData.some((d) => d.totalCount > 0);

  return (
    <div
      className={`rounded-3xl p-5 sm:p-7 border transition-all duration-300 ${
        isDark
          ? 'bg-[#080512]/90 border-white/15 shadow-[0_0_50px_rgba(147,51,234,0.06)]'
          : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
      }`}
    >
      {/* Top Bar: Title & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Audit Activity Velocity
            </h2>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                isDark
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  : 'bg-purple-100 text-purple-800 border-purple-300'
              }`}
            >
              {activeYear} Matrix
            </span>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            Monthly distribution of code snippets vs. full GitHub repositories inspected.
          </p>
        </div>

        {/* Filter Switcher */}
        <div
          className={`flex items-center p-1 rounded-2xl border text-xs font-mono select-none self-start sm:self-auto ${
            isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeFilter === 'all'
                ? isDark
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-purple-700 shadow-sm'
                : isDark
                ? 'text-white/60 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Audits
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('code')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeFilter === 'code'
                ? isDark
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-purple-700 shadow-sm'
                : isDark
                ? 'text-white/60 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Code Snippets
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('repo')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeFilter === 'repo'
                ? isDark
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-white text-cyan-700 shadow-sm'
                : isDark
                ? 'text-white/60 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Repositories
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-hidden">
        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20 bg-black/40 backdrop-blur-[2px] rounded-2xl">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>
            </div>
            <p className={`font-mono text-xs font-semibold ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
              No review activities recorded in database for {activeYear} yet.
            </p>
            <p className={`text-[11px] font-mono mt-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
              Submit a code snippet or GitHub repository from the Home page to populate this graph.
            </p>
          </div>
        )}

        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + paddingBottom}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            {/* Area Gradients */}
            <linearGradient id="areaGradientPurple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="areaGradientCyan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="barCodeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>

            <linearGradient id="barRepoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const y = paddingTop + usableHeight * (1 - ratio);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}
                  strokeDasharray="4 4"
                />
              </g>
            );
          })}

          {/* Background Area Curve Fill */}
          <path
            d={areaPath}
            fill={activeFilter === 'repo' ? 'url(#areaGradientCyan)' : 'url(#areaGradientPurple)'}
          />

          {/* Smooth Trend Spline */}
          <path
            d={smoothLine}
            fill="none"
            stroke={activeFilter === 'repo' ? '#06b6d4' : '#a855f7'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Monthly Columns (Bars + Hover Catchers) */}
          {monthlyData.map((d, index) => {
            const centerX = paddingX + (index / (monthlyData.length - 1)) * usableWidth;
            const codeH = (d.codeCount / maxMonthlyVal) * usableHeight;
            const repoH = (d.repoCount / maxMonthlyVal) * usableHeight;
            const totalH = (d.totalCount / maxMonthlyVal) * usableHeight;

            const isHovered = hoveredMonth?.name === d.name;

            return (
              <g
                key={d.name}
                onMouseEnter={() => setHoveredMonth(d)}
                onMouseLeave={() => setHoveredMonth(null)}
                className="cursor-pointer"
              >
                {/* Hover vertical column background highlight */}
                {isHovered && (
                  <rect
                    x={centerX - colWidth / 2}
                    y={paddingTop}
                    width={colWidth}
                    height={usableHeight}
                    rx="8"
                    fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
                  />
                )}

                {/* Bars Rendering */}
                {activeFilter === 'all' ? (
                  // Dual Sub-bars: Code Snippet (left) & Repo (right)
                  <>
                    {/* Code Snippet Bar */}
                    <rect
                      x={centerX - barWidth - 1}
                      y={chartHeight - codeH}
                      width={barWidth}
                      height={Math.max(codeH, d.codeCount > 0 ? 4 : 0)}
                      rx="4"
                      fill="url(#barCodeGradient)"
                      opacity={isHovered ? 1 : 0.85}
                      className="transition-all duration-200"
                    />
                    {/* Repo Bar */}
                    <rect
                      x={centerX + 1}
                      y={chartHeight - repoH}
                      width={barWidth}
                      height={Math.max(repoH, d.repoCount > 0 ? 4 : 0)}
                      rx="4"
                      fill="url(#barRepoGradient)"
                      opacity={isHovered ? 1 : 0.85}
                      className="transition-all duration-200"
                    />
                  </>
                ) : activeFilter === 'code' ? (
                  <rect
                    x={centerX - barWidth}
                    y={chartHeight - codeH}
                    width={barWidth * 2}
                    height={Math.max(codeH, d.codeCount > 0 ? 4 : 0)}
                    rx="5"
                    fill="url(#barCodeGradient)"
                    opacity={isHovered ? 1 : 0.85}
                    className="transition-all duration-200"
                  />
                ) : (
                  <rect
                    x={centerX - barWidth}
                    y={chartHeight - repoH}
                    width={barWidth * 2}
                    height={Math.max(repoH, d.repoCount > 0 ? 4 : 0)}
                    rx="5"
                    fill="url(#barRepoGradient)"
                    opacity={isHovered ? 1 : 0.85}
                    className="transition-all duration-200"
                  />
                )}

                {/* Data Dot on Spline */}
                <circle
                  cx={centerX}
                  cy={
                    chartHeight -
                    (activeFilter === 'code'
                      ? codeH
                      : activeFilter === 'repo'
                      ? repoH
                      : totalH)
                  }
                  r={isHovered ? 5.5 : 3.5}
                  fill={isDark ? '#080512' : '#ffffff'}
                  stroke={activeFilter === 'repo' ? '#22d3ee' : '#c084fc'}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />

                {/* Month Name X-Axis Label */}
                <text
                  x={centerX}
                  y={chartHeight + 24}
                  textAnchor="middle"
                  className={`text-[11px] font-mono transition-colors ${
                    isHovered
                      ? isDark
                        ? 'fill-white font-bold'
                        : 'fill-slate-900 font-bold'
                      : isDark
                      ? 'fill-white/40'
                      : 'fill-slate-400'
                  }`}
                >
                  {d.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip when hovering over a month */}
        {hoveredMonth && (
          <div
            className={`absolute top-2 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-6 pointer-events-none rounded-2xl p-3.5 border shadow-2xl backdrop-blur-xl animate-fade-in font-mono text-xs z-30 ${
              isDark
                ? 'bg-black/90 border-purple-500/40 text-white shadow-purple-500/10'
                : 'bg-white/95 border-purple-200 text-slate-900 shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between gap-4 border-b pb-2 mb-2 border-white/10">
              <span className="font-bold text-sm tracking-wide">
                {hoveredMonth.name} {activeYear}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  hoveredMonth.avgScore >= 80
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                Avg {hoveredMonth.avgScore > 0 ? `${hoveredMonth.avgScore}/100` : 'N/A'}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Code Snippets:
                </span>
                <span className="font-bold">{hoveredMonth.codeCount}</span>
              </div>

              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Repositories:
                </span>
                <span className="font-bold">{hoveredMonth.repoCount}</span>
              </div>

              <div className="flex items-center justify-between gap-6 pt-1.5 border-t border-white/10 font-bold">
                <span className={isDark ? 'text-white/70' : 'text-slate-600'}>
                  Total Audits:
                </span>
                <span className="text-purple-300">{hoveredMonth.totalCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom KPI Legend and Metrics */}
      <div
        className={`mt-6 pt-5 border-t flex flex-wrap items-center justify-between gap-4 text-xs font-mono ${
          isDark ? 'border-white/10 text-white/60' : 'border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-gradient-to-r from-purple-400 to-purple-600 shrink-0" />
            <span>Code Snippets</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-gradient-to-r from-cyan-400 to-cyan-600 shrink-0" />
            <span>GitHub Repositories</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span>Interactive: Hover over columns to inspect details</span>
        </div>
      </div>
    </div>
  );
}
