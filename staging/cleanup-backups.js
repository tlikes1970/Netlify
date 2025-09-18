/**
 * Backup Cleanup Script
 * Purpose: Remove backup directories and unnecessary files
 * Data Source: File system analysis
 * Update Path: Run this script to clean up
 * Dependencies: Node.js fs module
 */

const fs = require("fs");
const path = require("path");

// Files and directories to remove
const cleanupTargets = [
  // Backup documentation files
  "ACTION_BAR_IMPLEMENTATION_v22.21.md",
  "ARCHITECTURE_SINGLE_SOURCE_OF_TRUTH.md",
  "B2-JS-SUMMARY.md",
  "B3-CSS-SUMMARY.md",
  "B3-VERIFY-SUMMARY.md",
  "BACKUP_SUMMARY.md",
  "COMPREHENSIVE_FIXES_v15.2.md",
  "COMPREHENSIVE_FIXES_v17.9.md",
  "COMPREHENSIVE_FIXES_v20.0.md",
  "COMPREHENSIVE_FIXES_v20.4.md",
  "COMPREHENSIVE_FIXES_v22.20.md",
  "COMPREHENSIVE_FIXES_v22.6.md",
  "COMPREHENSIVE_FIXES_v22.7.md",
  "COMPREHENSIVE_FIXES_v23.0.md",
  "COMPREHENSIVE_FIXES_v23.1.md",
  "COMPREHENSIVE_FIXES_v23.7.md",
  "EMERGENCY_FIX_v23.2.md",
  "KISS_RESPONSIVE_SYSTEM.md",
  "LANGUAGE_SWITCHING_CONFIRMATION.md",
  "MOBILE_LAYOUT_FIXES_v14.7.md",
  "PERFORMANCE-INVESTIGATION-SUMMARY.md",
  "POSTER_STANDARDIZATION_v22.5.md",
  "RESPONSIVE_LAYOUT_SUMMARY.md",
  "ROUTE_FIX_SUMMARY_v23.85.md",
  "SYNTAX_FIX_v23.3.md",
  "TAB_SYSTEM_DOCUMENTATION.md",
  "TRANSLATION_SYSTEM_DOCUMENTATION.md",

  // Debug and test files
  "analyze-syntax.js",
  "audit-results.html",
  "auth-diagnostics.js",
  "build.js",
  "cleanup-invalid-data.html",
  "debug-posters.html",
  "debug-verification.js",
  "dir-tree.txt",
  "phase-b-verification.html",
  "test-add-functionality.html",
  "test-fixes.js",
  "test-overflow-menu.html",
  "verify-card-v2.html",
  "verify-fixes.js",

  // Duplicate configuration files
  "critical.css",
  "firebase-config.js",
  "split-manifest.json",
  "tmdb-config.js",

  // Reports directory (keep only essential reports)
  "reports",

  // Scripts directory (keep only essential scripts)
  "scripts",

  // Tools directory
  "tools",

  // Split exact directory (duplicate)
  "split_exact",

  // Node modules (will be reinstalled)
  "node_modules",
];

function removeFileOrDir(targetPath) {
  try {
    const fullPath = path.resolve(targetPath);

    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`✅ Removed directory: ${targetPath}`);
      } else {
        fs.unlinkSync(fullPath);
        console.log(`✅ Removed file: ${targetPath}`);
      }
      return true;
    } else {
      console.log(`⚠️  Not found: ${targetPath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error removing ${targetPath}:`, error.message);
    return false;
  }
}

function cleanup() {
  console.log("🧹 Starting backup cleanup...\n");

  let removedCount = 0;
  let totalCount = cleanupTargets.length;

  cleanupTargets.forEach((target) => {
    if (removeFileOrDir(target)) {
      removedCount++;
    }
  });

  console.log(`\n📊 Cleanup Summary:`);
  console.log(`   Removed: ${removedCount}/${totalCount} targets`);
  console.log(
    `   Success Rate: ${Math.round((removedCount / totalCount) * 100)}%`
  );

  if (removedCount === totalCount) {
    console.log("\n🎉 All cleanup targets removed successfully!");
  } else {
    console.log("\n⚠️  Some files could not be removed. Check permissions.");
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanup();
}

module.exports = { cleanup, removeFileOrDir };
