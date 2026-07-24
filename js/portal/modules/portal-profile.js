// ============================================================
// WRO Philippines – Standard User Portal – Profile Module
// Mobile-first: hero card, stacked info rows, full-width form
// ============================================================

const PortalProfile = {
  async render() {
    const content = document.getElementById('portal-content');
    content.innerHTML = `<div class="p-loading"><div class="p-spinner"></div></div>`;

    try {
      const me = await PORTAL_DB.me();

      content.innerHTML = `
        <div class="p-page">

          <!-- Hero card -->
          <div class="p-profile-hero">
            <div class="p-profile-avatar">${(me.name || 'U').charAt(0).toUpperCase()}</div>
            <div class="p-profile-name">${me.name || '—'}</div>
            <div class="p-profile-role">Standard User</div>
            ${me.school_name ? `<div class="p-profile-school"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>${me.school_name}</div>` : '<div class="p-profile-school" style="color:#e8c027;">No school linked — contact admin</div>'}
          </div>

          <div class="p-profile-grid">

            <!-- Account info card -->
            <div class="p-section">
              <div class="p-section-header">
                <span class="p-section-title">Account Info</span>
              </div>
              <div class="p-info-list">
                <div class="p-info-row">
                  <span class="p-info-lbl">Email Address</span>
                  <span class="p-info-val">${me.email || '—'}</span>
                </div>
                <div class="p-info-row">
                  <span class="p-info-lbl">Member since</span>
                  <span class="p-info-val">${me.created_at ? new Date(me.created_at).toLocaleDateString('en-PH',{month:'long',year:'numeric'}) : '—'}</span>
                </div>
                <div class="p-info-row">
                  <span class="p-info-lbl">Status</span>
                  <span class="p-badge" style="background:rgba(45,198,83,0.12);color:#2dc653;">Active</span>
                </div>
              </div>
            </div>

            <!-- Linked school card -->
            ${me.school_name ? `
            <div class="p-section">
              <div class="p-section-header">
                <span class="p-section-title">Linked School</span>
              </div>
              <div class="p-school-info">
                <div class="p-school-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F6C945" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div>
                  <div class="p-school-name">${me.school_name}</div>
                  ${me.region ? `<div class="p-school-detail"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${[me.city, me.province, me.region].filter(Boolean).join(', ')}</div>` : ''}
                  ${me.contact_number ? `<div class="p-school-detail"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.44 2 2 0 0 1 3.54 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.73a16 16 0 0 0 6.36 6.36l.87-1.84a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${me.contact_number}</div>` : ''}
                  ${me.school_email ? `<div class="p-school-detail"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>${me.school_email}</div>` : ''}
                </div>
              </div>
            </div>` : ''}

            <!-- Edit Profile -->
            <div class="p-section p-profile-form-full">
              <div class="p-section-header">
                <span class="p-section-title">Update Profile</span>
              </div>
              <form id="profile-form" onsubmit="PortalProfile.save(event)" class="p-form" novalidate>
                <div class="p-form-group">
                  <label class="p-label">Full Name</label>
                  <input class="p-input" name="name" value="${me.name || ''}" placeholder="Your full name" required autocomplete="name">
                </div>
                <div class="p-form-group">
                  <label class="p-label">Email Address</label>
                  <input class="p-input" type="email" name="email" value="${me.email || ''}" placeholder="your@email.com" autocomplete="email">
                </div>
                <div class="p-form-divider">Change Password <span>(leave blank to keep current)</span></div>
                <div class="p-form-group">
                  <label class="p-label">New Password</label>
                  <input class="p-input" type="password" name="password" placeholder="Min. 8 characters" minlength="8" autocomplete="new-password">
                </div>
                <div class="p-form-group">
                  <label class="p-label">Confirm Password</label>
                  <input class="p-input" type="password" name="confirmPassword" placeholder="Repeat new password" autocomplete="new-password">
                </div>
                <div id="profile-error" class="p-form-error" style="display:none;"></div>
                <button type="submit" class="p-btn-primary" id="profile-save-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Save Changes
                </button>
              </form>
            </div>

            <!-- Sign Out -->
            <div class="p-section" style="overflow:hidden;">
              <button onclick="PORTAL_AUTH.logout()"
                style="width:100%;padding:0.9rem 1rem;min-height:var(--p-touch);border:none;background:transparent;color:#e63946;font-size:0.85rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.6rem;font-family:inherit;transition:background 0.15s;-webkit-tap-highlight-color:transparent;"
                onmouseover="this.style.background='rgba(230,57,70,0.08)'" onmouseout="this.style.background='transparent'">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </button>
            </div>

          </div>
        </div>`;
    } catch (err) {
      content.innerHTML = `<div class="p-page"><div class="p-error-card">Failed to load profile: ${err.message}</div></div>`;
    }
  },

  async save(e) {
    e.preventDefault();
    const form    = document.getElementById('profile-form');
    const errEl   = document.getElementById('profile-error');
    const saveBtn = document.getElementById('profile-save-btn');
    const data    = Object.fromEntries(new FormData(form));

    errEl.style.display = 'none';

    if (data.password && data.password !== data.confirmPassword) {
      errEl.textContent    = 'Passwords do not match.';
      errEl.style.display  = 'block';
      return;
    }
    if (data.password && data.password.length < 8) {
      errEl.textContent   = 'Password must be at least 8 characters.';
      errEl.style.display = 'block';
      return;
    }

    const payload = { name: data.name, email: data.email };
    if (data.password) payload.password = data.password;

    saveBtn.disabled    = true;
    saveBtn.textContent = 'Saving…';

    try {
      await PORTAL_DB.updateProfile(payload);
      // Update session
      const session = PORTAL_AUTH.currentUser();
      if (session) {
        session.name  = data.name;
        session.email = data.email;
        sessionStorage.setItem(PORTAL_AUTH._SESSION_KEY, JSON.stringify(session));
      }
      saveBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Saved!`;
      saveBtn.style.background = '#2dc653';
      setTimeout(() => {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Save Changes`;
        saveBtn.style.background = '';
        PortalProfile.render();
      }, 1800);
    } catch (err) {
      errEl.textContent   = 'Failed to save: ' + err.message;
      errEl.style.display = 'block';
      saveBtn.disabled    = false;
      saveBtn.textContent = 'Save Changes';
    }
  },
};

window.PortalProfile = PortalProfile;
