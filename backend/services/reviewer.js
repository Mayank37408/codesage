'use strict';

/**
 * @file reviewer.js
 * @description Core code review engine combining static regex rules with Gemini AI analysis.
 */

const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { analyzeWithGemini } = require('./gemini');
const { saveReview } = require('./firebase');
const { fetchRepoForReview } = require('./repoFetcher');
const { scanFilesForVulnerabilities } = require('./vulnScanner');

/**
 * Executes a comprehensive code review using static analysis and optional AI inference.
 *
 * @param {string} code - Source code string to inspect.
 * @param {string} language - Programming language (e.g., 'javascript', 'python').
 * @param {boolean} [isPrivate=false] - Flag indicating if review persistence should be skipped.
 * @returns {Promise<{
 *   language: string,
 *   score: number,
 *   stats: { total: number, high: number, medium: number, low: number },
 *   summary: string,
 *   strengths: string[],
 *   issues: Array<{
 *     id: string,
 *     title: string,
 *     severity: 'high' | 'medium' | 'low',
 *     line: number,
 *     description: string,
 *     code: string,
 *     fix: string
 *   }>,
 *   reviewedAt: string,
 *   isPrivate: boolean
 * }>} The evaluated review payload.
 */
async function reviewCode(code, language = 'javascript', isPrivate = false) {
  try {
    const rawLines = code.split('\n');

    // STEP 1 — Regex static pattern analysis
    const regexIssues = [];
    let issueCounter = 1;

    rawLines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim();

      // ============================================
      // HIGH SEVERITY RULES
      // ============================================

      // 1. eval()
      if (/\beval\s*\(/.test(line)) {
        regexIssues.push({
          id: `ISS-${String(issueCounter++).padStart(3, '0')}`,
          title: 'Dangerous eval() Usage',
          severity: 'high',
          line: lineNum,
          description: 'Using eval() executes arbitrary strings as code, leading to severe code injection hazards.',
          code: trimmedLine,
          fix: 'Replace with JSON.parse() or safer alternatives'
        });
      }

      // 2. .innerHTML =
      if (/\.innerHTML\s*=/.test(line)) {
        regexIssues.push({
          id: `ISS-${String(issueCounter++).padStart(3, '0')}`,
          title: 'XSS Risk via innerHTML',
          severity: 'high',
          line: lineNum,
          description: 'Direct assignment to innerHTML without prior sanitization exposes the application to Cross-Site Scripting (XSS).',
          code: trimmedLine,
          fix: 'Use textContent or DOMPurify to sanitize'
        });
      }

      // 3. Hardcoded credentials / secrets
      if (/(?:password|api_?key|token|secret)\s*[:=]\s*['"`][^'"`\r\n]{3,}['"`]/i.test(line)) {
        regexIssues.push({
          id: `ISS-${String(issueCounter++).padStart(3, '0')}`,
          title: 'Hardcoded Credential Detected',
          severity: 'high',
          line: lineNum,
          description: 'Plaintext passwords, tokens, or API secrets should never be embedded in application source code.',
          code: trimmedLine,
          fix: 'Move to environment variables'
        });
      }

      // 4. while(true) with no break on same line
      if (/\bwhile\s*\(\s*true\s*\)/.test(line) && !/\b(?:break|return)\b/.test(line)) {
        regexIssues.push({
          id: `ISS-${String(issueCounter++).padStart(3, '0')}`,
          title: 'Infinite Loop Risk',
          severity: 'high',
          line: lineNum,
          description: 'Unconditional while(true) loop detected without an immediate break or return statement.',
          code: trimmedLine,
          fix: 'Add a break condition'
        });
      }

      // 5. SQL injection via string concatenation
      if (/\b(?:SELECT|INSERT|UPDATE|DELETE)\b.*(?:\+\s*[a-zA-Z0-9_$]+|\$\{[^}]+\})/i.test(line)) {
        regexIssues.push({
          id: `ISS-${String(issueCounter++).padStart(3, '0')}`,
          title: 'SQL Injection Risk',
          severity: 'high',
          line: lineNum,
          description: 'Concatenating raw variables directly into database query strings enables SQL injection.',
          code: trimmedLine,
          fix: 'Use parameterized queries'
        });
      }

      // ============================================
      // MEDIUM SEVERITY RULES
      // ============================================

      // 1. document.write(
      if (/document\.write\s*\(/.test(line)) {
        regexIssues.push({
          id: `ISS-${String(issueCounter++).padStart(3, '0')}`,
          title: 'Unsafe document.write()',
          severity: 'medium',
          line: lineNum,
          description: 'document.write() interferes with modern rendering trees and introduces script injection vulnerabilities.',
          code: trimmedLine,
          fix: 'Use DOM manipulation instead'
        });
      }

      // 2. Off-by-one in for loop: i <= arr.length
      if (/for\s*\(.*;\s*\w+\s*<=\s*(?:\w+\.)?length\s*;/.test(line)) {
        regexIssues.push({
          id: `ISS-${String(issueCounter++).padStart(3, '0')}`,
          title: 'Off-by-One Error',
          severity: 'medium',
          line: lineNum,
          description: 'Loop condition tests <= length on a 0-indexed collection, causing an out-of-bounds error on the last iteration.',
          code: trimmedLine,
          fix: 'Use < instead of <='
        });
      }

      // 3. Loose null comparison: == null or != null
      if (/[^=!]={1,2}\s*null\b|[^=!]!=\s*null\b/.test(line)) {
        regexIssues.push({
          id: `ISS-${String(issueCounter++).padStart(3, '0')}`,
          title: 'Loose Null Comparison',
          severity: 'medium',
          line: lineNum,
          description: 'Loose equality with null allows subtle type coercion ambiguities (e.g. matching undefined).',
          code: trimmedLine,
          fix: 'Use === null for strict comparison'
        });
      }

      // 4. Accidental assignment in condition: if(x = ...)
      if (/\bif\s*\([^)]*[^=!<>]=[^=][^)]*\)/.test(line)) {
        regexIssues.push({
          id: `ISS-${String(issueCounter++).padStart(3, '0')}`,
          title: 'Accidental Assignment in Condition',
          severity: 'medium',
          line: lineNum,
          description: 'Single equals sign in conditional statement performs assignment instead of evaluation.',
          code: trimmedLine,
          fix: 'Use === for comparison'
        });
      }

      // 5. console.log with sensitive keywords
      const hasSensitiveKeyword = /(?:password|token|secret|api_?key)/i.test(line);
      if (/console\.log\s*\(/.test(line) && hasSensitiveKeyword) {
        regexIssues.push({
          id: `ISS-${String(issueCounter++).padStart(3, '0')}`,
          title: 'Sensitive Data Logged',
          severity: 'medium',
          line: lineNum,
          description: 'Logging credentials or auth tokens to standard output creates credential exposure risks.',
          code: trimmedLine,
          fix: 'Remove logging of sensitive values'
        });
      }

      // ============================================
      // LOW SEVERITY RULES
      // ============================================

      // 1. console.log( without sensitive data
      if (/console\.log\s*\(/.test(line) && !hasSensitiveKeyword) {
        regexIssues.push({
          id: `ISS-${String(issueCounter++).padStart(3, '0')}`,
          title: 'Debug Log Left in Code',
          severity: 'low',
          line: lineNum,
          description: 'Console logging statements should be stripped prior to shipping to production.',
          code: trimmedLine,
          fix: 'Remove before production'
        });
      }

      // 2. var keyword
      if (/\bvar\s+[a-zA-Z0-9_$]+/.test(line)) {
        regexIssues.push({
          id: `ISS-${String(issueCounter++).padStart(3, '0')}`,
          title: 'Avoid var Keyword',
          severity: 'low',
          line: lineNum,
          description: 'var declarations are hoisted with function scope, frequently causing variable shadowing bugs.',
          code: trimmedLine,
          fix: 'Use const or let instead'
        });
      }

      // 3. Single-letter variable names (= a, = b, = x, = y, = z)
      if (/\b(?:let|const|var)\s+([a-zA-Z])\s*=/.test(line)) {
        regexIssues.push({
          id: `ISS-${String(issueCounter++).padStart(3, '0')}`,
          title: 'Single-Letter Variable Name',
          severity: 'low',
          line: lineNum,
          description: 'Single-character identifiers reduce code readability and convey insufficient intent.',
          code: trimmedLine,
          fix: 'Use descriptive names'
        });
      }

      // 4. Magic numbers (2+ digits in logic)
      if (/(?<![a-zA-Z0-9_.'"=\-])[1-9]\d{1,}(?![a-zA-Z0-9_'"])/.test(line) && !/line|version|copyright|202\d/i.test(line)) {
        regexIssues.push({
          id: `ISS-${String(issueCounter++).padStart(3, '0')}`,
          title: 'Magic Number Detected',
          severity: 'low',
          line: lineNum,
          description: 'Hardcoded numerical values obscure algorithmic logic and complicate maintenance.',
          code: trimmedLine,
          fix: 'Extract to a named constant'
        });
      }

      // 5. Trailing whitespace
      if (/[ \t]+$/.test(line)) {
        regexIssues.push({
          id: `ISS-${String(issueCounter++).padStart(3, '0')}`,
          title: 'Trailing Whitespace',
          severity: 'low',
          line: lineNum,
          description: 'Trailing spaces clutter version control diffs.',
          code: trimmedLine,
          fix: 'Remove trailing whitespace'
        });
      }
    });

    // Detect Strengths via pattern checks
    const regexStrengths = [];
    if (/\b(?:const|let)\b/.test(code)) {
      regexStrengths.push('Uses const/let instead of var ✓');
    }
    if (/\btry\s*\{/.test(code)) {
      regexStrengths.push('Has try/catch error handling ✓');
    }
    if (/===|!==/.test(code)) {
      regexStrengths.push('Uses strict equality operators ✓');
    }
    if (/\/\*\*/.test(code)) {
      regexStrengths.push('Has JSDoc documentation ✓');
    }
    if (!/console\.log\s*\(/.test(code)) {
      regexStrengths.push('No debug logs left in code ✓');
    }
    if (!/\beval\s*\(/.test(code)) {
      regexStrengths.push('No eval() usage ✓');
    }

    // STEP 2 — Execute Gemini analysis in parallel
    const [geminiResult] = await Promise.allSettled([
      analyzeWithGemini(code, language)
    ]);

    console.log('[Reviewer] Gemini result status:', geminiResult.status);
    console.log('[Reviewer] Gemini result value:', geminiResult.value ? 'HAS DATA' : 'NULL/UNDEFINED');

    const geminiData = geminiResult.status === 'fulfilled' ? geminiResult.value : null;

    // STEP 3 — Merge results & deduplicate (Gemini gets higher priority)
    const combinedIssues = [];

    // 1. Add ALL of Gemini's fatalErrors first
    if (geminiData && Array.isArray(geminiData.fatalErrors)) {
      geminiData.fatalErrors.forEach((fIssue) => {
        combinedIssues.push({
          id: '',
          title: fIssue.title || 'Fatal Execution Error',
          severity: 'high',
          line: typeof fIssue.line === 'number' ? fIssue.line : 1,
          description: fIssue.description || '',
          code: fIssue.code || (rawLines[(fIssue.line || 1) - 1] ? rawLines[(fIssue.line || 1) - 1].trim() : ''),
          fix: 'Fix the fatal error to allow code execution',
          correctedCode: fIssue.correctedCode || '',
          source: 'gemini-fatal'
        });
      });
    }

    // 2. Add Gemini's regular issues
    if (geminiData && Array.isArray(geminiData.issues)) {
      geminiData.issues.forEach((gIssue) => {
        combinedIssues.push({
          id: '',
          title: gIssue.title || 'Code Quality Concern',
          severity: ['high', 'medium', 'low'].includes((gIssue.severity || '').toLowerCase())
            ? gIssue.severity.toLowerCase()
            : 'medium',
          line: typeof gIssue.line === 'number' ? gIssue.line : 1,
          description: gIssue.description || '',
          code: gIssue.code || (rawLines[(gIssue.line || 1) - 1] ? rawLines[(gIssue.line || 1) - 1].trim() : ''),
          fix: gIssue.fix || '',
          correctedCode: gIssue.correctedCode || '',
          source: 'gemini'
        });
      });
    }

    // 3. Add regex issues with source: "regex", deduplicating against Gemini issues
    regexIssues.forEach((rIssue) => {
      const isDuplicate = combinedIssues.some((gIssue) => {
        if (gIssue.line === rIssue.line) {
          const gDescStart = (gIssue.description || '').slice(0, 20).toLowerCase();
          const rDescStart = (rIssue.description || '').slice(0, 20).toLowerCase();
          return gDescStart === rDescStart;
        }
        return false;
      });

      if (!isDuplicate) {
        combinedIssues.push({
          ...rIssue,
          source: 'regex'
        });
      }
    });

    // Re-ID all issues sequentially: ISS-001, ISS-002...
    const finalIssues = combinedIssues.map((issue, idx) => ({
      ...issue,
      id: `ISS-${String(idx + 1).padStart(3, '0')}`
    }));

    // Merge strengths and deduplicate exact matches
    const geminiStrengths = (geminiData && Array.isArray(geminiData.strengths)) ? geminiData.strengths : [];
    const combinedStrengths = Array.from(new Set([...regexStrengths, ...geminiStrengths]));

    // Calculate issue counts
    const stats = {
      total: finalIssues.length,
      high: finalIssues.filter(i => i.severity === 'high').length,
      medium: finalIssues.filter(i => i.severity === 'medium').length,
      low: finalIssues.filter(i => i.severity === 'low').length
    };

    // Determine summary text
    let summary = '';
    if (geminiData?.executionWillFail) {
      summary = (geminiData.fatalErrorSummary || 'Code contains fatal errors and will crash upon execution.') +
        ' Fix fatal errors before addressing other issues.';
    } else if (geminiData && geminiData.aiSummary && geminiData.aiSummary.trim().length > 0) {
      summary = geminiData.aiSummary;
    } else {
      if (stats.total === 0) {
        summary = 'Code looks clean with no issues detected.';
      } else if (stats.high > 0) {
        summary = `Found ${stats.high} high severity issue(s) out of ${stats.total} total — not ready to ship.`;
      } else if (stats.total <= 3 && stats.high === 0) {
        summary = `Good shape overall with ${stats.total} minor issue(s) to clean up.`;
      } else {
        summary = `${stats.total} issues found across style and logic — worth reviewing.`;
      }
    }

    // STEP 4 — Calculate score with fatal error priority (0-100)
    let score = 100;
    if (geminiData?.executionWillFail) {
      score = Math.min(score, 40);
    }
    score -= (stats.high * 20);
    score -= (stats.medium * 8);
    score -= (stats.low * 3);

    // Enforce rule: a score above 70 should only be given when there are no high-severity issues
    if (stats.high > 0) {
      score = Math.min(score, 70);
    }
    score = Math.max(0, score);

    // Format language display name
    const formattedLanguage = formatLanguageName(language);

    // STEP 5 — Build final response
    const finalResponse = {
      language: formattedLanguage,
      score,
      stats,
      summary,
      strengths: combinedStrengths,
      issues: finalIssues,
      executionWillFail: Boolean(geminiData?.executionWillFail),
      fatalErrorSummary: geminiData?.fatalErrorSummary || '',
      geminiAvailable: Boolean(geminiData),
      reviewedAt: new Date().toISOString(),
      isPrivate: Boolean(isPrivate)
    };

    // STEP 6 — Return final response
    return finalResponse;
  } catch (err) {
    throw new Error(`Review service error: ${err.message}`);
  }
}

/**
 * Formats a language string into its canonical display name.
 *
 * @param {string} [lang] - Input language identifier.
 * @returns {string} Formatted display name.
 */
function formatLanguageName(lang) {
  if (!lang) return 'JavaScript';
  const clean = String(lang).trim().toLowerCase();

  if (clean === 'cpp' || clean === 'c++') return 'C++';
  if (clean === 'csharp' || clean === 'c#' || clean === 'cs') return 'C#';
  if (clean === 'js' || clean === 'javascript') return 'JavaScript';
  if (clean === 'ts' || clean === 'typescript') return 'TypeScript';
  if (clean === 'py' || clean === 'python') return 'Python';
  if (clean === 'rs' || clean === 'rust') return 'Rust';
  if (clean === 'kt' || clean === 'kotlin') return 'Kotlin';
  if (clean === 'rb' || clean === 'ruby') return 'Ruby';
  if (clean === 'go' || clean === 'golang') return 'Go';
  if (clean === 'jsx' || clean === 'react') return 'React (JSX)';
  if (clean === 'tsx') return 'React (TSX)';
  if (clean === 'sh' || clean === 'shell' || clean === 'bash') return 'Bash';
  if (clean === 'objc' || clean === 'objectivec') return 'Objective-C';
  if (clean === 'sql') return 'SQL';
  if (clean === 'postgresql' || clean === 'postgres') return 'PostgreSQL';
  if (clean === 'wasm' || clean === 'webassembly') return 'WebAssembly';
  if (clean === 'php') return 'PHP';

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Language-agnostic duplication detector using a 6-line sliding window.
 * Strips full-line comments (//, #, /*, *, *\/, --, ;) and whitespace.
 *
 * @param {Array<{ path: string, content: string }>} files - Repository files.
 * @returns {Array<object>} Duplication issues array.
 */
function detectCodeDuplication(files) {
  const issues = [];
  const hashMap = new Map(); // hash -> { file, startLine }
  const WINDOW_SIZE = 6;
  const MIN_CHAR_LENGTH = 40;

  (files || []).forEach((file) => {
    const filePath = file.path || '';
    const content = file.content || '';
    const rawLines = content.split('\n');

    // Filter and normalize lines with 1-indexed line tracking
    const normalizedLines = [];
    rawLines.forEach((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) return;

      // Skip full-line comments across common language styles
      if (
        trimmed.startsWith('//') ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('*/') ||
        trimmed.startsWith('--') ||
        trimmed.startsWith(';')
      ) {
        return;
      }

      normalizedLines.push({
        text: trimmed,
        originalLine: index + 1
      });
    });

    // 6-line sliding window scan
    for (let i = 0; i <= normalizedLines.length - WINDOW_SIZE; i++) {
      const window = normalizedLines.slice(i, i + WINDOW_SIZE);
      const joinedText = window.map(item => item.text).join('\n');

      if (joinedText.length < MIN_CHAR_LENGTH) continue;

      const hash = crypto.createHash('md5').update(joinedText).digest('hex');
      const startLine = window[0].originalLine;

      if (hashMap.has(hash)) {
        const existing = hashMap.get(hash);

        const isDifferentFile = existing.file !== filePath;
        const isFarApartInSameFile = !isDifferentFile && Math.abs(startLine - existing.startLine) >= WINDOW_SIZE;

        if (isDifferentFile || isFarApartInSameFile) {
          if (!issues.some(iss => iss.file === filePath && iss.line === startLine)) {
            issues.push({
              severity: 'medium',
              file: filePath,
              line: startLine,
              title: 'Duplicated Code Block Detected',
              description: `A 6-line code block in '${filePath}' (line ${startLine}) is identical to a block in '${existing.file}' (line ${existing.startLine}).`,
              suggestion: 'Refactor repeated code blocks into a shared utility function or helper.',
              source: 'duplication-detected'
            });
          }
        }
      } else {
        hashMap.set(hash, { file: filePath, startLine });
      }
    }
  });

  return issues;
}

/**
 * Infers repository languages from file extensions.
 *
 * @param {Array<{ path: string }>} files
 * @returns {string} Comma-separated languages or 'Multi-language'.
 */
function detectRepoLanguages(files) {
  const extMap = {
    js: 'JavaScript', jsx: 'JavaScript (JSX)',
    ts: 'TypeScript', tsx: 'TypeScript (TSX)',
    py: 'Python', go: 'Go', rs: 'Rust',
    java: 'Java', cpp: 'C++', c: 'C', cs: 'C#',
    php: 'PHP', rb: 'Ruby', kt: 'Kotlin', sh: 'Bash', sql: 'SQL'
  };

  const detected = new Set();
  (files || []).forEach(f => {
    const ext = (f.path || '').split('.').pop()?.toLowerCase();
    if (ext && extMap[ext]) {
      detected.add(extMap[ext]);
    }
  });

  if (detected.size === 0) return 'Multi-language';
  return Array.from(detected).join(', ');
}

/**
 * Performs a whole-repository review.
 *
 * @param {string} repoUrl - GitHub repository URL.
 * @param {boolean} [isPrivate=false] - Flag for private review persistence.
 */
async function reviewRepo(repoUrl, isPrivate = false) {
  const repoData = await fetchRepoForReview(repoUrl);
  const { owner, repo, branch, files } = repoData;

  const [cveIssuesResult, geminiResult] = await Promise.all([
    scanFilesForVulnerabilities(files).catch((err) => {
      console.warn('[VulnScanner Warning]:', err.message);
      return [];
    }),
    analyzeRepoWithGemini(files, owner, repo)
  ]);

  const cveIssues = Array.isArray(cveIssuesResult) ? cveIssuesResult : [];
  const duplicationIssues = detectCodeDuplication(files);

  const combinedIssues = [
    ...(geminiResult?.issues || []),
    ...cveIssues,
    ...duplicationIssues
  ];

  const highCount = combinedIssues.filter(i => (i.severity || '').toLowerCase() === 'high').length;
  const mediumCount = combinedIssues.filter(i => (i.severity || '').toLowerCase() === 'medium').length;
  const lowCount = combinedIssues.filter(i => (i.severity || '').toLowerCase() === 'low').length;

  let overallScore = geminiResult?.overallScore;
  if (typeof overallScore !== 'number' || isNaN(overallScore)) {
    // Calculate fallback score strictly based on actual merged issues instead of a fixed 80
    overallScore = 100 - (highCount * 20) - (mediumCount * 8) - (lowCount * 3);
  }

  // Enforce rule: a score above 70 should only be given when there are no high-severity issues
  if (highCount > 0) {
    overallScore = Math.min(overallScore, 70);
  }
  overallScore = Math.max(0, overallScore);

  return {
    repoUrl,
    owner,
    repo,
    branch,
    language: detectRepoLanguages(files),
    overallScore,
    summary: geminiResult?.summary || 'Whole-repository review completed.',
    fileExplanations: geminiResult?.fileExplanations || [],
    issues: combinedIssues,
    strengths: geminiResult?.strengths || [],
    reviewedAt: new Date().toISOString(),
    isPrivate: Boolean(isPrivate)
  };
}

/**
 * Analyzes repository files with Gemini (gemini-3.5-flash).
 */
async function analyzeRepoWithGemini(files, owner, repo) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'paste_key_here') {
    console.warn('[Gemini Warning] GEMINI_API_KEY is not configured for whole-repo review.');
    return null;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const candidateModels = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash'];
  let model = null;

  for (const modelName of candidateModels) {
    try {
      model = genAI.getGenerativeModel({ model: modelName });
      if (model) break;
    } catch (e) {
      // try next candidate
    }
  }

  if (!model) {
    model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  }

  const fileTree = (files || []).map(f => f.path).join('\n');
  const fileContentsFormatted = (files || []).map(f => `--- FILE: ${f.path} ---\n${f.content}\n`).join('\n');

  const prompt = `You are a Principal Software Engineer performing a whole-repository code review for ${owner}/${repo}.

FILE TREE:
${fileTree}

REPOSITORY CONTENTS:
${fileContentsFormatted}

INSTRUCTIONS:
1. Cross-file architecture & consistency (e.g. redundant logic, mismatched design patterns)
2. Logic/intent bugs requiring multi-file context
3. Performance bottlenecks across module boundaries
4. Security patterns (mark source as "ai-reasoned")
5. "Vibecoder" red flags: AI-generated code lacking error handling, hardcoded config values, abandoned dependencies, or inconsistent styles.
6. Plain-English summary ("what this file does") per major file.
7. SCORING INSTRUCTIONS FOR overallScore (0-100):
   - overallScore MUST be calculated strictly based on the severity and quantity of issues identified in this review.
   - Start at 100. Deduct at least 20 points per high-severity issue, 8 points per medium-severity issue, and 3 points per low-severity issue.
   - Heavily penalize security findings (e.g., eval(), SQL injection, XSS, hardcoded credentials/secrets).
   - A score above 70 must ONLY be returned if there are ZERO high-severity issues and at most 1-2 medium-severity issues.
   - Do NOT return a generic or default-feeling score (such as 80 or 85) disconnected from the actual issues list.

Respond ONLY in strict, valid JSON matching this schema:
{
  "overallScore": 82,
  "summary": "High-level summary of repository health",
  "fileExplanations": [
    { "path": "string", "explanation": "string" }
  ],
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "file": "string",
      "line": 1,
      "title": "string",
      "description": "string",
      "suggestion": "string",
      "source": "ai-reasoned"
    }
  ],
  "strengths": ["string"]
}`;

  return await callGeminiWithJSONGuard(model, prompt);
}

/**
 * Executes Gemini generation with JSON guard and single retry fallback.
 */
async function callGeminiWithJSONGuard(model, prompt, isRetry = false) {
  try {
    const finalPrompt = isRetry 
      ? `${prompt}\n\nCRITICAL: Output strictly raw valid JSON. Do not include markdown code blocks or additional text.` 
      : prompt;
    
    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    let text = response.text().trim();

    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    return JSON.parse(text);
  } catch (err) {
    if (!isRetry) {
      console.warn('[Gemini Repo] JSON parse failed, retrying once...');
      return await callGeminiWithJSONGuard(model, prompt, true);
    }
    console.error('[Gemini Repo] Second JSON parse attempt failed:', err.message);
    return null;
  }
}

module.exports = {
  reviewCode,
  reviewRepo,
  formatLanguageName
};
