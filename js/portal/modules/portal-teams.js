// ============================================================
// WRO Philippines – Standard User Portal – My Teams Module
// QR-based team linking: scan camera or upload image
// ============================================================

const PortalTeams = {
  _scanning: false,
  _html5QrScanner: null,

  async render() {
    const content = document.getElementById('portal-content');
    content.innerHTML = `<div class="p-loading"><div class="p-spinner"></div></div>`;

    try {
      const teams = await PORTAL_DB.teams();
      content.innerHTML = this._buildPage(teams);
    } catch (err) {
      content.innerHTML = `<div class="p-page"><div class="p-error-card">Failed to load teams: ${err.message}</div></div>`;
    }
  },

  _buildPage(teams) {
    return `
      <div class="p-page">
        <div class="p-page-header">
          <div>
            <div class="p-page-title">My Teams</div>
            <div class="p-page-sub">Teams you are linked to via QR scan</div>
          </div>
          <div class="flex items-center gap-2">
            <div class="p-count-pill">${teams.length} team${teams.length !== 1 ? 's' : ''}</div>
            <button onclick="PortalTeams.openLinkModal()" id="btn-link-team" style="
              background: linear-gradient(135deg, #F6C945, #e8a800);
              color: #1a1a2e;
              border: none;
              border-radius: 12px;
              padding: 8px 16px;
              font-size: 13px;
              font-weight: 700;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 6px;
              transition: opacity 0.2s;
            " onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/>
                <path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                <path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>
              </svg>
              Link a Team
            </button>
          </div>
        </div>

        <!-- QR Link Modal -->
        <div id="qr-link-modal" style="display:none; position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); display:none; align-items:center; justify-content:center; padding:16px;">
          <div style="background:linear-gradient(135deg,#1a2744,#0f172a); border:1px solid rgba(246,201,69,0.2); border-radius:20px; padding:24px; width:100%; max-width:400px; max-height:90vh; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
              <div style="font-size:16px; font-weight:700; color:#fff;">Link a Team via QR</div>
              <button onclick="PortalTeams.closeLinkModal()" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:20px;line-height:1;">×</button>
            </div>

            <!-- Tab switcher -->
            <div style="display:flex; gap:8px; margin-bottom:20px; background:rgba(255,255,255,0.05); border-radius:12px; padding:4px;">
              <button id="tab-scan" onclick="PortalTeams.switchTab('scan')" style="flex:1; padding:8px; border-radius:9px; border:none; background:rgba(246,201,69,0.15); color:#F6C945; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s;">
                📷 Scan QR
              </button>
              <button id="tab-upload" onclick="PortalTeams.switchTab('upload')" style="flex:1; padding:8px; border-radius:9px; border:none; background:transparent; color:#64748b; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s;">
                📁 Upload Image
              </button>
            </div>

            <!-- Scan tab -->
            <div id="panel-scan">
              <div id="qr-reader" style="border-radius:12px; overflow:hidden; width:100%;"></div>
              <div id="scan-status" style="text-align:center; color:#94a3b8; font-size:13px; margin-top:12px;">Position the QR code in front of your camera.</div>
            </div>

            <!-- Upload tab -->
            <div id="panel-upload" style="display:none;">
              <div style="border:2px dashed rgba(246,201,69,0.3); border-radius:16px; padding:32px 16px; text-align:center; cursor:pointer;" onclick="document.getElementById('qr-file-input').click()">
                <div style="font-size:36px; margin-bottom:8px;">📷</div>
                <div style="color:#F6C945; font-weight:600; font-size:14px;">Choose QR Code Image</div>
                <div style="color:#64748b; font-size:12px; margin-top:4px;">PNG, JPG, WEBP supported</div>
                <input id="qr-file-input" type="file" accept="image/*" style="display:none;" onchange="PortalTeams.handleFileUpload(event)">
              </div>
              <div id="upload-preview" style="margin-top:12px; text-align:center;"></div>
              <div id="upload-status" style="text-align:center; color:#94a3b8; font-size:13px; margin-top:8px;"></div>
            </div>

            <div id="link-result" style="margin-top:16px; display:none;"></div>
          </div>
        </div>

        ${teams.length === 0 ? `
          <div class="p-section">
            <div class="p-empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(246,201,69,0.2)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 17h6M17 14v6"/>
              </svg>
              <div class="p-empty-title">No teams linked yet</div>
              <div class="p-empty-sub">Tap <strong style="color:#F6C945;">Link a Team</strong> above and scan or upload the QR code given by your admin.</div>
            </div>
          </div>` : `
        <div class="p-teams-list">
          ${teams.map(t => this._teamCard(t)).join('')}
        </div>`}
      </div>`;
  },

  _badge(val) {
    const map = {
      paid:       { bg:'rgba(45,198,83,0.12)',   color:'#2dc653' },
      partial:    { bg:'rgba(246,201,69,0.14)',  color:'#e8c027' },
      unpaid:     { bg:'rgba(230,57,70,0.12)',   color:'#e63946' },
      qualified:  { bg:'rgba(45,198,83,0.12)',   color:'#2dc653' },
      pending:    { bg:'rgba(246,201,69,0.14)',  color:'#e8c027' },
      registered: { bg:'rgba(29,111,164,0.12)', color:'#1d6fa4' },
      confirmed:  { bg:'rgba(45,198,83,0.12)',   color:'#2dc653' },
      active:     { bg:'rgba(45,198,83,0.12)',   color:'#2dc653' },
      inactive:   { bg:'rgba(107,116,148,0.12)', color:'#6b7a99' },
    };
    const key = val?.toLowerCase() || '';
    const s = map[key] || { bg:'rgba(107,116,148,0.12)', color:'#6b7a99' };
    return `<span class="p-badge" style="background:${s.bg};color:${s.color};">${val || '—'}</span>`;
  },

  _teamCard(t) {
    const members   = t.members || [];
    const schools   = [...new Set(members.map(m => m.student_school).filter(Boolean))];
    const schoolStr = schools.length > 0 ? schools.join(', ') : (t.school_name || '—');
    const isMulti   = schools.length > 1;

    return `
      <div class="p-team-card" style="margin-bottom:16px;">
        <div class="p-team-card-top">
          <div class="p-team-icon">${(t.team_name || 'T').charAt(0).toUpperCase()}</div>
          <div style="flex:1;min-width:0;">
            <div class="p-team-name">${t.team_name}</div>
            <div class="p-team-cat">${[t.category, t.age_group].filter(Boolean).join(' · ') || '—'}</div>
          </div>
          ${this._badge(t.payment_status)}
        </div>

        <div class="p-team-body">
          <div class="p-team-row">
            <span class="p-team-lbl">Season</span>
            <span class="p-team-val">${t.season || '—'}</span>
          </div>
          <div class="p-team-row">
            <span class="p-team-lbl">Coach</span>
            <span class="p-team-val">${t.coach_name || '—'}${t.coach_mobile ? ` · ${t.coach_mobile}` : ''}</span>
          </div>
          <div class="p-team-row">
            <span class="p-team-lbl">School${isMulti ? 's' : ''}</span>
            <span class="p-team-val" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              ${schoolStr}
              ${isMulti ? `<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(30,158,191,0.18);color:#1E9EBF;font-weight:600;">Multi-school</span>` : ''}
            </span>
          </div>
          <div class="p-team-row">
            <span class="p-team-lbl">Competition</span>
            <span class="p-team-val">${t.competition_name || '—'}</span>
          </div>
        </div>

        <!-- Members -->
        ${members.length > 0 ? `
        <div style="border-top:1px solid rgba(255,255,255,0.06); margin-top:12px; padding-top:12px;">
          <div style="font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:8px;">Team Members</div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${members.map(m => `
              <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(255,255,255,0.04);border-radius:10px;">
                <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,${m.gender==='Female'?'#ec4899,#f43f5e':'#6366f1,#8b5cf6'});display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0;">
                  ${(m.full_name||'?').charAt(0)}
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13px;font-weight:600;color:#e2e8f0;">${m.full_name}</div>
                  <div style="font-size:11px;color:#64748b;">${[m.grade_level, m.gender].filter(Boolean).join(' · ')}${m.student_school ? ` · <span style="color:#1E9EBF;">${m.student_school}</span>` : ''}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>` : ''}

        <div class="p-team-footer">
          ${this._badge(t.registration_status)}
          ${this._badge(t.qualification_status)}
          ${this._badge(t.payment_status)}
        </div>
      </div>`;
  },

  openLinkModal() {
    const modal = document.getElementById('qr-link-modal');
    if (modal) {
      modal.style.display = 'flex';
      this.switchTab('scan');
    }
  },

  closeLinkModal() {
    const modal = document.getElementById('qr-link-modal');
    if (modal) modal.style.display = 'none';
    this._stopScanner();
  },

  switchTab(tab) {
    document.getElementById('panel-scan').style.display   = tab === 'scan'   ? '' : 'none';
    document.getElementById('panel-upload').style.display = tab === 'upload' ? '' : 'none';
    const scanTab   = document.getElementById('tab-scan');
    const uploadTab = document.getElementById('tab-upload');
    if (tab === 'scan') {
      scanTab.style.background   = 'rgba(246,201,69,0.15)';
      scanTab.style.color        = '#F6C945';
      uploadTab.style.background = 'transparent';
      uploadTab.style.color      = '#64748b';
      this._startScanner();
    } else {
      uploadTab.style.background = 'rgba(246,201,69,0.15)';
      uploadTab.style.color      = '#F6C945';
      scanTab.style.background   = 'transparent';
      scanTab.style.color        = '#64748b';
      this._stopScanner();
    }
  },

  _startScanner() {
    if (!window.Html5Qrcode) {
      document.getElementById('scan-status').textContent = 'QR scanner not available. Please use "Upload Image" instead.';
      return;
    }
    this._stopScanner();
    try {
      this._html5QrScanner = new Html5Qrcode('qr-reader');
      this._scanning = true;
      this._html5QrScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          this._stopScanner();
          this._processQRText(decodedText);
        },
        () => {}
      ).catch(err => {
        document.getElementById('scan-status').textContent = 'Camera access denied. Please use "Upload Image" instead.';
      });
    } catch (e) {
      document.getElementById('scan-status').textContent = 'Camera not available. Please use "Upload Image" instead.';
    }
  },

  _stopScanner() {
    if (this._html5QrScanner && this._scanning) {
      this._html5QrScanner.stop().catch(() => {});
      this._scanning = false;
    }
  },

  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById('upload-preview');
    const status  = document.getElementById('upload-status');

    // Show preview
    const reader = new FileReader();
    reader.onload = e => {
      preview.innerHTML = `<img src="${e.target.result}" style="max-width:100%;max-height:180px;border-radius:10px;object-fit:contain;">`;
    };
    reader.readAsDataURL(file);

    status.textContent = 'Reading QR code…';
    status.style.color = '#94a3b8';

    if (!window.Html5Qrcode) {
      status.textContent = 'QR scanner library not loaded.';
      status.style.color = '#e63946';
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode('upload-hidden-div', { verbose: false });
      const result = await html5QrCode.scanFileV2(file, true);
      await this._processQRText(result.decodedText);
    } catch (e) {
      status.textContent = 'Could not read QR code from image. Please try another image.';
      status.style.color = '#e63946';
    }
  },

  async _processQRText(text) {
    // Extract token — support both bare token and full URL with ?team=<token>
    let token = text.trim();
    try {
      const url = new URL(text);
      const t   = url.searchParams.get('team');
      if (t) token = t;
    } catch (_) { /* not a URL, treat as raw token */ }

    this._setStatus('Linking team…', '#F6C945');
    const resultEl = document.getElementById('link-result');
    resultEl.style.display = '';

    try {
      const data = await PORTAL_DB.linkTeam(token);
      resultEl.innerHTML = `
        <div style="background:rgba(45,198,83,0.1);border:1px solid rgba(45,198,83,0.3);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:6px;">✅</div>
          <div style="color:#2dc653;font-weight:700;font-size:15px;">Team Linked!</div>
          <div style="color:#94a3b8;font-size:13px;margin-top:4px;">${data.team?.team_name || 'Team'} has been added to your account.</div>
          <button onclick="PortalTeams.closeLinkModal();PortalTeams.render();" style="margin-top:12px;background:linear-gradient(135deg,#2dc653,#1e9e3f);color:#fff;border:none;border-radius:10px;padding:8px 20px;font-weight:600;font-size:13px;cursor:pointer;">
            View My Teams
          </button>
        </div>`;
      this._setStatus('', '');
    } catch (err) {
      let msg = err.message;
      if (msg.includes('already linked') || msg.includes('Duplicate')) msg = 'You are already linked to this team.';
      else if (msg.includes('Invalid') || msg.includes('expired'))    msg = 'This QR code is invalid or has expired.';
      resultEl.innerHTML = `
        <div style="background:rgba(230,57,70,0.1);border:1px solid rgba(230,57,70,0.3);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:6px;">❌</div>
          <div style="color:#e63946;font-weight:700;font-size:14px;">${msg}</div>
        </div>`;
      this._setStatus('', '');
    }
  },

  _setStatus(text, color) {
    const s = document.getElementById('scan-status');
    const u = document.getElementById('upload-status');
    if (s) { s.textContent = text; s.style.color = color; }
    if (u) { u.textContent = text; u.style.color = color; }
  },
};

window.PortalTeams = PortalTeams;
