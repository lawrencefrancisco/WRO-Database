// ============================================================
// WRO Philippines – Standard User Portal Auth Module
// Separate from Admin AUTH – uses its own session key and
// redirects to portal-login.html instead of index.html
// ============================================================

const PORTAL_AUTH = {

  _SESSION_KEY: 'wro_ph_portal_session',
  _API_BASE:    'http://localhost:3000/api',

  /** Login via API – only accepts STANDARD_USER role */
  async login(username, password) {
    try {
      const res  = await fetch(`${this._API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid username or password.' };
      }

      // Block admin roles from the Standard User Portal
      if (data.portal !== 'standard') {
        return {
          success: false,
          error: 'This portal is for Standard Users only. Administrators should use the Admin Portal.',
        };
      }

      const session = {
        ...data.user,
        _token:    data.token,
        loginTime: new Date().toISOString(),
      };
      sessionStorage.setItem(this._SESSION_KEY, JSON.stringify(session));
      return { success: true, user: session };

    } catch (err) {
      return { success: false, error: 'Cannot reach server. Make sure the API is running on port 3000.' };
    }
  },

  logout() {
    sessionStorage.removeItem(this._SESSION_KEY);
    window.location.href = 'portal-login.html';
  },

  currentUser() {
    try {
      const raw = sessionStorage.getItem(this._SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  isLoggedIn() { return !!this.currentUser(); },

  token() { return this.currentUser()?._token || null; },

  /** Guard – redirect to portal-login.html if not authenticated */
  guard() {
    if (!this.isLoggedIn()) {
      window.location.href = 'portal-login.html';
      return false;
    }
    return true;
  },
};

window.PORTAL_AUTH = PORTAL_AUTH;
