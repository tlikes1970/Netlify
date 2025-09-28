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
  btn.textContent = '▲';
  (document.getElementById('appRoot') || document.body).appendChild(btn);

  // Find the tablist sentinel
  const tablist = document.querySelector('#navigation[role="tablist"], .tab-container[role="tablist"], [role="tablist"]');

  // Fallback: if no tablist found, reveal after modest scroll distance
  const fallbackReveal = () => {
    if (!tablist) btn.classList.toggle('is-visible', window.scrollY > 400);
  };

  // Observer shows btn only when tabs are OUT of view
  if (tablist) {
    const io = new IntersectionObserver(entries => {
      const e = entries[0];
      if (!e) return;
      if (e.isIntersecting) btn.classList.remove('is-visible');
      else btn.classList.add('is-visible');
    }, { root: null, threshold: 0 });
    io.observe(tablist);
  } else {
    document.addEventListener('scroll', fallbackReveal, { passive: true });
    fallbackReveal();
  }

  // Hide near top regardless of IO state
  const onScroll = () => { if (window.scrollY < 80) btn.classList.remove('is-visible'); };
  document.addEventListener('scroll', onScroll, { passive: true });

  // Action: smooth scroll respecting reduced motion
  btn.addEventListener('click', () => {
    const opts = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? {} : { behavior: 'smooth' };
    window.scrollTo({ top: 0, ...opts });
  });
})();
