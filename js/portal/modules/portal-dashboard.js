// ============================================================
// WRO Philippines – Standard User Portal – Dashboard Module
// Mobile-first: welcome card + action tiles + stats + previews
// ============================================================

const PortalDashboard = {
  async render() {
    const content = document.getElementById('portal-content');
    content.innerHTML = `<div class="p-loading"><div class="p-spinner"></div></div>`;

    try {
      const [stats, me] = await Promise.all([
        PORTAL_DB.dashboard().catch(() => ({})),
        PORTAL_DB.me().catch(() => ({})),
      ]);

      const catColors = {
        general:      '#1d6fa4',
        payment:      '#2dc653',
        qualification:'#e8c027',
        delegation:   '#8338ec',
        competition:  '#e63946',
      };

      const payColor = s => ({ paid:'#2dc653', partial:'#F6C945', unpaid:'#e63946' }[s?.toLowerCase()] || '#6b7a99');

      const totalTeams = stats.totalTeams || 0;
      const paid       = stats.paid       || 0;
      const partial    = stats.partial    || 0;
      const unpaid     = stats.unpaid     || 0;
      const qualified  = stats.qualified  || 0;
      const anns       = stats.recentAnnouncements || [];

      content.innerHTML = `
        <div class="p-page">

          <!-- ① Welcome card -->
          <div class="p-welcome">
            <div class="p-welcome-left">
              <div class="p-welcome-avatar">${(me.name || 'U').charAt(0).toUpperCase()}</div>
              <div>
                <div class="p-welcome-name">Hi, ${me.name?.split(' ')[0] || 'User'}</div>
                <div class="p-welcome-school">
                  ${me.school_name || 'No school linked'}
                  ${me.region ? ` · ${me.region}` : ''}
                </div>
              </div>
            </div>
            <div class="p-live-pill">
              <div class="p-pulse"></div>
              Live
            </div>
          </div>

          <!-- ② Quick Action Tiles (2×2 → 4×1 on wider screens) -->
          <div class="p-actions-label">Quick Access</div>
          <div class="p-actions-grid">

            <!-- My Teams -->
            <button class="p-action-tile" onclick="PortalRouter.navigate('teams')">
              <div class="p-action-glow" style="background:#F6C945;"></div>
              <div class="p-action-icon-wrap" style="background:rgba(246,201,69,0.12);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F6C945" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 17h6M17 14v6"/></svg>
              </div>
              <div>
                <div class="p-action-label">My Teams</div>
                <div class="p-action-sub">${totalTeams} team${totalTeams !== 1 ? 's' : ''} registered</div>
              </div>
              <div class="p-action-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>

            <!-- Announcements -->
            <button class="p-action-tile" onclick="PortalRouter.navigate('announcements')" ${anns.length > 0 ? 'style="border-color:rgba(79,156,249,0.4);box-shadow:0 0 20px rgba(79,156,249,0.15);"' : ''}>
              <div class="p-action-glow" style="background:${anns.length > 0 ? '#4f9cf9' : '#1d6fa4'}; opacity:${anns.length > 0 ? '0.2' : ''}"></div>
              <div class="p-action-icon-wrap" style="background:rgba(${anns.length > 0 ? '79,156,249,0.2' : '29,111,164,0.12'}); position:relative;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${anns.length > 0 ? '#4f9cf9' : '#1d6fa4'}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                ${anns.length > 0 ? '<div style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;background:#e63946;border-radius:50%;border:2px solid #0f172a;box-shadow:0 0 5px rgba(230,57,70,0.5)"></div>' : ''}
              </div>
              <div>
                <div class="p-action-label" style="${anns.length > 0 ? 'color:#fff;' : ''}">Announcements</div>
                <div class="p-action-sub" style="${anns.length > 0 ? 'color:#4f9cf9;font-weight:600;' : ''}">${anns.length > 0 ? anns.length + ' new update' + (anns.length !== 1 ? 's' : '') : 'No new updates'}</div>
              </div>
              <div class="p-action-arrow" style="${anns.length > 0 ? 'color:#4f9cf9;' : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>

            <!-- Payment Status -->
            <button class="p-action-tile" onclick="PortalRouter.navigate('teams')">
              <div class="p-action-glow" style="background:#2dc653;"></div>
              <div class="p-action-icon-wrap" style="background:rgba(45,198,83,0.10);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dc653" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <div>
                <div class="p-action-label">Payments</div>
                <div class="p-action-sub">${paid} paid · ${partial} partial · ${unpaid} unpaid</div>
              </div>
              <div class="p-action-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>

            <!-- My Profile -->
            <button class="p-action-tile" onclick="PortalRouter.navigate('profile')">
              <div class="p-action-glow" style="background:#8338ec;"></div>
              <div class="p-action-icon-wrap" style="background:rgba(131,56,236,0.10);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8338ec" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div class="p-action-label">My Profile</div>
                <div class="p-action-sub">Account &amp; settings</div>
              </div>
              <div class="p-action-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>

          </div>

          <!-- ③ Stats row (5 chips) -->
          ${totalTeams > 0 ? `
          <div class="p-stats-row">
            <div class="p-stat-chip">
              <div class="p-stat-val" style="color:#F6C945;">${totalTeams}</div>
              <div class="p-stat-lbl">Teams</div>
            </div>
            <div class="p-stat-chip">
              <div class="p-stat-val" style="color:#2dc653;">${qualified}</div>
              <div class="p-stat-lbl">Qualified</div>
            </div>
            <div class="p-stat-chip">
              <div class="p-stat-val" style="color:#2dc653;">${paid}</div>
              <div class="p-stat-lbl">Paid</div>
            </div>
            <div class="p-stat-chip">
              <div class="p-stat-val" style="color:#F6C945;">${partial}</div>
              <div class="p-stat-lbl">Partial</div>
            </div>
            <div class="p-stat-chip">
              <div class="p-stat-val" style="color:#e63946;">${unpaid}</div>
              <div class="p-stat-lbl">Unpaid</div>
            </div>
          </div>

          <!-- Payment bar -->
          <div class="p-section" style="margin-bottom:1rem;">
            <div class="p-section-header">
              <span class="p-section-title">Payment Overview</span>
            </div>
            <div style="padding:0.75rem 1rem 0;">
              <div class="p-pay-bar-wrap">
                ${paid    > 0 ? `<div class="p-pay-seg" style="width:${(paid/totalTeams*100).toFixed(0)}%;background:#2dc653;"></div>` : ''}
                ${partial > 0 ? `<div class="p-pay-seg" style="width:${(partial/totalTeams*100).toFixed(0)}%;background:#F6C945;"></div>` : ''}
                ${unpaid  > 0 ? `<div class="p-pay-seg" style="width:${(unpaid/totalTeams*100).toFixed(0)}%;background:#e63946;"></div>` : ''}
              </div>
            </div>
            <div class="p-pay-legend">
              ${[['Paid','#2dc653',paid],['Partial','#F6C945',partial],['Unpaid','#e63946',unpaid]].map(([l,c,v]) => `
              <div class="p-pay-legend-item"><div class="p-pay-legend-dot" style="background:${c};"></div>${l}: <strong>${v}</strong></div>`).join('')}
            </div>
          </div>` : ''}

          <!-- ④ Recent announcements preview -->
          <div class="p-section">
            <div class="p-section-header">
              <span class="p-section-title">Latest Updates</span>
              <button class="p-section-link" onclick="PortalRouter.navigate('announcements')">See All →</button>
            </div>
            ${anns.length === 0
              ? `<div class="p-empty-row">No announcements yet — check back later.</div>`
              : anns.slice(0, 4).map(a => `
                <div class="p-ann-row" onclick="PortalRouter.navigate('announcements')">
                  <div class="p-ann-dot" style="background:${catColors[a.category] || '#1d6fa4'};"></div>
                  <div class="p-ann-body">
                    <div class="p-ann-title">${a.title}</div>
                    <div class="p-ann-meta">${a.category} · ${new Date(a.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric'})}</div>
                  </div>
                  <div class="p-ann-chev">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>`).join('')}
          </div>

        </div>`;
    } catch (err) {
      content.innerHTML = `<div class="p-page"><div class="p-error-card">Failed to load dashboard: ${err.message}</div></div>`;
    }
  },
};

window.PortalDashboard = PortalDashboard;
