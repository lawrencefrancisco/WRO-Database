// ============================================================
// WRO Philippines DBMS – Client-Side SPA Router
// ============================================================

const Router = {
  _routes: {},
  _current: null,

  /** Register a route: Router.on('schools', () => Schools.render()) */
  on(name, handler) {
    this._routes[name] = handler;
    return this;
  },

  /** Navigate to a route */
  navigate(name, params = {}) {
    if (!this._routes[name]) {
      console.warn(`[Router] No route: ${name}`);
      return;
    }
    this._current = name;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === name);
    });

    // Update page title
    const titleEl = document.getElementById('page-title');
    const subtitleEl = document.getElementById('page-subtitle');
    const meta = this._routeMeta[name] || {};
    if (titleEl) titleEl.textContent = meta.title || name;
    if (subtitleEl) subtitleEl.textContent = meta.subtitle || '';

    // Render route
    const contentEl = document.getElementById('page-content');
    if (contentEl) {
      contentEl.innerHTML = '<div class="flex items-center justify-center h-48"><div class="spinner"></div></div>';
    }
    setTimeout(() => {
      this._routes[name](params);
      // Add fade-in animation to new content
      if (contentEl) {
        contentEl.querySelectorAll('.page-view').forEach(el => {
          el.style.animation = 'none';
          el.offsetHeight; // reflow
          el.style.animation = '';
        });
      }
    }, 80);
  },

  _routeMeta: {
    dashboard:      { title: 'Dashboard',              subtitle: 'Real-time overview of WRO Philippines operations' },
    schools:        { title: 'School Management',      subtitle: 'Manage all registered schools' },
    coaches:        { title: 'Coach Management',       subtitle: 'Coach profiles and records' },
    students:       { title: 'Student Management',     subtitle: 'Participant profiles and records' },
    teams:          { title: 'Team Management',        subtitle: 'Team registrations and details' },
    competitions:   { title: 'Competition Management', subtitle: 'Events, seasons, and categories' },
    judging:        { title: 'Judging & Scoring',      subtitle: 'Digital score sheets and rankings' },
    awards:         { title: 'Awards & Recognition',   subtitle: 'WRO Philippines Hall of Fame' },
    payments:       { title: 'Payment Management',     subtitle: 'Registration fees and financial records' },
    communications: { title: 'Communications',         subtitle: 'Email and SMS history' },
    delegation:     { title: 'International Delegation', subtitle: 'International competition management' },
    users:          { title: 'User Management',        subtitle: 'System accounts and permissions' },
    reports:        { title: 'Reports & Exports',      subtitle: 'Generate downloadable reports' },
    analytics:      { title: 'Analytics & Maps',       subtitle: 'Data insights and geographic distribution' },
    auditlogs:      { title: 'Audit Logs',             subtitle: 'System activity and changes' },
  },

  current() { return this._current; },
};

window.Router = Router;
