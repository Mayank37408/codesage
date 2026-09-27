/**
 * @file languageDetector.js
 * @description Intelligent programming language heuristic detector for CodeSage input.
 */

const EXTENSION_MAP = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  tsx: 'jsx',
  py: 'python',
  pyw: 'python',
  java: 'java',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  hxx: 'cpp',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  php: 'php',
  rb: 'ruby',
  swift: 'swift',
  kt: 'kotlin',
  kts: 'kotlin',
  sql: 'sql',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  dart: 'dart',
  html: 'html',
  htm: 'html',
  r: 'r',
  scala: 'scala',
  lua: 'lua',
  pl: 'perl'
};

const LANGUAGE_LABELS = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  jsx: 'React (JSX)',
  python: 'Python',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  go: 'Go',
  rust: 'Rust',
  php: 'PHP',
  ruby: 'Ruby',
  swift: 'Swift',
  kotlin: 'Kotlin',
  sql: 'SQL',
  bash: 'Bash/Shell',
  dart: 'Dart/Flutter',
  html: 'HTML',
  lua: 'Lua',
  r: 'R',
  scala: 'Scala',
  perl: 'Perl'
};

const LANGUAGE_EXTENSIONS = {
  javascript: 'js',
  typescript: 'ts',
  jsx: 'jsx',
  python: 'py',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  csharp: 'cs',
  go: 'go',
  rust: 'rs',
  php: 'php',
  ruby: 'rb',
  swift: 'swift',
  kotlin: 'kt',
  sql: 'sql',
  bash: 'sh',
  dart: 'dart',
  html: 'html',
  lua: 'lua',
  r: 'r',
  scala: 'scala',
  perl: 'pl'
};

/**
 * Returns canonical display label for a language key.
 *
 * @param {string} lang
 * @returns {string}
 */
export function getLanguageDisplayName(lang) {
  if (!lang) return 'Auto-Detect';
  const clean = lang.toLowerCase();
  return LANGUAGE_LABELS[clean] || (clean.charAt(0).toUpperCase() + clean.slice(1));
}

/**
 * Returns typical file extension for language key.
 *
 * @param {string} lang
 * @returns {string}
 */
export function getFileExtensionForLanguage(lang) {
  if (!lang) return 'js';
  const clean = lang.toLowerCase();
  return LANGUAGE_EXTENSIONS[clean] || 'txt';
}

/**
 * Heuristically detects the programming language of a source code snippet or filename.
 *
 * @param {string} [code=''] - Source code string.
 * @param {string} [fileName=''] - Optional filename to inspect extension.
 * @returns {{ language: string, confidence: 'high' | 'medium' | 'low' | 'none', label: string }}
 */
