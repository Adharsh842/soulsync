/**
 * SoulSync API Client (UPDATED)
 */

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8080/api'
  : '/api';

class ApiClient {
  constructor() {
    this._refreshPromise = null;
  }

  /* ── Token Management ── */
  getToken()        { return localStorage.getItem('ss_token'); }
  getRefreshToken() { return localStorage.getItem('ss_refresh'); }

  setTokens(access, refresh) {
    localStorage.setItem('ss_token', access);
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

  setUser(user) {
    localStorage.setItem('ss_user', JSON.stringify(user));
  }

  /* ── Core Request ── */
  async request(method, path, body = null, opts = {}) {
    const token = this.getToken();

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    let res = await fetch(API_BASE + path, config);

    // 🔁 Auto refresh
    if (res.status === 401 && !opts._retry) {
      try {
        await this._doRefresh();
        return this.request(method, path, body, { ...opts, _retry: true });
      } catch {
        this.clearTokens();
        window.location.href = '/index.html';
        return;
      }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiError(data.message || 'Request failed', res.status, data);
    }

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

    this._refreshPromise.finally(() => {
      this._refreshPromise = null;
    });

    return this._refreshPromise;
  }

  /* ── Upload ── */
  async upload(path, formData) {
    const token = this.getToken();

    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiError(data.message || 'Upload failed', res.status, data);
    }

    return data;
  }

  /* ── Methods ── */
  get(path)         { return this.request('GET', path); }
  post(path, body)  { return this.request('POST', path, body); }
  put(path, body)   { return this.request('PUT', path, body); }
  patch(path, body) { return this.request('PATCH', path, body); }
  del(path)         { return this.request('DELETE', path); }

  /* ── Auth ── */
  auth = {
    signup: (data) => this.post('/auth/signup', data),
    login:  (data) => this.post('/auth/login', data),
    logout: ()     => this.post('/auth/logout'),
    refresh: (rt)  => this.post('/auth/refresh', { refreshToken: rt }),
  };
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const api = new ApiClient();
window.api = api;