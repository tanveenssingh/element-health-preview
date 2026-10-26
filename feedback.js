/* Element Health preview · "Leave feedback" pins.
   Notes are saved to a Google Sheet through an Apps Script web app (ENDPOINT).
   Each note stores the page, view (desktop / tablet / mobile), the nearest heading and the
   exact spot clicked, so a pin can be drawn back on the same element later. */
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbyZ29CnRvyCXW5cNOUF34aMVPTz-UhtaJYGY-s7bBdqpDQAHzfCl9Dvig8vndnE-EawXQ/exec';
  var TITLES = {"home": "Home", "product-max-60": "Product \u00b7 Max Strength 60 mL", "collection-oils": "Collection \u00b7 Oils & Tinctures (by product)", "collection-sleep": "Collection \u00b7 Sleep Support (by benefit)", "lab-results": "Lab Results (COAs)", "contact": "Contact Us", "shipping": "Shipping Policy", "returns": "Return Policy", "privacy": "Privacy Policy", "cookies": "Cookie Policy", "accessibility": "Accessibility Statement", "faq": "FAQ", "terms": "Terms & Conditions", "story": "Our Story", "blog": "CBD Wisdom (blog)", "article-circadian": "Article \u00b7 Circadian Rhythm", "article-gratitude": "Article \u00b7 Mindfulness Series - Gratitude", "article-amazon": "Article \u00b7 Should I buy CBD on Amazon?"};
  var m = location.pathname.match(/pages\/([^/]+)\/(desktop|tablet|mobile)\.html$/);
  if (!m || m[1] === 'soon' || !ENDPOINT || ENDPOINT.indexOf('__') === 0) return;
  var PAGE = m[1], DEVICE = m[2];
  var C = { cream: '#F7F2EC', sand: '#E8DED2', slate: '#3E4256', ink: '#1F1F1F', muted: '#6E6660', bronze: '#9B7560', hair: 'rgba(31,31,31,0.12)' };

  // ---------- storage (best effort) ----------
  function get(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  (function () { var q = new URLSearchParams(location.search + '&' + location.hash.replace(/^#/, '')); var k = q.get('fbkey'); if (k) put('ehfb-key', k); })();
  var KEY = get('ehfb-key', ''), TOKENS = get('ehfb-tokens', {});

  // ---------- styles ----------
  var css = document.createElement('style');
  css.textContent = [
    '.ehfb, .ehfb * { box-sizing: border-box; font-family: Roboto, "Helvetica Neue", Arial, sans-serif; }',
    '.ehfb-cap { font-family: "Josefin Sans", Arial, sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; font-size: 11px; }',
    '.ehfb-launch { position: fixed; right: 20px; bottom: 20px; z-index: 2147483000; height: 46px; padding: 0 20px 0 16px; border: 0; border-radius: 999px; background: ' + C.slate + '; color: ' + C.cream + '; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; box-shadow: 0 10px 30px rgba(31,31,31,0.25); }',
    '.ehfb-launch .ehfb-count { min-width: 22px; height: 22px; padding: 0 6px; border-radius: 999px; background: ' + C.cream + '; color: ' + C.slate + '; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }',
    '.ehfb-panel { position: fixed; top: 0; right: 0; bottom: 0; width: 380px; max-width: 100%; z-index: 2147483001; background: ' + C.cream + '; border-left: 1px solid ' + C.hair + '; box-shadow: -20px 0 50px rgba(31,31,31,0.15); display: flex; flex-direction: column; color: ' + C.ink + '; transform: translateX(105%); transition: transform .25s ease; }',
    '.ehfb-panel.on { transform: none; }',
    '.ehfb-head { padding: 18px 20px 14px; border-bottom: 1px solid ' + C.hair + '; display: flex; flex-direction: column; gap: 14px; }',
    '.ehfb-row { display: flex; align-items: center; gap: 10px; }',
    '.ehfb-x { margin-left: auto; width: 34px; height: 34px; border-radius: 50%; border: 1px solid ' + C.hair + '; background: #fff; cursor: pointer; font-size: 18px; line-height: 1; color: ' + C.ink + '; }',
    '.ehfb-btn { height: 40px; padding: 0 18px; border-radius: 999px; border: 1px solid ' + C.slate + '; background: ' + C.slate + '; color: ' + C.cream + '; cursor: pointer; font-family: "Josefin Sans", Arial, sans-serif; font-weight: 600; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; white-space: nowrap; }',
    '.ehfb-btn.ghost { background: transparent; color: ' + C.slate + '; }',
    '.ehfb-btn.sm { height: 32px; padding: 0 14px; font-size: 10px; }',
    '.ehfb-btn:disabled { opacity: .5; cursor: default; }',
    '.ehfb-tabs { display: flex; gap: 4px; background: #fff; border: 1px solid ' + C.hair + '; border-radius: 999px; padding: 3px; }',
    '.ehfb-tabs button { flex: 1; height: 30px; border: 0; border-radius: 999px; background: transparent; font-size: 12px; font-weight: 500; color: ' + C.muted + '; cursor: pointer; }',
    '.ehfb-tabs button[aria-pressed="true"] { background: ' + C.slate + '; color: ' + C.cream + '; }',
    '.ehfb-toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: ' + C.muted + '; cursor: pointer; user-select: none; }',
    '.ehfb-list { flex: 1; overflow: auto; padding: 8px 20px 24px; }',
    '.ehfb-group { margin: 16px 0 6px; color: ' + C.bronze + '; }',
    '.ehfb-item { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid ' + C.hair + '; cursor: pointer; }',
    '.ehfb-item:hover .ehfb-note { color: ' + C.ink + '; }',
    '.ehfb-note { font-size: 14px; line-height: 1.55; color: ' + C.ink + '; white-space: pre-wrap; word-break: break-word; }',
    '.ehfb-meta { font-size: 12px; color: ' + C.muted + '; margin-top: 4px; line-height: 1.5; }',
    '.ehfb-reply { margin-top: 8px; padding: 8px 10px; border-radius: 10px; background: ' + C.sand + '; font-size: 13px; line-height: 1.5; white-space: pre-wrap; }',
    '.ehfb-empty { padding: 28px 0; font-size: 14px; line-height: 1.6; color: ' + C.muted + '; }',
    '.ehfb-dot { flex: 0 0 26px; width: 26px; height: 26px; border-radius: 50%; background: ' + C.slate + '; color: ' + C.cream + '; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; border: 2px solid ' + C.cream + '; box-shadow: 0 4px 12px rgba(31,31,31,0.3); }',
    '.ehfb-dot.done { background: #9A948F; }',
    '.ehfb-dot.new { background: ' + C.bronze + '; }',
    '.ehfb-layer { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 2147482990; }',
    '.ehfb-pin { position: absolute; transform: translate(-50%, -50%); cursor: pointer; padding: 0; transition: transform .15s ease; }',
    '.ehfb-pin:hover, .ehfb-pin.active { transform: translate(-50%, -50%) scale(1.15); }',
    '.ehfb-pop { position: absolute; z-index: 2147482995; width: 320px; max-width: calc(100vw - 24px); background: #fff; border: 1px solid ' + C.hair + '; border-radius: 16px; box-shadow: 0 18px 50px rgba(31,31,31,0.22); padding: 16px; color: ' + C.ink + '; }',
    '.ehfb-pop textarea, .ehfb-pop input { width: 100%; border: 1px solid ' + C.hair + '; border-radius: 10px; padding: 10px 12px; font-size: 14px; line-height: 1.5; color: ' + C.ink + '; background: #fff; outline: none; }',
    '.ehfb-pop textarea:focus, .ehfb-pop input:focus { border-color: ' + C.slate + '; }',
    '.ehfb-pop textarea { min-height: 96px; resize: vertical; }',
    '.ehfb-pop .ehfb-ctx { font-size: 12px; color: ' + C.muted + '; line-height: 1.5; margin-bottom: 10px; }',
    '.ehfb-banner { position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 2147483002; background: ' + C.slate + '; color: ' + C.cream + '; border-radius: 999px; padding: 8px 8px 8px 20px; display: flex; align-items: center; gap: 14px; font-size: 14px; box-shadow: 0 10px 30px rgba(31,31,31,0.25); white-space: nowrap; }',
    '.ehfb-banner .ehfb-btn { background: ' + C.cream + '; color: ' + C.slate + '; border-color: ' + C.cream + '; }',
    '.ehfb-hl { position: absolute; z-index: 2147482980; pointer-events: none; border: 2px solid ' + C.bronze + '; border-radius: 8px; background: rgba(155,117,96,0.08); transition: all .08s ease; }',
    'body.ehfb-picking, body.ehfb-picking * { cursor: crosshair !important; }',
    '.ehfb-chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; background: ' + C.sand + '; color: ' + C.ink + '; }',
    '.ehfb-chip.done { background: #E6E9E3; color: #4E5B48; }',
    '.ehfb-err { color: #A2463B; font-size: 12px; margin-top: 8px; }',
    '@media (max-width: 520px) { .ehfb-panel { width: 100%; top: auto; height: 78vh; border-left: 0; border-top: 1px solid ' + C.hair + '; border-radius: 20px 20px 0 0; transform: translateY(105%); } .ehfb-launch { right: 14px; bottom: 14px; } .ehfb-banner { font-size: 13px; white-space: normal; width: calc(100% - 24px); } }'
  ].join('\n');
  document.head.appendChild(css);

  // ---------- helpers ----------
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function when(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  function title(slug) { return TITLES[slug] || slug; }
  function mine(n) { return !!TOKENS[n.id]; }
  function api(body) {
    return fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function load() {
    return fetch(ENDPOINT + (ENDPOINT.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now()).then(function (r) { return r.json(); })
      .then(function (d) { NOTES = (d && d.notes) || []; NOTES.sort(function (a, b) { return String(a.created).localeCompare(String(b.created)); }); });
  }
  function here() { return NOTES.filter(function (n) { return n.page === PAGE && n.device === DEVICE; }); }
  function numberOf(n) { var list = NOTES.filter(function (x) { return x.page === n.page && x.device === n.device; }); return list.indexOf(n) + 1; }
  function inUI(t) { return t && t.closest && t.closest('.ehfb'); }

  // anchor: CSS path from <body>, plus the click offset inside that element
  function anchorFor(t) {
    if (t.closest('svg')) t = t.closest('svg');
    var mq = t.closest('.eh-marquee'), card = null; if (mq) { card = t; while (card.parentElement !== mq) card = card.parentElement; t = mq.parentElement; }
    var parts = [], n = t;
    while (n && n !== document.body && n.parentElement) {
      var i = Array.prototype.indexOf.call(n.parentElement.children, n) + 1;
      parts.unshift(n.tagName.toLowerCase() + ':nth-child(' + i + ')');
      n = n.parentElement;
    }
    return { el: t, card: card, path: 'body>' + parts.join('>') };
  }
  function textOf(e) {
    var out = [], w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT, null), t;
    while ((t = w.nextNode())) { var p = t.parentElement; if (p && !/^(SCRIPT|STYLE)$/.test(p.tagName)) out.push(t.nodeValue); }
    return out.join(' ').replace(/\s+/g, ' ').trim();
  }
  function snippet(e) { return (textOf(e) || e.getAttribute('alt') || e.getAttribute('aria-label') || '').slice(0, 80); }
  function sectionAt(y) {
    var best = '';
    document.querySelectorAll('h1, h2, h3').forEach(function (h) {
      if (inUI(h)) return;
      var r = h.getBoundingClientRect(); if (!r.width) return;
      if (r.top + scrollY <= y + 40) best = textOf(h);
    });
    return best || 'Top of page';
  }
  function locate(n) {
    var e = null; try { e = n.path ? document.querySelector(n.path) : null; } catch (err) {}
    if (e && !inUI(e)) {
      var r = e.getBoundingClientRect();
      var okText = !n.element || e.querySelector('.eh-marquee') || snippet(e).slice(0, 30) === String(n.element).slice(0, 30);
      if (r.width && r.height && okText) return { x: r.left + scrollX + Number(n.ox) * r.width, y: r.top + scrollY + Number(n.oy) * r.height };
    }
    return { x: Number(n.x) || 0, y: Number(n.y) || 0 };
  }

  // ---------- UI ----------
  var NOTES = [], OPEN = false, TAB = 'view', SHOW = get('ehfb-show', true), PICK = false, ACTIVE = null;
  var root = el('div', 'ehfb'); document.body.appendChild(root);
  var layer = el('div', 'ehfb ehfb-layer'); document.body.appendChild(layer);
  var hl = el('div', 'ehfb ehfb-hl'); hl.style.display = 'none'; document.body.appendChild(hl);

  var launch = el('button', 'ehfb-launch', '<span class="ehfb-cap" style="font-size:11px;">Feedback</span><span class="ehfb-count">0</span>');
  launch.type = 'button'; launch.setAttribute('aria-label', 'Open feedback'); root.appendChild(launch);

  var panel = el('aside', 'ehfb-panel'); panel.setAttribute('aria-label', 'Feedback');
  panel.innerHTML =
    '<div class="ehfb-head">' +
      '<div class="ehfb-row"><div><div class="ehfb-cap" style="color:' + C.bronze + ';font-size:10px;">Website preview</div><div class="ehfb-cap" style="font-size:15px;margin-top:6px;letter-spacing:.16em;">Feedback</div></div><button type="button" class="ehfb-x" aria-label="Close">&times;</button></div>' +
      '<button type="button" class="ehfb-btn" data-add>+ Add a note on this page</button>' +
      '<div class="ehfb-tabs" role="group"><button type="button" data-tab="view">This page &middot; ' + cap(DEVICE) + '</button><button type="button" data-tab="all">All pages</button></div>' +
      '<label class="ehfb-toggle"><input type="checkbox" data-show> Show pins on the page</label>' +
    '</div><div class="ehfb-list"></div>';
  root.appendChild(panel);
  var list = panel.querySelector('.ehfb-list');
  panel.querySelector('[data-show]').checked = SHOW;

  var banner = el('div', 'ehfb ehfb-banner', '<span>Click the spot you want to comment on</span><button type="button" class="ehfb-btn sm">Cancel</button>');
  banner.style.display = 'none'; document.body.appendChild(banner);

  function setOpen(v) { OPEN = v; panel.classList.toggle('on', v); }
  launch.addEventListener('click', function () { setOpen(!OPEN); });
  panel.querySelector('.ehfb-x').addEventListener('click', function () { setOpen(false); });
  panel.querySelector('[data-add]').addEventListener('click', startPick);
  panel.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { TAB = b.getAttribute('data-tab'); renderList(); }); });
  panel.querySelector('[data-show]').addEventListener('change', function (e) { SHOW = e.target.checked; put('ehfb-show', SHOW); drawPins(); });
  banner.querySelector('button').addEventListener('click', stopPick);

  function metaLine(n, withPage) {
    return [esc(n.name || 'Guest'), when(n.created), withPage ? esc(title(n.page)) + ' &middot; ' + cap(n.device) : cap(n.device), esc(n.section)].filter(Boolean).join(' &middot; ');
  }
  function itemHTML(n, withPage) {
    return '<div class="ehfb-item" data-id="' + esc(n.id) + '"><span class="ehfb-dot' + (n.status === 'done' ? ' done' : '') + '">' + (n.status === 'done' ? '&#10003;' : numberOf(n)) + '</span><div style="min-width:0;flex:1;">' +
      '<div class="ehfb-note">' + esc(n.note) + '</div><div class="ehfb-meta">' + metaLine(n, withPage) + (n.status === 'done' ? ' &middot; <span class="ehfb-chip done">Done</span>' : '') + '</div>' +
      (n.reply ? '<div class="ehfb-reply"><strong>Tanveen:</strong> ' + esc(n.reply) + '</div>' : '') + '</div></div>';
  }
  function renderList() {
    panel.querySelectorAll('[data-tab]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-tab') === TAB)); });
    var html = '';
    if (TAB === 'view') {
      var h = here();
      html = h.length ? h.map(function (n) { return itemHTML(n, false); }).join('') : '<div class="ehfb-empty">No notes on this view yet. Tap <strong>Add a note</strong>, then click anything on the page to pin a comment to it.</div>';
    } else {
      var groups = {};
      NOTES.forEach(function (n) { (groups[n.page] = groups[n.page] || []).push(n); });
      var keys = Object.keys(groups);
      html = keys.length ? keys.map(function (k) { return '<div class="ehfb-cap ehfb-group" style="font-size:10px;">' + esc(title(k)) + ' &middot; ' + groups[k].length + '</div>' + groups[k].map(function (n) { return itemHTML(n, true); }).join(''); }).join('') : '<div class="ehfb-empty">No notes yet.</div>';
    }
    list.innerHTML = html;
    list.querySelectorAll('.ehfb-item').forEach(function (it) {
      it.addEventListener('click', function () { var n = NOTES.find(function (x) { return x.id === it.getAttribute('data-id'); }); if (n) goTo(n); });
    });
    var open = NOTES.filter(function (n) { return n.status !== 'done'; }).length;
    launch.querySelector('.ehfb-count').textContent = open;
  }
  function goTo(n) {
    if (n.page !== PAGE || n.device !== DEVICE) { location.href = '../' + n.page + '/' + n.device + '.html#fb=' + n.id; return; }
    if (window.innerWidth <= 520) setOpen(false);
    var p = locate(n); window.scrollTo({ top: Math.max(0, p.y - window.innerHeight / 3), behavior: 'smooth' });
    if (!SHOW) { SHOW = true; put('ehfb-show', true); panel.querySelector('[data-show]').checked = true; drawPins(); }
    setTimeout(function () { showNote(n); }, 350);
  }

  // ---------- pins ----------
  function drawPins() {
    layer.innerHTML = '';
    if (!SHOW) return;
    here().forEach(function (n) {
      var p = locate(n);
      var b = el('button', 'ehfb-pin ehfb-dot' + (n.status === 'done' ? ' done' : ''), n.status === 'done' ? '&#10003;' : String(numberOf(n)));
      b.type = 'button'; b.style.left = p.x + 'px'; b.style.top = p.y + 'px'; b.setAttribute('data-id', n.id);
      b.setAttribute('aria-label', 'Note ' + numberOf(n) + ': ' + n.note);
      if (ACTIVE && ACTIVE.id === n.id) b.classList.add('active');
      b.addEventListener('click', function (e) { e.stopPropagation(); showNote(n); });
      layer.appendChild(b);
    });
  }
  var raf = 0; function redraw() { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { drawPins(); placePop(); }); }
  window.addEventListener('resize', redraw); window.addEventListener('load', redraw);
  if (window.ResizeObserver) new ResizeObserver(redraw).observe(document.body);

  // ---------- popovers ----------
  var pop = null, popAt = null;
  function closePop() { if (pop) pop.remove(); pop = null; popAt = null; ACTIVE = null; drawPins(); }
  function placePop() {
    if (!pop || !popAt) return;
    var p = typeof popAt === 'function' ? popAt() : popAt;
    var w = pop.offsetWidth, vw = document.documentElement.clientWidth;
    var left = p.x + 22; if (left + w > scrollX + vw - 12) left = p.x - w - 22; if (left < scrollX + 12) left = scrollX + 12;
    pop.style.left = left + 'px'; pop.style.top = Math.max(scrollY + 12, p.y - 20) + 'px';
  }
  function openPop(html, at) {
    if (pop) pop.remove();
    pop = el('div', 'ehfb ehfb-pop', html); document.body.appendChild(pop); popAt = at; placePop();
    return pop;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (PICK) stopPick(); else closePop(); } });
  document.addEventListener('click', function (e) { if (!PICK && pop && !inUI(e.target)) closePop(); });

  function showNote(n) {
    ACTIVE = n; drawPins();
    var admin = !!KEY, own = mine(n);
    var html = '<div class="ehfb-row" style="align-items:flex-start;"><span class="ehfb-dot' + (n.status === 'done' ? ' done' : '') + '">' + (n.status === 'done' ? '&#10003;' : numberOf(n)) + '</span><div style="flex:1;min-width:0;"><div class="ehfb-note">' + esc(n.note) + '</div><div class="ehfb-meta">' + metaLine(n, false) + '</div></div></div>' +
      (n.reply ? '<div class="ehfb-reply"><strong>Tanveen:</strong> ' + esc(n.reply) + '</div>' : '') +
      (admin ? '<div style="margin-top:12px;"><textarea data-reply placeholder="Reply (optional)" style="min-height:64px;">' + esc(n.reply || '') + '</textarea></div>' : '') +
      '<div class="ehfb-row" style="margin-top:12px;justify-content:flex-end;flex-wrap:wrap;">' +
        (own || admin ? '<button type="button" class="ehfb-btn ghost sm" data-del>Delete</button>' : '') +
        (admin ? '<button type="button" class="ehfb-btn ghost sm" data-save-reply>Save reply</button><button type="button" class="ehfb-btn sm" data-status>' + (n.status === 'done' ? 'Reopen' : 'Mark done') + '</button>' : '') +
        (!own && !admin ? '<button type="button" class="ehfb-btn ghost sm" data-close>Close</button>' : '') +
      '</div><div class="ehfb-err" hidden></div>';
    var p = openPop(html, function () { return locate(n); });
    var err = p.querySelector('.ehfb-err');
    function fail(msg) { err.hidden = false; err.textContent = msg || 'Something went wrong. Try again.'; }
    var c = p.querySelector('[data-close]'); if (c) c.addEventListener('click', closePop);
    var d = p.querySelector('[data-del]'); if (d) d.addEventListener('click', function () {
      d.disabled = true;
      api({ action: 'delete', id: n.id, token: TOKENS[n.id], key: KEY }).then(function (r) { if (!r.ok) return fail(); NOTES = NOTES.filter(function (x) { return x !== n; }); closePop(); renderList(); }).catch(function () { fail(); d.disabled = false; });
    });
    var s = p.querySelector('[data-status]'); if (s) s.addEventListener('click', function () {
      s.disabled = true; var st = n.status === 'done' ? 'open' : 'done'; var rep = p.querySelector('[data-reply]').value;
      api({ action: 'status', id: n.id, status: st, reply: rep, key: KEY }).then(function (r) { if (!r.ok) return fail(); n.status = st; n.reply = rep; closePop(); renderList(); }).catch(function () { fail(); s.disabled = false; });
    });
    var sr = p.querySelector('[data-save-reply]'); if (sr) sr.addEventListener('click', function () {
      sr.disabled = true; var rep = p.querySelector('[data-reply]').value;
      api({ action: 'reply', id: n.id, reply: rep, key: KEY }).then(function (r) { if (!r.ok) return fail(); n.reply = rep; showNote(n); renderList(); }).catch(function () { fail(); sr.disabled = false; });
    });
  }

  // ---------- pick a spot ----------
  function startPick() {
    closePop(); PICK = true; setOpen(false);
    banner.style.display = 'flex'; document.body.classList.add('ehfb-picking');
  }
  function stopPick() { PICK = false; banner.style.display = 'none'; hl.style.display = 'none'; document.body.classList.remove('ehfb-picking'); }
  function target(e) { var t = document.elementFromPoint(e.clientX, e.clientY); return t && !inUI(t) && t !== document.documentElement ? t : null; }
  document.addEventListener('mousemove', function (e) {
    if (!PICK) return; var t = target(e); if (!t || t === document.body) { hl.style.display = 'none'; return; }
    var a = anchorFor(t).el, r = a.getBoundingClientRect();
    hl.style.display = 'block'; hl.style.left = (r.left + scrollX - 3) + 'px'; hl.style.top = (r.top + scrollY - 3) + 'px'; hl.style.width = (r.width + 6) + 'px'; hl.style.height = (r.height + 6) + 'px';
  }, true);
  ['pointerdown', 'mousedown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (PICK && !inUI(e.target)) { e.stopPropagation(); } }, { capture: true, passive: true });
  });
  document.addEventListener('click', function (e) {
    if (!PICK || inUI(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    var t = target(e) || document.body, a = anchorFor(t), r = a.el.getBoundingClientRect();
    var x = e.clientX + scrollX, y = e.clientY + scrollY;
    var draft = {
      page: PAGE, device: DEVICE, path: a.path, element: a.card ? snippet(a.card) : snippet(a.el), section: sectionAt(y),
      ox: r.width ? +((e.clientX - r.left) / r.width).toFixed(4) : 0, oy: r.height ? +((e.clientY - r.top) / r.height).toFixed(4) : 0,
      x: Math.round(x), y: Math.round(y), url: location.pathname
    };
    stopPick(); compose(draft);
  }, true);

  function compose(draft) {
    var marker = el('span', 'ehfb ehfb-dot new', '+'); marker.style.position = 'absolute'; marker.style.left = draft.x + 'px'; marker.style.top = draft.y + 'px'; marker.style.transform = 'translate(-50%,-50%)'; marker.style.zIndex = 2147482991;
    document.body.appendChild(marker);
    var html = '<div class="ehfb-ctx"><strong>' + esc(title(PAGE)) + '</strong> &middot; ' + cap(DEVICE) + ' &middot; ' + esc(draft.section) + (draft.element ? '<br>On: <em>' + esc(draft.element.slice(0, 60)) + (draft.element.length > 60 ? '&hellip;' : '') + '</em>' : '') + '</div>' +
      '<textarea data-note placeholder="What would you like changed here?"></textarea>' +
      '<input data-name placeholder="Your name" style="margin-top:8px;" value="' + esc(get('ehfb-name', '')) + '">' +
      '<div class="ehfb-row" style="margin-top:12px;justify-content:flex-end;"><button type="button" class="ehfb-btn ghost sm" data-cancel>Cancel</button><button type="button" class="ehfb-btn sm" data-save>Save note</button></div><div class="ehfb-err" hidden></div>';
    var p = openPop(html, { x: draft.x, y: draft.y });
    var ta = p.querySelector('[data-note]'), nm = p.querySelector('[data-name]'), save = p.querySelector('[data-save]'), err = p.querySelector('.ehfb-err');
    setTimeout(function () { ta.focus({ preventScroll: true }); }, 30);
    var done = function () { marker.remove(); closePop(); };
    p.querySelector('[data-cancel]').addEventListener('click', done);
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save.click(); });
    save.addEventListener('click', function () {
      var note = ta.value.trim(); if (!note) { ta.focus(); return; }
      var name = nm.value.trim(); put('ehfb-name', name);
      var token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      save.disabled = true; save.textContent = 'Saving…'; err.hidden = true;
      api(Object.assign({ action: 'add', note: note, name: name, token: token }, draft)).then(function (r) {
        if (!r || !r.ok) throw new Error();
        TOKENS[r.note.id] = token; put('ehfb-tokens', TOKENS);
        NOTES.push(r.note); done(); renderList(); drawPins();
      }).catch(function () { save.disabled = false; save.textContent = 'Save note'; err.hidden = false; err.textContent = 'Could not save. Check your connection and try again.'; });
    });
  }

  // ---------- go ----------
  load().then(function () {
    renderList(); drawPins();
    var h = location.hash.match(/fb=([\w-]+)/);
    if (h) { var n = NOTES.find(function (x) { return x.id === h[1]; }); if (n) setTimeout(function () { goTo(n); }, 400); }
  }).catch(function () { renderList(); });
  renderList();
})();
