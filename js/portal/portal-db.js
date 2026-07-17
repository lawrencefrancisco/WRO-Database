// ============================================================
// WRO Philippines – Standard User Portal DB Client
// Thin fetch wrapper that uses the portal session token
// and the /api/portal/* endpoints
// ============================================================

const PORTAL_DB = {
  _BASE: 'https://wro-database.onrender.com/api',

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

  // Convenience portal-scoped getters
  me()            { return this.get('/portal/me'); },
  dashboard()     { return this.get('/portal/dashboard'); },
  teams()         { return this.get('/portal/teams'); },
  payments()      { return this.get('/portal/payments'); },
  announcements() { return this.get('/portal/announcements'); },
  updateProfile(data) { return this.put('/portal/profile', data); },
};

window.PORTAL_DB = PORTAL_DB;
