// ============================================================
// WRO Philippines DBMS – Authentication & Role Management
// Now backed by the Node.js API (JWT-based)
// ============================================================

const AUTH = {

  ROLES: {
    SUPER_ADMIN:   { label: 'Super Administrator', color: 'purple', icon: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#8338ec' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'><path d='M12 6l4 6 5-4-2 10H5L3 8l5 4 4-6z'/></svg>` },
    EVENT_ADMIN:   { label: 'Event Administrator', color: 'blue',   icon: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#1d6fa4' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><circle cx='12' cy='12' r='6'/><circle cx='12' cy='12' r='2'/></svg>` },
    STANDARD_USER: { label: 'Standard User',       color: 'green',  icon: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#2dc653' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'><path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/><circle cx='12' cy='7' r='4'/></svg>` },
  },

  PERMISSIONS: {
    SUPER_ADMIN: ['*'],  // All permissions
    EVENT_ADMIN: [
      'schools.read','schools.write',
      'coaches.read','coaches.write',
      'students.read','students.write',
      'teams.read','teams.write',
      'competitions.read','competitions.write',
      'payments.read','payments.write',
      'judging.read','judging.write',
      'awards.read','awards.write',
      'communications.read','communications.write',
      'delegation.read',
      'reports.read','reports.write',
      'users.read',
    ],
    STANDARD_USER: [], // No admin permissions – uses Standard User Portal instead
  },

  _SESSION_KEY: 'wro_ph_session',
  _API_BASE:    'http://localhost:3000/api',

  /** Login via API – returns { success, user/error } */
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

      // Block Standard Users from the Admin Portal
      if (data.portal === 'standard') {
        return {
          success: false,
          error: 'This portal is for administrators only. Standard Users should use the Standard User Portal.',
          redirect: 'portal-login.html',
        };
      }


      // Store user + JWT token in sessionStorage
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

  /** Logout – clears session and redirects */
  logout() {
    sessionStorage.removeItem(this._SESSION_KEY);
    window.location.href = 'index.html';
  },

  /** Get current logged-in user (reads from sessionStorage) */
  currentUser() {
    try {
      const raw = sessionStorage.getItem(this._SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  /** Check if user is logged in */
  isLoggedIn() {
    return !!this.currentUser();
  },

  /** Check permission */
  can(permission) {
    const user = this.currentUser();
    if (!user) return false;
    const perms = this.PERMISSIONS[user.role] || [];
    return perms.includes('*') || perms.includes(permission);
  },

  /** Guard – redirect to login if not authenticated */
  guard() {
    if (!this.isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  /** Require specific role */
  requireRole(...roles) {
    const user = this.currentUser();
    if (!user || !roles.includes(user.role)) {
      Toast.error('Access Denied: Insufficient permissions.');
      return false;
    }
    return true;
  },

  /** Get role info */
  getRoleInfo(role) {
    return this.ROLES[role] || { label: role, color: 'gray', icon: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#F6C945' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'><path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/><circle cx='12' cy='7' r='4'/></svg>` };
  },
};

window.AUTH = AUTH;
