// Comprehensive CSS Analysis
console.log('=== CSS Analysis ===');
console.log('Viewport width:', window.innerWidth, 'px');

// Check CSS variables
const rootStyles = getComputedStyle(document.documentElement);
const bpTablet = rootStyles.getPropertyValue('--bp-tablet');
console.log('--bp-tablet value:', bpTablet);

// Check if we're in mobile or desktop
const isMobile = window.innerWidth <= 960;
const isTabletMobile = bpTablet ? window.innerWidth <= parseInt(bpTablet) : false;
console.log('Is mobile (≤960px):', isMobile);
console.log('Is tablet mobile:', isTabletMobile);

// Check the actual CSS rules being applied
const content = document.querySelector('#group-2-community .community-content');
const contentStyles = getComputedStyle(content);
console.log('Applied CSS:', {
  display: contentStyles.display,
  gridTemplateColumns: contentStyles.gridTemplateColumns,
  gap: contentStyles.gap
});

// Check if our v2 class is working
const communitySection = document.querySelector('#group-2-community');
console.log('Has community-v2 class:', communitySection.classList.contains('community-v2'));
console.log('All classes:', Array.from(communitySection.classList));

