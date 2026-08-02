/* Shared behaviour for every page. Each block guards for elements that only
   exist on some pages, so one file can serve the whole site. */

var yr = document.getElementById('yr');
if (yr) yr.textContent = new Date().getFullYear();

/* menu */
var burger = document.getElementById('burger'), nav = document.getElementById('nav');
if (burger && nav) {
  var setNav = function (open) {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', function () { setNav(!nav.classList.contains('open')); });
  nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setNav(false); burger.focus(); }
  });
}

/* map (contact page). The Google embed sets its own cookies, so its src is held
   in data-src and only applied once the visitor has agreed — or clicked "Show
   map" for this visit alone. The frame is revealed only on a real load, so a
   blocked iframe leaves the address placeholder visible instead of a blank box. */
var map = document.getElementById('map');
var frame = map && map.querySelector('iframe[data-src]');
if (frame) frame.addEventListener('load', function () { map.classList.add('ready'); });

function loadMap() {
  if (frame && !frame.src) frame.src = frame.dataset.src;
}

/* Google Analytics 4 — injected only after consent, never on page load, so a
   visitor who declines is never given an analytics cookie at all. */
var GA_ID = 'G-6CN6CZRSQD';
var gaLoaded = false;
function loadAnalytics() {
  if (gaLoaded) return;
  gaLoaded = true;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { anonymize_ip: true });
}


/* Cookie preferences. Nothing that sets a cookie runs on load — analytics and
   the Google map are both injected only after an explicit opt-in, per category.
   The stored value is versioned so the shape can change later without breaking. */
var CONSENT = 'vrb-consent';

function readConsent() {
  try {
    var raw = localStorage.getItem(CONSENT);
    if (!raw) return null;
    if (raw === 'accept') return { analytics: true, maps: true };   // pre-v1 values
    if (raw === 'decline') return { analytics: false, maps: false };
    var o = JSON.parse(raw);
    return { analytics: !!o.analytics, maps: !!o.maps };
  } catch (e) { return null; }
}
function writeConsent(c) {
  try { localStorage.setItem(CONSENT, JSON.stringify({ v: 1, analytics: c.analytics, maps: c.maps })); }
  catch (e) { /* private mode — choice simply will not persist */ }
}
function applyConsent(c) {
  if (c.maps) loadMap();
  if (c.analytics) loadAnalytics();
}

var cookie = document.getElementById('cookie');
var saved = readConsent();
if (saved) applyConsent(saved);

if (cookie) {
  var closeNotice = function () { cookie.classList.remove('show'); };
  if (!saved) setTimeout(function () { cookie.classList.add('show'); }, 600);

  // delegated on document so the map placeholder's button works too
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cookie]');
    if (!btn) return;
    var act = btn.getAttribute('data-cookie');

    if (act === 'open') { cookie.classList.add('show'); return; }

    var choice = act === 'all'
      ? { analytics: true, maps: true }
      : { analytics: false, maps: false };
    writeConsent(choice);
    applyConsent(choice);
    closeNotice();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && cookie.classList.contains('show')) closeNotice();
  });
}


/* mobile action bar: on the home page it waits until the hero is behind you.
   Inner pages have no hero, so it shows straight away. */
var bar = document.getElementById('bar');
if (bar) {
  var heroEl = document.getElementById('top');
  if (heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      bar.classList.toggle('show', !en[0].isIntersecting);
    }, { threshold: 0 }).observe(heroEl);
  } else {
    bar.classList.add('show');
  }
}

/* Reveal on scroll, with belt and braces. IntersectionObserver does not fire in
   a background tab, so without a fallback a page opened in the background stays
   blank even after JS has run. Anything still hidden after a moment is shown
   unconditionally. */
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var rv = [].slice.call(document.querySelectorAll('.rv'));
function revealAll() { rv.forEach(function (el) { el.classList.add('in'); }); }

/* Only catch up sections that are actually on screen. Revealing everything on a
   timer meant each section had already animated by the time you scrolled to it,
   so the entrances were never seen. */
function revealVisible() {
  rv.forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.9 && r.bottom > 0) el.classList.add('in');
  });
}

