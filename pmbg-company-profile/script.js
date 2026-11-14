/* P²MBG Company Profile — interactivity
   1  Surname micro-rule         7  Flip card (theorist)
   2  Toast messages            8  Video player hook (data-embed)
   3  Light / dark theme        9  Reflection tabs + team buttons
   4  Nav: scrollspy + progress 10 Copy buttons
   5  Reveal + count-up         11 Lightbox
   6  Org chart switcher        12 Logo bounce, back to top           */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  root.classList.add('js');

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var behavior = reduce ? 'auto' : 'smooth';

  /* ---------- 1 · Surname micro-rule ----------
     Two rows of the five surnames, repeated across the full width. The second
     row starts two names later so the rows don't line up. Each surname takes
     the colour of its blob in the logo (set through the --c custom property). */
  (function buildRule() {
    var rule = $('#rule');
    if (!rule) return;
    var members = [
      { name: 'Gevera',   color: 'lime' },
      { name: 'Paller',   color: 'sky' },
      { name: 'Pasion',   color: 'ice' },
      { name: 'Beltran',  color: 'pink' },
      { name: 'Mendiola', color: 'violet' }
    ];
    var REPEATS = 30;
    var ROWS = 2;
    var track = doc.createElement('div');
    track.className = 'names-track';
    for (var r = 0; r < ROWS; r++) {
      var row = doc.createElement('div');
      var shift = r * 2;
      for (var n = 0; n < REPEATS; n++) {
        for (var i = 0; i < members.length; i++) {
          var m = members[(i + shift) % members.length];
          var span = doc.createElement('span');
          span.textContent = m.name;
          span.style.setProperty('--c', 'var(--' + m.color + ')');
          row.appendChild(span);
        }
      }
      track.appendChild(row);
    }
    rule.appendChild(track);
  })();

  /* ---------- 2 · Toast ---------- */
  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
  }

  /* ---------- 3 · Theme ---------- */
  (function theme() {
    var btn = $('#theme');
    function systemTheme() {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function apply(t) {
      root.setAttribute('data-theme', t);
      if (btn) {
        btn.setAttribute('aria-pressed', String(t === 'dark'));
        btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      }
    }
    var saved = null;
    try { saved = localStorage.getItem('pmbg-theme'); } catch (e) {}
    apply(saved === 'dark' || saved === 'light' ? saved : systemTheme());
    if (btn) {
      btn.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        apply(next);
        try { localStorage.setItem('pmbg-theme', next); } catch (e) {}
      });
    }
  })();

  /* ---------- 4 · Nav: scrollspy + progress ---------- */
  (function nav() {
    var navEl = $('.nav');
    var pills = $$('.pill');
    var bands = $$('.band');

    function setActive(id) {
      pills.forEach(function (p) {
        var on = p.getAttribute('href') === '#' + id;
        if (on) {
          p.setAttribute('aria-current', 'true');
          var box = p.parentNode;
          if (box.scrollTo) {
            box.scrollTo({ left: p.offsetLeft - (box.clientWidth - p.clientWidth) / 2, behavior: behavior });
          }
        } else {
          p.removeAttribute('aria-current');
        }
      });
    }
    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
      }, { rootMargin: '-40% 0px -55% 0px' });
      bands.forEach(function (b) { spy.observe(b); });
    }

    var ticking = false;
    function updateProgress() {
      ticking = false;
      var h = root.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, window.pageYOffset / h) : 0;
      if (navEl) navEl.style.setProperty('--p', (p * 100).toFixed(1) + '%');
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(updateProgress); }
    }, { passive: true });
    updateProgress();
  })();

  /* ---------- 5 · Reveal on scroll + count-up ---------- */
  (function motion() {
    var items = $$('.rv');
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      items.forEach(function (el) { io.observe(el); });
    } else {
      items.forEach(function (el) { el.classList.add('in'); });
    }

    $$('[data-count]').forEach(function (el) {
      var end = Number(el.getAttribute('data-count')) || 0;
      el.textContent = String(end);
      if (reduce || !('IntersectionObserver' in window)) return;
      var o = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        o.disconnect();
        var t0 = performance.now();
        (function step(t) {
          var k = Math.min(1, (t - t0) / 900);
          el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 3))));
          if (k < 1) window.requestAnimationFrame(step);
        })(t0);
      });
      o.observe(el);
    });
  })();

  /* ---------- 6 · Org chart switcher ---------- */
  (function orgChart() {
    var chart = $('#orgsvg');
    var buttons = $$('[data-variant]');
    if (!chart) return;
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        chart.setAttribute('data-active', btn.getAttribute('data-variant'));
      });
    });
  })();

  /* ---------- 7 · Flip card ---------- */
  (function flipCard() {
    var flip = $('#flip');
    if (!flip) return;
    function toggle() {
      flip.setAttribute('aria-pressed', String(flip.getAttribute('aria-pressed') !== 'true'));
    }
    flip.addEventListener('click', toggle);
    flip.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  })();

  /* ---------- 8 · Video hook ----------
     Put the embed link in the data-embed attribute of #video (index.html),
     e.g. data-embed="https://www.youtube.com/embed/VIDEO_ID".
     Clicking play then loads it in place. */
  (function video() {
    var box = $('#video');
    var play = $('#play');
    if (!box || !play) return;
    play.addEventListener('click', function () {
      var src = (box.getAttribute('data-embed') || '').trim();
      if (!src) {
        box.classList.remove('nudge');
        void box.offsetWidth;
        box.classList.add('nudge');
        toast('Add your video link to data-embed in index.html');
        return;
      }
      var frame = doc.createElement('iframe');
      frame.src = src;
      frame.title = 'Intro video about the company';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      frame.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(frame);
    });
  })();

  /* ---------- 9 · Reflection tabs + team buttons ---------- */
  (function reflection() {
    var tabs = $$('[role="tab"]');
    var panels = $$('[role="tabpanel"]');
    if (!tabs.length) return;

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var to = null;
        if (e.key === 'ArrowRight') to = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') to = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') to = tabs[0];
        else if (e.key === 'End') to = tabs[tabs.length - 1];
        if (to) { e.preventDefault(); select(to, true); }
      });
    });

    $$('[data-member]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = $('#tab-' + btn.getAttribute('data-member'));
        var target = $('#s4');
        if (tab) select(tab, false);
        if (target) target.scrollIntoView({ behavior: behavior, block: 'start' });
      });
    });
  })();

  /* ---------- 10 · Copy buttons ---------- */
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = $(btn.getAttribute('data-copy'));
      if (!target) return;
      var text = target.textContent.trim();

      function done() {
        btn.classList.add('ok');
        btn.textContent = 'Copied';
        toast('Copied to clipboard');
        setTimeout(function () { btn.classList.remove('ok'); btn.textContent = 'Copy'; }, 1800);
      }
      function fallback() {
        var range = doc.createRange();
        range.selectNodeContents(target);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        toast('Selected. Press Ctrl+C (or Cmd+C) to copy');
      }
      try {
        navigator.clipboard.writeText(text).then(done, fallback);
      } catch (e) {
        fallback();
      }
    });
  });

  /* ---------- 11 · Lightbox ---------- */
  (function lightbox() {
    var lb = $('#lb');
    var body = $('#lb-body');
    if (!lb || !body) return;
    $$('[data-zoom]').forEach(function (el) {
      el.addEventListener('click', function () {
        var clone = el.cloneNode(true);
        clone.removeAttribute('data-zoom');
        clone.removeAttribute('type');
        clone.removeAttribute('id');
        $$('[id]', clone).forEach(function (n) { n.removeAttribute('id'); });
        body.innerHTML = '';
        body.appendChild(clone);
        if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
      });
    });
    function close() { if (typeof lb.close === 'function') lb.close(); else lb.removeAttribute('open'); }
    $('#lb-x').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  })();

  /* ---------- 12 · Logo bounce, back to top ---------- */
  (function extras() {
    var logo = $('#logo');
    if (logo) {
      logo.addEventListener('click', function () {
        logo.classList.remove('jump');
        void logo.getBoundingClientRect();
        logo.classList.add('jump');
      });
      // the blobs bounce one after another; reset once the last one lands
      logo.addEventListener('animationend', function (e) {
        if (e.animationName === 'jump' && e.target.style.getPropertyValue('--i').trim() === '4') {
          logo.classList.remove('jump');
        }
      });
    }
    var top = $('#top');
    if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: behavior }); });
  })();
})();
