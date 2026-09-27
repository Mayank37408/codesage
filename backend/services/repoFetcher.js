'use strict';

/**
 * @file repoFetcher.js
 * @description Fetches and filters source files from a public GitHub repository.
 */

const https = require('https');

/**
 * Helper to make HTTPS GET requests.
 * @param {string} url
 * @param {object} headers
 * @returns {Promise<string>}
 */
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = new URL(url);
    const req = https.get({
      hostname: options.hostname,
      path: options.pathname + options.search,
      headers: {
        'User-Agent': 'CodeSage-Reviewer',
        'Accept': 'application/vnd.github.v3+json',
        ...headers
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location, headers).then(resolve).catch(reject);
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
  });
}

/**
 * Parses GitHub repository URL into owner and repo.
 * @param {string} urlStr
 * @returns {{ owner: string, repo: string }}
 */
function parseRepoUrl(urlStr) {
  const cleanStr = (urlStr || '').trim().replace(/\/+$/, '').replace(/\.git$/, '');
  const match = cleanStr.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  const parts = cleanStr.split('/');
  if (parts.length === 2) {
    return { owner: parts[0], repo: parts[1] };
  }
  throw new Error('Invalid GitHub repository URL format. Example: https://github.com/owner/repo');
}

/**
 * Fetches and filters files from a public GitHub repo.
 * Caps at max 15 files and ~60,000 total characters.
 *
 * @param {string} repoUrl
 * @returns {Promise<{ owner: string, repo: string, branch: string, files: Array<{ path: string, content: string }> }>}
 */
async function fetchRepoForReview(repoUrl) {
  const { owner, repo } = parseRepoUrl(repoUrl);
  
  // Get default branch metadata
  const repoMetaJson = await httpsGet(`https://api.github.com/repos/${owner}/${repo}`);
  const repoMeta = JSON.parse(repoMetaJson);
  const branch = repoMeta.default_branch || 'main';

  // Fetch full git tree
  const treeJson = await httpsGet(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  const treeData = JSON.parse(treeJson);
  
  if (!treeData.tree || !Array.isArray(treeData.tree)) {
    throw new Error('Failed to retrieve file tree from repository');
  }

  // Supported source extensions
  const allowedExtensions = new Set([
    'js', 'jsx', 'ts', 'tsx', 'py', 'go', 'rs', 'java', 'cpp', 'c', 'h', 'hpp',
    'cs', 'php', 'rb', 'kt', 'sh', 'sql', 'json', 'html', 'css'
  ]);

  const ignoredDirs = ['node_modules', 'dist', 'build', '.git', 'vendor', 'coverage', '.next'];

  const candidateFiles = treeData.tree.filter(item => {
    if (item.type !== 'blob') return false;
    if (ignoredDirs.some(dir => item.path.includes(`${dir}/`))) return false;
    
    const parts = item.path.split('.');
    const ext = parts.pop()?.toLowerCase();
    return ext && allowedExtensions.has(ext) && item.size < 100000;
  });

  // Prioritize package.json and core source code files
  candidateFiles.sort((a, b) => {
    if (a.path.endsWith('package.json')) return -1;
    if (b.path.endsWith('package.json')) return 1;
    return a.path.localeCompare(b.path);
  });

  const MAX_FILES = 15;
  const MAX_TOTAL_CHARS = 60000;

  const selectedFiles = candidateFiles.slice(0, MAX_FILES);
  const fetchedFiles = [];
  let currentTotalChars = 0;

  for (const fileItem of selectedFiles) {
    if (currentTotalChars >= MAX_TOTAL_CHARS) break;

    try {
      const rawContent = await httpsGet(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fileItem.path}`);
      
      const remainingBudget = MAX_TOTAL_CHARS - currentTotalChars;
      const truncatedContent = rawContent.slice(0, remainingBudget);
      
      currentTotalChars += truncatedContent.length;
      fetchedFiles.push({
        path: fileItem.path,
        content: truncatedContent
      });
    } catch (err) {
      console.warn(`[RepoFetcher] Skipping ${fileItem.path}:`, err.message);
    }
  }

  return {
    owner,
    repo,
    branch,
    files: fetchedFiles
  };
}

module.exports = {
  fetchRepoForReview
};
