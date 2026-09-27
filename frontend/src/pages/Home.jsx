import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LanguageSelector from '../components/LanguageSelector';
import FileUpload from '../components/FileUpload';
import CodeEditor from '../components/CodeEditor';
import { reviewCode, reviewRepo } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { saveRealReview } from '../services/activityService';
import SpecularButton from '../components/SpecularButton';
import DecryptedText from '../components/DecryptedText';
import CRTWarp from '../components/CRTWarp';
import { detectLanguage, getLanguageDisplayName } from '../utils/languageDetector';

/**
 * Home landing page where users input, upload, or submit GitHub repository URLs for review.
 */
export default function Home() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reviewMode, setReviewMode] = useState('code'); // 'code' | 'repo'
  const [code, setCode] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('auto'); // 'auto' | specific language key
  const [detectedLanguage, setDetectedLanguage] = useState('javascript');
  const [detectedConfidence, setDetectedConfidence] = useState('none');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isAutoDetect = selectedLanguage === 'auto';
  const effectiveLanguage = isAutoDetect ? detectedLanguage : selectedLanguage;

  useEffect(() => {
    try {
      const savedPrivate = localStorage.getItem('codesage_private');
      if (savedPrivate !== null) {
        setIsPrivate(savedPrivate === 'true');
      }
    } catch (e) {
      console.warn('Could not read private preference:', e);
    }
  }, []);

  const handleCodeChange = (newCode, fileName = uploadedFileName) => {
    setCode(newCode);
    if (errorMessage) setErrorMessage('');

    if (newCode && newCode.trim().length > 0) {
      const detection = detectLanguage(newCode, fileName);
      if (detection && detection.language) {
        setDetectedLanguage(detection.language);
        setDetectedConfidence(detection.confidence);
      }
    } else {
      setDetectedConfidence('none');
    }
  };

  const handleFileLoad = (fileContent) => {
    handleCodeChange(fileContent, uploadedFileName);
  };

  const handleFileNameChange = (fileName) => {
    setUploadedFileName(fileName);
    if (code) {
      handleCodeChange(code, fileName);
    } else {
      const detection = detectLanguage('', fileName);
      if (detection && detection.language) {
        setDetectedLanguage(detection.language);
        setDetectedConfidence(detection.confidence);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    // Read isPrivate from localStorage key "codesage_private" and parse as boolean
    const savedPrivate = localStorage.getItem('codesage_private');
    const privateModeActive = savedPrivate !== null ? (savedPrivate === 'true') : Boolean(isPrivate);

    const uid = user?.uid || 'anonymous';
    const email = user?.email || 'anonymous';

    try {
      let result;

      if (reviewMode === 'repo') {
        const cleanUrl = repoUrl.trim();
        if (!cleanUrl || !/github\.com\/[^/]+\/[^/]+/i.test(cleanUrl)) {
          setErrorMessage('Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo).');
          setLoading(false);
          return;
        }

        result = await reviewRepo(cleanUrl, privateModeActive, uid, email);

        // Save authentic repository review to database if not private
        if (!privateModeActive) {
          await saveRealReview({
            userId: uid,
            type: 'repo',
            title: cleanUrl.replace(/^https?:\/\/github\.com\//, ''),
            repoUrl: cleanUrl,
            score: typeof result.overallScore === 'number' ? result.overallScore : (result.score || 80),
            stats: {
              total: Array.isArray(result.issues) ? result.issues.length : 0,
              high: Array.isArray(result.issues) ? result.issues.filter(i => i.severity === 'high').length : 0,
              medium: Array.isArray(result.issues) ? result.issues.filter(i => i.severity === 'medium').length : 0,
              low: Array.isArray(result.issues) ? result.issues.filter(i => i.severity === 'low').length : 0
            },
            summary: result.summary || 'Whole-repository security and architecture audit.'
          });
        }
      } else {
        if (!code || code.trim().length === 0) {
          setErrorMessage('Please paste or upload code before requesting a review.');
          setLoading(false);
          return;
        }

        if (code.trim().length < 10) {
          setErrorMessage('Code is too short to review — please provide at least 10 characters.');
          setLoading(false);
          return;
        }

        const targetLang = effectiveLanguage || 'javascript';
        result = await reviewCode(code, targetLang, privateModeActive, uid, email);
        sessionStorage.setItem('codesage_input_code', code);

        // Save authentic single code review to database if not private
        if (!privateModeActive) {
          await saveRealReview({
            userId: uid,
            type: 'code',
            title: `${targetLang.toUpperCase()} Snippet (${code.split('\n').length} lines)`,
            language: targetLang,
            score: typeof result.score === 'number' ? result.score : 80,
            stats: result.stats || { total: 0, high: 0, medium: 0, low: 0 },
            summary: result.summary || 'Single-file code inspection.'
          });
        }
      }

      sessionStorage.setItem('codesage_result', JSON.stringify(result));
      navigate('/results');
    } catch (err) {
      console.error('Code review failed:', err);
      setErrorMessage(
        err.message || 'Unable to complete review. Please check your backend connection at http://localhost:3000.'
      );
    } finally {
      setLoading(false);
    }
  };



  const lineCount = code ? code.split('\n').length : 0;
  const charCount = code ? code.length : 0;

  return (
    <div className={`min-h-screen flex flex-col pt-16 transition-colors duration-200 ${
      isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <Navbar isPrivate={isPrivate} onPrivateChange={setIsPrivate} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-3 max-w-2xl mx-auto">
          <h1
            className={`text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Review Your Code{' '}
            <DecryptedText
              text="Instantly"
              animateOn="view"
              revealDirection="center"
              speed={50}
              maxIterations={18}
              characters="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+"
              parentClassName="font-serif-italic font-normal tracking-normal text-[1.12em] inline-block"
              className={isDark ? 'text-white' : 'text-slate-900'}
              encryptedClassName="text-red-500"
            />
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
            Detect security vulnerabilities, off-by-one errors, resource leaks, and whole-repository architecture issues.
          </p>
        </section>

        {/* Error Alert */}
        {errorMessage && (
          <div
            className={`rounded-2xl p-4 sm:p-5 flex items-start gap-3 backdrop-blur-md animate-fade-in border ${
              isDark
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="flex-1 text-sm">
              <span className="font-semibold block mb-0.5">Analysis Notice</span>
              {errorMessage}
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-xs font-mono underline hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Glass Card Form Container */}
        <div
          className={`relative rounded-3xl overflow-hidden p-5 sm:p-8 shadow-2xl transition-all duration-200 border ${
            isDark
              ? 'border-white/15 bg-[#05010a]'
              : 'border-slate-200 bg-white/70 shadow-xl shadow-slate-200/60'
          }`}
        >
          {/* CRT Warp Background Behind Inputs */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <CRTWarp
              color={isDark ? '#c755f7' : '#9333ea'}
              backgroundColor={isDark ? '#05010a' : '#faf5ff'}
              speed={0.5}
              curvature={0.25}
              scanlineStrength={0.25}
              scanlineFrequency={200}
              waveAmplitude={0.3}
              waveFrequency={2.5}
              bloom={1.5}
              bloomRadius={1}
              noise={0.1}
              vignette={0}
              brightness={isDark ? 1.25 : 1.1}
              pixelation={1}
              rgbShift={0.015}
              mouseReact
              mouseStrength={0.5}
              dpr={1}
              fps={30}
              paused={false}
            />
          </div>

          <div className="relative z-10 space-y-6">
            {/* Top Control Bar with Mode Switcher */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 ${
                isDark ? 'border-white/15' : 'border-slate-200'
              }`}
            >
              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-2 p-1 rounded-2xl border bg-black/40 border-white/10">
                <button
                  type="button"
                  onClick={() => { setReviewMode('code'); setErrorMessage(''); }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    reviewMode === 'code' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Paste Code
                </button>
                <button
                  type="button"
                  onClick={() => { setReviewMode('repo'); setErrorMessage(''); }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    reviewMode === 'repo' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'
                  }`}
                >
                  GitHub Repo
                </button>
              </div>

              {reviewMode === 'code' && (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-xs font-mono font-bold uppercase tracking-wider ${
                        isDark ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]' : 'text-slate-900'
                      }`}
                    >
                      Language Context
                    </span>
                    {!isAutoDetect ? (
                      <button
                        type="button"
                        onClick={() => setSelectedLanguage('auto')}
                        className="text-[10px] font-mono text-purple-400 hover:text-purple-300 underline cursor-pointer"
                      >
                        Reset to Auto
                      </button>
                    ) : detectedConfidence !== 'none' ? (
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Auto-detected: {getLanguageDisplayName(detectedLanguage)}</span>
                      </span>
                    ) : null}
                  </div>
                  <LanguageSelector
                    value={selectedLanguage}
                    onChange={setSelectedLanguage}
                    detectedLanguage={detectedLanguage}
                  />
                </div>
              )}
            </div>

            {/* Mode Specific Inputs */}
            {reviewMode === 'repo' ? (
              <div className="space-y-3 py-4">
                <label
                  className={`text-xs font-mono font-bold block uppercase tracking-wider ${
                    isDark ? 'text-white/80' : 'text-slate-700'
                  }`}
                >
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/owner/repo"
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className={`w-full px-4 py-3.5 rounded-2xl font-mono text-sm border outline-none transition ${
                    isDark
                      ? 'bg-black/60 border-white/20 text-white placeholder:text-white/30 focus:border-purple-400'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-purple-600'
                  }`}
                />
                <p className={`text-xs font-mono ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                  Inspects repository architecture, verified CVE dependencies, and cross-file code duplication.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <CodeEditor
                    value={code}
                    onChange={handleCodeChange}
                    language={effectiveLanguage}
                  />
                </div>

                <FileUpload
                  onFileLoad={handleFileLoad}
                  onFileNameChange={handleFileNameChange}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span
                      className={`px-3 py-1.5 rounded-lg border backdrop-blur-md font-medium ${
                        isDark
                          ? 'bg-black/80 border-white/20 text-white shadow-sm'
                          : 'bg-white border-slate-300 text-slate-800 shadow-sm'
                      }`}
                    >
                      Lines:{' '}
                      <strong className={isDark ? 'text-emerald-400 font-bold ml-0.5' : 'text-slate-900 font-bold ml-0.5'}>
                        {lineCount}
                      </strong>
                    </span>
                    <span
                      className={`px-3 py-1.5 rounded-lg border backdrop-blur-md font-medium ${
                        isDark
                          ? 'bg-black/80 border-white/20 text-white shadow-sm'
                          : 'bg-white border-slate-300 text-slate-800 shadow-sm'
                      }`}
                    >
                      Characters:{' '}
                      <strong className={isDark ? 'text-emerald-400 font-bold ml-0.5' : 'text-slate-900 font-bold ml-0.5'}>
                        {charCount}
                      </strong>
                    </span>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1.5 rounded-lg border backdrop-blur-md font-medium ${
                        isDark
                          ? 'bg-black/80 border-white/20 text-white shadow-sm'
                          : 'bg-white border-slate-300 text-slate-800 shadow-sm'
                      }`}
                    >
                      Mode:{' '}
                      <strong
                        className={`font-bold ml-0.5 ${
                          isDark
                            ? isPrivate ? 'text-yellow-400' : 'text-purple-300'
                            : isPrivate ? 'text-amber-600' : 'text-purple-700'
                        }`}
                      >
                        {isPrivate ? 'Private (No DB save)' : 'Public'}
                      </strong>
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Submit Action Button */}
            <div className="w-full flex justify-center pt-2">
              <SpecularButton
                size="lg"
                radius={18}
                bg={isDark ? '#0c0d12' : '#ffffff'}
                textColor={isDark ? '#ffffff' : '#000000'}
                lineColor={isDark ? '#ffffff' : '#000000'}
                baseColor={isDark ? '#ffffff' : '#000000'}
                intensity={1.2}
                shineSize={12}
                shineFade={40}
                thickness={1.5}
                speed={0.35}
                followMouse={true}
                proximity={250}
                autoAnimate={false}
                disabled={loading}
                onClick={handleSubmit}
                className={`w-full py-4 font-bold text-sm sm:text-base tracking-wide border transition-all ${
                  isDark
                    ? 'border-white/25 hover:border-white/50 shadow-[0_4px_24px_rgba(255,255,255,0.06)]'
                    : 'border-black/25 hover:border-black/50 shadow-[0_4px_24px_rgba(0,0,0,0.08)]'
                }`}
              >
                {loading ? (
                  <>
                    <div
                      className={`w-5 h-5 rounded-full border-2 animate-spin mr-2 ${
                        isDark
                          ? 'border-white/20 border-t-white'
                          : 'border-black/20 border-t-black'
                      }`}
                    />
                    <span>{reviewMode === 'repo' ? 'Analyzing repository...' : 'Analyzing your code...'}</span>
                  </>
                ) : (
                  <span>{reviewMode === 'repo' ? 'Review Repository' : 'Review My Code'}</span>
                )}
              </SpecularButton>
            </div>
          </div>
        </div>
      </main>

      <footer
        className={`text-center py-6 border-t text-xs font-mono ${
          isDark ? 'border-white/5 text-white/30' : 'border-slate-200 text-slate-500'
        }`}
      >
        CodeSage &copy; 2026 — AI-Powered Architectural Inspection
      </footer>
    </div>
  );
}
