'use strict';

/* ============================================================
   COMMON — loaded by every page.
   Provides formatting helpers, the access guard, and the shared
   chrome (navbar, footer, toast host, AI chat widget) so those
   pieces live in exactly one place instead of in twelve HTML files.
   ============================================================ */

/* ---------- formatting helpers ---------- */
function money(n) {
  return 'Rs. ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function todayStr() { return new Date().toISOString().split('T')[0]; }
function daysFromNow(n) { return new Date(Date.now() + 86400000 * n).toISOString().split('T')[0]; }
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function statusLabel(s) {
  const map = { PENDING: 'Pending Payment', CONFIRMED: 'Confirmed', CANCELLED: 'Cancelled', COMPLETED: 'Completed' };
  return map[s] || s;
}
function avatarInitials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
function bookingRef(id) { return '#BKG-' + String(id).padStart(4, '0'); }
function carImage(url) {
  return url || 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600';
}
function togglePasswordField(btn) {
  const input = btn.previousElementSibling;
  const icon = btn.querySelector('i');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  icon.className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
  btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
}

/* ---------- toasts ---------- */
function toast(message, type = 'success') {
  const icons = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill', warning: 'bi-exclamation-circle-fill' };
  let host = document.getElementById('toastHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toastHost';
    host.className = 'toast-host';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `toast-item ${type}`;
  el.innerHTML = `<i class="bi ${icons[type] || icons.success} toast-icon"></i><span>${escapeHtml(message)}</span>`;
  host.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

/**
 * A toast that survives a page navigation — used when an action on one page
 * should be confirmed on the next one (e.g. "Booked!" shown on bookings.html).
 */
function toastAfterRedirect(message, type = 'success') {
  sessionStorage.setItem('pendingToast', JSON.stringify({ message, type }));
}
function flushPendingToast() {
  const raw = sessionStorage.getItem('pendingToast');
  if (!raw) return;
  sessionStorage.removeItem('pendingToast');
  try {
    const t = JSON.parse(raw);
    toast(t.message, t.type);
  } catch (e) { /* ignore malformed value */ }
}

/* ---------- navigation ---------- */
function redirectToLogin() {
  // Remember where the user was headed so login can send them back.
  const here = location.pathname + location.search;
  if (!/\/(login|register)\.html?$/.test(here) && here !== '/') {
    sessionStorage.setItem('returnTo', here);
  }
  location.replace('login.html');
}

function logout() {
  // Stop Google from silently re-selecting the same account next time.
  try { google?.accounts?.id?.disableAutoSelect(); } catch (e) { /* GSI not loaded */ }
  Auth.clear();
  sessionStorage.removeItem('returnTo');
  location.href = 'login.html';
}

/* ---------- shared chrome ---------- */
const CUSTOMER_NAV = [
  { id: 'cars',      href: 'cars.html',      label: 'Browse Cars' },
  { id: 'bookings',  href: 'bookings.html',  label: 'My Reservations' },
  { id: 'assistant', href: 'assistant.html', label: 'AI Assistant' },
  { id: 'support',   href: 'support.html',   label: 'Support' }
];
const ADMIN_NAV = [
  { id: 'admin-dashboard', href: 'admin-dashboard.html', label: 'Dashboard' },
  { id: 'admin-fleet',     href: 'admin-fleet.html',     label: 'Fleet' },
  { id: 'admin-bookings',  href: 'admin-bookings.html',  label: 'Bookings' },
  { id: 'admin-customers', href: 'admin-customers.html', label: 'Customers' }
];

function renderNavbar(activeId) {
  const host = document.getElementById('siteNav');
  if (!host) return;

  const loggedIn = Auth.isLoggedIn();
  const isAdmin = Auth.getRole() === 'ADMIN';
  const links = !loggedIn ? [] : (isAdmin ? ADMIN_NAV : CUSTOMER_NAV);

  const linksHtml = links.map(l =>
    `<a href="${l.href}" class="nav-link-item${l.id === activeId ? ' active' : ''}">${l.label}</a>`
  ).join('');

  // Guests can only be on login or register now, so offer the *other* one
  // rather than a "Sign In" button on the sign-in page itself.
 

  const rightHtml = loggedIn ? `
      <span class="nav-role-badge">${isAdmin ? 'Admin' : 'Customer'}</span>
      <span class="nav-username d-none d-sm-inline">${escapeHtml(Auth.getUsername() || '')}</span>
      <div class="nav-avatar">${escapeHtml(avatarInitials(Auth.getUsername()))}</div>
      <a href="settings.html" class="nav-bell" title="Settings"><i class="bi bi-gear"></i></a>
      <button class="btn-nav-logout" type="button">Logout</button>
    ` : '';

  host.innerHTML = `
    <nav class="navbar navbar-expand-lg sticky-top">
      <div class="container d-flex justify-content-between align-items-center gap-3">
        <a class="navbar-brand d-flex align-items-center gap-2" href="${loggedIn ? Auth.homePage() : 'login.html'}">
          <i class="bi bi-car-front-fill" style="color:var(--brand)"></i>
          DriveEasy Rentals
        </a>
        ${loggedIn ? `
        <button class="nav-burger d-lg-none" id="navBurger" aria-label="Menu"><i class="bi bi-list"></i></button>
        <div class="d-none d-lg-flex align-items-center gap-4">${linksHtml}</div>
        <div class="d-none d-lg-flex align-items-center gap-2">${rightHtml}</div>
        ` : `
        <div class="d-flex align-items-center gap-2">${rightHtml}</div>
        `}
      </div>
      ${loggedIn ? `
      <div class="nav-mobile d-lg-none d-none" id="navMobile">
        <div class="container d-flex flex-column gap-2 py-3">
          ${linksHtml}
          <div class="d-flex align-items-center gap-2 pt-2 flex-wrap">${rightHtml}</div>
        </div>
      </div>
      ` : ''}
    </nav>`;

  const burger = document.getElementById('navBurger');
  if (burger) burger.onclick = () => document.getElementById('navMobile').classList.toggle('d-none');

  // The links and account block are rendered twice — once for the desktop bar
  // and once for the collapsed mobile menu — so bind by class, not id, and wire
  // every copy. (Nothing inside rightHtml carries an id, to keep them unique.)
  host.querySelectorAll('.btn-nav-logout').forEach(b => { b.onclick = logout; });
}

function renderFooter() {
  const host = document.getElementById('siteFooter');
  if (!host) return;
  // There is no public landing page — "Home" means the signed-in user's own
  // start page (fleet for customers, dashboard for admins).
  const isAdmin = Auth.getRole() === 'ADMIN';
  const links = isAdmin
    ? [['admin-dashboard.html', 'Dashboard'], ['admin-fleet.html', 'Fleet'], ['admin-bookings.html', 'Bookings']]
    : [['cars.html', 'Browse Cars'], ['bookings.html', 'My Reservations'], ['support.html', 'Support']];
  host.innerHTML = `
    <footer class="site-footer">
      <div class="container d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-car-front-fill" style="color:var(--brand)"></i>
          <span style="font-weight:700;color:#fff">DriveEasy Rentals</span>
        </div>
        <div class="footer-links">
          ${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}
        </div>
        <div style="font-size:.78rem;color:rgba(255,255,255,.4)">© ${new Date().getFullYear()} DriveEasy Rentals</div>
      </div>
    </footer>`;
}

/* ---------- AI chat widget (customer pages only) ---------- */
function mountChatWidget() {
  if (document.getElementById('chatWidget')) return;

  const wrap = document.createElement('div');
  wrap.id = 'chatWidget';
  wrap.innerHTML = `
    <div id="chatPanel" class="chat-panel d-none">
      <div class="chat-header">
        <div class="d-flex align-items-center gap-2">
          <span class="chat-avatar"><i class="bi bi-robot"></i></span>
          <div>
            <div class="chat-title">AI Assistant</div>
            <div class="chat-subtitle">Powered by DriveEasy</div>
          </div>
        </div>
        <button class="btn-close btn-close-white" id="chatCloseBtn" style="font-size:.75rem"></button>
      </div>
      <div class="chat-body" id="chatBody">
        <div class="chat-row bot">
          <span class="chat-bubble-avatar"><i class="bi bi-robot"></i></span>
          <div class="chat-msg bot">Hi! Ask me things like "cheapest car available" or "SUV for a family of 6 going outstation".</div>
        </div>
      </div>
      <div class="chat-input">
        <input type="text" id="chatInput" class="form-control" placeholder="Type a message…">
        <button class="chat-send-btn" id="chatSendBtn"><i class="bi bi-send-fill"></i></button>
      </div>
    </div>
    <button id="chatToggleBtn" class="chat-fab"><i class="bi bi-chat-dots-fill"></i></button>`;
  document.body.appendChild(wrap);

  const panel   = document.getElementById('chatPanel');
  const input   = document.getElementById('chatInput');
  const body    = document.getElementById('chatBody');

  document.getElementById('chatToggleBtn').onclick = () => {
    panel.classList.toggle('d-none');
    if (!panel.classList.contains('d-none')) input.focus();
  };
  document.getElementById('chatCloseBtn').onclick = () => panel.classList.add('d-none');

  async function send() {
    const msg = input.value.trim();
    if (!msg) return;
    body.insertAdjacentHTML('beforeend',
      `<div class="chat-row user"><div class="chat-msg user">${escapeHtml(msg)}</div></div>`);
    input.value = '';
    body.scrollTop = body.scrollHeight;

    const typingId = 'typing_' + Date.now();
    body.insertAdjacentHTML('beforeend',
      `<div class="chat-row bot" id="${typingId}">
        <span class="chat-bubble-avatar"><i class="bi bi-robot"></i></span>
        <div class="chat-msg bot" style="color:var(--muted);font-style:italic">Typing…</div>
      </div>`);
    body.scrollTop = body.scrollHeight;

    try {
      const res = await Api.aiChat(msg);
      document.getElementById(typingId)?.remove();
      body.insertAdjacentHTML('beforeend',
        `<div class="chat-row bot">
          <span class="chat-bubble-avatar"><i class="bi bi-robot"></i></span>
          <div class="chat-msg bot">${res.reply}</div>
        </div>`);
    } catch (err) {
      document.getElementById(typingId)?.remove();
      body.insertAdjacentHTML('beforeend',
        `<div class="chat-row bot">
          <span class="chat-bubble-avatar"><i class="bi bi-robot"></i></span>
          <div class="chat-msg bot" style="color:var(--danger)">Sorry, something went wrong.</div>
        </div>`);
    }
    body.scrollTop = body.scrollHeight;
  }

  document.getElementById('chatSendBtn').onclick = send;
  input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
}

/* ---------- page bootstrap ---------- */
/**
 * Every page calls this once, e.g.
 *   initPage({ page: 'cars', requires: 'CUSTOMER', chat: true });
 *
 * options:
 *   page     — nav item to highlight
 *   requires — 'CUSTOMER' | 'ADMIN' | 'ANY' | null (public page)
 *   chat     — mount the AI chat widget
 *   guestOnly— bounce signed-in users away (login / register pages)
 *
 * Returns true when the page may render, false when a redirect is under way.
 */
function initPage(options = {}) {
  const { page = null, requires = null, chat = false, guestOnly = false } = options;

  if (guestOnly && Auth.isLoggedIn()) {
    location.replace(Auth.homePage());
    return false;
  }

  if (requires) {
    if (!Auth.isLoggedIn()) { redirectToLogin(); return false; }
    if (requires !== 'ANY' && Auth.getRole() !== requires) {
      // Signed in, but on the wrong side of the app — send them to their own home.
      location.replace(Auth.homePage());
      return false;
    }
  }

  renderNavbar(page);
  renderFooter();
  if (chat && Auth.getRole() === 'CUSTOMER') mountChatWidget();

  document.body.classList.remove('page-loading');
  flushPendingToast();
  return true;
}
