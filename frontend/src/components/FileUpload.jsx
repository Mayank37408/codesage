import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * File upload component supporting drag-and-drop and manual file selection.
 *
 * @param {object} props
 * @param {Function} props.onFileLoad - Callback receiving loaded file text content.
 * @param {Function} [props.onFileNameChange] - Optional callback receiving the filename.
 */
export default function FileUpload({ onFileLoad, onFileNameChange }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;

    setFileName(file.name);
    if (onFileNameChange) {
      onFileNameChange(file.name);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        onFileLoad(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const getContainerStyle = () => {
    if (isDark) {
      return isDragging
        ? 'border-white/50 bg-white/8'
        : 'border-white/20 bg-white/3 hover:border-white/50 hover:bg-white/8';
    }
    return isDragging
      ? 'border-slate-500 bg-slate-100'
      : 'border-slate-300 bg-slate-50/80 hover:border-slate-400 hover:bg-slate-100 shadow-sm';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all duration-200 backdrop-blur-md ${getContainerStyle()}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".js,.jsx,.ts,.tsx,.py,.pyw,.java,.c,.h,.cpp,.cc,.cxx,.hpp,.hxx,.cs,.go,.rs,.php,.rb,.swift,.kt,.kts,.sql,.sh,.bash,.dart,.html,.lua,.r,.scala,.pl,.txt"
        onChange={handleInputChange}
        className="hidden"
      />

      <div
        className={`flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm ${
          isDark ? 'text-white/40' : 'text-slate-600'
        }`}
      >
        <svg className="w-5 h-5 opacity-70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span className={`font-medium ${isDark ? 'text-white/40' : 'text-slate-700'}`}>
          Drop your file here or click to upload
        </span>
        <span className={isDark ? 'text-white/30 text-xs' : 'text-slate-400 text-xs'}>
          (.js, .ts, .py, .java, .cpp, .go)
        </span>
      </div>

      {fileName && (
        <div
          className={`mt-2 text-xs font-mono flex items-center justify-center gap-1.5 ${
            isDark ? 'text-white/80' : 'text-slate-900'
          }`}
        >
          <span>✓ Loaded:</span>
          <span className="font-semibold underline">{fileName}</span>
        </div>
      )}
    </div>
  );
}
