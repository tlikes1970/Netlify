/**
 * Sticky Layout Validation Script
 * Purpose: Runtime check to assert zero gaps in sticky layout
 * Data Source: getBoundingClientRect measurements of layout elements
 * Update Path: Console logging for debugging
 * Dependencies: #appRoot, header.header, #navigation.tab-container, .panels
 */
(() => {
  const header = document.querySelector('#appRoot > header.header');
  const tabs   = document.querySelector('#appRoot > #navigation.tab-container, #appRoot > .tab-container, #appRoot > [role="tablist"]');
  const panels = document.querySelector('#appRoot > .panels');
  const active = panels && panels.querySelector('.tab-section.active');

  const hb = Math.round(header?.getBoundingClientRect().bottom ?? NaN);
  const tt = Math.round(tabs?.getBoundingClientRect().top ?? NaN);
  const tb = Math.round(tabs?.getBoundingClientRect().bottom ?? NaN);
  const pt = Math.round(active?.getBoundingClientRect().top ?? NaN);

  console.log('[layout]', {
    header_to_tabs_gap: tt - hb,
    tabs_to_panel_gap: pt - tb,
    panels_is_child_of_appRoot: panels?.parentElement?.id === 'appRoot'
  });
})();
