/* ДТП Информатор — промо-лендинг: анимации и мелкая интерактивность */
(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Шапка: фон при прокрутке ──────────────────────────────────
  const header = document.querySelector('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Мобильное меню ────────────────────────────────────────────
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    // закрываем меню при переходе по якорю или открытии модалки
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ── Появление блоков при скролле ──────────────────────────────
  const revealEls = document.querySelectorAll('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px' }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  // ── Счётчики в hero ───────────────────────────────────────────
  const counters = document.querySelectorAll('[data-count]');
  const runCounter = (el) => {
    const target = Number(el.dataset.count) || 0;
    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (prefersReduced || !('IntersectionObserver' in window)) {
    counters.forEach((el) => (el.textContent = el.dataset.count));
  } else {
    const cio = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            cio.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  // ── Текущий год в футере ──────────────────────────────────────
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  // ── Модальное окно «Написать нам» ─────────────────────────────
  const modal = document.getElementById('contact-modal');
  if (modal) {
    let lastFocused = null;

    const openModal = () => {
      lastFocused = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden'; // блокируем прокрутку фона
      const firstLink = modal.querySelector('.msn-btn');
      if (firstLink) firstLink.focus();
    };

    const closeModal = () => {
      modal.hidden = true;
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    };

    // кнопки «Попробовать бесплатно» и «Подключить»
    document.querySelectorAll('[data-modal]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });

    // клик по крестику или затемнённому фону
    modal.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) closeModal();
    });

    // Esc
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });
  }
  // ── Живой чат в телефоне ────────────────────────────────────────
  const phoneBody = document.querySelector('.phone__body');
  if (phoneBody) {
    const CREWS = ['Экипаж 1', 'Экипаж 2', 'Экипаж 3', 'Экипаж 4'];
    const ADDRESSES = [
      'ул. Садовая, 3',
      'пр-т Ленина, 24',
      'ул. Гагарина, 7',
      'ш. Энтузиастов, 15',
      'ул. Мира, 42',
      'наб. Реки, 8',
    ];
    const MAX_MESSAGES = 12;

    let addrIdx = 0;
    let crewIdx = 0;
    let timers = [];
    let running = false;

    const nowTime = () =>
      new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    const scrollDown = () => {
      phoneBody.scrollTo({
        top: phoneBody.scrollHeight,
        behavior: prefersReduced ? 'auto' : 'smooth',
      });
    };

    /** Добавляет сообщение в чат и прокручивает к нему. */
    const push = (html) => {
      const holder = document.createElement('div');
      holder.innerHTML = html;
      const node = holder.firstElementChild;
      if (!node) return;
      node.classList.add('msg--live');
      // пульсирует только самое свежее сообщение о ДТП
      if (node.classList.contains('msg--fresh')) {
        phoneBody.querySelectorAll('.msg--fresh').forEach((el) => el.classList.remove('msg--fresh'));
      }
      phoneBody.appendChild(node);
      while (phoneBody.children.length > MAX_MESSAGES) {
        phoneBody.removeChild(phoneBody.firstElementChild);
      }
      scrollDown();
    };

    const botDtp = (address) => `
      <div class="msg msg--bot msg--alert msg--fresh">
        <div class="msg__title msg__title--alert">🚨 НОВОЕ ДТП</div>
        <div class="msg__address">${address}</div>
        <span class="msg__btn">🛣 Построить маршрут</span>
      </div>`;

    const crewMsg = (name, text) => `
      <div class="msg msg--crew">
        <div class="msg__meta"><b>${name}</b><time>${nowTime()}</time></div>
        <p>${text}</p>
      </div>`;

    /** Один цикл: новое ДТП → экипаж принял → экипаж на месте. */
    const cycle = () => {
      if (!running) return;
      const address = ADDRESSES[addrIdx % ADDRESSES.length];
      const crew = CREWS[crewIdx % CREWS.length];
      addrIdx += 1;
      crewIdx += 1;

      push(botDtp(address));
      timers.push(setTimeout(() => push(crewMsg(crew, 'Приняли, выезжаем 🚑')), 1600));
      timers.push(setTimeout(() => push(crewMsg(crew, 'На месте. Оформляем ✅')), 3200));
      timers.push(setTimeout(cycle, 9000));
    };

    const start = () => {
      if (running) return;
      running = true;
      timers.push(setTimeout(cycle, 3500));
    };

    const stop = () => {
      running = false;
      timers.forEach((t) => clearTimeout(t));
      timers = [];
    };

    // крутим чат, только пока он виден на экране
    if ('IntersectionObserver' in window) {
      const phoneObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) start();
            else stop();
          }
        },
        { threshold: 0.2 }
      );
      phoneObserver.observe(document.querySelector('.phone'));
    } else {
      start();
    }
  }
})();
