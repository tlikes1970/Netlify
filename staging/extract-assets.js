/**
 * Asset Extraction Script
 * Purpose: Extract inline CSS and JS from HTML into separate files
 * Data Source: index.html file
 * Update Path: Run this script to extract assets
 * Dependencies: Node.js fs module
 */

const fs = require("fs");
const path = require("path");

function extractAssets() {
  console.log("📦 Starting asset extraction...\n");

  const htmlPath = path.join(__dirname, "www", "index.html");
  const htmlContent = fs.readFileSync(htmlPath, "utf8");

  // Extract CSS
  const cssMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
  if (cssMatch) {
    const cssContent = cssMatch[1];
    const cssPath = path.join(__dirname, "www", "styles", "critical.css");

    // Ensure styles directory exists
    const stylesDir = path.dirname(cssPath);
    if (!fs.existsSync(stylesDir)) {
      fs.mkdirSync(stylesDir, { recursive: true });
    }

    fs.writeFileSync(cssPath, cssContent);
    console.log(`✅ Extracted CSS to: ${cssPath}`);
    console.log(`   Size: ${(cssContent.length / 1024).toFixed(2)} KB`);
  }

  // Extract JavaScript
  const jsMatches = htmlContent.match(/<script>([\s\S]*?)<\/script>/g);
  if (jsMatches) {
    let scriptIndex = 1;
    jsMatches.forEach((match) => {
      const jsContent = match.replace(/<\/?script>/g, "");
      if (jsContent.trim()) {
        const jsPath = path.join(
          __dirname,
          "www",
          "js",
          `inline-script-${scriptIndex}.js`
        );

        // Ensure js directory exists
        const jsDir = path.dirname(jsPath);
        if (!fs.existsSync(jsDir)) {
          fs.mkdirSync(jsDir, { recursive: true });
        }

        fs.writeFileSync(jsPath, jsContent);
        console.log(`✅ Extracted JS to: ${jsPath}`);
        console.log(`   Size: ${(jsContent.length / 1024).toFixed(2)} KB`);
        scriptIndex++;
      }
    });
  }

  // Create updated HTML without inline assets
  let updatedHtml = htmlContent;

  // Replace CSS with external link
  updatedHtml = updatedHtml.replace(
    /<style>[\s\S]*?<\/style>/,
    '<link rel="stylesheet" href="/styles/critical.css">'
  );

  // Replace JavaScript with external links
  let scriptIndex = 1;
  updatedHtml = updatedHtml.replace(/<script>[\s\S]*?<\/script>/g, (match) => {
    const jsContent = match.replace(/<\/?script>/g, "");
    if (jsContent.trim()) {
      const scriptTag = `<script src="/js/inline-script-${scriptIndex}.js"></script>`;
      scriptIndex++;
      return scriptTag;
    }
    return match;
  });

  // Write updated HTML
  fs.writeFileSync(htmlPath, updatedHtml);
  console.log(`✅ Updated HTML file: ${htmlPath}`);

  // Calculate size reduction
  const originalSize = htmlContent.length;
  const newSize = updatedHtml.length;
  const reduction = (((originalSize - newSize) / originalSize) * 100).toFixed(
    2
  );

  console.log(`\n📊 Extraction Summary:`);
  console.log(`   Original HTML size: ${(originalSize / 1024).toFixed(2)} KB`);
  console.log(`   New HTML size: ${(newSize / 1024).toFixed(2)} KB`);
  console.log(`   Size reduction: ${reduction}%`);
  console.log(`   Assets extracted: ${scriptIndex - 1} JS files + 1 CSS file`);

  console.log("\n🎉 Asset extraction completed successfully!");
}

// Run extraction if this script is executed directly
if (require.main === module) {
  extractAssets();
}

module.exports = { extractAssets };
