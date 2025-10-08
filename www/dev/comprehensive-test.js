// Comprehensive Community V2 Test
console.log('=== Community V2 Comprehensive Test ===');

// 1. Viewport Check
console.log('Viewport width:', window.innerWidth, 'px');
console.log('Is desktop (≥961px):', window.innerWidth >= 961);
console.log('Is mobile (≤960px):', window.innerWidth <= 960);

// 2. CSS Loading Check
const v2CSSLink = document.querySelector('link[href*="community-layout.v2.css"]');
console.log('V2 CSS loaded:', !!v2CSSLink);
if (v2CSSLink) {
  console.log('V2 CSS href:', v2CSSLink.href);
}

// 3. HTML Structure Check
const section = document.querySelector('#group-2-community');
console.log('Community section found:', !!section);
if (section) {
  console.log('Has community-v2 class:', section.classList.contains('community-v2'));
  console.log('All classes:', Array.from(section.classList));
}

// 4. CSS Rules Check
const content = document.querySelector('#group-2-community .community-content');
if (content) {
  const styles = getComputedStyle(content);
  console.log('Applied CSS:', {
    display: styles.display,
    gridTemplateColumns: styles.gridTemplateColumns,
    gap: styles.gap
  });
  
  // Check which CSS file is winning
  console.log('CSS cascade analysis:');
  console.log('- Expected desktop: minmax(0, 2fr) minmax(280px, 1fr)');
  console.log('- Expected mobile: 1fr');
  console.log('- Actual:', styles.gridTemplateColumns);
}

// 5. Left Position Check
const left = document.querySelector('#group-2-community .community-left');
if (left) {
  const leftStyles = getComputedStyle(left);
  console.log('Left position:', {
    position: leftStyles.position,
    top: leftStyles.top
  });
}

// 6. Games Check
const games = document.querySelector('#group-2-community #home-games');
if (games) {
  const gamesStyles = getComputedStyle(games);
  console.log('Games CSS:', {
    display: gamesStyles.display,
    gridTemplateColumns: gamesStyles.gridTemplateColumns
  });
}

