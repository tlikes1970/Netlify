/**
 * Process: Modal Iframe Sizing
 * Purpose: Size iframes to fit modal bodies
 * Data Source: Modal events
 * Update Path: Runs on modal open/close
 * Dependencies: None
 */

// Helper to size an iframe to its modal body
function sizeModalIframe(modalId, iframeEl){
  const modal = document.getElementById(modalId);
  if (!modal || !iframeEl) return;
  const body = modal.querySelector('.gm-body');
  if (!body) return;

  /* Height now managed by card system - no forced heights */
}

// Set up iframe sizing
const needsResize = new Set();

document.addEventListener('modal:open', (e)=>{
  const id = e.detail?.id;
  if (id) {
    const iframe = document.querySelector(`#${id} iframe`);
    if (iframe) {
      requestAnimationFrame(()=> sizeIframe(id));
      needsResize.add(id);
    }
  }
});

document.addEventListener('modal:close', (e)=>{
  const id = e.detail?.id;
  if (!id) return;
  needsResize.delete(id);
});

window.addEventListener('resize', ()=>{
  for (const id of needsResize) sizeIframe(id);
});
