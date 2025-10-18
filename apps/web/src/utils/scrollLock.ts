// Scroll lock utility that preserves scroll position
let scrollLockData: { scrollY: number; bodyStyle: string } | null = null;

export function lockScroll() {
  if (scrollLockData) return; // Already locked
  
  const scrollY = window.scrollY;
  const bodyStyle = document.body.style.cssText;
  
  document.body.style.cssText = `
    position: fixed;
    top: -${scrollY}px;
    left: 0;
    right: 0;
    overflow: hidden;
  `;
  
  scrollLockData = { scrollY, bodyStyle };
}

export function unlockScroll() {
  if (!scrollLockData) return;
  
  document.body.style.cssText = scrollLockData.bodyStyle;
  window.scrollTo(0, scrollLockData.scrollY);
  
  scrollLockData = null;
}






