// Lightweight stub to signal when Three-related initialization is complete.
// If a full three-about implementation exists, replace this with the real init.
(function () {
  // Try to detect when THREE is available; otherwise dispatch quickly so loader doesn't hang.
  function dispatchReady() {
    try {
      document.dispatchEvent(new Event('threeReady'));
    } catch (e) {
      // For very old browsers fallback to CustomEvent
      document.dispatchEvent(new CustomEvent('threeReady'));
    }
  }

  if (window.THREE) {
    // Three.js is available — signal readiness on next tick
    setTimeout(dispatchReady, 50);
  } else {
    // Poll briefly for THREE (max ~3s), then give up and signal ready
    let attempts = 0;
    const interval = setInterval(() => {
      if (window.THREE || attempts++ > 30) {
        clearInterval(interval);
        dispatchReady();
      }
    }, 100);
  }
})();
