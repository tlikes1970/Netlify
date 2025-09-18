/**
 * Production Build Script for TV Tracker
 * Minifies JS and CSS for production deployment
 */

const fs = require('fs');
const path = require('path');

// Simple minification functions
function minifyJS(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\s*([{}();,=])\s*/g, '$1') // Remove spaces around operators
    .trim();
}

function minifyCSS(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\s*([{}:;,>+~])\s*/g, '$1') // Remove spaces around selectors
    .replace(/;\s*}/g, '}') // Remove semicolons before closing braces
    .trim();
}

// Files to minify
const jsFiles = [
  'scripts/inline-script-01.js',
  'scripts/inline-script-02.js',
  'scripts/inline-script-03.js',
  'js/app.js',
  'js/auth.js',
  'js/bootstrap.js',
  'js/common-utils.js',
  'js/debug-utils.js',
  'js/dom-cache.js',
  'js/error-handler.js',
  'js/firebase-init.js',
  'js/flags.js',
  'js/functions.js',
  'js/home-sections-config.js',
  'js/i18n.js',
  'js/language-manager.js',
  'js/layout-enhancements.js',
  'js/syntax-fix.js',
  'js/utils.js',
  'js/visibility-manager.js'
];

const cssFiles = [
  'styles/inline-style-01.css',
  'styles/inline-style-02.css',
  'styles/components.css',
  'styles/mobile.css',
  'styles/main.css',
  'styles/consolidated-layout.css',
  'styles/action-bar.css',
  'styles/card-system.css'
];

// Create minified versions
function build() {
  console.log('🔨 Starting production build...');
  
  // Create build directory
  const buildDir = 'build';
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Minify JavaScript files
  console.log('📦 Minifying JavaScript files...');
  jsFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const minified = minifyJS(content);
      const outputPath = path.join(buildDir, file.replace('.js', '.min.js'));
      
      // Ensure directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, minified);
      console.log(`✅ ${file} → ${path.relative(__dirname, outputPath)}`);
    } else {
      console.log(`⚠️  ${file} not found, skipping...`);
    }
  });
  
  // Minify CSS files
  console.log('🎨 Minifying CSS files...');
  cssFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const minified = minifyCSS(content);
      const outputPath = path.join(buildDir, file.replace('.css', '.min.css'));
      
      // Ensure directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, minified);
      console.log(`✅ ${file} → ${path.relative(__dirname, outputPath)}`);
    } else {
      console.log(`⚠️  ${file} not found, skipping...`);
    }
  });
  
  // Copy other assets
  console.log('📋 Copying other assets...');
  const assetsToCopy = [
    'index.html',
    'manifest.json',
    'sw.js',
    'icons/',
    'img/'
  ];
  
  assetsToCopy.forEach(asset => {
    const srcPath = path.join(__dirname, asset);
    const destPath = path.join(buildDir, asset);
    
    if (fs.existsSync(srcPath)) {
      if (fs.statSync(srcPath).isDirectory()) {
        // Copy directory
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyDir(srcPath, destPath);
        console.log(`✅ ${asset}/ → ${path.relative(__dirname, destPath)}/`);
      } else {
        // Copy file
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ ${asset} → ${path.relative(__dirname, destPath)}`);
      }
    } else {
      console.log(`⚠️  ${asset} not found, skipping...`);
    }
  });
  
  console.log('🎉 Build complete!');
  console.log(`📁 Output directory: ${path.join(__dirname, buildDir)}`);
}

// Helper function to copy directories
function copyDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Run build
if (require.main === module) {
  build();
}

module.exports = { build, minifyJS, minifyCSS };
