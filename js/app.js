// ============================================================
// WRO Philippines DBMS – Main Application Controller
// ============================================================

// ─────────────────────────────────────────────────────────────
// SidebarManager – centralised hamburger menu logic
// Handles: mobile open/close, scroll lock, ARIA, focus trapping
//          desktop collapse, and body-class-driven margin shift
// ─────────────────────────────────────────────────────────────
const SidebarManager = {
  _mobileOpen: false,
  _collapsed:  false,

  // ── Getters ──────────────────────────────────────────────────
  isOpen()      { return this._mobileOpen; },
  isCollapsed() { return this._collapsed; },

  // ── Mobile: open ─────────────────────────────────────────────
  open() {
    const sb      = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    const toggle  = document.getElementById('sidebar-toggle');
    if (!sb || this._mobileOpen) return;

    this._mobileOpen = true;

    // Show sidebar
    sb.classList.add('mobile-open');
    sb.removeAttribute('aria-hidden');

    // Show overlay (CSS transition via class)
    if (overlay) {
      overlay.classList.remove('hidden');
      // Force reflow so the opacity transition fires
      void overlay.offsetWidth;
      overlay.classList.add('overlay-visible');
    }

    // ARIA on toggle button
    if (toggle) toggle.setAttribute('aria-expanded', 'true');

    // Body scroll lock
    document.body.classList.add('sidebar-open');

    // Move focus to first focusable element inside sidebar
    const firstFocusable = sb.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();

    // Trap focus within sidebar while it's open
    this._trapFocus(sb);
  },

  // ── Mobile: close ────────────────────────────────────────────
  close() {
    const sb      = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    const toggle  = document.getElementById('sidebar-toggle');
    if (!sb || !this._mobileOpen) return;

    this._mobileOpen = false;

    // Hide sidebar
    sb.classList.remove('mobile-open');
    sb.setAttribute('aria-hidden', 'true');

    // Fade out overlay then hide it
    if (overlay) {
      overlay.classList.remove('overlay-visible');
      // Wait for CSS transition to finish before hiding from DOM
      const onTransitionEnd = () => {
        overlay.classList.add('hidden');
        overlay.removeEventListener('transitionend', onTransitionEnd);
      };
      overlay.addEventListener('transitionend', onTransitionEnd);
    }

    // ARIA on toggle button
    if (toggle) toggle.setAttribute('aria-expanded', 'false');

    // Remove body scroll lock
    document.body.classList.remove('sidebar-open');

    // Release focus trap
    this._releaseTrap();

    // Return focus to the toggle button
    if (toggle) toggle.focus();
  },

  // ── Mobile: toggle ───────────────────────────────────────────
  toggle() {
    this._mobileOpen ? this.close() : this.open();
  },

  // ── Desktop: collapse/expand icon-only strip ─────────────────
  toggleCollapse() {
    const sb = document.getElementById('sidebar');
    if (!sb) return;
    this._collapsed = !this._collapsed;
    sb.classList.toggle('collapsed', this._collapsed);
    // Body class drives the CSS sibling #main-content margin
    document.body.classList.toggle('sidebar-collapsed', this._collapsed);
  },

  // ── Close sidebar when a nav link is clicked on mobile ───────
  onNavClick() {
    if (window.innerWidth <= 768 && this._mobileOpen) {
      this.close();
    }
  },

  // ── Focus trapping ───────────────────────────────────────────
  _boundKeydown: null,
  _trapFocus(container) {
    const focusable = () => Array.from(
      container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(el => !el.disabled && el.offsetParent !== null);

    this._boundKeydown = (e) => {
      if (e.key !== 'Tab') return;
      const els   = focusable();
      const first = els[0];
      const last  = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', this._boundKeydown);
  },
  _releaseTrap() {
    if (this._boundKeydown) {
      document.removeEventListener('keydown', this._boundKeydown);
      this._boundKeydown = null;
    }
  },

  // ── Initialise after sidebar & topbar are rendered ───────────
  init() {
    const overlay = document.getElementById('mobile-overlay');
    const sb      = document.getElementById('sidebar');

    // Set initial ARIA state
    if (sb) sb.setAttribute('aria-hidden', 'true');

    // Overlay click closes sidebar (replaces inline onclick)
    if (overlay) {
      // Remove the old inline handler if present
      overlay.removeAttribute('onclick');
      overlay.addEventListener('click', () => this.close());
    }

    // Close sidebar on nav item click (mobile UX)
    if (sb) {
      sb.addEventListener('click', (e) => {
        const navItem = e.target.closest('[data-route]');
        if (navItem) this.onNavClick();
      });
    }

    // Handle resize: if user rotates device to desktop, clean up mobile state
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && this._mobileOpen) {
        // Silently clean up without animating
        this._mobileOpen = false;
        if (sb)      { sb.classList.remove('mobile-open'); sb.setAttribute('aria-hidden', 'true'); }
        if (overlay) { overlay.classList.remove('overlay-visible'); overlay.classList.add('hidden'); }
        document.body.classList.remove('sidebar-open');
        this._releaseTrap();
        const toggle = document.getElementById('sidebar-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    });
  },
};

window.SidebarManager = SidebarManager;

const App = {

  init() {
    // Guard authentication
    if (!AUTH.guard()) return;

    ThemeManager.init();

    // Set up routes
    Router
      .on('dashboard',      () => Dashboard.render())
      .on('schools',        () => Schools.render())
      .on('coaches',        () => Coaches.render())
      .on('students',       () => Students.render())
      .on('teams',          () => Teams.render())
      .on('competitions',   () => Competitions.render())
      .on('judging',        () => Judging.render())
      .on('awards',         () => Awards.render())
      .on('payments',       () => Payments.render())
      .on('communications', () => Communications.render())
      .on('delegation',     () => Delegation.render())
      .on('users',          () => Users.render())
      .on('reports',        () => Reports.render())
      .on('auditlogs',      () => AuditLogs.render());

    // Render layout
    this._renderSidebar();
    this._renderTopbar();

    // Initialise sidebar manager AFTER both elements are in the DOM
    SidebarManager.init();

    // Navigate to dashboard
    Router.navigate('dashboard');

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close mobile sidebar first; fall through to modal if sidebar is not open
        if (SidebarManager.isOpen()) {
          SidebarManager.close();
        } else {
          Modal.close();
        }
      }
    });
  },

  _renderSidebar() {
    const user  = AUTH.currentUser();
    const ri    = AUTH.getRoleInfo(user?.role);
    const canSeeUsers = AUTH.can('*') || user?.role === 'SUPER_ADMIN';

    // ── Lucide SVG icon helper (18×18, thin-line, currentColor) ──
    const _icon = (d, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0" ${extra}>${d}</svg>`;

    const ICONS = {
      dashboard:      _icon('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>'),
      reports:        _icon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>'),
      schools:        _icon('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
      coaches:        _icon('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>'),
      students:       _icon('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5"/>'),
      teams:          _icon('<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 17h6M17 14v6"/>'),
      competitions:   _icon('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>'),
      judging:        _icon('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
      awards:         _icon('<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>'),
      payments:       _icon('<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>'),
      communications: _icon('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
      delegation:     _icon('<path d="M22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'),
      users:          _icon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
      auditlogs:      _icon('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
      logout:         _icon('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'),
    };

    const navGroups = [
      {
        label: 'Overview',
        items: [
          { route: 'dashboard', icon: ICONS.dashboard,      label: 'Dashboard' },
          { route: 'analytics', icon: ICONS.reports,        label: 'Analytics', hide: true },
          { route: 'reports',   icon: ICONS.reports,        label: 'Reports' },
        ]
      },
      {
        label: 'Database Modules',
        items: [
          { route: 'schools',      icon: ICONS.schools,      label: 'Schools',      perm: 'schools.read' },
          { route: 'coaches',      icon: ICONS.coaches,      label: 'Coaches',      perm: 'coaches.read' },
          { route: 'students',     icon: ICONS.students,     label: 'Students',     perm: 'students.read' },
          { route: 'teams',        icon: ICONS.teams,        label: 'Teams',        perm: 'teams.read' },
          { route: 'competitions', icon: ICONS.competitions, label: 'Competitions', perm: 'competitions.read' },
        ]
      },
      {
        label: 'Operations',
        items: [
          { route: 'judging',        icon: ICONS.judging,        label: 'Judges',        perm: 'judging.read' },
          { route: 'awards',         icon: ICONS.awards,         label: 'Awards',        perm: 'awards.read' },
          { route: 'payments',       icon: ICONS.payments,       label: 'Payments',      perm: 'payments.read' },
          { route: 'communications', icon: ICONS.communications, label: 'Communications',perm: 'communications.read' },
          { route: 'delegation',     icon: ICONS.delegation,     label: 'Delegation',    perm: 'delegation.read' },
        ]
      },
      {
        label: 'Administration',
        items: [
          { route: 'users',     icon: ICONS.users,     label: 'Users',      adminOnly: true },
          { route: 'auditlogs', icon: ICONS.auditlogs, label: 'Audit Logs', adminOnly: true },
        ]
      }
    ];

    const navHTML = navGroups.map(group => {
      const visibleItems = group.items.filter(item => {
        if (item.hide) return false;
        if (item.adminOnly) return user?.role === 'SUPER_ADMIN';
        if (item.perm) return AUTH.can(item.perm);
        return true;
      });
      if (visibleItems.length === 0) return '';
      return `
        <div class="mb-4" role="group" aria-label="${group.label}">
          <div class="sidebar-section-label text-xs font-bold text-slate-600 uppercase tracking-widest px-3 mb-1" aria-hidden="true">${group.label}</div>
          ${visibleItems.map(item => `
            <button data-route="${item.route}"
              onclick="Router.navigate('${item.route}')"
              aria-label="Navigate to ${item.label}"
              class="nav-item w-full flex items-center gap-3 px-3 py-2.5 mb-0.5 text-left">
              <span class="nav-icon w-5 flex items-center justify-center text-slate-400" aria-hidden="true">${item.icon}</span>
              <span class="nav-label text-sm font-medium text-slate-300">${item.label}</span>
            </button>`).join('')}
        </div>`;
    }).join('');

    document.getElementById('sidebar').innerHTML = `
      <!-- Logo -->
      <div style="padding:16px;border-bottom:1px solid rgba(246,201,69,0.2);">
        <div class="flex items-center gap-3">
          <img id="sidebar-logo" src="assets/image/FELTA_LOGO_LIGHT.png" alt="FELTA WRO Philippines logo"
            class="sidebar-logo-text js-theme-logo w-auto object-contain"
            style="height: 48px; max-width: 160px; filter:drop-shadow(0 1px 6px rgba(246,201,69,0.35));">
          <div class="sidebar-logo-text" style="white-space:nowrap;">
            <div style="font-size:10px;font-weight:700;color:#F6C945;letter-spacing:0.4px;" aria-hidden="true">DATABASE SYSTEM</div>
          </div>
        </div>
        <!-- WRO Rainbow Bar -->
        <div class="wro-rainbow-bar rounded-full mt-3" role="presentation"></div>
      </div>

      <!-- Navigation -->
      <nav role="navigation" aria-label="Main navigation" class="flex-1 overflow-y-auto p-3 space-y-1" style="scrollbar-width:thin;">
        ${navHTML}
      </nav>

      <!-- User Profile -->
      <div style="padding:14px;border-top:1px solid rgba(246,201,69,0.2);">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style="background:linear-gradient(135deg,#F6C945,#8B6914);" aria-hidden="true">
            ${(user?.name||'?').charAt(0)}
          </div>
          <div class="nav-label flex-1 overflow-hidden">
            <div class="text-sm font-semibold truncate" style="color:#f0e9d2;">${user?.name}</div>
            <div class="text-xs" style="color:#F6C945;">${ri.label}</div>
          </div>
          <button onclick="AUTH.logout()" title="Log out" aria-label="Log out" class="nav-label transition" style="color:#5a6a8a;background:none;border:none;cursor:pointer;display:flex;align-items:center;" onmouseover="this.style.color='#e63946'" onmouseout="this.style.color='#5a6a8a'">${ICONS.logout}</button>
        </div>
      </div>`;
  },

  _renderTopbar() {
    const topbar = document.getElementById('topbar');
    if (!topbar) return;
    topbar.innerHTML = `
      <div class="flex items-center gap-3 flex-1">
        <!-- Mobile hamburger toggle -->
        <button id="sidebar-toggle"
          aria-label="Toggle navigation menu"
          aria-controls="sidebar"
          aria-expanded="false"
          class="p-2 rounded-xl transition" style="color:#F6C945;background:rgba(246,201,69,0.08);display:flex;align-items:center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <!-- Page Title -->
        <div class="flex items-center gap-2">
          <h1 id="page-title" class="text-lg font-bold" style="color:#f0e9d2;"></h1>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <p id="page-subtitle" class="text-xs hidden md:block" style="color:#5a6a8a;"></p>

        <button onclick="ThemeManager.toggle()" id="theme-toggle-icon" class="p-2 rounded-xl transition hover:bg-slate-700/50" style="color:#F6C945; display:flex; align-items:center;" title="Toggle Light/Dark Mode" aria-label="Toggle light/dark mode">
          <!-- Default sun icon (handled by ThemeManager) -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        </button>

        <div class="flex items-center gap-2 px-3 py-1.5 glass-light rounded-xl" aria-live="polite" aria-label="System status: online">
          <div class="pulse-dot" aria-hidden="true"></div>
          <span class="text-xs font-medium" style="color:#F6C945;">Live</span>
        </div>
        <div class="text-xs hidden md:block" style="color:#5a6a8a;">${new Date().toLocaleDateString('en-PH')}</div>
        <button onclick="AUTH.logout()" class="px-3 py-1.5 rounded-xl text-xs font-medium transition"
          style="background:rgba(230,57,70,0.12);color:#e63946;border:1px solid rgba(230,57,70,0.2);"
          aria-label="Log out">
          Logout
        </button>
      </div>`;
    // Attach toggle handler AFTER DOM is in place
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => App.toggleSidebar());
    // Update theme icon after render
    ThemeManager.updateIcon();
  },

  toggleSidebar() {
    // Use 768px as the breakpoint (matches CSS max-width: 768px)
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      SidebarManager.toggle();
    } else {
      SidebarManager.toggleCollapse();
    }
  },
};

const ThemeManager = {
  key: 'wro_ph_theme',
  init() {
    const saved = localStorage.getItem(this.key);
    // Default is LIGHT — only use dark if explicitly saved
    if (saved === 'dark') this.setDark();
    else this.setLight();
    this._swapLogos(saved !== 'dark');
  },

  toggle() {
    if (document.documentElement.classList.contains('light-mode')) this.setDark();
    else this.setLight();
  },
  setLight() {
    document.documentElement.classList.add('light-mode');
    localStorage.setItem(this.key, 'light');
    this.updateIcon();
    this._swapLogos(true);
  },
  setDark() {
    document.documentElement.classList.remove('light-mode');
    localStorage.setItem(this.key, 'dark');
    this.updateIcon();
    this._swapLogos(false);
  },
  _swapLogos(isLight) {
    const dark  = 'assets/image/FELTA_LOGO_DARK.png';
    const light = 'assets/image/FELTA_LOGO_LIGHT.png';
    document.querySelectorAll('.js-theme-logo').forEach(img => {
      img.src = isLight ? light : dark;
    });
  },
  updateIcon() {
    const btn = document.getElementById('theme-toggle-icon');
    if (!btn) return;
    if (document.documentElement.classList.contains('light-mode')) {
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6.364 6.364 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
    } else {
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
    }
  }
};

window.ThemeManager = ThemeManager;
window.App = App;

// ── AI Chatbot (Chathead) ─────────────────────────────────────
const ChatBot = {
  _open: false,

  init() {
    const chatInput  = document.getElementById('chat-input');
    const sendBtn    = document.getElementById('chat-send-btn');
    const modal      = document.getElementById('chat-modal');

    // Elements might not exist on the login page – guard early
    if (!chatInput || !sendBtn || !modal) return;

    const send = () => this._sendMessage();
    sendBtn.addEventListener('click', send);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
  },

  open() {
    const modal   = document.getElementById('chat-modal');
    const headBtn = document.getElementById('chat-head-btn');
    if (!modal) return;
    this._open = true;
    modal.classList.add('chat-modal--open');
    modal.setAttribute('aria-hidden', 'false');
    headBtn?.classList.add('chat-head-btn--hidden');
    // Focus input after animation
    setTimeout(() => {
      const input = document.getElementById('chat-input');
      if (input) input.focus();
    }, 280);
  },

  close() {
    const modal   = document.getElementById('chat-modal');
    const headBtn = document.getElementById('chat-head-btn');
    if (!modal) return;
    this._open = false;
    modal.classList.remove('chat-modal--open');
    modal.setAttribute('aria-hidden', 'true');
    headBtn?.classList.remove('chat-head-btn--hidden');
  },

  _appendMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const wrap = document.createElement('div');
    wrap.className = `chat-bubble ${sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`;

    const span = document.createElement('span');
    span.textContent = text;
    wrap.appendChild(span);

    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
  },

  _setThinking(active) {
    const container = document.getElementById('chat-messages');
    if (!container) return null;

    if (active) {
      const thinking = document.createElement('div');
      thinking.id = 'chat-thinking';
      thinking.className = 'chat-bubble chat-bubble-ai chat-bubble-thinking';
      thinking.innerHTML = `<span class="chat-dot-1"></span><span class="chat-dot-2"></span><span class="chat-dot-3"></span>`;
      container.appendChild(thinking);
      container.scrollTop = container.scrollHeight;
    } else {
      document.getElementById('chat-thinking')?.remove();
    }
  },

  async _sendMessage() {
    const input   = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    this._appendMessage(message, 'user');
    input.value = '';
    input.focus();
    if (sendBtn) sendBtn.disabled = true;
    this._setThinking(true);

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await response.json();
      this._setThinking(false);
      if (response.ok) {
        this._appendMessage(data.reply || "Sorry, I didn't get a proper response.", 'ai');
      } else {
        this._appendMessage(`⚠️ ${data.detail || data.error || 'Unknown server error.'}`, 'ai');
      }
    } catch (err) {
      console.error('Chat error:', err);
      this._setThinking(false);
      this._appendMessage('Error connecting to the server. Please try again.', 'ai');
    } finally {
      if (sendBtn) sendBtn.disabled = false;
    }
  },
};

window.ChatBot = ChatBot;

// ── Init on DOM ready ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  ChatBot.init();
});

