/**
 * SoulSync App Shell
 * Router, sidebar, navbar, toast system, theme, WebSocket
 */

/* ── Toast System ─────────────────────────────── */
const Toast = {
  container: null,

  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },

  show(title, message = '', type = 'info', duration = 4000) {
    const icons = { success: '✅', error: '❌', info: '💌', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || '💌'}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
      <div class="toast-progress"></div>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
    return toast;
  },

  success: (t, m) => Toast.show(t, m, 'success'),
  error:   (t, m) => Toast.show(t, m, 'error'),
  info:    (t, m) => Toast.show(t, m, 'info'),
};

/* ── Theme Manager ────────────────────────────── */
const Theme = {
  current: localStorage.getItem('ss_theme') || 'light',

  init() {
    document.documentElement.setAttribute('data-theme', this.current);
    this.updateBtn();
  },

  toggle() {
    this.current = this.current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.current);
    localStorage.setItem('ss_theme', this.current);
    this.updateBtn();
  },

  updateBtn() {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.innerHTML = this.current === 'light' ? '🌙' : '☀️';
  }
};

/* ── WebSocket (STOMP) ────────────────────────── */
const WS = {
  client: null,
  subscriptions: {},

  connect(coupleId) {
    if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') {
      console.warn('WebSocket libs not loaded');
      return;
    }
    const socket = new SockJS('http://localhost:8080/api/ws');
    this.client = Stomp.over(socket);
    this.client.debug = null; // silence STOMP logs

    const token = api.getToken();
    this.client.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        console.log('WS connected');
        if (coupleId) {
          this.subscribe(`/topic/couple/${coupleId}/messages`,   (msg) => App.onNewMessage(JSON.parse(msg.body)));
          this.subscribe(`/topic/couple/${coupleId}/typing`,     (msg) => App.onTyping(JSON.parse(msg.body)));
          this.subscribe(`/topic/couple/${coupleId}/mood`,       (msg) => App.onMoodUpdate(JSON.parse(msg.body)));
          this.subscribe(`/topic/couple/${coupleId}/love-notes`, (msg) => App.onLoveNote(JSON.parse(msg.body)));
        }
        // Personal notifications
        const userId = api.getUser()?.id;
        if (userId) {
          this.subscribe(`/user/${userId}/queue/notifications`, (msg) => App.onNotification(JSON.parse(msg.body)));
        }
      },
      (err) => console.error('WS error:', err)
    );
  },

  subscribe(topic, callback) {
    if (!this.client) return;
    if (this.subscriptions[topic]) this.subscriptions[topic].unsubscribe();
    this.subscriptions[topic] = this.client.subscribe(topic, callback);
  },

  send(destination, body) {
    if (this.client && this.client.connected) {
      this.client.send(destination, {}, JSON.stringify(body));
    }
  },

  disconnect() {
    if (this.client) { this.client.disconnect(); this.client = null; }
  }
};

/* ── Router ───────────────────────────────────── */
const Router = {
  routes: {
    '#dashboard':     'loadDashboard',
    '#chat':          'loadChat',
    '#timeline':      'loadTimeline',
    '#mood':          'loadMood',
    '#dates':         'loadDates',
    '#notes':         'loadNotes',
    '#profile':       'loadProfile',
  },

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },

  resolve() {
    const hash = window.location.hash || '#dashboard';
    const method = this.routes[hash] || 'loadDashboard';
    if (App[method]) App[method]();
    this.updateSidebar(hash);
  },

  navigate(hash) {
    window.location.hash = hash;
  },

  updateSidebar(active) {
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === active);
    });
  }
};

