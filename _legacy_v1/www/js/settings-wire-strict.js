// Settings Wire Strict - Deterministic settings rendering and binding
// Reads JSON config, validates DOM, binds controls using ONLY configured selectors

(async function () {
  // Helper: safe fetch of local JSON
  async function loadConfig() {
    const res = await fetch('/config/settings-wiring.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`settings-wiring.json ${res.status}`);
    return res.json();
  }

  // Storage helpers
  function getStorageKey(key) {
    return localStorage.getItem(key);
  }

  function setStorageKey(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('[settings-wire] storage error:', e);
    }
  }

  // Control type handlers
  const handlers = {
    toggle: (element, config) => {
      if (!element) return;

      // Load saved state
      const saved = getStorageKey(config.storageKey);
      if (saved !== null) {
        element.checked = saved === 'true';
      }

      // Bind change handler
      element.addEventListener('change', () => {
        setStorageKey(config.storageKey, element.checked.toString());
        console.log(`[settings-wire] ${config.key} = ${element.checked}`);
      });
    },

    select: (element, config) => {
      if (!element) return;

      // Load saved state
      const saved = getStorageKey(config.storageKey);
      if (saved !== null) {
        element.value = saved;
      }

      // Bind change handler
      element.addEventListener('change', () => {
        setStorageKey(config.storageKey, element.value);
        console.log(`[settings-wire] ${config.key} = ${element.value}`);
      });
    },

    text: (element, config) => {
      if (!element) return;

      // Load saved state
      const saved = getStorageKey(config.storageKey);
      if (saved !== null) {
        element.value = saved;
      }

      // Bind change handler
      element.addEventListener('input', () => {
        setStorageKey(config.storageKey, element.value);
        console.log(`[settings-wire] ${config.key} = ${element.value}`);
      });
    },

    button: (element, config) => {
      if (!element) return;

      // Bind action handler
      element.addEventListener('click', () => {
        if (config.action && window[config.action]) {
          window[config.action]();
        } else {
          console.warn(`[settings-wire] action ${config.action} not found`);
        }
      });
    },

    file: (element, config) => {
      if (!element) return;

      // Bind change handler for file input
      element.addEventListener('change', (e) => {
        if (config.action && window[config.action]) {
          window[config.action](e.target.files[0]);
        } else {
          console.warn(`[settings-wire] action ${config.action} not found`);
        }
      });
    },

    multiselect: (element, config) => {
      if (!element) return;

      // Handle multiple checkboxes
      const checkboxes = document.querySelectorAll(config.selector);
      checkboxes.forEach((cb) => {
        const key = `${config.storageKey}_${cb.id}`;
        const saved = getStorageKey(key);
        if (saved !== null) {
          cb.checked = saved === 'true';
        }

        cb.addEventListener('change', () => {
          setStorageKey(key, cb.checked.toString());
          console.log(`[settings-wire] ${config.key}.${cb.id} = ${cb.checked}`);
        });
      });
    },

    label: (element, config) => {
      // Labels don't need binding, just validation
      if (!element) {
        console.warn(`[settings-wire] missing label: ${config.selector}`);
      }
    },
  };

  function bindControl(control) {
    if (!control.selector) {
      console.warn(`[settings-wire] empty selector for control: ${control.key}`);
      return;
    }

    const element = document.querySelector(control.selector);
    if (!element) {
      console.warn(`[settings-wire] missing element: ${control.selector} for ${control.key}`);
      return;
    }

    const handler = handlers[control.type];
    if (handler) {
      handler(element, control);
    } else {
      console.warn(`[settings-wire] unknown control type: ${control.type}`);
    }
  }

  function run(config) {
    console.log('[settings-wire] binding controls...');

    config.groups.forEach((group) => {
      console.log(`[settings-wire] binding group: ${group.title}`);
      group.controls.forEach(bindControl);
    });

    console.log('[settings-wire] binding complete');
  }

  const config = await loadConfig();
  run(config);
})().catch((e) => console.error('[settings-wire] failed to init', e));
