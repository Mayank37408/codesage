import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { getLanguageDisplayName } from '../utils/languageDetector';

const LANGUAGE_GROUPS = [
  {
    label: 'Web',
    options: [
      { value: 'javascript', label: 'JavaScript' },
      { value: 'typescript', label: 'TypeScript' },
      { value: 'jsx', label: 'React/JSX' },
      { value: 'php', label: 'PHP' },
      { value: 'wasm', label: 'WebAssembly' },
    ],
  },
  {
    label: 'Systems',
    options: [
      { value: 'c', label: 'C' },
      { value: 'cpp', label: 'C++' },
      { value: 'rust', label: 'Rust' },
      { value: 'go', label: 'Go' },
      { value: 'swift', label: 'Swift' },
    ],
  },
  {
    label: 'Mobile',
    options: [
      { value: 'kotlin', label: 'Kotlin' },
      { value: 'dart', label: 'Dart/Flutter' },
      { value: 'objc', label: 'Objective-C' },
    ],
  },
  {
    label: 'Backend',
    options: [
      { value: 'python', label: 'Python' },
      { value: 'java', label: 'Java' },
      { value: 'ruby', label: 'Ruby' },
      { value: 'kotlin', label: 'Kotlin' },
      { value: 'scala', label: 'Scala' },
      { value: 'csharp', label: 'C#' },
    ],
  },
  {
    label: 'Data & Query',
    options: [
      { value: 'sql', label: 'SQL' },
      { value: 'postgresql', label: 'PostgreSQL' },
      { value: 'r', label: 'R' },
    ],
  },
  {
    label: 'Scripting',
    options: [
      { value: 'bash', label: 'Bash/Shell' },
      { value: 'lua', label: 'Lua' },
      { value: 'perl', label: 'Perl' },
    ],
  },
];

/**
 * Dropdown selector for target programming language with Auto-Detect.
 *
 * @param {object} props
 * @param {string} props.value - Currently selected language identifier or 'auto'.
 * @param {Function} props.onChange - Handler called on language selection.
 * @param {string} [props.detectedLanguage] - Currently detected language key.
 */
export default function LanguageSelector({
  value = 'auto',
  onChange,
  detectedLanguage = 'javascript'
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const detectedLabel = getLanguageDisplayName(detectedLanguage);

  return (
    <div className="relative inline-block w-full sm:w-64">
      <label htmlFor="language-select" className="sr-only">
        Select Language
      </label>
      <div className="relative">
        <select
          id="language-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold backdrop-blur-md transition cursor-pointer focus:outline-none focus:ring-2 ${isDark
              ? 'bg-black/85 border border-white/25 text-white hover:bg-black/95 focus:border-purple-400 focus:ring-purple-400/30 shadow-lg shadow-black/40'
              : 'bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 focus:border-purple-500 focus:ring-purple-300 shadow-sm'
            }`}
        >
          <option value="auto" className={isDark ? 'bg-[#0f0e17] text-purple-300 font-bold' : 'bg-white text-purple-700 font-bold'}>
            Auto-Detect {detectedLabel ? `(${detectedLabel})` : ''}
          </option>

          {LANGUAGE_GROUPS.map((group) => (
            <optgroup
              key={group.label}
              label={group.label}
              className={isDark ? 'bg-[#0f0e17] text-white/60 font-mono font-bold' : 'bg-slate-100 text-slate-600 font-mono font-bold'}
            >
              {group.options.map((lang) => (
                <option
                  key={`${group.label}-${lang.value}`}
                  value={lang.value}
                  className={isDark ? 'bg-[#0f0e17] text-white font-sans py-2' : 'bg-white text-slate-900 font-sans py-2'}
                >
                  {lang.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${isDark ? 'text-white' : 'text-slate-700'
          }`}>
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
              fillRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
