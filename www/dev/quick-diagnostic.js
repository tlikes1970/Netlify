// Quick diagnostic
console.log('Viewport width:', window.innerWidth, 'px');
console.log('Should be desktop (≥961px):', window.innerWidth >= 961);

// Check if our CSS is loading
const link = document.querySelector('link[href*="community-layout.v2.css"]');
console.log('V2 CSS loaded:', !!link);

// Check if the v2 class is applied
const section = document.querySelector('#group-2-community');
console.log('Has community-v2 class:', section.classList.contains('community-v2'));
console.log('All classes:', Array.from(section.classList));

