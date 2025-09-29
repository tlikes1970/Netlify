const fs = require('fs');
const path = require('path');

/**
 * Simple repo string/regex scanner
 * @param {string[]} paths - Array of file paths or glob patterns
 * @param {string[]} patterns - Array of regex patterns to search for
 * @returns {Array} Array of hits with file, line, context
 */
function grep(paths, patterns) {
  const results = [];

  function scanFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      patterns.forEach((pattern) => {
        const regex = new RegExp(pattern, 'gi');
        lines.forEach((line, index) => {
          const matches = [...line.matchAll(regex)];
          matches.forEach((match) => {
            results.push({
              file: filePath,
              line: index + 1,
              context: line.trim(),
              match: match[0],
              pattern: pattern,
            });
          });
        });
      });
    } catch (error) {
      results.push({
        file: filePath,
        line: 0,
        context: `Error reading file: ${error.message}`,
        match: '',
        pattern: '',
        error: true,
      });
    }
  }

  function scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      items.forEach((item) => {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (
          stat.isFile() &&
          (item.endsWith('.js') ||
            item.endsWith('.html') ||
            item.endsWith('.css') ||
            item.endsWith('.json'))
        ) {
          scanFile(fullPath);
        }
      });
    } catch (error) {
      // Skip directories we can't read
    }
  }

  paths.forEach((pathItem) => {
    if (fs.existsSync(pathItem)) {
      const stat = fs.statSync(pathItem);
      if (stat.isDirectory()) {
        scanDirectory(pathItem);
      } else {
        scanFile(pathItem);
      }
    }
  });

  return results;
}

module.exports = { grep };
