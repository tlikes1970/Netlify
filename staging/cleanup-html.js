/**
 * HTML Cleanup Script
 * Purpose: Remove redundant script tags and clean up HTML
 * Data Source: index.html file
 * Update Path: Run this script to clean up HTML
 * Dependencies: Node.js fs module
 */

const fs = require("fs");
const path = require("path");

function cleanupHTML() {
  console.log("🧹 Starting HTML cleanup...\n");

  const htmlPath = path.join(__dirname, "www", "index.html");
  let htmlContent = fs.readFileSync(htmlPath, "utf8");

  // Remove all script tags except the main module
  const scriptRegex = /<script[^>]*src="[^"]*"[^>]*><\/script>/g;
  const scripts = htmlContent.match(scriptRegex) || [];

  console.log(`Found ${scripts.length} script tags to process`);

  // Keep only the main module script
  htmlContent = htmlContent.replace(scriptRegex, (match) => {
    if (match.includes('src="/main.js"')) {
      return match; // Keep the main module
    }
    return ""; // Remove all other scripts
  });

  // Remove Firebase scripts (they'll be loaded via CDN)
  htmlContent = htmlContent.replace(
    /<script src="https:\/\/www\.gstatic\.com\/firebasejs\/[^"]*"><\/script>\s*/g,
    ""
  );

  // Remove firebase-config.js script
  htmlContent = htmlContent.replace(
    /<script src="\/firebase-config\.js"><\/script>\s*/g,
    ""
  );

  // Clean up extra whitespace
  htmlContent = htmlContent.replace(/\n\s*\n\s*\n/g, "\n\n");

  // Write cleaned HTML
  fs.writeFileSync(htmlPath, htmlContent);

  console.log(`✅ Cleaned HTML file: ${htmlPath}`);
  console.log(`   Removed ${scripts.length - 1} script tags`);
  console.log(`   Kept main module script`);

  console.log("\n🎉 HTML cleanup completed successfully!");
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupHTML();
}

module.exports = { cleanupHTML };
