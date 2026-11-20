/* ДТП Радар — промо-лендинг: анимации и мелкая интерактивность */
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
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = String(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (prefersReduced || !('IntersectionObserver' in window)) {
    counters.forEach((el) => (el.textContent = el.dataset.count + (el.dataset.suffix || '')));
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

  // ── Бета-набор: таймер и места ────────────────────────────────
  // Дедлайн — последняя секунда текущего месяца, обновлять не нужно.
  // Для фиксированной даты замените на: new Date('2026-12-31T23:59:59')
  const now = new Date();
  const deadline = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Таймер «До конца бета-набора»
  const clock = document.querySelector('[data-countdown]');
  if (clock) {
    const cells = {
      days: clock.querySelector('[data-unit="days"]'),
      hours: clock.querySelector('[data-unit="hours"]'),
      minutes: clock.querySelector('[data-unit="minutes"]'),
      seconds: clock.querySelector('[data-unit="seconds"]'),
    };
    const pad = (n) => String(n).padStart(2, '0');

    const tick = () => {
      const diff = Math.max(0, deadline - Date.now());
      cells.days.textContent = pad(Math.floor(diff / 86400000));
      cells.hours.textContent = pad(Math.floor(diff / 3600000) % 24);
      cells.minutes.textContent = pad(Math.floor(diff / 60000) % 60);
      cells.seconds.textContent = pad(Math.floor(diff / 1000) % 60);
    };
    tick();
    setInterval(tick, 1000);
  }

  // Места в бета-потоке: с каждым днём свободных мест всё меньше.
  // От 5 занятых в начале месяца к 14 к дедлайну (до 15 не доходим).
  const places = document.querySelector('[data-places]');
  if (places) {
    const takenEl = places.querySelector('[data-places-taken]');
    const bar = places.querySelector('.offer__bar');
    const fill = bar.querySelector('i');
    const TOTAL = 15, START = 5, END = 14;

    const frac = Math.min(1, Math.max(0, (now - monthStart) / (deadline - monthStart)));
    const taken = Math.min(TOTAL, Math.round(START + (END - START) * frac));
    // ширина полосы — доля занятых мест в процентах (6 из 10 = 60%)
    const pct = Math.round(taken / TOTAL * 100);

    // в финальном CTA показываем, сколько мест осталось (с правильным падежом)
    const ctaPlaces = document.querySelector('[data-cta-places]');
    if (ctaPlaces) {
      const left = Math.max(0, TOTAL - taken);
      const mod10 = left % 10;
      const mod100 = left % 100;
      const noun = mod10 === 1 && mod100 !== 11
        ? 'бесплатное место'
        : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
          ? 'бесплатных места'
          : 'бесплатных мест';
      ctaPlaces.textContent = 'Осталось ' + left + ' ' + noun;
    }

    // полоса и цифра «оживают» при появлении панели на экране
    const runPlaces = () => {
      fill.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', String(pct));
      const start = performance.now();
      const duration = 1200;
      const step = (t) => {
        const p = Math.min(1, (t - start) / duration);
        takenEl.textContent = Math.round(taken * p) + ' / ' + TOTAL;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (prefersReduced || !('IntersectionObserver' in window)) {
      takenEl.textContent = taken + ' / ' + TOTAL;
      fill.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', String(pct));
    } else {
      fill.style.width = '0%';
      takenEl.textContent = '0 / ' + TOTAL;
      const placesObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            runPlaces();
            placesObserver.disconnect();
          }
        },
        { threshold: 0.4 }
      );
      placesObserver.observe(places);
    }
  }

  // ── Калькулятор выгоды ────────────────────────────────────────
  // Ползунок «Сколько из них берёте вы» — ваша доля ДТП С НАМИ
  // (уведомление приходит первым). «Без нас» — та же доля, делённая на 2.8:
  // работа наугад, когда вы находите лишь малую часть аварий.
  const calc = document.querySelector('.calc');
  if (calc) {
    const inputs = {
      accidents: calc.querySelector('[data-calc="accidents"]'),
      share: calc.querySelector('[data-calc="share"]'),
      check: calc.querySelector('[data-calc="check"]'),
      shifts: calc.querySelector('[data-calc="shifts"]'),
    };
    const out = (name) => calc.querySelector('[data-calc-out="' + name + '"]');
    const label = (name) => calc.querySelector('[data-calc-label="' + name + '"]');
    const barEl = (name) => calc.querySelector('[data-calc-bar="' + name + '"]');
    const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    // закрашивает пройденную часть ползунка через CSS-переменную --p
    const paint = (input) => {
      const p = (input.value - input.min) / (input.max - input.min) * 100;
      input.style.setProperty('--p', p + '%');
    };

    const recalc = () => {
      const dtp = +inputs.accidents.value;
      const share = +inputs.share.value / 100;
      const price = +inputs.check.value;
      const days = +inputs.shifts.value;

      const jobs = Math.round(dtp * share * days);              // выездов в месяц с нами
      const after = jobs * price;
      const jobsBefore = Math.round(dtp * (share / 2.8) * days); // выездов в месяц без нас
      const before = jobsBefore * price;

      label('accidents').textContent = fmt(dtp);
      label('share').textContent = inputs.share.value + ' %';
      label('check').textContent = fmt(price) + ' ₽';
      label('shifts').textContent = fmt(days);

      out('jobs').textContent = fmt(jobs);
      out('before').textContent = fmt(before) + ' ₽';
      out('before2').textContent = fmt(before) + ' ₽';
      out('after').textContent = fmt(after) + ' ₽';
      out('after2').textContent = fmt(after) + ' ₽';
      out('delta').textContent = '+' + fmt(after - before) + ' ₽ в месяц';

      barEl('after').style.width = Math.max(4, after / Math.max(after, before, 1) * 100) + '%';
      barEl('before').style.width = Math.max(3, before / Math.max(after, before, 1) * 100) + '%';

      Object.values(inputs).forEach(paint);
    };

    Object.values(inputs).forEach((input) => input.addEventListener('input', recalc));
    recalc();
  }

  // ── Бегущая строка: лента последних ДТП ───────────────────────
  // Декоративная лента «как это работает вживую». Улицы и типы —
  // примеры: перед публикацией замените на реальные.
  const tickerRow = document.querySelector('[data-ticker]');
  if (tickerRow) {
    const streets = [
      'пр. Ленина × ул. Гагарина', 'ул. Космонавтов, 42', 'Окружная дорога, 14-й км',
      'ул. Мира × Октябрьский пр.', 'ул. Советская, 118', 'пр. Победы, 7',
      'Развязка «Южная», съезд 3', 'ул. Заводская × пер. Тихий', 'Набережная, 5',
      'ул. Чехова, 26', 'Московское шоссе, 88', 'ул. Энтузиастов, 7',
      'Трасса Р-239, 12-й км', 'ул. Садовая, 3',
    ];
    // цвет = уровень срочности: низкий → зелёный, средний → янтарный, высокий → красный
    const levels = [
      { label: 'НИЗКАЯ', color: 'var(--green)' },
      { label: 'СРЕДНЯЯ', color: 'var(--amber)' },
      { label: 'ВЫСОКАЯ', color: 'var(--red)' },
    ];
    const padTick = (n) => String(n).padStart(2, '0');
    const ago = (min) => {
      const d = new Date(Date.now() - min * 60000);
      return padTick(d.getHours()) + ':' + padTick(d.getMinutes());
    };

    // две копии ленты подряд: анимация сдвигается на 50% и шов незаметен
    let html = '';
    for (let copy = 0; copy < 2; copy++) {
      for (let i = 0; i < 12; i++) {
        const level = levels[i % levels.length];
        html += '<div class="ticker__item">' +
          '<i class="ticker__dot" style="background:' + level.color + ';box-shadow:0 0 8px ' + level.color + '"></i>' +
          '<span class="ticker__time">' + ago(Math.floor(Math.random() * 25)) + '</span>' +
          '<span>' + streets[(i * 3 + copy) % streets.length] + '</span>' +
          '<span class="ticker__type" style="color:' + level.color + '">' + level.label + '</span>' +
          '</div>';
      }
    }
    tickerRow.innerHTML = html;
  }

  // ── FAQ: плавное раскрытие/скрытие ответов ────────────────────
  // Ответ оборачивается в два слоя, высота анимируется через
  // grid-template-rows: 0fr → 1fr. Браузер сам считает высоту контента,
  // поэтому анимация без рывков в обе стороны.
  // Аккордеон: одновременно открыт один пункт, остальные плавно сворачиваются.
  const faqItems = document.querySelectorAll('.faq details');
  if (faqItems.length && !prefersReduced) {
    const DUR = 420;
    const EASE = 'cubic-bezier(0.2, 0.8, 0.3, 1)';
    const state = new Map();

    faqItems.forEach((item) => {
      const summary = item.querySelector('summary');
      const answer = item.querySelector('p');
      if (!summary || !answer) return;

      const wrap = document.createElement('div');
      const inner = document.createElement('div');
      wrap.className = 'faq__a';
      inner.className = 'faq__a-in';
      answer.replaceWith(wrap);
      inner.appendChild(answer);
      wrap.appendChild(inner);

      state.set(item, { wrap, busy: false });
    });

    const transitionOn = (wrap, cb) => {
      let done = false;
      const settle = () => {
        if (done) return;
        done = true;
        wrap.removeEventListener('transitionend', onEnd);
        cb();
      };
      const onEnd = (e) => {
        if (e.target === wrap && e.propertyName === 'grid-template-rows') settle();
      };
      wrap.addEventListener('transitionend', onEnd);
      setTimeout(settle, DUR + 80); // страховка, если transitionend не дошёл
    };

    const closeItem = (item) => {
      const s = state.get(item);
      if (!s || s.busy) return;
      s.busy = true;
      item.classList.add('is-animating');
      s.wrap.style.transition = 'grid-template-rows ' + DUR + 'ms ' + EASE;
      s.wrap.style.gridTemplateRows = '0fr';
      transitionOn(s.wrap, () => {
        item.open = false;
        s.wrap.style.transition = '';
        s.wrap.style.gridTemplateRows = '';
        item.classList.remove('is-animating');
        s.busy = false;
      });
    };

    const openItem = (item) => {
      const s = state.get(item);
      s.busy = true;
      item.open = true;
      item.classList.add('is-animating');
      s.wrap.style.gridTemplateRows = '0fr';
      void s.wrap.offsetHeight; // фиксируем стартовый кадр без ожидания rAF
      s.wrap.style.transition = 'grid-template-rows ' + DUR + 'ms ' + EASE;
      s.wrap.style.gridTemplateRows = '1fr';
      transitionOn(s.wrap, () => {
        s.wrap.style.transition = '';
        s.wrap.style.gridTemplateRows = '';
        item.classList.remove('is-animating');
        s.busy = false;
      });
    };

    faqItems.forEach((item) => {
      const s = state.get(item);
      if (!s) return;
      item.querySelector('summary').addEventListener('click', (e) => {
        e.preventDefault();
        if (s.busy) return;
        const wasOpen = item.open;

        // аккордеон: плавно сворачиваем все остальные открытые пункты
        document.querySelectorAll('.faq details[open]').forEach((o) => {
          if (o !== item) closeItem(o);
        });

        if (wasOpen) closeItem(item);
        else openItem(item);
      });
    });
  }

  // ── Липкая CTA на мобильных ───────────────────────────────────
  const sticky = document.querySelector('.sticky-cta');
  if (sticky) {
    let ctaOnScreen = false;
    const ctaSection = document.getElementById('cta');

    const syncSticky = () => {
      // показываем после прокрутки первого экрана и прячем у финального CTA
      const show = window.innerWidth <= 720 &&
        window.scrollY > window.innerHeight * 0.8 &&
        !ctaOnScreen;
      sticky.classList.toggle('is-visible', show);
    };

    if (ctaSection && 'IntersectionObserver' in window) {
      const ctaObserver = new IntersectionObserver(
        (entries) => {
          ctaOnScreen = entries[0].isIntersecting;
          syncSticky();
        },
        { threshold: 0.1 }
      );
      ctaObserver.observe(ctaSection);
    } else if (!ctaSection) {
      ctaOnScreen = true; // секции нет — не показываем вовсе
    }

    window.addEventListener('scroll', syncSticky, { passive: true });
    window.addEventListener('resize', syncSticky);
  }

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
