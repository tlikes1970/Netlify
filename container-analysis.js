/**
 * Container Size Forensic Analysis Script
 * Measures and compares container sizes across the main page
 */

console.log('🔍 Starting Container Size Forensic Analysis...');

// Function to measure container dimensions
function measureContainer(selector, name) {
  const element = document.querySelector(selector);
  if (!element) {
    return { name, found: false, error: 'Element not found' };
  }
  
  const rect = element.getBoundingClientRect();
  const computedStyle = getComputedStyle(element);
  
  return {
    name,
    found: true,
    selector,
    dimensions: {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      maxWidth: computedStyle.maxWidth,
      padding: {
        top: parseInt(computedStyle.paddingTop) || 0,
        right: parseInt(computedStyle.paddingRight) || 0,
        bottom: parseInt(computedStyle.paddingBottom) || 0,
        left: parseInt(computedStyle.paddingLeft) || 0
      },
      margin: {
        top: parseInt(computedStyle.marginTop) || 0,
        right: parseInt(computedStyle.marginRight) || 0,
        bottom: parseInt(computedStyle.marginBottom) || 0,
        left: parseInt(computedStyle.marginLeft) || 0
      },
      border: {
        top: parseInt(computedStyle.borderTopWidth) || 0,
        right: parseInt(computedStyle.borderRightWidth) || 0,
        bottom: parseInt(computedStyle.borderBottomWidth) || 0,
        left: parseInt(computedStyle.borderLeftWidth) || 0
      }
    },
    css: {
      background: computedStyle.backgroundColor,
      borderRadius: computedStyle.borderRadius,
      boxShadow: computedStyle.boxShadow,
      display: computedStyle.display,
      position: computedStyle.position
    }
  };
}

// Measure all containers
const containers = [
  // Main container
  measureContainer('.main-container', 'Main Container'),
  
  // Home groups
  measureContainer('#group-1-your-shows', 'Your Shows Group'),
  measureContainer('#group-2-community', 'Community Group'),
  measureContainer('#group-4-theaters', 'Theaters Group'),
  
  // Individual sections within groups
  measureContainer('#currentlyWatchingPreview', 'Currently Watching Section'),
  measureContainer('#up-next-row', 'Up Next Section'),
  measureContainer('#curated-section', 'Curated Section'),
  measureContainer('#theaters-section', 'Theaters Section'),
  
  // Community sub-containers
  measureContainer('.community-content', 'Community Content'),
  measureContainer('.community-left', 'Community Left'),
  measureContainer('.community-right', 'Community Right')
];

// Display results
console.log('📊 Container Size Analysis Results:');
console.table(containers.map(c => ({
  Container: c.name,
  Found: c.found ? '✅' : '❌',
  Width: c.found ? `${c.dimensions.width}px` : 'N/A',
  Height: c.found ? `${c.dimensions.height}px` : 'N/A',
  MaxWidth: c.found ? c.dimensions.maxWidth : 'N/A',
  Padding: c.found ? `${c.dimensions.padding.left + c.dimensions.padding.right}px` : 'N/A',
  Background: c.found ? (c.css.background !== 'rgba(0, 0, 0, 0)' ? 'Yes' : 'None') : 'N/A'
})));

// Detailed analysis
console.log('\n🔍 Detailed Analysis:');

// Check for discrepancies
const mainContainer = containers.find(c => c.name === 'Main Container');
if (mainContainer && mainContainer.found) {
  console.log(`\n📏 Main Container Reference:`);
  console.log(`   Width: ${mainContainer.dimensions.width}px`);
  console.log(`   Max-Width: ${mainContainer.dimensions.maxWidth}`);
  console.log(`   Padding: ${mainContainer.dimensions.padding.left + mainContainer.dimensions.padding.right}px total`);
  
  // Compare with groups
  const groups = containers.filter(c => c.name.includes('Group') && c.found);
  groups.forEach(group => {
    const widthDiff = group.dimensions.width - mainContainer.dimensions.width;
    const paddingDiff = (group.dimensions.padding.left + group.dimensions.padding.right) - 
                       (mainContainer.dimensions.padding.left + mainContainer.dimensions.padding.right);
    
    console.log(`\n📊 ${group.name}:`);
    console.log(`   Width: ${group.dimensions.width}px (${widthDiff > 0 ? '+' : ''}${widthDiff}px vs main)`);
    console.log(`   Padding: ${group.dimensions.padding.left + group.dimensions.padding.right}px (${paddingDiff > 0 ? '+' : ''}${paddingDiff}px vs main)`);
    console.log(`   Background: ${group.css.background !== 'rgba(0, 0, 0, 0)' ? 'Present' : 'None'}`);
    console.log(`   Border: ${group.css.borderRadius !== '0px' ? 'Present' : 'None'}`);
    
    if (Math.abs(widthDiff) > 10) {
      console.log(`   ⚠️  WIDTH DISCREPANCY: ${widthDiff}px difference from main container`);
    }
    if (Math.abs(paddingDiff) > 5) {
      console.log(`   ⚠️  PADDING DISCREPANCY: ${paddingDiff}px difference from main container`);
    }
  });
}

// Check CSS inheritance issues
console.log('\n🎨 CSS Inheritance Analysis:');
const cssIssues = [];

containers.forEach(container => {
  if (!container.found) return;
  
  // Check for overrides that might cause size differences
  if (container.name === 'Your Shows Group') {
    if (container.css.background === 'rgba(0, 0, 0, 0)' || container.css.background === 'transparent') {
      cssIssues.push(`${container.name}: Background removed (should match main container)`);
    }
    if (container.css.borderRadius === '0px') {
      cssIssues.push(`${container.name}: Border radius removed (should match main container)`);
    }
  }
  
  if (container.name === 'Community Group') {
    if (container.dimensions.width !== mainContainer.dimensions.width) {
      cssIssues.push(`${container.name}: Width mismatch with main container`);
    }
  }
});

if (cssIssues.length > 0) {
  console.log('⚠️  CSS Issues Found:');
  cssIssues.forEach(issue => console.log(`   - ${issue}`));
} else {
  console.log('✅ No major CSS inheritance issues detected');
}

// Summary
console.log('\n📋 Summary:');
const mainWidth = mainContainer?.dimensions.width || 0;
const groupsWithIssues = containers.filter(c => 
  c.found && 
  c.name.includes('Group') && 
  Math.abs(c.dimensions.width - mainWidth) > 10
);

if (groupsWithIssues.length === 0) {
  console.log('✅ All container sizes are consistent with the main container');
} else {
  console.log(`❌ ${groupsWithIssues.length} groups have size discrepancies:`);
  groupsWithIssues.forEach(group => {
    const diff = group.dimensions.width - mainWidth;
    console.log(`   - ${group.name}: ${diff > 0 ? '+' : ''}${diff}px`);
  });
}

return {
  analysis: 'complete',
  containers: containers.filter(c => c.found),
  issues: cssIssues,
  summary: groupsWithIssues.length === 0 ? 'consistent' : 'discrepancies_found'
};




