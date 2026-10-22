/* Preview-only behaviour: auto-scrolling marquees that pause on touch/hover and can be swiped,
   plus active-dot tracking for swipe rows. The Shopify build reimplements this in the theme. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- marquees -------------------------------------------------------------
  document.querySelectorAll('.eh-marquee').forEach(function (track) {
    var wrap = track.parentElement;
    if (!wrap) return;
    var m = /eh-marquee\s+([\d.]+)s/.exec(track.getAttribute('style') || '');
    var dur = m ? parseFloat(m[1]) : 40;
    wrap.classList.add('eh-scroll');
    track.style.animation = 'none';

    var paused = reduce, resumeTimer = null, pos = 0, last = null, half = 0;
    function measure() { half = track.scrollWidth / 2; }
    measure();
    window.addEventListener('resize', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    function pause() { paused = true; clearTimeout(resumeTimer); resumeTimer = null; }
    function resumeSoon(ms) { clearTimeout(resumeTimer); resumeTimer = setTimeout(function () { resumeTimer = null; pos = wrap.scrollLeft; paused = reduce; }, ms); }

    var lastTouch = 0;
    // Mouse: hover pauses, leaving resumes. Browsers synthesise mouse events after a tap, so ignore those.
    wrap.addEventListener('mouseenter', function () { if (Date.now() - lastTouch > 1200) pause(); });
    wrap.addEventListener('mouseleave', function () { if (Date.now() - lastTouch > 1200) resumeSoon(150); });
    // Touch: finger down pauses; lifting resumes after a moment; a tap while paused resumes at once.
    wrap.addEventListener('touchstart', function () {
      lastTouch = Date.now();
      if (paused && !resumeTimer) { pos = wrap.scrollLeft; paused = reduce; return; }
      pause();
    }, { passive: true });
    wrap.addEventListener('touchend', function () { lastTouch = Date.now(); if (paused) resumeSoon(800); }, { passive: true });
    wrap.addEventListener('touchcancel', function () { lastTouch = Date.now(); if (paused) resumeSoon(800); }, { passive: true });
    wrap.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') { pause(); } });
    wrap.addEventListener('scroll', function () {
      // keep the loop seamless when the user drags past either end
      if (!half) return;
      if (wrap.scrollLeft >= half) wrap.scrollLeft -= half;
      else if (wrap.scrollLeft < 1 && paused) wrap.scrollLeft += half;
      if (paused) pos = wrap.scrollLeft;
    }, { passive: true });

    function tick(t) {
      if (last == null) last = t;
      var dt = Math.min(64, t - last); last = t;
      if (!paused && half > 0) {
        pos += (half / dur) * (dt / 1000);
        if (pos >= half) pos -= half;
        wrap.scrollLeft = pos;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  // --- swipe rows: active dot ------------------------------------------------
  document.querySelectorAll('.eh-swipe').forEach(function (row) {
    var dots = row.parentElement && row.parentElement.querySelector('.eh-dots');
    if (!dots) return;
    var pips = Array.prototype.slice.call(dots.children);
    var items = Array.prototype.slice.call(row.children).filter(function (el) { return el.tagName !== 'STYLE'; });
    function update() {
      var x = row.scrollLeft, idx = 0, best = Infinity;
      items.forEach(function (el, i) { var d = Math.abs(el.offsetLeft - row.offsetLeft - x - 16); if (d < best) { best = d; idx = i; } });
      pips.forEach(function (p, i) {
        var on = i === idx;
        p.style.width = on ? '18px' : '6px';
        p.style.background = on ? '#3E4256' : 'rgba(31,31,31,0.2)';
      });
    }
    row.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    update();
  });
})();
