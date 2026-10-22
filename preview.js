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

/* --- mobile / tablet menu drawer (preview only) --- */
(function () {
  var btn = document.querySelector('a[aria-label="Menu"]');
  if (!btn) return;
  var dev = (location.pathname.match(/(desktop|tablet|mobile)\.html$/) || [])[1] || 'mobile';
  var items = [['Shop by Product', '../collection-oils/' + dev + '.html'], ['Shop by Benefit', '../collection-sleep/' + dev + '.html'], ['CBD Wisdom', '../soon/' + dev + '.html?what=CBD%20Wisdom'], ['Find Your CBD', '../soon/' + dev + '.html?what=Find%20Your%20CBD%20quiz'], ['Our Story', '../soon/' + dev + '.html?what=Our%20Story'], ['Contact', '../soon/' + dev + '.html?what=Contact']];
  var sub = [['CBD Oils', '../collection-oils/' + dev + '.html'], ['Gummies', '../soon/' + dev + '.html?what=Gummies'], ['Softgels', '../soon/' + dev + '.html?what=Softgels'], ['Topical Salve', '../soon/' + dev + '.html?what=Salve'], ['CBD for Pets', '../soon/' + dev + '.html?what=Pet%20CBD'], ['Bundles', '../soon/' + dev + '.html?what=Bundles']];
  var ben = [['Sleep Support', '../collection-sleep/' + dev + '.html'], ['Calm & Stress', '../soon/' + dev + '.html?what=Calm%20%26%20Stress'], ['Pain & Recovery', '../soon/' + dev + '.html?what=Pain%20%26%20Recovery'], ['Focus & Energy', '../soon/' + dev + '.html?what=Focus%20%26%20Energy'], ['Social & Uplift', '../soon/' + dev + '.html?what=Social%20%26%20Uplift']];
  var J = "font-family:'Josefin Sans',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.18em;";
  var d = document.createElement('div');
  d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Menu');
  d.style.cssText = 'position:fixed;inset:0;z-index:50;display:none;background:rgba(31,31,31,.35);';
  d.innerHTML = '<div style="position:absolute;top:0;left:0;bottom:0;width:min(86vw,360px);background:#F7F2EC;box-shadow:20px 0 60px rgba(31,31,31,.2);display:flex;flex-direction:column;overflow:auto;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid rgba(31,31,31,.12);"><span style="' + J + 'font-size:12px;">Menu</span><button type="button" data-close aria-label="Close menu" style="width:40px;height:40px;border:0;background:transparent;font-size:22px;cursor:pointer;color:#1F1F1F;">&times;</button></div>'
    + '<div style="padding:8px 20px 24px;display:flex;flex-direction:column;">'
    + '<div style="padding:14px 0 6px;' + J + 'font-size:10px;color:#9B7560;letter-spacing:.26em;font-weight:600;">Shop by product</div>' + sub.map(function (x) { return '<a href="' + x[1] + '" style="padding:10px 0;font-size:16px;color:#1F1F1F;text-decoration:none;border-bottom:1px solid rgba(31,31,31,.08);">' + x[0] + '</a>'; }).join('')
    + '<div style="padding:18px 0 6px;' + J + 'font-size:10px;color:#9B7560;letter-spacing:.26em;font-weight:600;">Shop by benefit</div>' + ben.map(function (x) { return '<a href="' + x[1] + '" style="padding:10px 0;font-size:16px;color:#1F1F1F;text-decoration:none;border-bottom:1px solid rgba(31,31,31,.08);">' + x[0] + '</a>'; }).join('')
    + '<div style="padding:18px 0 6px;"></div>' + items.slice(2).map(function (x) { return '<a href="' + x[1] + '" style="padding:12px 0;' + J + 'font-size:12px;color:#1F1F1F;text-decoration:none;">' + x[0] + '</a>'; }).join('')
    + '</div></div>';
  document.body.appendChild(d);
  function open() { d.style.display = 'block'; document.body.style.overflow = 'hidden'; }
  function close() { d.style.display = 'none'; document.body.style.overflow = ''; }
  btn.addEventListener('click', function (e) { e.preventDefault(); open(); });
  d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
