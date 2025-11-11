/**
 * FlickWord Mobile Probe
 * 
 * Read-only diagnostic utility to capture real DOM structure and computed sizes
 * of the FlickWord modal. No visual changes, outputs JSON to console.
 * 
 * Usage (in DevTools console):
 *   import('/src/debug/fwProbe.ts').then(m => m.fwProbe());
 * 
 * This file should be tree-shaken out of production builds.
 */

export function fwProbe() {
  const root =
    document.querySelector('[data-fw-root]') ||
    document.querySelector('.flickword,.FlickWord,[data-game="flickword"]');

  const qs = (sel: string) => (root ? root.querySelector(sel) : null);
  const qa = (sel: string) => (root ? Array.from(root.querySelectorAll(sel)) : []);

  // Try common variants so we don't depend on your exact classes
  const grid =
    qs('[data-fw-el="grid"]') ||
    qs('.fw-grid') ||
    qs('[class*="grid"]');

  const tile =
    qs('[data-fw-el="tile"]') ||
    qs('.tile') ||
    qs('[class*="tile"]');

  const kb =
    qs('[data-fw-el="keyboard"]') ||
    qs('.fw-keyboard') ||
    qs('[class*="keyboard"]');

  const rows =
    qa('[data-fw-el="key-row"]') ||
    qa('.fw-kb-row') ||
    qa('.key-row') ||
    qa('[class*="keyRow"]');

  const cs = (el: Element | null) => (el ? getComputedStyle(el as Element) : null);
  const bb = (el: Element | null) => (el ? (el as Element).getBoundingClientRect() : null);

  const rowSamples = rows.slice(0, 3).map(r => {
    const k = Array.from(r.querySelectorAll('button,[role="button"],[data-fw-el="key"]') || []);
    const kBB = k.map(el => el.getBoundingClientRect());
    const widths = kBB.map(b => Math.round(b.width));
    const heights = kBB.map(b => Math.round(b.height));
    const gap = cs(r)?.gap || `${cs(r)?.columnGap} / ${cs(r)?.rowGap}`;
    return {
      class: (r as Element).className,
      count: k.length,
      rowBB: bb(r),
      gap,
      widths,
      heights,
      sumW: widths.reduce((a, n) => a + n, 0),
    };
  });

  const out: any = {
    vw: window.innerWidth,
    vh: window.innerHeight,
    root: { class: root?.className || null, bb: bb(root) },
    grid: grid && {
      class: grid.className,
      display: cs(grid)?.display,
      gap: cs(grid)?.gap || `${cs(grid)?.rowGap}/${cs(grid)?.columnGap}`,
      templateCols: cs(grid)?.gridTemplateColumns,
      autoFlow: cs(grid)?.gridAutoFlow,
      bb: bb(grid),
    },
    tile: tile && {
      class: tile.className,
      pos: cs(tile)?.position,
      z: cs(tile)?.zIndex,
      width: cs(tile)?.width,
      height: cs(tile)?.height,
      transform: cs(tile)?.transform,
      bb: bb(tile),
    },
    keyboard: kb && { class: kb.className, bb: bb(kb) },
    rows: rowSamples,
    // Detect overlap: pick first row of tiles and read their rects
    overlapCheck: (() => {
      const firstRow = grid?.querySelectorAll('[data-fw-el="tile"],.tile,[class*="tile"]');
      if (!firstRow || !firstRow.length) return null;
      const rects = Array.from(firstRow).slice(0, 5).map(el => el.getBoundingClientRect());
      // any pair with vertical overlap > 0 and horizontal overlap > 0 that shouldn't overlap?
      const overlaps: any[] = [];
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i], b = rects[j];
          const xOver = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const yOver = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (xOver > 0 && yOver > 0) overlaps.push([i, j, { xOver: Math.round(xOver), yOver: Math.round(yOver) }]);
        }
      }
      return { count: overlaps.length, overlaps, rects };
    })(),
  };

  // Summarize top-row fit math if we have the first key row
  if (rows[0]) {
    const r = rows[0] as Element;
    const gap = parseFloat(getComputedStyle(r).columnGap || getComputedStyle(r).gap || '0') || 0;
    const keysInRow = Array.from(r.querySelectorAll('button,[role="button"],[data-fw-el="key"]'));
    const widths = keysInRow.map(k => Math.round(k.getBoundingClientRect().width));
    const totalGaps = gap * Math.max(0, keysInRow.length - 1);
    const needed = widths.reduce((a, n) => a + n, 0) + totalGaps;
    const available = Math.round(r.getBoundingClientRect().width);
    out.rowFit = { available, needed, gap, keyCount: keysInRow.length, delta: available - needed };
  }

  console.log('[fwProbe]', out);
  return out;
}

