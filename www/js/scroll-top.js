(() => {
  if (document.getElementById('scrollTopBtn')) return; // idempotent

  // H1.1: remove legacy duplicate up-arrows on boot
  const kill = document.querySelectorAll('.legacy-up, .up-arrow, .scroll-to-top, .fab .icon-up, .fab-up');
  kill.forEach(n => n.remove());

  // Create button and attach to app root
  const btn = document.createElement('button');
  btn.id = 'scrollTopBtn';
  btn.className = 'scroll-top-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.textContent = '↑';
  (document.getElementById('appRoot') || document.body).appendChild(btn);
  console.log('Scroll-top button created and attached:', btn);

  // Find the tablist sentinel
  const tablist = document.querySelector('#navigation[role="tablist"], .tab-container[role="tablist"], [role="tablist"]');

  // Show button when scrolling down
  const showOnScroll = () => {
    const scrollThreshold = 50; // Show after scrolling 50px
    
    // Check multiple scroll sources
    const windowScrollY = window.scrollY || window.pageYOffset || 0;
    const documentScrollY = document.documentElement.scrollTop || document.body.scrollTop || 0;
    const maxScrollY = Math.max(windowScrollY, documentScrollY);
    
    const shouldShow = maxScrollY > scrollThreshold;
    btn.classList.toggle('is-visible', shouldShow);
  };

  // Always use scroll detection for simplicity
  window.addEventListener('scroll', showOnScroll, { passive: true });
  document.addEventListener('scroll', showOnScroll, { passive: true });
  document.documentElement.addEventListener('scroll', showOnScroll, { passive: true });
  document.body.addEventListener('scroll', showOnScroll, { passive: true });
  
  // Initial check
  showOnScroll();

  // Action: immediately scroll to top
  btn.addEventListener('click', () => {
    console.log('Arrow clicked, scrolling to top');
    // Scroll both window and document to ensure it works
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
})();
