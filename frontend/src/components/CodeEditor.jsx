import React, { useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getFileExtensionForLanguage } from '../utils/languageDetector';

/**
 * Monospace code editor with synchronized line numbers and dynamic extension.
 *
 * @param {object} props
 * @param {string} props.value - Current code content.
 * @param {Function} props.onChange - Text change callback.
 * @param {string} props.language - Current active language.
 */
export default function CodeEditor({
  value,
  onChange,
  language
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const lineNumbersRef = useRef(null);
  const textareaRef = useRef(null);

  const lines = value ? value.split('\n') : [''];
  const lineCount = Math.max(lines.length, 12);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const ext = getFileExtensionForLanguage(language);

  return (
    <div
      className={`relative rounded-xl border overflow-hidden transition-all ${isDark
        ? 'bg-[#121214] border-white/10 focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/20'
        : 'bg-white border-slate-200 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300 shadow-md'
        }`}
    >
      {/* Editor Header Bar */}
      <div
        className={`flex items-center justify-between border-b px-4 py-2 text-xs ${isDark
          ? 'border-white/10 bg-black/50 text-white/40'
          : 'border-slate-200 bg-slate-100 text-slate-500'
          }`}
      >
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500/70" />
          <span
            className={`ml-2 font-mono font-medium lowercase ${isDark ? 'text-white/60' : 'text-slate-600'
              }`}
          >
            main.{ext}
          </span>
        </div>
        <span className={`font-mono ${isDark ? 'text-white/40' : 'text-slate-500'}`}>UTF-8</span>
      </div>

      {/* Main Textarea Area with Line Numbers */}
      <div
        className={`flex min-h-[320px] max-h-[580px] relative font-mono text-sm leading-6 ${isDark ? 'bg-[#1c1c20]' : 'bg-slate-50/70'
          }`}
      >
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className={`w-12 sm:w-14 shrink-0 py-3 pr-3 text-right select-none border-r overflow-hidden font-mono text-xs leading-6 ${isDark
            ? 'text-white/30 bg-black/30 border-white/10'
            : 'text-slate-400 bg-slate-100/70 border-slate-200'
            }`}
        >
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6">
              {num}
            </div>
          ))}
        </div>

        {/* Code Input Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder="// Paste your code here or import a file above..."
          spellCheck="false"
          className={`w-full flex-1 resize-y bg-transparent py-3 px-4 font-mono text-sm leading-6 outline-none focus:outline-none min-h-[320px] max-h-[580px] overflow-y-auto ${isDark
            ? 'text-white placeholder:text-white/30'
            : 'text-slate-900 placeholder:text-slate-400'
            }`}
        />
      </div>

      {/* Status Bar */}
      <div
        className={`flex items-center justify-between border-t px-4 py-2 text-xs font-mono ${isDark
          ? 'border-white/10 bg-black/50 text-white/40'
          : 'border-slate-200 bg-slate-100 text-slate-500'
          }`}
      >
        <div>
          <span>{lines.length} lines</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{value.length} characters</span>
        </div>
      </div>
    </div>
  );
}
