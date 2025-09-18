/* scripts/card.js */
(function(){
  if (window.CardActions) return;

  function saveNotInterested(id, type){
    try {
      localStorage.setItem(`ni:${type}:${id}`, '1');
    } catch (e) {
      console.warn('[CardActions] persist failed', e);
    }
  }

  function removeCardFromDOM(id){
    const el = document.querySelector(`[data-card-id="${id}"]`);
    if (!el) { console.debug('[CardActions] card not found for removal', id); return; }
    el.remove();
  }

  function notInterested(id, type){
    saveNotInterested(id, type);
    removeCardFromDOM(id);
    if (window.Toast?.show) window.Toast.show('Hidden from your results.');
    AppEvents.emit('data:changed', { reason: 'not-interested', id, type });
  }

  window.CardActions = { notInterested };
})();