export function detectLanguage(code = '', fileName = '') {
  // 1. Check filename extension first if available
  if (fileName && typeof fileName === 'string') {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext && EXTENSION_MAP[ext]) {
      const lang = EXTENSION_MAP[ext];
      return {
        language: lang,
        confidence: 'high',
        label: getLanguageDisplayName(lang)
      };
    }
  }

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return {
      language: 'javascript',
      confidence: 'none',
      label: 'JavaScript'
    };
  }

  const trimmed = code.trim();
  const scores = {};

  const addScore = (lang, points) => {
    scores[lang] = (scores[lang] || 0) + points;
  };

  // Shebang check
  if (/^#!\/(?:usr\/)?bin\/(?:bash|sh|zsh)/m.test(trimmed)) {
    addScore('bash', 40);
  } else if (/^#!\/(?:usr\/)?bin\/(?:env\s+)?python/m.test(trimmed)) {
    addScore('python', 40);
  } else if (/^#!\/(?:usr\/)?bin\/(?:env\s+)?node/m.test(trimmed)) {
    addScore('javascript', 40);
  }

  // HTML Check
  if (/<!DOCTYPE\s+html>/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) {
    addScore('html', 35);
  }

  // PHP Check
  if (/<\?php/i.test(trimmed)) {
    addScore('php', 40);
  }
  if (/\$(?:_POST|_GET|_SERVER|_SESSION|_REQUEST|_ENV)\b/.test(trimmed)) {
    addScore('php', 25);
  }
  if (/\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*\s*=[^=]/.test(trimmed)) {
    addScore('php', 10);
  }

  // Python Heuristics
  if (/(?:^|\n)\s*def\s+[a-zA-Z_]\w*\s*\(.*?\)\s*:/m.test(trimmed)) {
    addScore('python', 20);
  }
  if (/(?:^|\n)\s*class\s+[a-zA-Z_]\w*(?:\(.*?\))?\s*:/m.test(trimmed)) {
    addScore('python', 12);
  }
  if (/(?:^|\n)\s*elif\s+.*?:/m.test(trimmed)) {
    addScore('python', 15);
  }
  if (/(?:^|\n)\s*(?:from\s+[a-zA-Z0-9_.]+\s+import\s+|import\s+[a-zA-Z0-9_.]+)/m.test(trimmed)) {
    addScore('python', 10);
  }
  if (/\bif\s+__name__\s*==\s*['"]__main__['"]\s*:/m.test(trimmed)) {
    addScore('python', 30);
  }
  if (/\bself\.[a-zA-Z_]\w*/.test(trimmed)) {
    addScore('python', 12);
  }
  if (/\b__init__\s*\(\s*self/.test(trimmed)) {
    addScore('python', 20);
  }
  if (/\bprint\s*\([^;)]*?\)(?!\s*;)/.test(trimmed)) {
    addScore('python', 6);
  }
  if (/\b(?:True|False|None)\b/.test(trimmed)) {
    addScore('python', 6);
  }
  if (/(?:^|\n)\s*except\s+(?:[A-Z]\w*|Exception)?\s*(?:as\s+\w+)?\s*:/m.test(trimmed)) {
    addScore('python', 20);
  }

  // Rust Heuristics
  if (/\bfn\s+[a-zA-Z_]\w*\s*\(.*?\)\s*(?:->\s*.*?\{|\{)/.test(trimmed)) {
    addScore('rust', 25);
  }
  if (/\blet\s+mut\s+/.test(trimmed)) {
    addScore('rust', 20);
  }
  if (/\bprintln!\s*\(/.test(trimmed)) {
    addScore('rust', 20);
  }
  if (/\bpub\s+(?:fn|struct|enum|mod|trait)\b/.test(trimmed)) {
    addScore('rust', 15);
  }
  if (/\bimpl\s+[a-zA-Z_]\w*\s*\{/.test(trimmed) || /\bimpl\s+.*?for\s+\w+\s*\{/.test(trimmed)) {
    addScore('rust', 20);
  }
  if (/\buse\s+std::/.test(trimmed)) {
    addScore('rust', 15);
  }
  if (/->\s*(?:Result|Option)\s*</.test(trimmed)) {
    addScore('rust', 12);
  }

  // Go Heuristics
  if (/(?:^|\n)\s*package\s+[a-zA-Z_]\w*/m.test(trimmed)) {
    addScore('go', 30);
  }
  if (/(?:^|\n)\s*import\s+\(/m.test(trimmed)) {
    addScore('go', 15);
  }
  if (/\bfunc\s+(?:\([a-zA-Z0-9_ *]+\)\s+)?[a-zA-Z_]\w*\s*\(/.test(trimmed)) {
    addScore('go', 20);
  }
  if (/\bfmt\.(?:Println|Printf|Print|Sprintf)\b/.test(trimmed)) {
    addScore('go', 20);
  }
  if (/:=\s*make\s*\(/.test(trimmed) || /:=/.test(trimmed)) {
    addScore('go', 10);
  }
  if (/\btype\s+[a-zA-Z_]\w*\s+struct\s*\{/.test(trimmed)) {
    addScore('go', 18);
  }

  // Java Heuristics
  if (/\bpublic\s+(?:final\s+)?class\s+[a-zA-Z_]\w*/.test(trimmed)) {
    addScore('java', 18);
  }
  if (/\bpublic\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]/i.test(trimmed)) {
    addScore('java', 30);
  }
  if (/\bSystem\.(?:out|err)\.(?:println|print|printf)\b/.test(trimmed)) {
    addScore('java', 20);
  }
  if (/\bimport\s+java\.[a-zA-Z0-9_.*]+;/.test(trimmed)) {
    addScore('java', 25);
  }
  if (/@Override\b/.test(trimmed)) {
    addScore('java', 10);
  }

  // C# Heuristics
  if (/\busing\s+System(?:\.[a-zA-Z0-9_.]+)?;/.test(trimmed)) {
    addScore('csharp', 25);
  }
  if (/\bnamespace\s+[a-zA-Z0-9_.]+\s*\{?/m.test(trimmed)) {
    addScore('csharp', 18);
  }
  if (/\bConsole\.(?:WriteLine|Write)\b/.test(trimmed)) {
    addScore('csharp', 20);
  }
  if (/\{\s*get;\s*set;\s*\}/.test(trimmed)) {
    addScore('csharp', 22);
  }
  if (/\bstatic\s+void\s+Main\s*\(/.test(trimmed)) {
    addScore('csharp', 18);
  }

  // C++ Heuristics
  if (/#include\s*<(?:iostream|vector|string|algorithm|memory|map|utility)>/i.test(trimmed)) {
    addScore('cpp', 30);
  }
  if (/\bstd::(?:cout|cin|cerr|endl|string|vector|map|unique_ptr|shared_ptr)\b/.test(trimmed)) {
    addScore('cpp', 25);
  }
  if (/\bcout\s*<<|\bcin\s*>>/.test(trimmed)) {
    addScore('cpp', 20);
  }
  if (/\btemplate\s*<\s*(?:typename|class)\s+[a-zA-Z_]\w*>/m.test(trimmed)) {
    addScore('cpp', 18);
  }

  // C Heuristics
  if (/#include\s*<(?:stdio\.h|stdlib\.h|string\.h|unistd\.h|math\.h)>/i.test(trimmed)) {
    addScore('c', 30);
  }
  if (/\bprintf\s*\(|\bscanf\s*\(/.test(trimmed) && !scores.cpp && !scores.csharp) {
    addScore('c', 18);
  }
  if (/\bmalloc\s*\(|\bfree\s*\(/.test(trimmed)) {
    addScore('c', 14);
  }
  if (/\bint\s+main\s*\(\s*(?:void|int\s+argc)?\s*\)/.test(trimmed)) {
    addScore('c', 15);
  }

  // SQL Heuristics
  if (/\bSELECT\s+[\s\S]+?\s+FROM\b/i.test(trimmed)) {
    addScore('sql', 30);
  }
  if (/\bINSERT\s+INTO\b|\bUPDATE\s+\w+\s+SET\b|\bDELETE\s+FROM\b/i.test(trimmed)) {
    addScore('sql', 25);
  }
  if (/\bCREATE\s+TABLE\b|\bALTER\s+TABLE\b|\bDROP\s+TABLE\b/i.test(trimmed)) {
    addScore('sql', 25);
  }

  // React / JSX Heuristics
  if (/\bimport\s+React\b/.test(trimmed)) {
    addScore('jsx', 25);
  }
  if (/\bclassName=["'{]/.test(trimmed)) {
    addScore('jsx', 20);
  }
  if (/<\/[a-zA-Z][a-zA-Z0-9]*>/.test(trimmed) && /<[a-zA-Z][a-zA-Z0-9]*[\s>]/.test(trimmed)) {
    addScore('jsx', 15);
  }
  if (/use(?:State|Effect|Memo|Callback|Context)\s*\(/.test(trimmed)) {
    addScore('jsx', 20);
  }

  // TypeScript Heuristics
  if (/:\s*(?:string|number|boolean|any|unknown|never|void|Record<|Array<)[,);=]/.test(trimmed)) {
    addScore('typescript', 15);
  }
  if (/\binterface\s+[A-Z]\w*(?:\s+extends\s+[A-Z]\w*)?\s*\{/.test(trimmed)) {
    addScore('typescript', 20);
  }
  if (/\btype\s+[A-Z]\w*\s*=\s*/.test(trimmed)) {
    addScore('typescript', 15);
  }
  if (/\bas\s+const\b/.test(trimmed)) {
    addScore('typescript', 12);
  }

  // JavaScript Heuristics
  if (/\bconst\s+[a-zA-Z0-9_$]+\s*=[^=]/.test(trimmed)) {
    addScore('javascript', 8);
  }
  if (/\blet\s+[a-zA-Z0-9_$]+\s*=[^=]/.test(trimmed)) {
    addScore('javascript', 8);
  }
  if (/\bconsole\.(?:log|warn|error|info|debug)\s*\(/.test(trimmed)) {
    addScore('javascript', 12);
  }
  if (/\bmodule\.exports\s*=|exports\.[a-zA-Z_]/.test(trimmed)) {
    addScore('javascript', 20);
  }
  if (/\brequire\s*\(['"][^'"]+['"]\)/.test(trimmed)) {
    addScore('javascript', 18);
  }
  if (/\bdocument\.(?:getElementById|querySelector)\s*\(/.test(trimmed)) {
    addScore('javascript', 15);
  }
  if (/(?:^|\n)\s*function\s+[a-zA-Z0-9_$]*\s*\(.*?\)\s*\{/m.test(trimmed)) {
    addScore('javascript', 8);
  }
  if (/\([^)]*\)\s*=>\s*\{?/.test(trimmed)) {
    addScore('javascript', 8);
  }

  // Swift Heuristics
  if (/\bimport\s+(?:SwiftUI|UIKit|Foundation)\b/.test(trimmed)) {
    addScore('swift', 30);
  }
  if (/\bguard\s+let\b/.test(trimmed)) {
    addScore('swift', 20);
  }

  // Kotlin Heuristics
  if (/\bfun\s+main\s*\(/.test(trimmed)) {
    addScore('kotlin', 25);
  }
  if (/\bdata\s+class\s+[A-Z]\w*/.test(trimmed)) {
    addScore('kotlin', 20);
  }

  // Ruby Heuristics
  if (/(?:^|\n)\s*def\s+[a-zA-Z_]\w*(?:\s*\(.*?\))?\s*(?!:)(?:\n|$)/m.test(trimmed) && !scores.python) {
    addScore('ruby', 15);
  }
  if (/\battr_accessor\b|\battr_reader\b/.test(trimmed)) {
    addScore('ruby', 20);
  }
  if (/\bputs\s+["']/.test(trimmed) && !scores.python) {
    addScore('ruby', 12);
  }

  // Dart Heuristics
  if (/\bvoid\s+main\s*\(\s*\)/.test(trimmed) && /print\s*\(/.test(trimmed) && !scores.c && !scores.cpp) {
    addScore('dart', 18);
  }
  if (/import\s+['"]package:flutter\//.test(trimmed) || /Widget\s+build\s*\(/.test(trimmed)) {
    addScore('dart', 30);
  }

  // Rank scores
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0 || sorted[0][1] <= 0) {
    return {
      language: 'javascript',
      confidence: 'none',
      label: 'JavaScript (Default)'
    };
  }

  const [topLang, topScore] = sorted[0];

  // Specific resolution for TypeScript vs JavaScript vs JSX:
  // If JSX has high score, pick jsx
  if (scores.jsx && scores.jsx >= 15) {
    return {
      language: 'jsx',
      confidence: 'high',
      label: getLanguageDisplayName('jsx')
    };
  }

  // If TypeScript features detected alongside JS, prefer typescript
  if (scores.typescript && scores.typescript >= 12 && (topLang === 'javascript' || topLang === 'typescript')) {
    return {
      language: 'typescript',
      confidence: 'high',
      label: getLanguageDisplayName('typescript')
    };
  }

  const confidence = topScore >= 20 ? 'high' : topScore >= 8 ? 'medium' : 'low';

  return {
    language: topLang,
    confidence,
    label: getLanguageDisplayName(topLang)
  };
}
