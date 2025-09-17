/**
 * Process: Daily Trivia Bridge
 * Purpose: Handle trivia modal mount/unmount
 * Data Source: Modal events
 * Update Path: Runs on modal open/close
 * Dependencies: None
 */

// === Daily Trivia <-> Modal bridge (iframe mount/unmount) ===
window.DailyTriviaBridge = (() => {
  let handle = null;
  const TRIVIA_SRC = 'features/trivia.html'; // change here if your path differs

  function todayISO(){ return new Date().toISOString().slice(0,10); }

  function mount(rootSel){
    const root = typeof rootSel === 'string' ? document.querySelector(rootSel) : rootSel;
    if (!root) throw new Error('DailyTrivia root not found');
    
    // Create iframe if it doesn't exist
    let iframe = root.querySelector('iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.src = TRIVIA_SRC + '?date=' + todayISO();
      iframe.style.width = '100%';
      iframe.style.height = '400px';
      iframe.style.border = 'none';
      root.appendChild(iframe);
    }
    
    handle = { root, iframe };
    console.log('🎯 Trivia mounted');
    return handle;
  }

  function unmount(){
    if (handle) {
      const { iframe } = handle;
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      handle = null;
      console.log('🎯 Trivia unmounted');
    }
  }

  return { mount, unmount };
})();

// Set up modal event listeners
document.addEventListener('modal:open', (e)=>{
  if (e.detail?.id === 'modal-trivia') {
    try {
      const root = document.querySelector('#modal-trivia .gm-body');
      if (root) {
        window.DailyTriviaBridge.mount(root);
      }
    }
    catch(err){ console.error('Trivia mount failed', err); }
  }
});

document.addEventListener('modal:close', (e)=>{
  if (e.detail?.id === 'modal-trivia') {
    try {
      window.DailyTriviaBridge.unmount();
    }
    catch(err){ console.error('Trivia unmount failed', err); }
  }
});
