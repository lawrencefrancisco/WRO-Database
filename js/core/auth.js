// ============================================================
// WRO Philippines DBMS – Authentication & Role Management
// ============================================================

const AUTH = {

  ROLES: {
    SUPER_ADMIN:   { label: 'Super Administrator', color: 'purple', icon: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#8338ec' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'><path d='M12 6l4 6 5-4-2 10H5L3 8l5 4 4-6z'/></svg>` },
    EVENT_ADMIN:   { label: 'Event Administrator', color: 'blue',   icon: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#1d6fa4' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><circle cx='12' cy='12' r='6'/><circle cx='12' cy='12' r='2'/></svg>` },
    JUDGE:         { label: 'Judge',               color: 'yellow', icon: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#D4A017' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/></svg>` },
    COACH:         { label: 'Coach',               color: 'green',  icon: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#2dc653' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9H4.5a2.5 2.5 0 0 1 0-5H6'/><path d='M18 9h1.5a2.5 2.5 0 0 0 0-5H18'/><path d='M4 22h16'/><path d='M18 2H6v7a6 6 0 0 0 12 0V2z'/></svg>` },
    VOLUNTEER:     { label: 'Volunteer',            color: 'gray',   icon: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#a89060' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'><path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/><circle cx='12' cy='7' r='4'/></svg>` },
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
    JUDGE: [
      'teams.read',
      'judging.read','judging.write',
      'awards.read',
    ],
    COACH: [
      'schools.read',
      'coaches.read',
      'students.read','students.write',
      'teams.read','teams.write',
      'competitions.read',
      'payments.read',
      'awards.read',
      'communications.read',
    ],
    VOLUNTEER: [
      'teams.read',
      'students.read',
      'competitions.read',
    ],
  },

  _SESSION_KEY: 'wro_ph_session',

  /** Login */
  login(username, password) {
    const users = DB.getAll('users');
    const user  = users.find(u => u.username === username && u.password === password && !u.isDeleted);
    if (!user) return { success: false, error: 'Invalid username or password.' };
    if (!user.isActive) return { success: false, error: 'Account is inactive. Contact administrator.' };

    const session = {
      userId:    user.id,
      name:      user.name,
      role:      user.role,
      email:     user.email,
      avatar:    user.avatar || null,
      loginTime: new Date().toISOString(),
    };
    sessionStorage.setItem(this._SESSION_KEY, JSON.stringify(session));
    DB.update('users', user.id, { lastLogin: new Date().toISOString() });
    return { success: true, user: session };
  },

  /** Logout */
  logout() {
    sessionStorage.removeItem(this._SESSION_KEY);
    window.location.href = 'index.html';
  },

  /** Get current logged-in user */
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
    return this.ROLES[role] || { label: role, color: 'gray', icon: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#a89060' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'><path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/><circle cx='12' cy='7' r='4'/></svg>` };
  },
};

window.AUTH = AUTH;
