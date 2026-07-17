// ============================================================
// WRO Philippines – Standard User Portal – My Teams Module
// Mobile-first: single-column cards, expandable details
// ============================================================

const PortalTeams = {
  async render() {
    const content = document.getElementById('portal-content');
    content.innerHTML = `<div class="p-loading"><div class="p-spinner"></div></div>`;

    try {
      const teams = await PORTAL_DB.teams();

      const badge = (val, type) => {
        const map = {
          paid:      { bg:'rgba(45,198,83,0.12)',   color:'#2dc653' },
          partial:   { bg:'rgba(246,201,69,0.14)',  color:'#e8c027' },
          unpaid:    { bg:'rgba(230,57,70,0.12)',   color:'#e63946' },
          qualified: { bg:'rgba(45,198,83,0.12)',   color:'#2dc653' },
          pending:   { bg:'rgba(246,201,69,0.14)',  color:'#e8c027' },
          registered:{ bg:'rgba(29,111,164,0.12)', color:'#1d6fa4' },
          active:    { bg:'rgba(45,198,83,0.12)',   color:'#2dc653' },
          inactive:  { bg:'rgba(107,116,148,0.12)',color:'#6b7a99' },
        };
        const key = val?.toLowerCase() || '';
        const s = map[key] || { bg:'rgba(107,116,148,0.12)', color:'#6b7a99' };
        return `<span class="p-badge" style="background:${s.bg};color:${s.color};">${val || '—'}</span>`;
      };

      content.innerHTML = `
        <div class="p-page">
          <div class="p-page-header">
            <div>
              <div class="p-page-title">My Teams</div>
              <div class="p-page-sub">Teams registered under your school</div>
            </div>
            <div class="p-count-pill">${teams.length} team${teams.length !== 1 ? 's' : ''}</div>
          </div>

          ${teams.length === 0 ? `
            <div class="p-section">
              <div class="p-empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(246,201,69,0.2)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/>
                  <rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 17h6M17 14v6"/>
                </svg>
                <div class="p-empty-title">No teams found</div>
                <div class="p-empty-sub">Contact your Event Administrator to register teams under your school.</div>
              </div>
            </div>` : `
          <div class="p-teams-list">
            ${teams.map((t, i) => `
              <div class="p-team-card">
                <div class="p-team-card-top">
                  <div class="p-team-icon">${(t.team_name || 'T').charAt(0).toUpperCase()}</div>
                  <div style="flex:1;min-width:0;">
                    <div class="p-team-name">${t.team_name}</div>
                    <div class="p-team-cat">${[t.category, t.age_group].filter(Boolean).join(' · ') || '—'}</div>
                  </div>
                  ${badge(t.payment_status)}
                </div>
                <div class="p-team-body">
                  <div class="p-team-row">
                    <span class="p-team-lbl">Coach</span>
                    <span class="p-team-val">${t.coach_first ? `${t.coach_first} ${t.coach_last}` : '—'}</span>
                  </div>
                  <div class="p-team-row">
                    <span class="p-team-lbl">Competition</span>
                    <span class="p-team-val">${t.competition_name || '—'}</span>
                  </div>
                  <div class="p-team-row">
                    <span class="p-team-lbl">Platform</span>
                    <span class="p-team-val">${t.robot_platform || '—'}</span>
                  </div>
                  <div class="p-team-row">
                    <span class="p-team-lbl">Language</span>
                    <span class="p-team-val">${t.programming_language || '—'}</span>
                  </div>
                </div>
                <div class="p-team-footer">
                  ${badge(t.registration_status)}
                  ${badge(t.qualification_status)}
                  ${badge(t.payment_status)}
                </div>
              </div>`).join('')}
          </div>`}
        </div>`;
    } catch (err) {
      content.innerHTML = `<div class="p-page"><div class="p-error-card">Failed to load teams: ${err.message}</div></div>`;
    }
  },
};

window.PortalTeams = PortalTeams;