/* ── Notification Renderer ────────────────────── */
function updateNotifBadge(count) {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  badge.textContent = count > 9 ? '9+' : count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

/* ── Sidebar Builder ──────────────────────────── */
function buildSidebar(user) {
  const nav = [
    { icon: '🏠', label: 'Dashboard',    route: '#dashboard' },
    { icon: '💬', label: 'Chat',         route: '#chat',     badge: 0 },
    { icon: '📸', label: 'Timeline',     route: '#timeline' },
    { icon: '🌊', label: 'Mood',         route: '#mood' },
    { icon: '📅', label: 'Special Dates',route: '#dates' },
    { icon: '💌', label: 'Love Notes',   route: '#notes' },
    { icon: '👤', label: 'Profile',      route: '#profile' },
  ];

  return `
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon">💞</div>
      <span class="sidebar-logo-text">SoulSync</span>
    </div>
    <nav class="sidebar-nav">
      ${nav.map(item => `
        <a class="sidebar-nav-item" href="${item.route}" data-route="${item.route}">
          <span class="sidebar-nav-icon">${item.icon}</span>
          <span class="sidebar-nav-label">${item.label}</span>
          ${item.badge !== undefined ? `<span class="sidebar-badge" id="msg-badge" style="display:none">0</span>` : ''}
        </a>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user" onclick="Router.navigate('#profile')">
        <div class="sidebar-user-avatar">
          ${user?.avatarUrl ? `<img src="${user.avatarUrl}" alt="">` : (user?.displayName?.charAt(0) || '?')}
        </div>
        <div class="sidebar-user-info sidebar-nav-label">
          <div class="sidebar-user-name">${user?.displayName || 'You'}</div>
          <div class="sidebar-user-status">● Online</div>
        </div>
      </div>
    </div>`;
}

/* ── Navbar Builder ───────────────────────────── */
function buildNavbar() {
  return `
    <div class="navbar-left">
      <button class="btn btn-icon btn-ghost" id="sidebar-toggle" title="Toggle sidebar">☰</button>
      <span class="navbar-title" id="page-title">Dashboard</span>
    </div>
    <div class="navbar-right">
      <button class="btn btn-icon btn-ghost" id="theme-toggle" title="Toggle theme" onclick="Theme.toggle()">🌙</button>
      <div class="notif-btn" style="position:relative">
        <button class="btn btn-icon btn-ghost" id="notif-btn" onclick="App.toggleNotifPanel()">🔔</button>
        <span class="notif-badge" id="notif-badge" style="display:none">0</span>
      </div>
      <button class="btn btn-sm btn-ghost" onclick="App.logout()" title="Logout">⏻</button>
    </div>`;
}

/* ── Main App ─────────────────────────────────── */
const App = {
  user: null,
  coupleInfo: null,
  _notifPanelOpen: false,

  async init() {
    Toast.init();
    Theme.init();

    // Check auth
    const user = api.getUser();
    if (!user || !api.getToken()) {
		window.location.href = '/api/index.html';
      return;
    }
    this.user = user;

    // Render shell
    document.getElementById('sidebar').innerHTML = buildSidebar(user);
    document.getElementById('navbar').innerHTML  = buildNavbar();

    // Sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      const sb = document.getElementById('sidebar');
      const mc = document.getElementById('main-content');
      const nb = document.getElementById('navbar');
      sb.classList.toggle('collapsed');
      mc.classList.toggle('sidebar-collapsed');
      nb.classList.toggle('sidebar-collapsed');
    });

    // Load couple info and connect WS
    try {
      const res = await api.users.couple();
      this.coupleInfo = res.data;
      WS.connect(this.coupleInfo.coupleId);
    } catch {
      // No couple yet — some features disabled
    }

    // Unread notifications count
    this.refreshNotifCount();
    setInterval(() => this.refreshNotifCount(), 60000);

    // Init router
    Router.init();
  },

  async refreshNotifCount() {
    try {
      const res = await api.notifications.unreadCount();
      updateNotifBadge(res.data.unreadCount || 0);
    } catch {}
  },

  async toggleNotifPanel() {
    if (this._notifPanelOpen) {
      document.getElementById('notif-panel')?.remove();
      this._notifPanelOpen = false;
      return;
    }
    this._notifPanelOpen = true;
    const panel = document.createElement('div');
    panel.className = 'notif-panel';
    panel.id = 'notif-panel';
    panel.innerHTML = `
      <div class="notif-panel-header">
        <span style="font-weight:700">Notifications</span>
        <button class="btn btn-sm btn-ghost" onclick="api.notifications.markAllRead().then(()=>{App.refreshNotifCount();document.querySelectorAll('.notif-item').forEach(i=>i.classList.remove('unread'))})">Mark all read</button>
      </div>
      <div id="notif-list"><div style="padding:20px;text-align:center"><div class="spinner" style="margin:auto"></div></div></div>`;

    document.querySelector('.notif-btn').appendChild(panel);

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !document.getElementById('notif-btn').contains(e.target)) {
          panel.remove(); this._notifPanelOpen = false;
        }
      }, { once: true });
    }, 100);

    try {
      const res = await api.notifications.list();
      const items = res.data?.content || [];
      document.getElementById('notif-list').innerHTML = items.length === 0
        ? '<div class="empty-state" style="padding:32px"><div class="empty-icon">🔔</div><div class="empty-title" style="font-size:1rem">All caught up!</div></div>'
        : items.map(n => `
          <div class="notif-item ${n.isRead ? '' : 'unread'}" onclick="api.notifications.markRead(${n.id})">
            <div class="notif-item-icon">${notifIcon(n.notificationType)}</div>
            <div>
              <div class="notif-item-title">${n.title}</div>
              <div class="notif-item-body">${n.body || ''}</div>
              <div class="notif-item-time">${timeAgo(n.createdAt)}</div>
            </div>
          </div>`).join('');
      api.notifications.markAllRead();
      updateNotifBadge(0);
    } catch { document.getElementById('notif-list').innerHTML = '<div style="padding:20px;color:var(--text-muted);text-align:center">Could not load notifications</div>'; }
  },

  // WebSocket handlers
  onNewMessage(msg) {
    window.dispatchEvent(new CustomEvent('ws:message', { detail: msg }));
    if (window.location.hash !== '#chat') {
      const badge = document.getElementById('msg-badge');
      if (badge) { badge.style.display = 'flex'; badge.textContent = parseInt(badge.textContent || 0) + 1; }
      if (msg.senderId !== this.user?.id) Toast.info('💬 New message', msg.senderDisplayName + ': ' + (msg.content || '[media]'));
    }
  },
  onTyping(data)    { window.dispatchEvent(new CustomEvent('ws:typing',    { detail: data })); },
  onMoodUpdate(data){ window.dispatchEvent(new CustomEvent('ws:mood',      { detail: data })); Toast.info('🌊 Partner mood updated', data.userDisplayName + ' logged their mood'); },
  onLoveNote(data)  { window.dispatchEvent(new CustomEvent('ws:lovenote',  { detail: data })); Toast.info('💌 New Love Note', 'You have a new love note!'); },
  onNotification(n) { updateNotifBadge(parseInt(document.getElementById('notif-badge')?.textContent || 0) + 1); Toast.info(n.title, n.body); },

  async logout() {
    try { await api.auth.logout(); } catch {}
    api.clearTokens();
    WS.disconnect();
	window.location.href = '/api/index.html';
  },

  setPageTitle(title) {
    const el = document.getElementById('page-title');
    if (el) el.textContent = title;
  },

  // ── Page Loaders ──────────────────────────── //
  async loadDashboard() {
    this.setPageTitle('Dashboard');
    const content = document.getElementById('content');
    content.innerHTML = `<div class="page-container stagger" id="dashboard-page"></div>`;
    await loadPage('dashboard');
  },
  async loadChat() {
    this.setPageTitle('Chat');
    const badge = document.getElementById('msg-badge');
    if (badge) badge.style.display = 'none';
    await loadPage('chat');
  },
  async loadTimeline() { this.setPageTitle('Our Timeline'); await loadPage('timeline'); },
  async loadMood()     { this.setPageTitle('Mood Tracker'); await loadPage('mood');     },
  async loadDates()    { this.setPageTitle('Special Dates'); await loadPage('dates');   },
  async loadNotes()    { this.setPageTitle('Love Notes');   await loadPage('notes');    },
  async loadProfile()  { this.setPageTitle('Profile');      await loadPage('profile');  },
};

/* ── Page Loader ──────────────────────────────── */
async function loadPage(name) {
  const content = document.getElementById('content');
  if (!content) return;
  if (name !== 'chat') content.innerHTML = `<div class="page-container"><div class="empty-state"><div class="spinner"></div></div></div>`;
  try {
    const module = Pages[name];
    if (module) await module.render(content);
  } catch (e) {
    console.error('Page load error:', e);
    content.innerHTML = `<div class="page-container"><div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Page Error</div><div class="empty-desc">${e.message}</div></div></div>`;
  }
}

/* ── Helpers ──────────────────────────────────── */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...opts });
}

function notifIcon(type) {
  const m = { MESSAGE:'💬', MOOD:'🌊', MEMORY:'📸', SPECIAL_DATE:'📅', LOVE_NOTE:'💌', SYSTEM:'⚙️', REMINDER:'🔔' };
  return m[type] || '🔔';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function modal(title, bodyHtml, footerHtml = '') {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">✕</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    </div>`;
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
  document.body.appendChild(backdrop);
  return backdrop;
}

window.timeAgo = timeAgo;
window.formatDate = formatDate;
window.modal = modal;
window.escapeHtml = escapeHtml;
window.App = App;
window.Router = Router;
window.Theme = Theme;
window.Toast = Toast;
window.WS = WS;