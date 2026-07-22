// ============================================================
// WRO Philippines – Standard User Portal DB Client
// Thin fetch wrapper that uses the portal session token
// and the /api/portal/* endpoints
// ============================================================

const PORTAL_DB = {
  _BASE: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3000/api' : window.location.origin + '/api',

  _headers() {
    return {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${PORTAL_AUTH.token()}`,
    };
  },

  async get(path) {
    const res  = await fetch(`${this._BASE}${path}`, { headers: this._headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  async put(path, body) {
    const res  = await fetch(`${this._BASE}${path}`, {
      method:  'PUT',
      headers: this._headers(),
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  async post(path, body = {}) {
    const res  = await fetch(`${this._BASE}${path}`, {
      method:  'POST',
      headers: this._headers(),
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  // Convenience portal-scoped getters
  me()            { return this.get('/portal/me'); },
  dashboard()     { return this.get('/portal/dashboard'); },
  teams()         { return this.get('/portal/teams'); },
  payments()      { return this.get('/portal/payments'); },
  announcements() { return this.get('/portal/announcements'); },
  notifications() { return this.get('/portal/notifications'); },
  markNotificationRead(id) { return this.put(`/portal/notifications/${id}/read`, {}); },
  markAllNotificationsRead() { return this.put('/portal/notifications/read-all', {}); },
  markAnnouncementRead(id) { return this.put(`/portal/announcements/${id}/read`, {}); },
  markAllAnnouncementsRead() { return this.put('/portal/announcements/mark-all-read', {}); },
  updateProfile(data) { return this.put('/portal/profile', data); },
};

window.PORTAL_DB = PORTAL_DB;
