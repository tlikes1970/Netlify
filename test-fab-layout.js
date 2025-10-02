// Quick test script to verify FAB layout
console.log('🔍 Testing FAB Layout...');

// Check if FAB dock exists and has correct flex properties
const fabDock = document.querySelector('.fab-dock');
if (fabDock) {
  const computedStyle = getComputedStyle(fabDock);
  console.log('✅ FAB Dock found');
  console.log('  - Display:', computedStyle.display);
  console.log('  - Flex Direction:', computedStyle.flexDirection);
  console.log('  - Flex Wrap:', computedStyle.flexWrap);
  console.log('  - Gap:', computedStyle.gap);
  console.log('  - Position:', computedStyle.position);
} else {
  console.log('❌ FAB Dock not found');
}

// Check FAB children
const fabLeft = document.querySelector('.fab-left');
const fabStack = document.querySelector('.fab-stack');
const themeFab = document.querySelector('#themeToggleFab');
const mardiFab = document.querySelector('#mardiGrasFab');

console.log('\n🔍 FAB Children:');
console.log('  - Settings FAB (.fab-left):', fabLeft ? '✅ Found' : '❌ Missing');
console.log('  - FAB Stack (.fab-stack):', fabStack ? '✅ Found' : '❌ Missing');
console.log('  - Theme Toggle FAB:', themeFab ? '✅ Found' : '❌ Missing');
console.log('  - Mardi Gras FAB:', mardiFab ? '✅ Found' : '❌ Missing');

if (fabLeft) {
  const leftStyle = getComputedStyle(fabLeft);
  console.log('  - Settings FAB position:', leftStyle.position);
}

if (fabStack) {
  const stackStyle = getComputedStyle(fabStack);
  console.log('  - FAB Stack display:', stackStyle.display);
  console.log('  - FAB Stack flex-direction:', stackStyle.flexDirection);
  console.log('  - FAB Stack gap:', stackStyle.gap);
}

if (themeFab) {
  const themeStyle = getComputedStyle(themeFab);
  console.log('  - Theme FAB position:', themeStyle.position);
  console.log('  - Theme FAB visibility:', themeStyle.visibility);
  console.log('  - Theme FAB display:', themeStyle.display);
}

if (mardiFab) {
  const mardiStyle = getComputedStyle(mardiFab);
  console.log('  - Mardi FAB position:', mardiStyle.position);
  console.log('  - Mardi FAB visibility:', mardiStyle.visibility);
  console.log('  - Mardi FAB display:', mardiStyle.display);
}

// Check for horizontal overflow
console.log('\n🔍 Layout Check:');
console.log('  - Document scroll width:', document.documentElement.scrollWidth);
console.log('  - Window inner width:', window.innerWidth);
console.log('  - Has horizontal scroll:', document.documentElement.scrollWidth > window.innerWidth ? '❌ Yes' : '✅ No');

console.log('\n✅ FAB Layout Test Complete');



