'use strict';

/**
 * @file vulnScanner.js
 * @description Checks dependencies across multiple ecosystems against OSV.dev API.
 */

const https = require('https');

/**
 * Helper to make HTTPS POST requests.
 * @param {string} url
 * @param {object} payload
 * @returns {Promise<string>}
 */
function httpsPost(url, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const options = new URL(url);
    const req = https.request({
      hostname: options.hostname,
      path: options.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'CodeSage-Reviewer'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Scans dependency manifests (package.json, requirements.txt, go.mod, Cargo.toml, Gemfile, composer.json, pom.xml)
 * for known vulnerabilities using OSV.dev.
 *
 * @param {Array<{ path: string, content: string }>} files
 * @returns {Promise<Array<object>>} List of CVE issues.
 */
async function scanFilesForVulnerabilities(files) {
  const issues = [];
  const queries = [];
  const pkgList = [];

  (files || []).forEach((file) => {
    const filePath = file.path || '';
    const content = file.content || '';
    const fileName = filePath.split('/').pop()?.toLowerCase();

    // 1. package.json (npm)
    if (fileName === 'package.json') {
      try {
        const pkg = JSON.parse(content);
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        for (const [name, rawVersion] of Object.entries(deps)) {
          const version = (rawVersion || '').replace(/[^0-9.]/g, '');
          if (version) {
            queries.push({ package: { name, ecosystem: 'npm' }, version });
            pkgList.push({ file: filePath, name, version, ecosystem: 'npm' });
          }
        }
      } catch (e) {}
    }

    // 2. requirements.txt (PyPI)
    if (fileName === 'requirements.txt' || fileName.endsWith('.req')) {
      const lines = content.split('\n');
      lines.forEach(line => {
        const match = line.trim().match(/^([a-zA-Z0-9_\-\.]+)\s*(?:==|>=|~=)\s*([0-9\.]+)/);
        if (match) {
          const name = match[1];
          const version = match[2];
          queries.push({ package: { name, ecosystem: 'PyPI' }, version });
          pkgList.push({ file: filePath, name, version, ecosystem: 'PyPI' });
        }
      });
    }

    // 3. go.mod (Go)
    if (fileName === 'go.mod') {
      const lines = content.split('\n');
      lines.forEach(line => {
        const match = line.trim().match(/^(?:require\s+)?([a-zA-Z0-9_\-\.\/]+)\s+v([0-9\.]+)/);
        if (match && !match[1].startsWith('//')) {
          const name = match[1];
          const version = match[2];
          queries.push({ package: { name, ecosystem: 'Go' }, version });
          pkgList.push({ file: filePath, name, version, ecosystem: 'Go' });
        }
      });
    }

    // 4. Cargo.toml (crates.io)
    if (fileName === 'Cargo.toml') {
      const lines = content.split('\n');
      let inDeps = false;
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('[')) {
          inDeps = trimmed.includes('dependencies');
        } else if (inDeps) {
          const matchSimple = trimmed.match(/^([a-zA-Z0-9_\-]+)\s*=\s*['"]([0-9\.]+)['"]/);
          const matchObj = trimmed.match(/^([a-zA-Z0-9_\-]+)\s*=\s*\{.*version\s*=\s*['"]([0-9\.]+)['"]/);
          const match = matchSimple || matchObj;
          if (match) {
            const name = match[1];
            const version = match[2];
            queries.push({ package: { name, ecosystem: 'crates.io' }, version });
            pkgList.push({ file: filePath, name, version, ecosystem: 'crates.io' });
          }
        }
      });
    }

    // 5. Gemfile (RubyGems)
    if (fileName === 'gemfile') {
      const lines = content.split('\n');
      lines.forEach(line => {
        const match = line.trim().match(/gem\s+['"]([a-zA-Z0-9_\-]+)['"]\s*,\s*['"](?:~>|>=|=)?\s*([0-9\.]+)['"]/);
        if (match) {
          const name = match[1];
          const version = match[2];
          queries.push({ package: { name, ecosystem: 'RubyGems' }, version });
          pkgList.push({ file: filePath, name, version, ecosystem: 'RubyGems' });
        }
      });
    }

    // 6. composer.json (Packagist)
    if (fileName === 'composer.json') {
      try {
        const pkg = JSON.parse(content);
        const deps = { ...(pkg.require || {}), ...(pkg['require-dev'] || {}) };
        for (const [name, rawVersion] of Object.entries(deps)) {
          if (name.toLowerCase() === 'php' || name.startsWith('ext-')) continue;
          const version = (rawVersion || '').replace(/[^0-9.]/g, '');
          if (version) {
            queries.push({ package: { name, ecosystem: 'Packagist' }, version });
            pkgList.push({ file: filePath, name, version, ecosystem: 'Packagist' });
          }
        }
      } catch (e) {}
    }

    // 7. pom.xml (Maven)
    if (fileName === 'pom.xml') {
      const depBlocks = content.match(/<dependency>[\s\S]*?<\/dependency>/gi) || [];
      depBlocks.forEach(block => {
        const groupMatch = block.match(/<groupId>([^<]+)<\/groupId>/i);
        const artifactMatch = block.match(/<artifactId>([^<]+)<\/artifactId>/i);
        const versionMatch = block.match(/<version>([^<]+)<\/version>/i);

        if (groupMatch && artifactMatch && versionMatch) {
          const name = `${groupMatch[1].trim()}:${artifactMatch[1].trim()}`;
          const version = versionMatch[1].trim().replace(/[^0-9.]/g, '');
          if (version) {
            queries.push({ package: { name, ecosystem: 'Maven' }, version });
            pkgList.push({ file: filePath, name, version, ecosystem: 'Maven' });
          }
        }
      });
    }
  });

  if (queries.length === 0) return issues;

  try {
    const responseJson = await httpsPost('https://api.osv.dev/v1/querybatch', { queries });
    const response = JSON.parse(responseJson);

    if (response.results && Array.isArray(response.results)) {
      response.results.forEach((res, index) => {
        if (res.vulns && res.vulns.length > 0) {
          const pkg = pkgList[index];
          const vuln = res.vulns[0];
          const cveId = vuln.aliases ? vuln.aliases.find(a => a.startsWith('CVE-')) || vuln.id : vuln.id;

          issues.push({
            severity: 'high',
            file: pkg.file,
            line: 1,
            title: `Vulnerable Dependency: ${pkg.name}@${pkg.version}`,
            description: `Package '${pkg.name}' version '${pkg.version}' (${pkg.ecosystem}) has a known vulnerability: ${cveId} (${vuln.summary || 'Security advisory'}).`,
            suggestion: `Upgrade ${pkg.name} to a secure version.`,
            source: 'verified-cve'
          });
        }
      });
    }
  } catch (err) {
    console.warn('[VulnScanner Error]:', err.message);
  }

  return issues;
}

module.exports = {
  scanFilesForVulnerabilities
};