// =========================================================================
// CHATBOT MODEL SWITCHER CODE
// =========================================================================

// This empty list holds your short history so you don't exhaust your tokens
let chatbotHistory = []; 

async function sendChatMessage() {
    // This finds the input box where you type messages
    const inputField = document.getElementById('chat-input-element');
    
    // This finds the new dropdown menu we are creating for your models
    const modelSelector = document.getElementById('model-agent-selector');
    
    // This reads what you typed
    const userText = inputField.value.trim();
    
    // This reads which model you picked in the dropdown (Defaults to flash if empty)
    const chosenModel = modelSelector ? modelSelector.value : 'gemini-2.5-flash';
    
    if (!userText) return; // If you didn't type anything, do nothing.

    // This puts your message on the screen right away
    if (typeof appendMessageToPanel === 'function') {
        appendMessageToPanel("user", userText);
    }
    
    // This clears your input box so it's empty for your next message
    inputField.value = ""; 

    try {
        // This talks directly to your backend server
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userText,
                model: chosenModel, // Sends the drop-down choice to the backend
                history: chatbotHistory.slice(-6) // Only sends the last few messages to save credits
            })
        });

        const data = await response.json();
        
        // This displays the AI's response on your screen
        if (data.reply && typeof appendMessageToPanel === 'function') {
            appendMessageToPanel("assistant", data.reply);
            
            // This saves the message to your short-term history memory
            chatbotHistory.push({ role: "user", content: userText });
            chatbotHistory.push({ role: "assistant", content: data.reply });
        }
    } catch (err) {
        console.error("Chatbot ran into an error:", err);
    }
}