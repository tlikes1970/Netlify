#!/usr/bin/env node

/**
 * Process: Bundle Budget Check
 * Purpose: Monitor bundle size growth and fail builds if they exceed budget
 * Data Source: Bundle analysis from rollup-plugin-visualizer
 * Update Path: Update baseline.json when acceptable size increases occur
 * Dependencies: dist/bundle-analysis.html, reports/bundle-baseline.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASELINE_FILE = path.join(__dirname, '../reports/bundle-baseline.json');
const ANALYSIS_FILE = path.join(__dirname, '../dist/bundle-analysis.html');
const REPORTS_DIR = path.join(__dirname, '../reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Parse bundle analysis by reading actual file sizes
function parseBundleAnalysis() {
  if (!fs.existsSync(ANALYSIS_FILE)) {
    console.error('❌ Bundle analysis file not found. Run "npm run build" first.');
    process.exit(1);
  }

  const assetsDir = path.join(__dirname, '../dist/assets');
  if (!fs.existsSync(assetsDir)) {
    console.error('❌ Assets directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  try {
    const files = fs.readdirSync(assetsDir);
    const chunks = [];
    
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(assetsDir, file);
        const stats = fs.statSync(filePath);
        chunks.push({
          name: file,
          size: stats.size,
          gzipSize: 0 // We'll estimate gzip size as ~30% of original
        });
      }
    });

    // Find the main app chunk (usually index-*.js)
    const mainChunk = chunks.find(chunk => 
      chunk.name.includes('index-') && chunk.name.endsWith('.js')
    ) || chunks[0];

    if (!mainChunk) {
      console.error('❌ Could not find main chunk in analysis');
      process.exit(1);
    }

    // Estimate gzip sizes (roughly 30% of original)
    chunks.forEach(chunk => {
      chunk.gzipSize = Math.round(chunk.size * 0.3);
    });

    return {
      mainChunkSize: mainChunk.size || 0,
      mainChunkGzipSize: mainChunk.gzipSize || 0,
      totalSize: chunks.reduce((sum, chunk) => sum + (chunk.size || 0), 0),
      totalGzipSize: chunks.reduce((sum, chunk) => sum + (chunk.gzipSize || 0), 0),
      chunkCount: chunks.length,
      chunks: chunks
    };
  } catch (error) {
    console.error('❌ Error reading bundle files:', error.message);
    process.exit(1);
  }
}

// Load or create baseline
function loadBaseline() {
  if (fs.existsSync(BASELINE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Could not parse baseline file, creating new one');
    }
  }

  // Create new baseline
  const currentSizes = parseBundleAnalysis();
  const baseline = {
    ...currentSizes,
    timestamp: new Date().toISOString(),
    version: 'D3-polish-baseline'
  };

  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2));
  console.log('✅ Created new bundle baseline');
  console.log(`📊 Main chunk: ${(baseline.mainChunkSize / 1024).toFixed(1)}KB (${(baseline.mainChunkGzipSize / 1024).toFixed(1)}KB gzipped)`);
  
  return baseline;
}

// Check budget
function checkBudget(current, baseline) {
  const MAX_GROWTH_PERCENT = 7; // 7% max growth
  
  const mainChunkGrowth = ((current.mainChunkSize - baseline.mainChunkSize) / baseline.mainChunkSize) * 100;
  const totalGrowth = ((current.totalSize - baseline.totalSize) / baseline.totalSize) * 100;

  console.log('\n📊 Bundle Size Analysis:');
  console.log(`Main chunk: ${(current.mainChunkSize / 1024).toFixed(1)}KB (${(current.mainChunkGzipSize / 1024).toFixed(1)}KB gzipped)`);
  console.log(`Total size: ${(current.totalSize / 1024).toFixed(1)}KB (${(current.totalGzipSize / 1024).toFixed(1)}KB gzipped)`);
  console.log(`Chunks: ${current.chunkCount}`);
  
  console.log('\n📈 Growth Analysis:');
  console.log(`Main chunk growth: ${mainChunkGrowth.toFixed(1)}%`);
  console.log(`Total growth: ${totalGrowth.toFixed(1)}%`);

  if (mainChunkGrowth > MAX_GROWTH_PERCENT) {
    console.error(`\n❌ Bundle budget exceeded!`);
    console.error(`Main chunk grew by ${mainChunkGrowth.toFixed(1)}% (max: ${MAX_GROWTH_PERCENT}%)`);
    console.error(`Consider code splitting or removing unused dependencies.`);
    process.exit(1);
  }

  if (totalGrowth > MAX_GROWTH_PERCENT) {
    console.error(`\n❌ Bundle budget exceeded!`);
    console.error(`Total bundle grew by ${totalGrowth.toFixed(1)}% (max: ${MAX_GROWTH_PERCENT}%)`);
    console.error(`Consider code splitting or removing unused dependencies.`);
    process.exit(1);
  }

  console.log(`\n✅ Bundle size within budget (max growth: ${MAX_GROWTH_PERCENT}%)`);
}

// Main execution
function main() {
  console.log('🔍 Analyzing bundle size...');
  
  const currentSizes = parseBundleAnalysis();
  const baseline = loadBaseline();
  
  checkBudget(currentSizes, baseline);
  
  // Copy analysis to reports directory for easy access
  const reportsAnalysisFile = path.join(REPORTS_DIR, 'bundle.html');
  fs.copyFileSync(ANALYSIS_FILE, reportsAnalysisFile);
  console.log(`\n📄 Bundle analysis saved to: ${reportsAnalysisFile}`);
}

main();
