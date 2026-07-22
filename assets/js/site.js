(() => {
  const header = document.querySelector('[data-site-header]');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 960) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }

  document.querySelectorAll('[data-current-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  const filterInput = document.querySelector('[data-filter-input]');
  const filterList = document.querySelector('[data-filter-list]');
  const filterStatus = document.querySelector('[data-filter-status]');
  const filterEmpty = document.querySelector('[data-filter-empty]');
  if (filterInput && filterList) {
    const items = [...filterList.querySelectorAll('.filter-item')];
    const sessions = [...filterList.querySelectorAll('[data-program-session]')];
    const total = items.length;
    const noun = document.body.classList.contains('program-page') ? 'talks' : 'papers';
    const update = () => {
      const query = filterInput.value.trim().toLocaleLowerCase();
      let visible = 0;
      items.forEach((item) => {
        const text = item.dataset.filterText || item.textContent.toLocaleLowerCase();
        const match = !query || text.includes(query);
        item.hidden = !match;
        if (match) visible += 1;
      });
      sessions.forEach((session) => {
        const sessionItems = [...session.querySelectorAll('.filter-item')];
        session.hidden = sessionItems.length > 0 && sessionItems.every((item) => item.hidden);
      });
      if (filterStatus) {
        const acceptedPage = document.body.classList.contains('accepted-page');
        if (acceptedPage) {
          filterStatus.textContent = query
            ? (visible === 0 ? 'No matching papers' : 'Showing matching papers')
            : 'Showing all accepted papers';
        } else {
          filterStatus.textContent = query ? `Showing ${visible} of ${total} ${noun}` : `Showing all ${total} ${noun}`;
        }
      }
      if (filterEmpty) filterEmpty.hidden = visible !== 0;
    };
    filterInput.addEventListener('input', update);
  }

  document.querySelectorAll('[data-details-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const open = button.dataset.detailsAction === 'open';
      document.querySelectorAll('.talk-card:not([hidden])').forEach((details) => {
        details.open = open;
      });
    });
  });

  let printState = [];
  window.addEventListener('beforeprint', () => {
    printState = [...document.querySelectorAll('.talk-card')].map((d) => d.open);
    document.querySelectorAll('.talk-card').forEach((d) => { d.open = true; });
  });
  window.addEventListener('afterprint', () => {
    document.querySelectorAll('.talk-card').forEach((d, i) => { d.open = printState[i] ?? false; });
  });

  // During ITC 2026, open the program at the session or event currently in progress.
  // Explicit anchors and browser back/forward restoration take precedence.
  const programSchedule = document.querySelector('[data-program-autoscroll]');
  if (programSchedule && !location.hash) {
    const navigationEntry = typeof performance?.getEntriesByType === 'function'
      ? performance.getEntriesByType('navigation')[0]
      : null;
    const restoringHistory = navigationEntry?.type === 'back_forward';
    const scheduleItems = [...programSchedule.querySelectorAll('[data-schedule-start][data-schedule-end]')]
      .map((element) => ({
        element,
        start: Date.parse(element.dataset.scheduleStart || ''),
        end: Date.parse(element.dataset.scheduleEnd || ''),
        date: (element.dataset.scheduleStart || '').slice(0, 10),
      }))
      .filter(({ start, end, date }) => date && Number.isFinite(start) && Number.isFinite(end) && end > start)
      .sort((a, b) => a.start - b.start);

    if (!restoringHistory && scheduleItems.length > 0) {
      const now = Date.now();
      // Overlapping social events are resolved in favor of the one that began most recently.
      let current = scheduleItems
        .filter(({ start, end }) => now >= start && now < end)
        .sort((a, b) => b.start - a.start)[0];

      // Treat only very short unscheduled gaps as part of the live program, moving to
      // the next item when it begins within fifteen minutes. This avoids overnight jumps.
      if (!current) {
        const upcoming = scheduleItems.find(({ start }) => start > now);
        const fifteenMinutes = 15 * 60 * 1000;
        if (upcoming && upcoming.start - now <= fifteenMinutes) current = upcoming;
      }

      if (current) {
        current.element.classList.add('is-current-program-item');
        current.element.setAttribute('aria-current', 'time');

        const scrollToCurrent = () => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => current.element.scrollIntoView({ block: 'start', behavior: 'auto' }));
          });
        };

        if (document.readyState === 'complete') scrollToCurrent();
        else window.addEventListener('load', scrollToCurrent, { once: true });
      }
    }
  }

  // When following a deep link to a talk, open its abstract and place it comfortably below the sticky header.
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target instanceof HTMLDetailsElement) {
      target.open = true;
      requestAnimationFrame(() => target.scrollIntoView({block: 'start'}));
    }
  }
})();
