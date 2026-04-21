/**
 * SoulSync API Client
 * Centralized HTTP layer with JWT auth, refresh logic, and error handling
 */

const API_BASE = 'http://localhost:8080/api';

class ApiClient {
  constructor() {
    this._refreshPromise = null;
  }

  /* ── Token Management ─────────────────────── */
  getToken()        { return localStorage.getItem('ss_token'); }
  getRefreshToken() { return localStorage.getItem('ss_refresh'); }
  setTokens(access, refresh) {
    localStorage.setItem('ss_token',   access);
    localStorage.setItem('ss_refresh', refresh);
  }
  clearTokens() {
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_refresh');
    localStorage.removeItem('ss_user');
  }

  getUser() {
    try { return JSON.parse(localStorage.getItem('ss_user') || 'null'); }
    catch { return null; }
  }
  setUser(user) { localStorage.setItem('ss_user', JSON.stringify(user)); }

  /* ── Core Request ─────────────────────────── */
  async request(method, path, body = null, opts = {}) {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (opts.headers) Object.assign(headers, opts.headers);

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    let res = await fetch(API_BASE + path, config);

    // Auto-refresh on 401
    if (res.status === 401 && !opts._retry) {
      try {
        await this._doRefresh();
        return this.request(method, path, body, { ...opts, _retry: true });
      } catch {
        this.clearTokens();
        window.location.href = '/';
        return;
      }
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.message || 'Request failed', res.status, data);
    return data;
  }

  async _doRefresh() {
    if (this._refreshPromise) return this._refreshPromise;
    this._refreshPromise = (async () => {
      const rt = this.getRefreshToken();
      if (!rt) throw new Error('No refresh token');
      const res = await fetch(API_BASE + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Refresh failed');
      this.setTokens(data.data.accessToken, data.data.refreshToken);
      this.setUser(data.data.user);
    })();
    this._refreshPromise.finally(() => { this._refreshPromise = null; });
    return this._refreshPromise;
  }

  /* ── Upload ───────────────────────────────── */
  async upload(path, formData) {
    const token = this.getToken();
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.message || 'Upload failed', res.status, data);
    return data;
  }

  /* ── Convenience wrappers ─────────────────── */
  get(path, opts)         { return this.request('GET',    path, null,  opts); }
  post(path, body, opts)  { return this.request('POST',   path, body,  opts); }
  put(path, body, opts)   { return this.request('PUT',    path, body,  opts); }
  patch(path, body, opts) { return this.request('PATCH',  path, body,  opts); }
  del(path, opts)         { return this.request('DELETE', path, null,  opts); }

  /* ── Auth Endpoints ───────────────────────── */
  auth = {
    signup: (data)         => this.post('/auth/signup', data),
    login:  (data)         => this.post('/auth/login', data),
    logout: ()             => this.post('/auth/logout'),
    generateInvite: ()     => this.get('/auth/invite-code'),
    joinCouple: (code)     => this.post('/auth/join-couple', { inviteCode: code }),
    refreshToken: (token)  => this.post('/auth/refresh', { refreshToken: token }),
  };

  /* ── User Endpoints ───────────────────────── */
  users = {
    me:           ()       => this.get('/users/me'),
    updateMe:     (data)   => this.put('/users/me', data),
    couple:       ()       => this.get('/users/me/couple'),
  };

  /* ── Message Endpoints ────────────────────── */
  messages = {
    list:    (page=0, size=50) => this.get(`/messages?page=${page}&size=${size}`),
    send:    (data)            => this.post('/messages', data),
    react:   (id, emoji)       => this.post(`/messages/${id}/react`, { emoji }),
    markRead: ()               => this.put('/messages/read'),
  };

  /* ── Memory Endpoints ─────────────────────── */
  memories = {
    timeline:   (page=0, size=20) => this.get(`/memories?page=${page}&size=${size}`),
    create:     (data)            => this.post('/memories', data),
    get:        (id)              => this.get(`/memories/${id}`),
    update:     (id, data)        => this.put(`/memories/${id}`, data),
    delete:     (id)              => this.del(`/memories/${id}`),
    favorite:   (id)              => this.post(`/memories/${id}/favorite`),
    onThisDay:  ()                => this.get('/memories/on-this-day'),
  };

  /* ── Mood Endpoints ───────────────────────── */
  moods = {
    log:       (data)      => this.post('/moods', data),
    list:      (days=30)   => this.get(`/moods?days=${days}`),
    analytics: (days=30)   => this.get(`/moods/analytics?days=${days}`),
  };

  /* ── Special Dates ────────────────────────── */
  specialDates = {
    list:     ()          => this.get('/special-dates'),
    upcoming: ()          => this.get('/special-dates/upcoming'),
    create:   (data)      => this.post('/special-dates', data),
    update:   (id, data)  => this.put(`/special-dates/${id}`, data),
    delete:   (id)        => this.del(`/special-dates/${id}`),
  };

  /* ── Love Notes ───────────────────────────── */
  loveNotes = {
    list:   (page=0, size=20) => this.get(`/love-notes?page=${page}&size=${size}`),
    create: (data)            => this.post('/love-notes', data),
    read:   (id)              => this.put(`/love-notes/${id}/read`),
  };

  /* ── Notifications ────────────────────────── */
  notifications = {
    list:       (page=0, size=20) => this.get(`/notifications?page=${page}&size=${size}`),
    unreadCount: ()               => this.get('/notifications/unread-count'),
    markRead:   (id)              => this.put(`/notifications/${id}/read`),
    markAllRead: ()               => this.put('/notifications/read-all'),
  };

  /* ── File Upload ──────────────────────────── */
  files = {
    photo:  (file) => { const fd = new FormData(); fd.append('file', file); return this.upload('/upload/photo', fd); },
    video:  (file) => { const fd = new FormData(); fd.append('file', file); return this.upload('/upload/video', fd); },
    voice:  (file) => { const fd = new FormData(); fd.append('file', file); return this.upload('/upload/voice', fd); },
    avatar: (file) => { const fd = new FormData(); fd.append('file', file); return this.upload('/upload/avatar', fd); },
  };
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message); this.status = status; this.data = data;
  }
}

// Singleton
const api = new ApiClient();
window.api = api;