// i18n: load locale JSON files from /locales and apply translations to elements with data-i18n
(function () {
  const DEFAULT = 'en';
  const STORAGE_KEY = 'site_lang';
  const CACHE = {};

  function setActiveButton(lang) {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  function applyMap(map) {
    if (!map) return;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = map[key];
      if (val === undefined) return;
      // if element is an input/textarea, set placeholder/value if appropriate
      const tag = el.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') {
        if (el.placeholder !== undefined) el.placeholder = val;
        else el.value = val;
      } else if (tag === 'option') {
        el.textContent = val;
      } else {
        el.textContent = val;
      }
    });
  }

  async function loadLocale(lang) {
    if (!lang) lang = DEFAULT;
    if (CACHE[lang]) return CACHE[lang];
    try {
      const res = await fetch(`/locales/${lang}.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error('locale not found');
      const json = await res.json();
      CACHE[lang] = json;
      return json;
    } catch (e) {
      if (lang !== DEFAULT) return loadLocale(DEFAULT);
      // final fallback: empty map
      CACHE[lang] = {};
      return CACHE[lang];
    }
  }

  async function translatePage(lang) {
    if (!lang) lang = DEFAULT;
    const map = await loadLocale(lang);
    applyMap(map);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    document.documentElement.lang = lang;
    setActiveButton(lang);
  }

  // Wire buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-btn');
    if (!btn) return;
    const lang = btn.dataset.lang;
    if (lang) translatePage(lang);
  });

  // Initialize on load
  (function init() {
    let lang = DEFAULT;
    try { lang = localStorage.getItem(STORAGE_KEY) || DEFAULT; } catch (e) {}
    // Kick off translate but don't block other scripts
    translatePage(lang).catch(() => {});
  })();
})();
// Simple i18n handler using data-i18n attributes.
(function () {
  const DEFAULT = 'en';
  const STORAGE_KEY = 'site_lang';

  const translations = {
    en: {
      'nav.home': 'Home',
      'nav.courses': 'Courses',
      'nav.lab': 'Virtual Lab',
      'nav.about': 'About',
      'nav.contact': 'Contact',
      'loading': 'Loading...',
      'hero.title1': 'HIJACK',
      'hero.title2': 'SCIENCE CENTRE',
      'hero.subtitle': 'Explore the Universe of Knowledge',
      'hero.explore': 'Explore Courses',
      'hero.lab': 'Virtual Lab',
      'panel.students': 'Students',
      'panel.courses': 'Courses',
      'panel.labs': 'Labs',
      'features.title': 'Why Choose Us',
      'features.subtitle': 'Discover the future of science education',
      'stats.students': 'Students Enrolled',
      'stats.courses': 'Courses Available',
      'stats.satisfaction': '% Satisfaction',
      'stats.experts': 'Expert Instructors',
      'cta.title': 'Ready to Start Your Journey?',
      'cta.subtitle': 'Join thousands of students exploring the wonders of science',
      'cta.button': 'Get Started Today',
      'footer.tagline': 'Inspiring the next generation of scientists',
      'footer.explore': 'Explore',
      'footer.connect': 'Connect',
      'footer.rights': 'All rights reserved.'
    },
    uz: {
      'nav.home': "Bosh sahifa",
      'nav.courses': "Kurslar",
      'nav.lab': "Virtual laboratoriya",
      'nav.about': "Biz haqimizda",
      'nav.contact': "Aloqa",
      'loading': 'Yuklanmoqda...',
      'hero.title1': 'HIJACK',
      'hero.title2': 'FAN MARKAZI',
      'hero.subtitle': 'Bilim olamiga sayohat qiling',
      'hero.explore': 'Kurslarni ko‘rish',
      'hero.lab': 'Virtual laboratoriya',
      'panel.students': 'Talabalar',
      'panel.courses': 'Kurslar',
      'panel.labs': 'Laboratoriyalar',
      'features.title': 'Nega biz?',
      'features.subtitle': 'Fan taʼlimining kelajagini kashf eting',
      'stats.students': 'Roʻyxatdan oʻtganlar',
      'stats.courses': 'Mavjud kurslar',
      'stats.satisfaction': '% Mamnuniyat',
      'stats.experts': 'Mutaxassislar',
      'cta.title': 'Sayohatingizni boshlashga tayyormisiz?',
      'cta.subtitle': 'Minglab talabalarga qoʻshiling',
      'cta.button': 'Bugunoq boshlang',
      'footer.tagline': 'Kelajak olimlarini ilhomlantirish',
      'footer.explore': 'Kashf etish',
      'footer.connect': 'Bogʻlanish',
      'footer.rights': "Barcha huquqlar himoyalangan."
    },
    ru: {
      'nav.home': 'Главная',
      'nav.courses': 'Курсы',
      'nav.lab': 'Виртуальная лаборатория',
      'nav.about': 'О нас',
      'nav.contact': 'Контакт',
      'loading': 'Загрузка...',
      'hero.title1': 'HIJACK',
      'hero.title2': 'НАУЧНЫЙ ЦЕНТР',
      'hero.subtitle': 'Исследуйте вселенную знаний',
      'hero.explore': 'Курсы',
      'hero.lab': 'Лаборатория',
      'panel.students': 'Студенты',
      'panel.courses': 'Курсы',
      'panel.labs': 'Лаборатории',
      'features.title': 'Почему мы',
      'features.subtitle': 'Откройте будущее научного образования',
      'stats.students': 'Зачислено студентов',
      'stats.courses': 'Доступные курсы',
      'stats.satisfaction': '% Удовлетворенность',
      'stats.experts': 'Эксперты',
      'cta.title': 'Готовы начать путь?',
      'cta.subtitle': 'Присоединяйтесь к тысячам студентов',
      'cta.button': 'Начать сегодня',
      'footer.tagline': 'Вдохновляя следующее поколение ученых',
      'footer.explore': 'Исследовать',
      'footer.connect': 'Связаться',
      'footer.rights': 'Все права защищены.'
    }
  };

  function setActiveButton(lang) {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  function translatePage(lang) {
    if (!lang) lang = DEFAULT;
    const map = translations[lang] || translations[DEFAULT];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const text = map[key];
      if (text !== undefined) {
        el.textContent = text;
      }
    });
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    document.documentElement.lang = lang;
    setActiveButton(lang);
  }

  // Wire buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-btn');
    if (!btn) return;
    const lang = btn.dataset.lang;
    if (lang) translatePage(lang);
  });

  // Initialize on load
  (function init() {
    let lang = DEFAULT;
    try { lang = localStorage.getItem(STORAGE_KEY) || DEFAULT; } catch (e) {}
    translatePage(lang);
  })();
})();
