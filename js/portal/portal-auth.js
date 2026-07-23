// ============================================================
// WRO Philippines – Standard User Portal Auth Module
// Separate from Admin AUTH – uses its own session key and
// redirects to portal-login.html instead of index.html
// ============================================================

const PORTAL_AUTH = {

  _SESSION_KEY: 'wro_ph_portal_session',
  _API_BASE: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3000/api' : window.location.origin + '/api',

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

  /**
   * Dynamically computes the base directory of the app so redirects work
   * whether served by Apache (e.g. /WRO-old/) or Node.js on port 3000 (/).
   * Uses this script's own src to find the root — avoids being tripped up
   * by deep-linked URLs like /WRO-old/announcements/1.
   */
  _baseUrl() {
    // This script is at: /WRO-old/js/portal/portal-auth.js
    // We need:           /WRO-old/
    const scripts = document.querySelectorAll('script[src]');
    for (const s of scripts) {
      if (s.src && s.src.includes('portal-auth.js')) {
        // e.g. http://localhost/WRO-old/js/portal/portal-auth.js
        //   → strip "js/portal/portal-auth.js" → http://localhost/WRO-old/
        return s.src.replace(/js\/portal\/portal-auth\.js.*$/, '');
      }
    }
    // Fallback: use the origin (works correctly on Node.js server at port 3000)
    return window.location.origin + '/';
  },

  logout() {
    sessionStorage.removeItem(this._SESSION_KEY);
    window.location.href = this._baseUrl() + 'portal-login';
  },

  currentUser() {
    try {
      const raw = sessionStorage.getItem(this._SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  isLoggedIn() { return !!this.currentUser(); },

  token() { return this.currentUser()?._token || null; },

  /** Guard – redirect to portal-login if not authenticated */
  guard() {
    if (!this.isLoggedIn()) {
      window.location.href = this._baseUrl() + 'portal-login';
      return false;
    }
    return true;
  },
};

window.PORTAL_AUTH = PORTAL_AUTH;
