// Nuclear safety net: unregister any SW that appears during dev
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  setInterval(() => {
    navigator.serviceWorker.getRegistrations()
      .then(regs => Promise.all(regs.map(r => r.unregister())))
      .catch(() => {});
  }, 2000);
}

