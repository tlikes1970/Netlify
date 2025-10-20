/* scripts/compat-utils.v2.js
 * TRUE global variables for legacy calls: bind, debounce, throttle.
 * Include this BEFORE scripts/inline-script-01.js (classic script).
 */

/* --- bind --- */
if (typeof bind !== 'function' && typeof window.bind !== 'function') {
  var bind = function (idOrEl, fn) {
    try {
      var el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
      if (!el) {
        console.warn('[bind] element not found:', idOrEl);
        return false;
      }
      if (el.addEventListener) el.addEventListener('click', fn, false);
      else el.onclick = fn;
      return true;
    } catch (e) {
      console.error('[bind] failed:', e);
      return false;
    }
  };
  window.bind = bind;
} else if (typeof bind !== 'function' && typeof window.bind === 'function') {
  var bind = window.bind;
} else if (typeof bind === 'function' && typeof window.bind !== 'function') {
  window.bind = bind;
}

/* --- debounce --- */
if (typeof debounce !== 'function' && typeof window.debounce !== 'function') {
  var debounce = function (fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      var a = arguments;
      t = setTimeout(function () {
        fn.apply(null, a);
      }, wait);
    };
  };
  window.debounce = debounce;
} else if (typeof debounce !== 'function' && typeof window.debounce === 'function') {
  var debounce = window.debounce;
} else if (typeof debounce === 'function' && typeof window.debounce !== 'function') {
  window.debounce = debounce;
}

/* --- throttle --- */
if (typeof throttle !== 'function' && typeof window.throttle !== 'function') {
  var throttle = function (fn, limit) {
    var inFlight = false;
    return function () {
      if (inFlight) return;
      inFlight = true;
      try {
        fn.apply(null, arguments);
      } finally {
        setTimeout(function () {
          inFlight = false;
        }, limit);
      }
    };
  };
  window.throttle = throttle;
} else if (typeof throttle !== 'function' && typeof window.throttle === 'function') {
  var throttle = window.throttle;
} else if (typeof throttle === 'function' && typeof window.throttle !== 'function') {
  window.throttle = throttle;
}
