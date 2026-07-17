// ============================================================
// WRO Philippines – Standard User Portal – App Controller
// Mobile-first: bottom nav (mobile) + sidebar (desktop)
// ============================================================

const PortalRouter = {
  _current: null,
  _routes:  {},

  on(name, fn) { this._routes[name] = fn; return this; },

  navigate(name, opts = {}) {
    if (!this._routes[name]) return;
    this._current = name;

    // Active state – bottom nav
    document.querySelectorAll('.p-bottom-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.route === name);
    });

    // Active state – sidebar
    document.querySelectorAll('.p-sidebar-item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === name);
    });

    // Close sidebar on mobile after nav
    PortalApp.closeSidebar();

    // Loading state
    if (!opts.silent) {
      const c = document.getElementById('portal-content');
      if (c) c.innerHTML = `<div class="p-loading"><div class="p-spinner"></div></div>`;
    }

    requestAnimationFrame(() => this._routes[name]());
  },
};

const PortalApp = {
  _user: null,

  init() {
    if (!PORTAL_AUTH.guard()) return;
    this._user = PORTAL_AUTH.currentUser();

    // Register routes
    PortalRouter
      .on('dashboard',     () => PortalDashboard.render())
      .on('teams',         () => PortalTeams.render())
      .on('announcements', () => PortalAnnouncements.render())
      .on('profile',       () => PortalProfile.render());

    this._renderTopbar();
    this._renderSidebar();
    this._renderBottomNav();

    // Initial route
    PortalRouter.navigate('dashboard');

    // Overlay click closes sidebar
    document.getElementById('portal-overlay').addEventListener('click', () => this.closeSidebar());

    // ESC key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.closeSidebar();
    });
  },

  _ic(d) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="p-bottom-icon">${d}</svg>`;
  },

  NAV: [
    {
      route: 'dashboard',
      label: 'Home',
      icon:  '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    },
    {
      route: 'teams',
      label: 'Teams',
      icon:  '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 17h6M17 14v6"/>',
    },
    {
      route: 'announcements',
      label: 'Updates',
      icon:  '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    },
    {
      route: 'profile',
      label: 'Profile',
      icon:  '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    },
  ],

  _renderTopbar() {
    const u = this._user;
    document.getElementById('portal-topbar').innerHTML = `
      <!-- Hamburger (mobile/tablet only) -->
      <button class="p-hamburger" onclick="PortalApp.openSidebar()" aria-label="Open menu">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <!-- Brand -->
      <div class="p-topbar-brand">
        <img src="assets/image/FELTA_LOGO_LIGHT.png" alt="WRO PH" class="p-topbar-logo js-theme-logo">
        <div>
          <div class="p-topbar-name">WRO Philippines</div>
          <div class="p-topbar-sub">Standard User Portal</div>
        </div>
      </div>

      <!-- Right: avatar -->
      <div class="p-topbar-right">
        <div class="p-topbar-avatar" onclick="PortalRouter.navigate('profile')" title="${u?.name || 'Profile'}">
          ${(u?.name || 'U').charAt(0).toUpperCase()}
        </div>
      </div>`;
  },

  _renderSidebar() {
    const u = this._user;
    const navItems = this.NAV.map(item => `
      <button class="p-sidebar-item" data-route="${item.route}"
        onclick="PortalRouter.navigate('${item.route}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${item.icon}</svg>
        <span>${item.label === 'Home' ? 'Dashboard' : item.label === 'Updates' ? 'Announcements' : item.label}</span>
      </button>`).join('');

    document.getElementById('portal-sidebar').innerHTML = `
      <!-- Header -->
      <div class="p-sidebar-header">
        <div class="p-sidebar-brand">
          <img src="assets/image/FELTA_LOGO_LIGHT.png" alt="WRO PH" class="p-sidebar-logo js-theme-logo">
          <div>
            <div class="p-sidebar-title">WRO Philippines</div>
            <div class="p-sidebar-sub">Standard Portal</div>
          </div>
        </div>
        <button class="p-sidebar-close" onclick="PortalApp.closeSidebar()" aria-label="Close menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- User info -->
      <div class="p-sidebar-user">
        <div class="p-sidebar-avatar">${(u?.name || 'U').charAt(0).toUpperCase()}</div>
        <div style="min-width:0;">
          <div class="p-sidebar-user-name">${u?.name || 'User'}</div>
          <div class="p-sidebar-user-role">Standard User</div>
        </div>
      </div>

      <div class="p-sidebar-divider"></div>

      <!-- Nav -->
      <nav class="p-sidebar-nav" aria-label="Main navigation">
        ${navItems}
      </nav>

      <div class="p-sidebar-spacer"></div>

      <!-- Footer -->
      <div class="p-sidebar-footer">
        <div class="p-sidebar-divider" style="margin-bottom:0.5rem;"></div>
        <button class="p-sidebar-logout" onclick="PORTAL_AUTH.logout()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      </div>`;
  },

  _renderBottomNav() {
    const nav = document.getElementById('portal-bottom-nav');
    if (!nav) return;
    nav.innerHTML = this.NAV.map(item => `
      <button class="p-bottom-tab" data-route="${item.route}"
        onclick="PortalRouter.navigate('${item.route}')"
        aria-label="${item.label}">
        ${this._ic(item.icon)}
        <span class="p-bottom-label">${item.label}</span>
      </button>`).join('');
  },

  openSidebar() {
    document.getElementById('portal-sidebar').classList.add('open');
    document.getElementById('portal-overlay').classList.add('visible');
    document.body.style.overflow = 'hidden';
  },

  closeSidebar() {
    document.getElementById('portal-sidebar').classList.remove('open');
    document.getElementById('portal-overlay').classList.remove('visible');
    document.body.style.overflow = '';
  },
};

window.PortalRouter = PortalRouter;
window.PortalApp    = PortalApp;
