/**
 * Quick script to check if insights were written to Firestore
 * 
 * Usage:
 *   node scripts/check-insights.js [tmdbId]
 * 
 * If tmdbId is not provided, it will check a few sample titles
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin
try {
  admin.initializeApp({
    projectId: "flicklet-71dff",
  });
} catch (e) {
  // Already initialized
}

const db = admin.firestore();

async function checkInsights(tmdbId) {
  try {
    const docRef = db.collection("insights").doc(String(tmdbId));
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      console.log(`\n✅ Found insights for TMDB ID ${tmdbId}:`);
      console.log(`   - Source: ${data.source}`);
      console.log(`   - Last Updated: ${data.lastUpdated}`);
      console.log(`   - Items Count: ${data.items?.length || 0}`);
      console.log(`   - Updated At: ${data.updatedAt?.toDate() || "N/A"}`);
      
      if (data.items && data.items.length > 0) {
        console.log(`\n   Sample items:`);
        data.items.slice(0, 2).forEach((item, i) => {
          console.log(`   ${i + 1}. [${item.kind}] ${item.text.substring(0, 60)}...`);
        });
      }
      return true;
    } else {
      console.log(`\n❌ No insights found for TMDB ID ${tmdbId}`);
      return false;
    }
  } catch (error) {
    console.error(`\n❌ Error checking TMDB ID ${tmdbId}:`, error.message);
    return false;
  }
}

async function checkTitles(tmdbId) {
  try {
    const docRef = db.collection("titles").doc(String(tmdbId));
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      console.log(`\n📋 Title info for TMDB ID ${tmdbId}:`);
      console.log(`   - Title: ${data.title || "N/A"}`);
      console.log(`   - Media Type: ${data.mediaType || "N/A"}`);
      console.log(`   - Last Ingested: ${data.lastIngestedAt?.toDate() || "Never"}`);
      return true;
    } else {
      console.log(`\n❌ No title found for TMDB ID ${tmdbId}`);
      return false;
    }
  } catch (error) {
    console.error(`\n❌ Error checking title ${tmdbId}:`, error.message);
    return false;
  }
}

async function main() {
  const tmdbId = process.argv[2];

  if (tmdbId) {
    // Check specific title
    await checkTitles(tmdbId);
    await checkInsights(tmdbId);
  } else {
    // Check a few sample titles
    console.log("Checking sample titles from bulk ingestion...\n");
    
    const sampleIds = [550, 84226, 84661, 85271, 8592]; // From the logs
    
    for (const id of sampleIds) {
      await checkTitles(id);
      await checkInsights(id);
      console.log("\n" + "─".repeat(60));
    }
    
    // Also check count
    try {
      const insightsSnapshot = await db.collection("insights").limit(10).get();
      console.log(`\n📊 Found ${insightsSnapshot.size} insights documents (showing first 10)`);
    } catch (error) {
      console.error("Error counting insights:", error.message);
    }
  }
}

main().catch(console.error);



