/* ═══════════════════════════════════════════════════════
   EPFBD WMS — SHARED NAVIGATION & UTILS
   nav.js  — include on every page
   ═══════════════════════════════════════════════════════ */

/* ── Theme ─────────────────────────────────────── */
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('.tdot').forEach(d => d.classList.toggle('on', d.dataset.t === t));
  localStorage.setItem('epf-theme', t);
}

/* ── Font ──────────────────────────────────────── */
function setFont(f) {
  document.documentElement.setAttribute('data-font', f);
  document.querySelectorAll('.fbtn').forEach(b => b.classList.toggle('on', b.dataset.f === f));
  localStorage.setItem('epf-font', f);
}

/* ── Clock ─────────────────────────────────────── */
function startClock() {
  function tick() {
    const n = new Date(), p = v => String(v).padStart(2,'0');
    const el = document.getElementById('clock');
    if (el) el.textContent = p(n.getHours())+':'+p(n.getMinutes())+':'+p(n.getSeconds());
  }
  tick(); setInterval(tick, 1000);
}

/* ── Date display ──────────────────────────────── */
function fmtDate() {
  return new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'});
}

/* ── Sidebar toggle ────────────────────────────── */
function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('open');
}

/* ── Toast ─────────────────────────────────────── */
function toast(msg, type = 'ok', ms = 2500) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast'; el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}

/* ── PIN Lock System ───────────────────────────── */
const PIN = '9625';
let pinBuffer = '';
let pinCallback = null;
let pinMode = 'add'; // 'add' | 'delete'

function openPin(mode, cb) {
  pinMode = mode;
  pinCallback = cb;
  pinBuffer = '';
  updatePinDots();
  const el = document.getElementById('pin-err');
  if (el) { el.style.display = 'none'; }
  const title = document.getElementById('pin-title');
  if (title) title.textContent = mode === 'add' ? '🔐 Enter PIN to Add' : '🔐 Enter PIN to Delete';
  showOverlay('ov-pin');
}

function pressPin(v) {
  if (v === 'del') {
    pinBuffer = pinBuffer.slice(0,-1);
  } else if (v === 'ok') {
    checkPin();
    return;
  } else {
    if (pinBuffer.length >= 4) return;
    pinBuffer += v;
    if (pinBuffer.length === 4) {
      setTimeout(checkPin, 150);
    }
  }
  updatePinDots();
}

function checkPin() {
  if (pinBuffer === PIN) {
    closeOverlay('ov-pin');
    pinBuffer = '';
    if (typeof pinCallback === 'function') pinCallback();
  } else {
    const el = document.getElementById('pin-err');
    if (el) { el.style.display = 'block'; }
    pinBuffer = '';
    updatePinDots();
  }
}

function updatePinDots() {
  document.querySelectorAll('.pin-dot').forEach((d, i) => {
    d.classList.toggle('filled', i < pinBuffer.length);
  });
}

/* ── Overlay helpers ───────────────────────────── */
function showOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}
function closeOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
  // Reset pin
  pinBuffer = '';
  updatePinDots();
  const e = document.getElementById('pin-err');
  if (e) e.style.display = 'none';
}

/* Click outside overlay to close */
document.addEventListener('click', function(e) {
  document.querySelectorAll('.overlay.show').forEach(ov => {
    if (e.target === ov) closeOverlay(ov.id);
  });
});

/* ── INIT ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  // Apply saved preferences
  setTheme(localStorage.getItem('epf-theme') || 'slate');
  setFont(localStorage.getItem('epf-font')  || 'ubuntu');
  startClock();

  // Footer date
  const fd = document.getElementById('footer-date');
  if (fd) fd.textContent = 'Last updated: ' + fmtDate();

  // Mark active nav link
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.topbar-nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href && path && href.includes(path.replace('.html',''))) {
      a.classList.add('active');
    }
  });

  // Highlight sidebar
  document.querySelectorAll('.sb-link[href]').forEach(a => {
    if ((a.getAttribute('href')||'').includes(path.replace('.html',''))) {
      a.classList.add('on');
    }
  });
});
