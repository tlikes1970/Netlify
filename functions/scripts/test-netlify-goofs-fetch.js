/**
 * Test script to verify Netlify goofs-fetch function is accessible
 * 
 * Usage:
 *   node scripts/test-netlify-goofs-fetch.js [admin-token]
 * 
 * If admin-token is not provided, it will try to read from environment variable
 * GOOFS_INGESTION_ADMIN_TOKEN or prompt for it.
 */

const https = require('https');
const http = require('http');

// Configuration
const NETLIFY_FUNCTION_URL = process.env.NETLIFY_FUNCTION_URL || 
  "https://flicklet.netlify.app/.netlify/functions/goofs-fetch";

// Get admin token from command line args or environment
const adminToken = process.argv[2] || process.env.GOOFS_INGESTION_ADMIN_TOKEN;

if (!adminToken) {
  console.error("❌ Error: Admin token required");
  console.error("Usage: node scripts/test-netlify-goofs-fetch.js <admin-token>");
  console.error("Or set GOOFS_INGESTION_ADMIN_TOKEN environment variable");
  process.exit(1);
}

// Test data
const testPayload = {
  tmdbId: 550, // Fight Club (well-known movie for testing)
  metadata: {
    tmdbId: 550,
    id: 550,
    title: "Fight Club",
    mediaType: "movie",
    genres: ["Drama", "Thriller"],
    year: 1999,
  }
};

console.log("🧪 Testing Netlify goofs-fetch function...");
console.log(`📍 URL: ${NETLIFY_FUNCTION_URL}`);
console.log(`🔑 Using admin token: ${adminToken.substring(0, 8)}...`);
console.log(`📦 Test payload:`, JSON.stringify(testPayload, null, 2));
console.log("");

// Parse URL
const url = new URL(NETLIFY_FUNCTION_URL);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-token': adminToken,
  },
};

const startTime = Date.now();

const req = client.request(options, (res) => {
  const statusCode = res.statusCode;
  const contentType = res.headers['content-type'] || '';
  const isJson = contentType.includes('application/json');
  const isHtml = contentType.includes('text/html') || 
                 contentType.includes('text/plain');

  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    const duration = Date.now() - startTime;
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📊 Response Status: ${statusCode}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📄 Content-Type: ${contentType}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    // Check if response is HTML (error page)
    if (responseData.trim().startsWith('<!DOCTYPE') || 
        responseData.trim().startsWith('<html')) {
      console.error("❌ ERROR: Function returned HTML error page instead of JSON");
      console.error("");
      console.error("This usually means:");
      console.error("  1. Function is not deployed to Netlify");
      console.error("  2. Function URL is incorrect");
      console.error("  3. Function crashed and Netlify returned error page");
      console.error("");
      console.error("Response preview (first 500 chars):");
      console.error(responseData.substring(0, 500));
      process.exit(1);
    }

    // Parse JSON response
    if (isJson) {
      try {
        const json = JSON.parse(responseData);
        if (statusCode === 200) {
          console.log("✅ SUCCESS: Function is accessible and working!");
          console.log("");
          console.log("Response:");
          console.log(JSON.stringify(json, null, 2));
        } else if (statusCode === 401) {
          console.error("❌ ERROR: Unauthorized (401)");
          console.error("The admin token is incorrect or missing in Netlify environment variables.");
          console.error("");
          console.error("Response:", json);
          process.exit(1);
        } else {
          console.error(`❌ ERROR: Function returned status ${statusCode}`);
          console.error("");
          console.error("Response:", json);
          process.exit(1);
        }
      } catch (e) {
        console.error("❌ ERROR: Failed to parse JSON response");
        console.error("Response:", responseData);
        process.exit(1);
      }
    } else {
      console.error("❌ ERROR: Unexpected response format");
      console.error("Expected JSON, got:", contentType);
      console.error("");
      console.error("Response preview:");
      console.error(responseData.substring(0, 500));
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error("❌ ERROR: Request failed");
  console.error("Error:", error.message);
  console.error("");
  console.error("This could mean:");
  console.error("  1. Network connectivity issue");
  console.error("  2. DNS resolution failed");
  console.error("  3. SSL certificate issue");
  process.exit(1);
});

// Send request
req.write(JSON.stringify(testPayload));
req.end();



