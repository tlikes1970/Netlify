(() => {
  const card = document.querySelector('.tab-card');
  if (!card) return console.warn('No .tab-card found');
  const r = card.getBoundingClientRect();
  const cx = Math.floor(r.left + r.width/2), cy = Math.floor(r.top + r.height/2);
  const stack = document.elementsFromPoint(cx, cy);
  const firstAccepting = stack.find(el => getComputedStyle(el).pointerEvents !== 'none') || null;
  const sel = el => el ? el.tagName.toLowerCase() + (el.id ? '#'+el.id : '')
    + ([...el.classList].length ? '.'+[...el.classList].join('.') : '') : '(none)';
  console.table(stack.slice(0,10).map((el,i)=>({
    i, el: sel(el), pe: getComputedStyle(el).pointerEvents, z: getComputedStyle(el).zIndex
  })));
  console.table({
    density: document.documentElement.dataset.density || '(none)',
    compactAttr: document.documentElement.hasAttribute('data-compact-mobile-v1'),
    hits_card_or_child: !!firstAccepting && (firstAccepting === card || card.contains(firstAccepting)),
  });
})();