if (reduced || !('IntersectionObserver' in window)) {
  revealAll();
} else {
  var rio = new IntersectionObserver(function (en) {
    en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
  }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
  rv.forEach(function (el) { rio.observe(el); });

  // a tab that loaded hidden gets no callbacks; catch up what is on screen once
  // it is looked at, and let the observer handle everything below the fold
  document.addEventListener('visibilitychange', function () { if (!document.hidden) revealVisible(); });
  if (document.hidden) revealVisible(); else setTimeout(revealVisible, 2500);
}

/* ── Reviews rail ──────────────────────────────────────────────────────────
   The card set is cloned three times and the view parked in the middle copy.
   When scrolling drifts into an outer copy we shift by exactly one set width,
   which is visually identical, so the rail loops forever with no empty space
   at either end. Whichever card sits nearest the centre stays opaque. */
(function () {
  var rail = document.getElementById('revrail');
  if (!rail) return;
  var track = rail.firstElementChild;
  var originals = track ? [].slice.call(track.children) : [];
  var n = originals.length;
  if (!n) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // five identical copies with the view parked in the middle one. More runway
  // than three, so trackpad momentum never reaches a real end of the track.
  var COPIES = 5, HOME = 2;
  for (var copy = 0; copy < COPIES - 1; copy++) {
    originals.forEach(function (c) {
      var d = c.cloneNode(true);
      d.setAttribute('aria-hidden', 'true');
      track.appendChild(d);
    });
  }
  var cards = [].slice.call(track.children);
  var setW = 0, timer = null, paused = false, looping = false;

  function measure() {
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    setW = n * cards[0].offsetWidth + n * gap;
  }
  function centreIndex() {
    var rr = rail.getBoundingClientRect(), mid = rr.left + rr.width / 2;
    var best = 0, bestD = Infinity;
    for (var i = 0; i < cards.length; i++) {
      var cr = cards[i].getBoundingClientRect();
      var d = Math.abs((cr.left + cr.width / 2) - mid);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }
  // Shift by exactly one set as soon as we drift out of the home copy. The jump
  // is visually identical, and snapping is suspended for the single frame it
  // takes so the browser does not re-snap and stutter mid-momentum.
  function recentre() {
    if (looping || !setW) return;
    var shift = 0;
    if (rail.scrollLeft < setW * (HOME - 0.5)) shift = setW;
    else if (rail.scrollLeft > setW * (HOME + 0.5)) shift = -setW;
    if (!shift) return;
    looping = true;
    var prev = rail.style.scrollSnapType;
    rail.style.scrollSnapType = 'none';
    rail.scrollLeft += shift;
    void rail.offsetWidth;
    rail.style.scrollSnapType = prev || '';
    looping = false;
  }
  function sync() {
    var active = centreIndex();
    for (var i = 0; i < cards.length; i++) cards[i].classList.toggle('is-active', i === active);
    if (dots) {
      var real = active % n;
      for (var j = 0; j < dots.children.length; j++) {
        dots.children[j].setAttribute('aria-current', j === real ? 'true' : 'false');
      }
    }
  }
  function goTo(i, behavior) {
    var rr = rail.getBoundingClientRect(), cr = cards[i].getBoundingClientRect();
    rail.scrollTo({ left: rail.scrollLeft + (cr.left + cr.width / 2) - (rr.left + rr.width / 2),
                    behavior: behavior || 'smooth' });
  }

  var dots = null;
  if (n > 1) {
    dots = document.createElement('div');
    dots.className = 'revdots';
    dots.setAttribute('aria-label', 'Reviews');
    originals.forEach(function (_, idx) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Review ' + (idx + 1));
      b.addEventListener('click', function () { goTo(n * HOME + idx); });
      dots.appendChild(b);
    });
    rail.parentNode.insertBefore(dots, rail.nextSibling);
  }

  rail.addEventListener('scroll', sync, { passive: true });

  // treat any recent wheel/touch as "the visitor is driving" and hold off
  var userUntil = 0;
  ['wheel', 'touchmove', 'pointerdown'].forEach(function (ev) {
    rail.addEventListener(ev, function () { userUntil = Date.now() + 1600; }, { passive: true });
  });
  window.addEventListener('resize', function () { measure(); goTo(n * HOME, 'instant'); sync(); });
  ['pointerenter', 'focusin', 'touchstart'].forEach(function (ev) {
    rail.addEventListener(ev, function () { paused = true; }, { passive: true });
  });
  ['pointerleave', 'focusout'].forEach(function (ev) {
    rail.addEventListener(ev, function () { paused = false; }, { passive: true });
  });

  // Wrap while the rail is stationary, never during a smooth scroll: shifting
  // scrollLeft mid-animation leaves the browser animating toward the old
  // absolute target, which lands the card off-centre.
  function advance() {
    if (paused || looping || Date.now() < userUntil) return;
    recentre();
    goTo(centreIndex() + 1);
  }

  // user-driven scrolling wraps once it settles
  var settle = null;
  rail.addEventListener('scroll', function () {
    clearTimeout(settle);
    settle = setTimeout(function () {
      if (!paused && Date.now() >= userUntil - 1500) recentre();
    }, 120);
  }, { passive: true });

  measure();
  goTo(n * HOME, 'instant');   // park on the first card of the middle copy
  sync();
  if (!reduced) timer = setInterval(advance, 5000);
})();

/* ── Lightbox ──────────────────────────────────────────────────────────────
   Any gallery photo opens enlarged. Focus moves to the close button and
   returns to the thumbnail on close, Escape and backdrop both dismiss, and
   the page behind is locked from scrolling. */
(function () {
  var lb = document.getElementById('lightbox');
  if (!lb) return;
  var img = document.getElementById('lbImg');
  var cap = document.getElementById('lbCap');
  var closeBtn = document.getElementById('lbClose');
  var opener = null;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var anim = null;

  // rAF is suspended in background tabs, so pair it with a timer and take
  // whichever fires first — the panel must never be left half-open.
  function soon(fn) {
    var done = false;
    var run = function () { if (done) return; done = true; fn(); };
    requestAnimationFrame(run);
    setTimeout(run, 50);
  }

  // FLIP: show the image where the thumbnail is, then animate it to where it
  // belongs. Reversed on close, so the photo appears to grow out of the grid
  // and shrink back into it.
  function flip(from, back) {
    if (reduced || !from) return null;
    var a = from.getBoundingClientRect();
    var b = img.getBoundingClientRect();
    if (!b.width || !b.height) return null;
    var sx = a.width / b.width, sy = a.height / b.height;
    var tx = a.left - b.left, ty = a.top - b.top;
    var thumb = 'translate(' + tx + 'px,' + ty + 'px) scale(' + sx + ',' + sy + ')';
    var frames = back ? ['none', thumb] : [thumb, 'none'];
    return img.animate(
      [{ transform: frames[0] }, { transform: frames[1] }],
      { duration: back ? 260 : 340, easing: back ? 'cubic-bezier(.4,0,.7,.3)' : 'cubic-bezier(.2,.8,.25,1)', fill: 'both' }
    );
  }

  function open(src, alt, caption, from) {
    opener = from;
    img.src = src;
    img.alt = alt || '';
    cap.textContent = caption || '';
    cap.hidden = !caption;
    lb.classList.add('mounted');
    document.body.classList.add('lb-open');

    // Open on the next frame regardless of image state — the panel must never
    // depend on a load event that may not fire for a cached image.
    soon(function () {
      lb.classList.add('show');
      closeBtn.focus({ preventScroll: true });
      if (anim) { anim.cancel(); anim = null; }
      anim = flip(from, false);
      // if the bitmap had no size yet, run the zoom once it does
      if (!anim && !(img.complete && img.naturalWidth)) {
        img.addEventListener('load', function () {
          if (anim) anim.cancel();
          anim = flip(from, false);
        }, { once: true });
      }
    });
  }

  function close() {
    if (!lb.classList.contains('mounted')) return;
    lb.classList.remove('show');
    if (anim) anim.cancel();
    anim = flip(opener, true);
    var done = function () {
      lb.classList.remove('mounted');
      document.body.classList.remove('lb-open');
      img.src = '';
      if (opener && opener.focus) opener.focus({ preventScroll: true });
      opener = null;
    };
    if (anim) anim.onfinish = done; else setTimeout(done, reduced ? 0 : 260);
  }

  document.addEventListener('click', function (e) {
    var frame = e.target.closest('.shot__f');
    if (frame) {
      var i = frame.querySelector('img');
      if (!i || !i.currentSrc && !i.src) return;
      var fig = frame.closest('figure');
      var fc = fig && fig.querySelector('figcaption');
      e.preventDefault();
      open(i.currentSrc || i.src, i.alt, fc ? fc.textContent.trim() : '', frame);
      return;
    }
    if (e.target.closest('#lbClose') || e.target === lb) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('mounted')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }   // single focusable
  });

  // make the frames reachable by keyboard
  document.querySelectorAll('.shot__f').forEach(function (f) {
    f.setAttribute('tabindex', '0');
    f.setAttribute('role', 'button');
    var i = f.querySelector('img');
    f.setAttribute('aria-label', 'Enlarge photo' + (i && i.alt ? ': ' + i.alt : ''));
    f.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f.click(); }
    });
  });
})();

