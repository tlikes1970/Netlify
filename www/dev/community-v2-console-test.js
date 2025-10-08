// Community V2 Console Validation Script
// Copy and paste this into the browser console to validate the implementation

(() => {
  const css = getComputedStyle(document.querySelector('#group-2-community .community-content'));
  const left = getComputedStyle(document.querySelector('#group-2-community .community-left'));
  const games = getComputedStyle(document.querySelector('#group-2-community #home-games'));
  console.table([
    {prop:'content.display', val: css.display},
    {prop:'content.columns', val: css.gridTemplateColumns},
    {prop:'left.position', val: left.position, top:left.top},
    {prop:'games.display', val: games.display, cols: games.gridTemplateColumns}
  ]);
})();

