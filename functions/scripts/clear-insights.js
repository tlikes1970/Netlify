/**
 * Script to clear insights from Firestore
 *
 * Usage:
 *   node scripts/clear-insights.js [options]
 *
 * Options:
 *   --all          Delete all insights
 *   --tmdbId=ID    Delete insights for specific TMDB ID
 *   --dry-run      Show what would be deleted without actually deleting
 *
 * Examples:
 *   node scripts/clear-insights.js --all
 *   node scripts/clear-insights.js --tmdbId=1010756
 *   node scripts/clear-insights.js --all --dry-run
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin
try {
  admin.initializeApp({
    projectId: "flicklet-71dff",
  });
} catch {
  // Already initialized
}

const database = admin.firestore();

async function clearAllInsights(dryRun = false) {
  try {
    console.log("\n🔍 Fetching all insights from Firestore...");
    const snapshot = await database.collection("insights").get();

    if (snapshot.empty) {
      console.log("✅ No insights found in Firestore.");
      return;
    }

    console.log(`\n📊 Found ${snapshot.size} insight documents`);

    if (dryRun) {
      console.log("\n🔍 DRY RUN - Would delete the following:");
      for (const [index, document_] of snapshot.docs.entries()) {
        const data = document_.data();
        console.log(
          `   ${index + 1}. TMDB ID: ${document_.id} (${data.items?.length || 0} items) - ${data.title || "No title"}`
        );
      }
      console.log("\n⚠️  Run without --dry-run to actually delete.");
      return;
    }

    console.log("\n🗑️  Deleting insights...");
    const batch = database.batch();
    let count = 0;

    for (const document_ of snapshot.docs) {
      batch.delete(document_.ref);
      count++;
    }

    await batch.commit();
    console.log(
      `\n✅ Successfully deleted ${count} insight documents from Firestore.`
    );
    console.log(
      "💡 Re-run bulk ingestion to regenerate insights with new templates."
    );
  } catch (error) {
    console.error("\n❌ Error clearing insights:", error.message);
    process.exit(1);
  }
}

async function clearSpecificInsight(tmdbId, dryRun = false) {
  try {
    const tmdbIdString = String(tmdbId);
    const documentReference = database.collection("insights").doc(tmdbIdString);
    const document_ = await documentReference.get();

    if (!document_.exists) {
      console.log(`\n❌ No insights found for TMDB ID ${tmdbId}`);
      return;
    }

    const data = document_.data();
    console.log(`\n📊 Found insights for TMDB ID ${tmdbId}:`);
    console.log(`   - Items: ${data.items?.length || 0}`);
    console.log(`   - Last Updated: ${data.lastUpdated || "N/A"}`);

    if (dryRun) {
      console.log("\n🔍 DRY RUN - Would delete this document.");
      console.log("⚠️  Run without --dry-run to actually delete.");
      return;
    }

    await documentReference.delete();
    console.log(`\n✅ Successfully deleted insights for TMDB ID ${tmdbId}`);
    console.log("💡 Re-run ingestion for this title to regenerate insights.");
  } catch (error) {
    console.error(
      `\n❌ Error deleting insights for TMDB ID ${tmdbId}:`,
      error.message
    );
    process.exit(1);
  }
}

// Parse command line arguments
const arguments_ = process.argv.slice(2);
const dryRun = arguments_.includes("--dry-run");
const allFlag = arguments_.includes("--all");
const tmdbIdArgument = arguments_.find((argument) =>
  argument.startsWith("--tmdbId=")
);

if (allFlag) {
  clearAllInsights(dryRun).then(() => process.exit(0));
} else if (tmdbIdArgument) {
  const tmdbId = tmdbIdArgument.split("=")[1];
  clearSpecificInsight(tmdbId, dryRun).then(() => process.exit(0));
} else {
  console.log(`
Usage: node scripts/clear-insights.js [options]

Options:
  --all              Delete all insights
  --tmdbId=ID        Delete insights for specific TMDB ID
  --dry-run          Show what would be deleted without actually deleting

Examples:
  node scripts/clear-insights.js --all
  node scripts/clear-insights.js --tmdbId=1010756
  node scripts/clear-insights.js --all --dry-run
  `);
  process.exit(1);
}


