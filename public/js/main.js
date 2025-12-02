// Hide the loader when the page or 3D scene is ready, with a safe fallback.
(function () {
  const loaderId = 'loader';
  const FALLBACK_MS = 6000; // maximum wait before hiding loader

  const loader = document.getElementById(loaderId);
  if (!loader) return;

  let hidden = false;
  let fallbackTimer = null;

  function removeLoader() {
    if (hidden) return;
    hidden = true;
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
    // Use GSAP if available for a smooth fade, otherwise CSS transition
    if (window.gsap && typeof window.gsap.to === 'function') {
      try {
        window.gsap.to(loader, { autoAlpha: 0, duration: 0.6, onComplete: () => loader.remove() });
        return;
      } catch (e) {
        // fallthrough to native fade
      }
    }

    loader.style.transition = 'opacity 0.6s ease, visibility 0.6s ease';
    loader.style.opacity = '0';
    loader.style.visibility = 'hidden';
    setTimeout(() => {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 700);
  }

  // If the 3D scene or other scripts signal readiness, hide immediately
  function onThreeReady() {
    removeLoader();
    // fallbackTimer cleared by removeLoader
    document.removeEventListener('threeReady', onThreeReady);
    window.removeEventListener('load', onWindowLoad);
  }

  function onDomReady() {
    // DOM is interactive; content is available. Use this as another signal.
    removeLoader();
    document.removeEventListener('DOMContentLoaded', onDomReady);
  }

  function onWindowLoad() {
    // window load usually indicates assets are ready
    removeLoader();
    // fallbackTimer cleared by removeLoader
    document.removeEventListener('threeReady', onThreeReady);
    window.removeEventListener('load', onWindowLoad);
  }

  document.addEventListener('threeReady', onThreeReady);
  document.addEventListener('DOMContentLoaded', onDomReady);
  window.addEventListener('load', onWindowLoad);

  // Safety checks: if the document already finished loading, or Three.js
  // is already available by the time this script runs, ensure loader is removed.
  if (document.readyState === 'complete') {
    // run on next tick to avoid synchronous DOM changes during script evaluation
    setTimeout(onWindowLoad, 20);
  } else if (document.readyState === 'interactive') {
    // DOM is ready but window load hasn't fired yet
    setTimeout(onDomReady, 20);
  }

  if (window.THREE) {
    // If Three is present, some pages may not dispatch threeReady explicitly
    // (or it may have already been dispatched). Ensure loader still clears.
    setTimeout(() => {
      if (!hidden) onThreeReady();
    }, 60);
  }

  // Fallback: ensure loader is removed even if events never fire
  fallbackTimer = setTimeout(() => {
    removeLoader();
    document.removeEventListener('threeReady', onThreeReady);
    window.removeEventListener('load', onWindowLoad);
  }, FALLBACK_MS);
})();

// UI handlers: theme toggle, mobile menu
(function () {
  const html = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  function applyTheme(theme) {
    if (!theme) return;
    html.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }

  // Initialize theme from localStorage or default to dark
  try {
    const saved = localStorage.getItem('theme');
    applyTheme(saved || html.getAttribute('data-theme') || 'dark');
  } catch (e) {
    applyTheme(html.getAttribute('data-theme') || 'dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  // Mobile menu toggle
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      mobileMenuBtn.classList.toggle('open', open);
    });

    // Close menu when a link is clicked
    mobileMenu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        mobileMenu.classList.remove('open');
        mobileMenuBtn.classList.remove('open');
      }
    });
  }
})();
