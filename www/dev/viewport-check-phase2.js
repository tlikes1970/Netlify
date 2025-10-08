// Quick viewport check
console.log('Viewport width:', window.innerWidth, 'px');
console.log('Should be desktop (2fr 1fr):', window.innerWidth > 960 ? 'YES' : 'NO');
console.log('Should be mobile (1fr):', window.innerWidth <= 960 ? 'YES' : 'NO');

