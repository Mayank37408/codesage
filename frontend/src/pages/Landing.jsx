import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AeroShards from '../components/AeroShards';
import DecryptedText from '../components/DecryptedText';
import SpecularButton from '../components/SpecularButton';
import LogoLoop from '../components/LogoLoop';
import BorderGlow from '../components/BorderGlow';
import { useTheme } from '../context/ThemeContext';
import {
  SiJavascript,
  SiTypescript,
  SiPython,
  SiOpenjdk,
  SiCplusplus,
  SiC,
  SiGo,
  SiRust,
  SiPhp,
  SiRuby,
  SiSwift,
  SiKotlin,
  SiDart,
  SiFlutter,
  SiReact,
  SiNodedotjs,
  SiDotnet,
  SiPostgresql,
  SiMysql,
  SiWebassembly,
  SiR,
  SiScala,
  SiHaskell,
  SiLua,
  SiPerl,
  SiGnubash
} from 'react-icons/si';

function SectionReveal({ children, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Section 2: Stats counting animation state
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [counts, setCounts] = useState({
    languages: 0,
    engines: 0,
    issues: 0,
    time: 0
  });

  // Section 3: Features animation state
  const featuresRef = useRef(null);
  const [featuresVisible, setFeaturesVisible] = useState(false);

  // Section 5: Live demo state
  const [activeTab, setActiveTab] = useState('js');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);

  // Intersection observer for stats bar
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
        }
      },
      { threshold: 0.25 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Intersection observer for features grid
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFeaturesVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Number count-up effect
  useEffect(() => {
    if (!statsVisible) return;

    let start = null;
    const duration = 1400;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      setCounts({
        languages: Math.round(ease * 30),
        engines: Math.round(ease * 2),
        issues: Math.round(ease * 12),
        time: Math.round(ease * 3)
      });

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [statsVisible]);

  // Scan simulation on live demo
  const triggerScanDemo = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 4;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => setIsScanning(false), 300);
      }
    }, 28);
  };

  const featureCards = [
    {
      tag: 'High Severity',
      tagColor: isDark
        ? 'text-red-500 bg-red-500/10 border-red-500/30'
        : 'text-black bg-black/5 border-black/20 font-semibold',
      title: 'Security Vulnerabilities',
      desc: 'Catches eval() usage, XSS risks via innerHTML, hardcoded credentials, and SQL injection patterns before they reach production.',
      colors: ['#ef4444', '#f87171', '#f59e0b'],
      glowColor: '0 85 65'
    },
    {
      tag: 'Medium Severity',
      tagColor: isDark
        ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
        : 'text-black bg-black/5 border-black/20 font-semibold',
      title: 'Logic Bugs',
      desc: 'Detects infinite loops, off-by-one errors, loose null comparisons, and accidental assignments in conditions.',
      colors: ['#f59e0b', '#fbbf24', '#f97316'],
      glowColor: '45 90 65'
    },
    {
      tag: 'Low Severity',
      tagColor: isDark
        ? 'text-white/80 bg-white/10 border-white/20'
        : 'text-black bg-black/5 border-black/20 font-semibold',
      title: 'Style Issues',
      desc: 'Flags debug logs, magic numbers, generic variable names, and missing JSDoc documentation.',
      colors: ['#c084fc', '#f472b6', '#38bdf8'],
      glowColor: '270 80 75'
    },
    {
      tag: 'Gemini 3.8 Flash',
      tagColor: isDark
        ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30'
        : 'text-black bg-black/5 border-black/20 font-semibold',
      title: 'Gemini AI Review',
      desc: 'Beyond regex — Gemini 3.8 Flash understands context and catches nuanced issues static analysis misses.',
      colors: ['#6366f1', '#a855f7', '#06b6d4'],
      glowColor: '250 85 70'
    },
    {
      tag: 'Quality Signals',
      tagColor: isDark
        ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
        : 'text-black bg-black/5 border-black/20 font-semibold',
      title: 'Positive Patterns',
      desc: "Recognizes and highlights what you're doing right — strict equality, error handling, clean structure.",
      colors: ['#10b981', '#34d399', '#06b6d4'],
      glowColor: '155 80 65'
    },
    {
      tag: 'Zero Storage',
      tagColor: isDark
        ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
        : 'text-black bg-black/5 border-black/20 font-semibold',
      title: 'Private Mode',
      desc: 'Review sensitive code without saving to our database. Nothing is stored when private mode is on.',
      colors: ['#f59e0b', '#fb923c', '#e11d48'],
      glowColor: '35 85 65'
    }
  ];

  // Full ecosystem of languages supported by CodeSage
  const languageLogos = [
    { node: <SiJavascript className="text-[#F7DF1E]" />, title: 'JavaScript' },
    { node: <SiTypescript className="text-[#3178C6]" />, title: 'TypeScript' },
    { node: <SiPython className="text-[#3776AB]" />, title: 'Python' },
    { node: <SiOpenjdk className="text-[#EA2D2E]" />, title: 'Java' },
    { node: <SiCplusplus className="text-[#00599C]" />, title: 'C++' },
    { node: <SiC className="text-[#A8B9CC]" />, title: 'C' },
    { node: <SiGo className="text-[#00ADD8]" />, title: 'Go' },
    { node: <SiRust className="text-[#DEA584]" />, title: 'Rust' },
    { node: <SiPhp className="text-[#777BB4]" />, title: 'PHP' },
    { node: <SiRuby className="text-[#CC342D]" />, title: 'Ruby' },
    { node: <SiSwift className="text-[#F05138]" />, title: 'Swift' },
    { node: <SiKotlin className="text-[#7F52FF]" />, title: 'Kotlin' },
    { node: <SiDart className="text-[#0175C2]" />, title: 'Dart' },
    { node: <SiFlutter className="text-[#02569B]" />, title: 'Flutter' },
    { node: <SiReact className="text-[#61DAFB]" />, title: 'React / JSX' },
    { node: <SiNodedotjs className="text-[#5FA04E]" />, title: 'Node.js' },
    { node: <SiDotnet className="text-[#512BD4]" />, title: 'C# / .NET' },
    { node: <SiPostgresql className="text-[#4169E1]" />, title: 'PostgreSQL' },
    { node: <SiMysql className="text-[#4479A1]" />, title: 'MySQL / SQL' },
    { node: <SiWebassembly className="text-[#654FF0]" />, title: 'WebAssembly' },
    { node: <SiR className="text-[#276DC3]" />, title: 'R' },
    { node: <SiScala className="text-[#DC322F]" />, title: 'Scala' },
    { node: <SiHaskell className="text-[#5D4F85]" />, title: 'Haskell' },
    { node: <SiLua className="text-[#2C2D72]" />, title: 'Lua' },
    { node: <SiPerl className="text-[#39457E]" />, title: 'Perl' },
    { node: <SiGnubash className="text-[#4EAA25]" />, title: 'Bash / Shell' }
  ];

  // JavaScript demo code
  const jsDemoCode = [
    { num: 1, text: '// Production Authentication & Query Handler', hazard: null },
    { num: 2, text: 'async function handleUserLogin(req, res) {', hazard: null },
    { num: 3, text: '  const { username, password, token } = req.body;', hazard: null },
    { num: 4, text: '  const apiKey = "sk_live_98a7f6e5d4c3b2a19e8f";', hazard: 'high', label: 'Hardcoded Secret' },
    { num: 5, text: '', hazard: null },
    { num: 6, text: '  if (token == null) {', hazard: 'med', label: 'Loose Null Check' },
    { num: 7, text: '    return res.status(401).json({ error: "Missing token" });', hazard: null },
    { num: 8, text: '  }', hazard: null },
    { num: 9, text: '', hazard: null },
    { num: 10, text: '  // Dynamic client option evaluation', hazard: null },
    { num: 11, text: '  const config = eval("(" + req.body.options + ")");', hazard: 'high', label: 'Dangerous eval()' },
    { num: 12, text: '', hazard: null },
    { num: 13, text: '  // Direct database query without sanitization', hazard: null },
    { num: 14, text: '  const query = `SELECT * FROM users WHERE user = \'${username}\'`;', hazard: 'high', label: 'SQL Injection' },
    { num: 15, text: '  document.getElementById("output").innerHTML = req.body.status;', hazard: 'high', label: 'XSS Risk' },
    { num: 16, text: '', hazard: null },
    { num: 17, text: '  console.log("Authenticated session for:", username);', hazard: 'low', label: 'Debug Log' },
    { num: 18, text: '  return res.json({ success: true, user: username });', hazard: null },
    { num: 19, text: '}', hazard: null }
  ];

  // Python demo code
  const pyDemoCode = [
    { num: 1, text: '# Production Payment & Config Handler', hazard: null },
    { num: 2, text: 'def process_checkout(user_id, raw_data):', hazard: null },
    { num: 3, text: '    # Insecure credentials placement', hazard: null },
    { num: 4, text: '    JWT_SECRET = "sec_prod_9941a87c12ff3e4d5c"', hazard: 'high', label: 'Hardcoded Secret' },
    { num: 5, text: '', hazard: null },
    { num: 6, text: '    # Dynamic payload deserialization', hazard: null },
    { num: 7, text: '    payload = eval(raw_data.get("config"))', hazard: 'high', label: 'Dangerous eval()' },
    { num: 8, text: '', hazard: null },
    { num: 9, text: '    # Direct SQL query formatting', hazard: null },
    { num: 10, text: '    query = f"SELECT * FROM orders WHERE id = \'{payload.get(\'id\')}\'"', hazard: 'high', label: 'SQL Injection' },
    { num: 11, text: '', hazard: null },
    { num: 12, text: '    # Uncapped polling loop hazard', hazard: null },
    { num: 13, text: '    while True:', hazard: 'med', label: 'Loop Without Timeout' },
    { num: 14, text: '        status = check_gateway()', hazard: null },
    { num: 15, text: '        if status == "ready": break', hazard: null },
    { num: 16, text: '', hazard: null },
    { num: 17, text: '    print("Audit order payload processed:", payload)', hazard: 'low', label: 'Debug Print' },
    { num: 18, text: '    return {"status": "ok", "order": payload}', hazard: null }
  ];

  const activeCodeLines = activeTab === 'js' ? jsDemoCode : pyDemoCode;

  return (
    <div className={`min-h-screen relative flex flex-col font-sans transition-colors duration-300 selection:bg-black/10 selection:text-black ${isDark ? 'bg-[#06040a] text-white selection:bg-white/20 selection:text-white' : 'bg-white text-black'
      }`}>
      {/* Top Floating Glass Navbar */}
      <Navbar />

      {/* ========================================================= */}
      {/* SECTION 1 — HERO (Full Viewport Height)                    */}
      {/* ========================================================= */}
      <section className="relative min-h-screen w-full flex flex-col justify-between items-center px-4 sm:px-6 pt-28 pb-8 overflow-hidden z-10">
        {/* Full-bleed AeroShards background */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <AeroShards
            backgroundColor={isDark ? '#06040a' : '#ffffff'}
            shardColor={isDark ? '#896ABD' : '#6366f1'}
            accentColor={isDark ? '#A855F7' : '#9333ea'}
            placement="full"
            flow="stream"
            material="pearl"
            detail="balanced"
            effect="none"
            scale={1}
            spread={1}
            depth={1}
            speed={1}
            spin={1}
            interaction="repel"
            density={1.5}
            shardSize={1.1}
            stretch={1}
            turbulence={1}
            glow={isDark ? 1 : 0.6}
            edgeSoftness={2}
            bloom={isDark ? 0.5 : 0.2}
            grain={0.05}
            chromaticAberration={0.0075}
            transitionDuration={1}
            interactionRadius={1.5}
            interactionStrength={0.5}
            rippleIntensity={1}
            holdToGather
            paused={false}
          />
        </div>

        {/* Ambient radial vignette mask tailored for both dark & light themes */}
        <div
          className={`absolute inset-0 pointer-events-none z-1 transition-opacity duration-300 ${isDark
            ? 'bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.02)_0%,_rgba(6,4,10,0.78)_100%)]'
            : 'bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.05)_0%,_rgba(255,255,255,0.85)_100%)]'
            }`}
        />

        {/* Centered Content */}
        <div className="relative z-10 my-auto flex flex-col items-center max-w-4xl mx-auto text-center px-2 sm:px-4 py-6">
          {/* Main Headline (Huge, Bold, 3 Lines) */}
          <div className="space-y-1 sm:space-y-2 select-none">
            <div
              className={`text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-tight sm:leading-none drop-shadow-sm transition-colors ${isDark ? 'text-white' : 'text-black'
                }`}
            >
              Your Code Has
            </div>

            <div className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-tight sm:leading-none py-1">
              <DecryptedText
                text="Hidden Flaws"
                animateOn="view"
                revealDirection="center"
                speed={45}
                maxIterations={18}
                characters="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+"
                parentClassName="inline-block relative py-1"
                className={`font-black tracking-tight filter ${isDark
                  ? 'text-red-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.9)]'
                  : 'text-black'
                  }`}
                encryptedClassName={`font-mono tracking-tight ${isDark
                  ? 'text-red-500/90 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]'
                  : 'text-black/70'
                  }`}
              />
            </div>

            <div
              className={`text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-tight sm:leading-none drop-shadow-sm transition-colors ${isDark ? 'text-white' : 'text-black'
                }`}
            >
              We Find Them.
            </div>
          </div>

          {/* Subtext */}
          <p
            className={`text-base sm:text-lg md:text-xl max-w-2xl text-center mx-auto mt-6 sm:mt-8 leading-relaxed font-normal transition-colors ${isDark ? 'text-white/60' : 'text-black'
              }`}
          >
            CodeSage combines static analysis with Gemini AI to detect security vulnerabilities, logic bugs, and style issues across 30+ languages and frameworks — in seconds.
          </p>

          {/* Two Buttons Side by Side */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 sm:mt-10 w-full sm:w-auto">
            {/* Primary SpecularButton */}
            <div className="w-full sm:w-auto flex justify-center">
              <SpecularButton
                size="lg"
                radius={16}
                bg={isDark ? '#0c0d12' : '#000000'}
                textColor="#ffffff"
                lineColor="#ffffff"
                baseColor="#ffffff"
                intensity={1.3}
                shineSize={14}
                shineFade={40}
                thickness={1.5}
                speed={0.35}
                followMouse={true}
                proximity={250}
                autoAnimate={false}
                onClick={() => navigate('/app')}
                className="w-full sm:w-auto px-7 py-3.5 font-bold text-sm sm:text-base tracking-wide border border-white/30 hover:border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.15)] transition-all cursor-pointer"
              >
                <span>Start Reviewing Code →</span>
              </SpecularButton>
            </div>

            {/* Secondary Plain Glass Button */}
            <button
              type="button"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-medium text-sm sm:text-base backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] cursor-pointer border ${isDark
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white'
                : 'bg-white border-black/20 hover:bg-black/5 text-black font-semibold shadow-sm'
                }`}
            >
              See How It Works ↓
            </button>
          </div>
        </div>

        {/* Scroll Indicator at Bottom of Hero */}
        <div
          onClick={() => {
            document.getElementById('stats-bar')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`relative z-10 mt-auto pt-4 flex flex-col items-center gap-1.5 cursor-pointer transition-opacity select-none group ${isDark ? 'opacity-70 hover:opacity-100' : 'opacity-80 hover:opacity-100'
            }`}
        >
          <span
            className={`text-xs font-mono uppercase tracking-widest transition-colors ${isDark ? 'text-white/30 group-hover:text-white/60' : 'text-black group-hover:text-black font-semibold'
              }`}
          >
            Scroll to explore
          </span>
          <span
            className={`text-base animate-bounce leading-none ${isDark ? 'text-white/40' : 'text-black'
              }`}
          >
            ↓
          </span>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 2 — STATS BAR                                      */}
      {/* ========================================================= */}
      <section
        id="stats-bar"
        ref={statsRef}
        className={`w-full py-8 relative z-20 backdrop-blur-md border-y transition-colors ${isDark
          ? 'bg-white/[0.03] border-white/10'
          : 'bg-white border-black/10 shadow-sm'
          }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y md:divide-y-0 md:divide-x ${isDark ? 'divide-white/10' : 'divide-black/10'
              }`}
          >
            {/* Stat 1 */}
            <div className="flex flex-col items-center text-center p-4">
              <div
                className={`text-4xl sm:text-5xl font-bold font-mono tracking-tight flex items-baseline ${isDark ? 'text-white' : 'text-black'
                  }`}
              >
                <span>{counts.languages}</span>
                <span className={isDark ? "text-purple-400 font-bold ml-0.5" : "text-black font-bold ml-0.5"}>+</span>
              </div>
              <span
                className={`text-xs sm:text-sm uppercase tracking-widest mt-2 font-medium ${isDark ? 'text-white/40' : 'text-black'
                  }`}
              >
                Languages &amp; Stacks
              </span>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col items-center text-center p-4 pt-6 md:pt-4">
              <div
                className={`text-4xl sm:text-5xl font-bold font-mono tracking-tight flex items-baseline ${isDark ? 'text-white' : 'text-black'
                  }`}
              >
                <span>{counts.engines}</span>
              </div>
              <span
                className={`text-xs sm:text-sm uppercase tracking-widest mt-2 font-medium ${isDark ? 'text-white/40' : 'text-black'
                  }`}
              >
                AI Engines Combined
              </span>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col items-center text-center p-4 pt-6 md:pt-4">
              <div
                className={`text-4xl sm:text-5xl font-bold font-mono tracking-tight flex items-baseline ${isDark ? 'text-white' : 'text-black'
                  }`}
              >
                <span>{counts.issues}</span>
                <span className={isDark ? "text-red-500 font-bold ml-0.5" : "text-black font-bold ml-0.5"}>+</span>
              </div>
              <span
                className={`text-xs sm:text-sm uppercase tracking-widest mt-2 font-medium ${isDark ? 'text-white/40' : 'text-black'
                  }`}
              >
                Issue Types Detected
              </span>
            </div>

            {/* Stat 4 */}
            <div className="flex flex-col items-center text-center p-4 pt-6 md:pt-4">
              <div
                className={`text-4xl sm:text-5xl font-bold font-mono tracking-tight flex items-baseline ${isDark ? 'text-white' : 'text-black'
                  }`}
              >
                <span className={isDark ? "text-emerald-500 font-bold mr-1" : "text-black font-bold mr-1"}>&lt;</span>
                <span>{counts.time}</span>
                <span className={`ml-0.5 text-3xl font-mono ${isDark ? 'text-white/60' : 'text-black'}`}>s</span>
              </div>
              <span
                className={`text-xs sm:text-sm uppercase tracking-widest mt-2 font-medium ${isDark ? 'text-white/40' : 'text-black'
                  }`}
              >
                Average Review Time
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 3 — FEATURES (id="features")                       */}
      {/* ========================================================= */}
      <section
        id="features"
        ref={featuresRef}
        className="w-full py-24 sm:py-32 px-4 sm:px-6 relative z-10 max-w-6xl mx-auto space-y-16"
      >
        {/* Section Heading */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className={`text-4xl sm:text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
            What CodeSage Detects
          </h2>
          <p className={`text-base sm:text-lg ${isDark ? 'text-white/40' : 'text-black'}`}>
            Every review combines deterministic regex rules with Gemini AI reasoning
          </p>
        </div>

        {/* 6 Glass Feature Cards in a 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((card, idx) => (
            <div
              key={card.title}
              style={{
                transitionDelay: `${idx * 80}ms`
              }}
              className={`transition-all duration-500 ${
                featuresVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <BorderGlow
                edgeSensitivity={30}
                glowColor={card.glowColor || '40 80 80'}
                backgroundColor={isDark ? '#120F17' : '#ffffff'}
                borderRadius={20}
                glowRadius={36}
                glowIntensity={1}
                coneSpread={25}
                animated={false}
                colors={card.colors}
                className="h-full hover:scale-[1.02] transition-transform duration-300"
              >
                <div className="p-6 sm:p-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span
                        className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-md border ${card.tagColor}`}
                      >
                        {card.tag}
                      </span>
                    </div>
                    <h3 className={`font-semibold text-lg tracking-tight mb-2 transition-colors ${
                      isDark ? 'text-white' : 'text-black'
                    }`}>
                      {card.title}
                    </h3>
                  </div>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-white/50' : 'text-black'}`}>
                    {card.desc}
                  </p>
                </div>
              </BorderGlow>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 4 — HOW IT WORKS                                   */}
      {/* ========================================================= */}
      <section className={`w-full py-20 px-4 sm:px-6 relative z-10 border-t transition-colors ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-black/10 bg-black/[0.01]'
        }`}>
        <SectionReveal className="max-w-6xl mx-auto space-y-16">
          {/* Section Heading */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className={`text-3xl sm:text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
              Three Steps to Cleaner Code
            </h2>
            <p className={`text-base sm:text-lg ${isDark ? 'text-white/40' : 'text-black'}`}>
              From raw snippet to comprehensive diagnostics in under three seconds
            </p>
          </div>

          {/* 3 Steps in Horizontal Row connected by dotted line */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 pt-4">
            {/* Dotted Connecting Line for Desktop */}
            <div className={`hidden md:block absolute top-[52px] left-[16%] right-[16%] h-0.5 border-t-2 border-dashed z-0 pointer-events-none ${isDark ? 'border-white/20' : 'border-black/20'
              }`} />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-4 group">
              <div className={`w-20 h-20 rounded-full border backdrop-blur-md flex items-center justify-center font-mono font-bold text-2xl group-hover:scale-105 transition-all duration-300 shadow-lg ${isDark
                ? 'bg-white/5 border-white/15 text-white/90 group-hover:border-purple-400/50 group-hover:text-purple-300'
                : 'bg-white border-black/15 text-black group-hover:border-black group-hover:bg-black group-hover:text-white shadow-sm'
                }`}>
                01
              </div>
              <h3 className={`font-semibold text-xl tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                Paste or Upload
              </h3>
              <p className={`text-sm max-w-xs leading-relaxed ${isDark ? 'text-white/50' : 'text-black'}`}>
                Drop your code directly or upload a file. Supports 30+ languages including JS, TS, Python, Go, Rust, Java, and C++.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-4 group">
              <div className={`w-20 h-20 rounded-full border backdrop-blur-md flex items-center justify-center font-mono font-bold text-2xl group-hover:scale-105 transition-all duration-300 shadow-lg ${isDark
                ? 'bg-white/5 border-white/15 text-white/90 group-hover:border-purple-400/50 group-hover:text-purple-300'
                : 'bg-white border-black/15 text-black group-hover:border-black group-hover:bg-black group-hover:text-white shadow-sm'
                }`}>
                02
              </div>
              <h3 className={`font-semibold text-xl tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                AI Analyzes
              </h3>
              <p className={`text-sm max-w-xs leading-relaxed ${isDark ? 'text-white/50' : 'text-black'}`}>
                Regex engine runs instantly. Gemini AI adds contextual intelligence on top.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-4 group">
              <div className={`w-20 h-20 rounded-full border backdrop-blur-md flex items-center justify-center font-mono font-bold text-2xl group-hover:scale-105 transition-all duration-300 shadow-lg ${isDark
                ? 'bg-white/5 border-white/15 text-white/90 group-hover:border-purple-400/50 group-hover:text-purple-300'
                : 'bg-white border-black/15 text-black group-hover:border-black group-hover:bg-black group-hover:text-white shadow-sm'
                }`}>
                03
              </div>
              <h3 className={`font-semibold text-xl tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                Get Fixes
              </h3>
              <p className={`text-sm max-w-xs leading-relaxed ${isDark ? 'text-white/50' : 'text-black'}`}>
                Receive a scored report with exact line numbers, descriptions, and corrected code.
              </p>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* ========================================================= */}
      {/* SECTION 5 — LIVE CODE PREVIEW (Realistic Demo)             */}
      {/* ========================================================= */}
      <SectionReveal className="w-full py-24 sm:py-32 px-4 sm:px-6 relative z-10 max-w-7xl mx-auto space-y-12">
        {/* Section Heading */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className={`text-4xl sm:text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
            See It In Action
          </h2>
          <p className={`text-base sm:text-lg ${isDark ? 'text-white/40' : 'text-black'}`}>
            Inspect flaws and AI-engineered remediations side-by-side in real time
          </p>
        </div>

        {/* Live Demo Split-Screen Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDE — Fake Code Input (Styled exactly like CodeEditor) */}
          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#121214] shadow-2xl overflow-hidden relative backdrop-blur-md">
            {/* Window Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-black/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500/80" />
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="inline-block w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-2 font-mono font-medium text-white/50 flex items-center gap-1.5">
                  {activeTab === 'js' ? 'auth_handler.js' : 'payment_service.py'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Language Switcher Tabs */}
                <button
                  type="button"
                  onClick={() => setActiveTab('js')}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${activeTab === 'js'
                    ? 'bg-white/20 text-white font-semibold'
                    : 'bg-white/5 text-white/40 hover:text-white'
                    }`}
                >
                  JavaScript
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('py')}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${activeTab === 'py'
                    ? 'bg-white/20 text-white font-semibold'
                    : 'bg-white/5 text-white/40 hover:text-white'
                    }`}
                >
                  Python
                </button>
              </div>
            </div>

            {/* Scan Beam Indicator */}
            {isScanning && (
              <div
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,1)] z-30 transition-all duration-75 pointer-events-none"
                style={{ top: `${(scanProgress / 100) * 360 + 40}px` }}
              />
            )}

            {/* Code Body with Line Gutter */}
            <div className="flex min-h-[380px] max-h-[500px] overflow-y-auto font-mono text-xs sm:text-sm leading-6 bg-[#16161a]">
              {/* Line Numbers Gutter */}
              <div className="w-10 sm:w-12 shrink-0 py-3 pr-2.5 text-right select-none border-r border-white/10 bg-black/30 text-white/25 font-mono text-xs leading-6">
                {activeCodeLines.map((line) => (
                  <div key={line.num} className="leading-6">
                    {line.num}
                  </div>
                ))}
              </div>

              {/* Code Text with Problematic Line Highlights */}
              <div className="flex-1 py-3 px-3 sm:px-4 overflow-x-auto text-white/90">
                {activeCodeLines.map((line) => {
                  let lineBg = '';
                  let labelColor = '';
                  if (line.hazard === 'high') {
                    lineBg = 'bg-red-500/10 border-l-2 border-red-500 pl-1.5 -ml-1.5';
                    labelColor = 'text-red-400 border-red-500/30 bg-red-500/10';
                  } else if (line.hazard === 'med') {
                    lineBg = 'bg-yellow-500/10 border-l-2 border-yellow-500 pl-1.5 -ml-1.5';
                    labelColor = 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
                  } else if (line.hazard === 'low') {
                    lineBg = 'bg-white/10 border-l-2 border-white/40 pl-1.5 -ml-1.5';
                    labelColor = 'text-white/80 border-white/30 bg-white/10';
                  }

                  return (
                    <div
                      key={line.num}
                      className={`leading-6 flex items-center justify-between group/line rounded-sm ${lineBg}`}
                    >
                      <span className="font-mono whitespace-pre">
                        {line.text}
                      </span>
                      {line.label && (
                        <span
                          className={`hidden sm:inline-block ml-2 text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${labelColor}`}
                        >
                          {line.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 bg-black/50 text-xs font-mono text-white/40">
              <div className="flex items-center gap-3">
                <span>{activeCodeLines.length} lines</span>
                <span>•</span>
                <span>UTF-8</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={triggerScanDemo}
                  disabled={isScanning}
                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>{isScanning ? 'Scanning...' : 'Re-scan Snippet'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE — CodeSage Inspection Findings & Remedies */}
          <div className={`lg:col-span-5 rounded-2xl border backdrop-blur-md shadow-2xl p-5 sm:p-6 space-y-5 transition-colors ${isDark
            ? 'border-white/10 bg-white/[0.02]'
            : 'border-black/10 bg-white'
            }`}>
            {/* Header with Score and Engines */}
            <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-white/10' : 'border-black/10'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-black text-white border-black shadow-sm'
                  }`}>
                  <span className={`text-xl font-bold font-mono ${isDark ? 'text-red-400' : 'text-white'}`}>
                    {activeTab === 'js' ? '38' : '41'}
                  </span>
                  <span className={`text-[9px] font-mono uppercase ${isDark ? 'text-red-400' : 'text-white/80'}`}>/100</span>
                </div>
                <div>
                  <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                    Quality Score: Poor
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black'}`}>
                    Hazards detected in 0.42s
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] flex items-center gap-1.5 border ${isDark
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-black/5 border-black/20 text-black'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-emerald-400 animate-pulse' : 'bg-black animate-pulse'
                  }`} />
                Gemini + Regex
              </span>
            </div>

            {/* Findings Pill Counters */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className={`px-2.5 py-1 rounded-lg border font-medium ${isDark
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-black text-white border-black'
                }`}>
                {activeTab === 'js' ? '4 High' : '3 High'}
              </span>
              <span className={`px-2.5 py-1 rounded-lg border font-medium ${isDark
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                : 'bg-black/5 border-black/20 text-black font-semibold'
                }`}>
                1 Medium
              </span>
              <span className={`px-2.5 py-1 rounded-lg border font-medium ${isDark
                ? 'bg-white/10 border-white/20 text-white/80'
                : 'bg-black/5 border-black/20 text-black font-semibold'
                }`}>
                1 Low
              </span>
            </div>

            {/* Finding Cards List */}
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {activeTab === 'js' ? (
                <>
                  {/* JS Finding 1 */}
                  <div className={`rounded-xl border p-3.5 border-l-4 space-y-1.5 text-xs ${isDark ? 'border-white/10 bg-white/[0.03] border-l-red-500' : 'border-black/10 bg-black/[0.02] border-l-black'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-black'}`}>
                        Hardcoded Secret Key
                      </span>
                      <span className={`font-mono text-[11px] ${isDark ? 'text-white/40' : 'text-black'}`}>Line 4</span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-white/50' : 'text-black'}`}>
                      Plaintext API secret exposed in client code.
                    </p>
                    <div className={`border rounded p-2 font-mono text-[11px] ${isDark ? 'bg-black/50 border-white/5 text-emerald-400' : 'bg-white border-black/15 text-black shadow-sm font-medium'
                      }`}>
                      Fix: Move to process.env.API_KEY
                    </div>
                  </div>

                  {/* JS Finding 2 */}
                  <div className={`rounded-xl border p-3.5 border-l-4 space-y-1.5 text-xs ${isDark ? 'border-white/10 bg-white/[0.03] border-l-red-500' : 'border-black/10 bg-black/[0.02] border-l-black'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-black'}`}>
                        Dangerous eval() Usage
                      </span>
                      <span className={`font-mono text-[11px] ${isDark ? 'text-white/40' : 'text-black'}`}>Line 11</span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-white/50' : 'text-black'}`}>
                      Arbitrary code execution risk from untrusted user input string.
                    </p>
                    <div className={`border rounded p-2 font-mono text-[11px] ${isDark ? 'bg-black/50 border-white/5 text-emerald-400' : 'bg-white border-black/15 text-black shadow-sm font-medium'
                      }`}>
                      Fix: Use JSON.parse() instead of arbitrary eval
                    </div>
                  </div>

                  {/* JS Finding 3 */}
                  <div className={`rounded-xl border p-3.5 border-l-4 space-y-1.5 text-xs ${isDark ? 'border-white/10 bg-white/[0.03] border-l-red-500' : 'border-black/10 bg-black/[0.02] border-l-black'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-black'}`}>
                        SQL Injection Hazard
                      </span>
                      <span className={`font-mono text-[11px] ${isDark ? 'text-white/40' : 'text-black'}`}>Line 14</span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-white/50' : 'text-black'}`}>
                      Direct string concatenation in SQL queries allows query tampering.
                    </p>
                    <div className={`border rounded p-2 font-mono text-[11px] ${isDark ? 'bg-black/50 border-white/5 text-emerald-400' : 'bg-white border-black/15 text-black shadow-sm font-medium'
                      }`}>
                      Fix: Use parameterized queries: db.query(sql, [params])
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Python Finding 1 */}
                  <div className={`rounded-xl border p-3.5 border-l-4 space-y-1.5 text-xs ${isDark ? 'border-white/10 bg-white/[0.03] border-l-red-500' : 'border-black/10 bg-black/[0.02] border-l-black'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-black'}`}>
                        Hardcoded Secret Token
                      </span>
                      <span className={`font-mono text-[11px] ${isDark ? 'text-white/40' : 'text-black'}`}>Line 4</span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-white/50' : 'text-black'}`}>
                      Embedded secret key in source repository.
                    </p>
                    <div className={`border rounded p-2 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] ${isDark ? 'bg-black/50 border-white/5' : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                      Fix: Use os.environ.get("API_SECRET")
                    </div>
                  </div>

                  {/* Python Finding 2 */}
                  <div className={`rounded-xl border p-3.5 border-l-4 border-l-red-500 space-y-1.5 text-xs ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50/80'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        eval() on Request Body
                      </span>
                      <span className={`font-mono text-[11px] ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Line 7</span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
                      Deserializing untrusted client input via eval causes remote execution.
                    </p>
                    <div className={`border rounded p-2 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] ${isDark ? 'bg-black/50 border-white/5' : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                      Fix: Replace with json.loads(raw_data)
                    </div>
                  </div>

                  {/* Python Finding 3 */}
                  <div className={`rounded-xl border p-3.5 border-l-4 border-l-yellow-500 space-y-1.5 text-xs ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50/80'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Unbounded Loop Risk
                      </span>
                      <span className={`font-mono text-[11px] ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Line 13</span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
                      while True polling loop has no timeout boundary.
                    </p>
                    <div className={`border rounded p-2 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] ${isDark ? 'bg-black/50 border-white/5' : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                      Fix: Add max retry counter and asyncio sleep
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Strengths Callout */}
            <div className={`rounded-xl border p-3 flex items-start gap-2 text-xs ${isDark
              ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300/80'
              : 'border-black/20 bg-black/5 text-black'
              }`}>
              <span className={isDark ? "text-emerald-500 font-bold" : "text-black font-bold"}>✓</span>
              <span>
                <strong>Positive Pattern:</strong> Structured error handling and clean dictionary output.
              </span>
            </div>

            {/* Launch App Button */}
          </div>
        </div>
      </SectionReveal>

      {/* ========================================================= */}
      {/* SECTION 6 — SUPPORTED LANGUAGES SHOWCASE (LogoLoop)       */}
      {/* ========================================================= */}
      <section className={`w-full py-20 px-4 sm:px-6 relative z-10 border-t transition-colors ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-black/10 bg-white'
        }`}>
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className={`text-2xl sm:text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
              Supported Across Modern Tech Stacks
            </h2>
            <p className={`text-sm sm:text-base ${isDark ? 'text-white/40' : 'text-black/70'}`}>
              First-class static analysis and AI reasoning across 30+ languages &amp; frameworks
            </p>
          </div>

          {/* Borderless LogoLoop Component */}
          <div className="relative w-full py-8 overflow-hidden select-none">
            <LogoLoop
              logos={languageLogos}
              speed={65}
              direction="left"
              logoHeight={48}
              gap={54}
              hoverSpeed={0}
              scaleOnHover={true}
              fadeOut={true}
              fadeOutColor={isDark ? '#06040a' : '#ffffff'}
              ariaLabel="Supported programming languages and frameworks"
            />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 7 — DUAL-ENGINE ARCHITECTURE MATRIX               */}
      {/* ========================================================= */}
      <SectionReveal className="w-full py-20 px-4 sm:px-6 relative z-10 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className={`text-2xl sm:text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
            Why CodeSage Outperforms
          </h2>
          <p className={`text-sm sm:text-base ${isDark ? 'text-white/40' : 'text-black/70'}`}>
            The speed of deterministic rules combined with Gemini 3.8 reasoning
          </p>
        </div>

        <div className={`overflow-x-auto rounded-2xl border backdrop-blur-md p-1 ${isDark
          ? 'border-white/10 bg-white/[0.02]'
          : 'border-black/10 bg-white shadow-sm'
          }`}>
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className={`border-b font-mono uppercase text-[11px] ${isDark ? 'border-white/10 text-white/40' : 'border-black/10 text-black/60'
                }`}>
                <th className="py-4 px-4 sm:px-6">Capability</th>
                <th className="py-4 px-3 sm:px-4">Standard Linters</th>
                <th className="py-4 px-3 sm:px-4">Raw LLM Prompts</th>
                <th className={`py-4 px-4 sm:px-6 font-bold ${isDark ? 'text-white bg-white/5' : 'text-black bg-black/5'
                  }`}>
                  CodeSage Hybrid
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/5 text-white/70' : 'divide-black/10 text-black/85'
              }`}>
              <tr>
                <td className={`py-3.5 px-4 sm:px-6 font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Execution Speed
                </td>
                <td className="py-3.5 px-3 sm:px-4 text-emerald-500">Sub-second</td>
                <td className="py-3.5 px-3 sm:px-4 text-red-500">10-25 seconds</td>
                <td className={`py-3.5 px-4 sm:px-6 font-semibold ${isDark ? 'text-emerald-400 bg-white/5' : 'text-emerald-600 bg-black/5'
                  }`}>
                  Under 3 seconds
                </td>
              </tr>
              <tr>
                <td className={`py-3.5 px-4 sm:px-6 font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Exact Line Mapping
                </td>
                <td className="py-3.5 px-3 sm:px-4 text-emerald-500">✓ 100% exact</td>
                <td className="py-3.5 px-3 sm:px-4 text-yellow-500">~ Hallucinates lines</td>
                <td className={`py-3.5 px-4 sm:px-6 font-semibold ${isDark ? 'text-emerald-400 bg-white/5' : 'text-emerald-600 bg-black/5'
                  }`}>
                  ✓ Deterministic lines
                </td>
              </tr>
              <tr>
                <td className={`py-3.5 px-4 sm:px-6 font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Contextual Fix Generation
                </td>
                <td className="py-3.5 px-3 sm:px-4 text-red-500">✗ Generic warnings</td>
                <td className="py-3.5 px-3 sm:px-4 text-emerald-500">✓ Contextual</td>
                <td className={`py-3.5 px-4 sm:px-6 font-semibold ${isDark ? 'text-emerald-400 bg-white/5' : 'text-emerald-600 bg-black/5'
                  }`}>
                  ✓ AI remediation code
                </td>
              </tr>
              <tr>
                <td className={`py-3.5 px-4 sm:px-6 font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Zero-Storage Private Mode
                </td>
                <td className="py-3.5 px-3 sm:px-4 text-emerald-500">✓ Local only</td>
                <td className="py-3.5 px-3 sm:px-4 text-red-500">✗ Logged & trained</td>
                <td className={`py-3.5 px-4 sm:px-6 font-semibold ${isDark ? 'text-emerald-400 bg-white/5' : 'text-emerald-600 bg-black/5'
                  }`}>
                  ✓ 100% Ephemeral
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionReveal>

      {/* ========================================================= */}
      {/* SECTION 8 — FINAL HIGH-IMPACT CALL TO ACTION               */}
      {/* ========================================================= */}
      <SectionReveal className="w-full py-24 sm:py-32 px-4 sm:px-6 relative z-10 max-w-5xl mx-auto">
        <div className={`relative rounded-3xl border p-8 sm:p-14 text-center backdrop-blur-xl shadow-2xl overflow-hidden space-y-6 transition-colors ${isDark
          ? 'border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.02]'
          : 'border-black/10 bg-white'
          }`}>
          {/* Background Ambient Glow */}
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <h2 className={`text-3xl sm:text-5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
              Ready to Ship Flawless Code?
            </h2>
            <p className={`text-base sm:text-lg ${isDark ? 'text-white/50' : 'text-black/75'}`}>
              Start finding vulnerabilities, logic hazards, and code smells in your stack today.
            </p>
          </div>

          <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <SpecularButton
              size="lg"
              radius={16}
              bg={isDark ? '#0c0d12' : '#000000'}
              textColor="#ffffff"
              lineColor="#ffffff"
              baseColor="#ffffff"
              intensity={1.3}
              shineSize={14}
              shineFade={40}
              thickness={1.5}
              speed={0.35}
              followMouse={true}
              proximity={250}
              autoAnimate={false}
              onClick={() => navigate('/app')}
              className="px-8 py-4 font-bold text-base tracking-wide border border-white/30 hover:border-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.15)] transition-all cursor-pointer"
            >
              <span>Start Reviewing Free →</span>
            </SpecularButton>
          </div>

          <div className={`relative z-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs font-mono ${isDark ? 'text-white/40' : 'text-black/70 font-medium'
            }`}>
            <span>✓ No credit card required</span>
            <span>•</span>
            <span>✓ Instant private mode</span>
            <span>•</span>
            <span>✓ 30+ programming languages &amp; frameworks</span>
          </div>
        </div>
      </SectionReveal>

      {/* ========================================================= */}
      {/* FOOTER                                                     */}
      {/* ========================================================= */}
      <footer className={`w-full border-t py-10 px-4 sm:px-6 relative z-10 text-xs transition-colors ${isDark ? 'bg-black border-white/10 text-white/40' : 'bg-white border-black/10 text-black/60'
        }`}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>CodeSage</span>
            <span className={`border-l pl-3 font-mono ${isDark ? 'border-white/20' : 'border-black/20'}`}>
              AI-Powered Architectural Inspection
            </span>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs">
            <button
              type="button"
              onClick={() => navigate('/app')}
              className={`transition-colors cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-black font-semibold'}`}
            >
              Reviewer App
            </button>
            <button
              type="button"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`transition-colors cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-black font-semibold'}`}
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`transition-colors cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-black font-semibold'}`}
            >
              Back to Top ↑
            </button>
          </div>

          <div className={`font-mono text-[11px] ${isDark ? 'text-white/30' : 'text-black/50'}`}>
            &copy; 2026 CodeSage. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
