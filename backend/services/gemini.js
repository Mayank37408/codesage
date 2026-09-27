'use strict';

/**
 * @file gemini.js
 * @description Google Gemini AI integration service using strict Structured Output JSON schema with in-memory LRU cache.
 */

const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Simple In-Memory LRU Cache
const CACHE_MAX_SIZE = 50;
const CACHE_TTL_MS = 600000; // 10 minutes (600000ms)
const cache = new Map();

function getCached(key) {
  if (!cache.has(key)) return null;

  const entry = cache.get(key);
  const now = Date.now();

  if (now - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  // Refresh LRU order (delete and re-insert)
  cache.delete(key);
  cache.set(key, entry);

  return entry.data;
}

function setCached(key, data) {
  if (!data) return;

  if (cache.has(key)) {
    cache.delete(key);
  } else if (cache.size >= CACHE_MAX_SIZE) {
    // When cache is full, delete the oldest entry (first key in Map)
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Reviews source code using Gemini's Structured Output feature.
 *
 * @param {string} code - The source code content to analyze.
 * @param {string} language - The programming language of the snippet.
 * @returns {Promise<{
 *   fatalErrors: Array<{
 *     line: number,
 *     title: string,
 *     description: string,
 *     code: string,
 *     correctedCode: string
 *   }>,
 *   issues: Array<{
 *     line: number,
 *     title: string,
 *     severity: 'high' | 'medium' | 'low',
 *     description: string,
 *     code: string,
 *     fix: string,
 *     correctedCode: string
 *   }>,
 *   strengths: string[],
 *   aiSummary: string,
 *   executionWillFail: boolean,
 *   fatalErrorSummary: string
 * }|null>} Parsed review findings from Gemini, or null if API fails or is unconfigured.
 */
async function analyzeWithGemini(code, language) {
  try {
    const hash = crypto.createHash('sha256')
      .update(code + language)
      .digest('hex');

    const cachedResult = getCached(hash);
    if (cachedResult) {
      console.log('[Gemini] Cache hit');
      return cachedResult;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey === 'paste_key_here') {
      console.warn('[Gemini Warning] GEMINI_API_KEY is not configured. Falling back to static pattern analysis.');
      return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const generationConfig = {
      temperature: 0.1,
      topP: 0.8,
      topK: 10,
      maxOutputTokens: 1200,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          fatalErrors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                line: { type: "number" },
                title: { type: "string" },
                description: { type: "string" },
                code: { type: "string" },
                correctedCode: { type: "string" }
              },
              required: ["line", "title", "description", "code", "correctedCode"]
            }
          },
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                line: { type: "number" },
                title: { type: "string" },
                severity: { type: "string", enum: ["high", "medium", "low"] },
                description: { type: "string" },
                code: { type: "string" },
                fix: { type: "string" },
                correctedCode: { type: "string" }
              },
              required: ["line", "title", "severity", "description", "code", "fix", "correctedCode"]
            }
          },
          strengths: {
            type: "array",
            items: { type: "string" }
          },
          aiSummary: { type: "string" },
          executionWillFail: { type: "boolean" },
          fatalErrorSummary: { type: "string" }
        },
        required: ["fatalErrors", "issues", "strengths", "aiSummary", "executionWillFail", "fatalErrorSummary"]
      }
    };

    const systemInstruction = "You are a senior software engineer and security expert performing a thorough code review. Your TOP PRIORITY before anything else is to check if this code will actually execute without crashing. Check for syntax errors, undefined functions, missing arguments, type mismatches, and runtime exceptions FIRST. Then identify security vulnerabilities, logic bugs, and style issues. Be extremely precise about line numbers. Always provide correctedCode with the actual fixed code snippet, not a description.";

    const prompt = `Analyze this ${language} code with maximum scrutiny.

PRIORITY 1 — FATAL EXECUTION ERRORS (check these first):
- Syntax errors (missing brackets, parentheses, semicolons)
- Calling functions that don't exist
- Wrong number of arguments passed to functions  
- Using variables before they are declared
- Type errors that will throw at runtime
- Import/require of non-existent modules

PRIORITY 2 — SECURITY ISSUES:
- SQL injection, XSS, eval usage, hardcoded secrets
- Authentication bypasses, insecure data handling

PRIORITY 3 — LOGIC BUGS:
- Infinite loops, off-by-one errors, null dereferences
- Race conditions, incorrect comparisons

PRIORITY 4 — STYLE & MAINTAINABILITY:
- var usage, magic numbers, poor naming, missing docs

For executionWillFail: set to TRUE if there are ANY fatal errors 
that will prevent the code from running.

For fatalErrorSummary: if executionWillFail is true, write a clear 
one sentence explanation of why the code will crash.

For correctedCode on every issue: write the ACTUAL fixed code for 
that specific line, not an explanation. 
Example: if line has 'console.log("hello"' write 'console.log("hello")'

Code to analyze:
\`\`\`${language}
${code}
\`\`\``;

    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.7-flash'
    ].filter(Boolean);

    let result = null;
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
          generationConfig
        });

        console.log(`[Gemini] Calling ${modelName}...`);
        result = await model.generateContent(prompt);
        if (result) break;
      } catch (callErr) {
        lastError = callErr;
        console.warn(`[Gemini] ${modelName} error:`, callErr.message);
      }
    }

    if (!result) {
      throw lastError || new Error('Gemini API call returned no result');
    }

    const response = await result.response;
    const responseText = response.text();

    const parsed = JSON.parse(responseText);
    console.log('[Gemini] Parsed structured response. executionWillFail:', parsed.executionWillFail, 'Fatal errors:', parsed.fatalErrors?.length, 'Issues:', parsed.issues?.length);

    setCached(hash, parsed);

    return parsed;
  } catch (error) {
    console.error('[Gemini] Error analyzing code:', error);
    return null;
  }
}

module.exports = {
  analyzeWithGemini
};
