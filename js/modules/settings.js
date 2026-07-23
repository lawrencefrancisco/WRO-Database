class SettingsModule {
  constructor() {}

  async render() {
    const container = document.getElementById('page-content');
    if (!AUTH.can('competitions.write')) {
      container.innerHTML = `
        <div class="page-view" style="display:flex;align-items:center;justify-content:center;min-height:60vh;">
          <div style="text-align:center;">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(239,68,68,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            </div>
            <h2 style="font-size:1.25rem;font-weight:700;color:#ef4444;margin-bottom:0.5rem;">Access Denied</h2>
            <p style="color:var(--text-muted,#94a3b8);font-size:0.9rem;">You don't have permission to view this page.</p>
          </div>
        </div>`;
      return;
    }

    const _icon = (d) => `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

    container.innerHTML = `
      <div class="page-view space-y-6">

        <!-- Page Header -->
        <div class="page-header">
          <div style="display:flex;align-items:center;gap:1rem;">
            <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,var(--felta-yellow,#F6C945),var(--felta-yellow-d,#C9A012));display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(246,201,69,0.3);flex-shrink:0;">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#070c20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold">System Settings</h2>
              <p style="color:var(--text-muted,#94a3b8);font-size:0.875rem;margin-top:0.15rem;">Manage WRO Philippines public portal configurations</p>
            </div>
          </div>
        </div>

        <!-- Settings Grid -->
        <div style="display:grid;grid-template-columns:280px 1fr;gap:1.5rem;align-items:start;">

          <!-- Sidebar Navigation -->
          <div class="glass rounded-2xl" style="padding:0.75rem;overflow:hidden;">
            <p style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted,#94a3b8);padding:0.5rem 0.75rem;margin-bottom:0.25rem;">Configuration</p>
            <button class="settings-nav-btn active" id="nav-registration" onclick="Settings._switchTab('registration')" style="width:100%;display:flex;align-items:center;gap:0.75rem;padding:0.7rem 0.85rem;border-radius:10px;border:none;cursor:pointer;font-size:0.875rem;font-weight:600;text-align:left;background:rgba(246,201,69,0.12);color:var(--felta-yellow,#F6C945);transition:all 0.2s;">
              <span style="color:inherit;">${_icon('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>')}</span>
              Registration Link
            </button>
            <button class="settings-nav-btn" id="nav-portal" onclick="Settings._switchTab('portal')" style="width:100%;display:flex;align-items:center;gap:0.75rem;padding:0.7rem 0.85rem;border-radius:10px;border:none;cursor:pointer;font-size:0.875rem;font-weight:600;text-align:left;background:transparent;color:var(--text-muted,#94a3b8);transition:all 0.2s;margin-top:0.2rem;">
              <span style="color:inherit;">${_icon('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>')}</span>
              Portal Appearance
            </button>
          </div>

          <!-- Main Content Panel -->
          <div id="settings-panel">
            <!-- Registration Tab (default) -->
            <div id="tab-registration">
              <div class="glass rounded-2xl" style="overflow:hidden;">
                <!-- Card Header -->
                <div style="padding:1.5rem 1.75rem;border-bottom:1px solid var(--border-color,rgba(255,255,255,0.06));">
                  <div style="display:flex;align-items:center;gap:0.75rem;">
                    <div style="width:36px;height:36px;border-radius:10px;background:rgba(246,201,69,0.1);display:flex;align-items:center;justify-content:center;color:var(--felta-yellow,#F6C945);">
                      ${_icon('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>')}
                    </div>
                    <div>
                      <h3 style="font-weight:700;font-size:1rem;">Official Team Registration</h3>
                      <p style="color:var(--text-muted,#94a3b8);font-size:0.8rem;margin-top:0.1rem;">Configure the registration link displayed on the public WRO Philippines homepage.</p>
                    </div>
                  </div>
                </div>

                <!-- Form Body -->
                <div style="padding:1.75rem;">
                  <form id="settings-form">

                    <!-- Toggle Switch -->
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:1.1rem 1.25rem;border-radius:12px;background:var(--bg-surface,rgba(255,255,255,0.03));border:1px solid var(--border-color,rgba(255,255,255,0.06));margin-bottom:1.25rem;">
                      <div>
                        <p style="font-weight:600;font-size:0.9rem;">Enable Registration Link</p>
                        <p style="color:var(--text-muted,#94a3b8);font-size:0.8rem;margin-top:0.2rem;">Show the registration button on the public portal homepage</p>
                      </div>
                      <label style="position:relative;display:inline-block;width:48px;height:26px;flex-shrink:0;cursor:pointer;">
                        <input type="checkbox" id="setting_enabled" style="opacity:0;width:0;height:0;position:absolute;">
                        <span id="toggle-track" style="position:absolute;inset:0;border-radius:999px;background:rgba(148,163,184,0.4);transition:all 0.25s;"></span>
                        <span id="toggle-thumb" style="position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);transition:all 0.25s;"></span>
                      </label>
                    </div>

                    <!-- URL Input -->
                    <div style="margin-bottom:1.5rem;">
                      <label for="setting_link" style="display:flex;align-items:center;gap:0.4rem;font-size:0.875rem;font-weight:600;margin-bottom:0.5rem;">
                        ${_icon('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>')}
                        Registration URL
                      </label>
                      <div style="position:relative;">
                        <input type="url" id="setting_link" class="form-input" style="width:100%;padding-left:2.75rem;" placeholder="https://docs.google.com/forms/...">
                        <span style="position:absolute;left:0.85rem;top:50%;transform:translateY(-50%);color:var(--text-muted,#94a3b8);display:flex;align-items:center;">
                          ${_icon('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>')}
                        </span>
                      </div>
                      <p style="color:var(--text-muted,#94a3b8);font-size:0.78rem;margin-top:0.4rem;">Paste the Google Form or external registration URL. This will appear as a button on the public homepage when enabled.</p>
                    </div>

                    <!-- Live Preview -->
                    <div id="link-preview" style="display:none;padding:1rem 1.25rem;border-radius:12px;background:rgba(246,201,69,0.05);border:1px solid rgba(246,201,69,0.15);margin-bottom:1.5rem;">
                      <p style="font-size:0.78rem;font-weight:600;color:var(--felta-yellow,#F6C945);margin-bottom:0.35rem;display:flex;align-items:center;gap:0.4rem;">
                        ${_icon('<polyline points="20 6 9 17 4 12"/>')} Preview
                      </p>
                      <p id="link-preview-text" style="font-size:0.82rem;color:var(--text-muted,#94a3b8);word-break:break-all;"></p>
                    </div>

                    <!-- Save Button -->
                    <div style="display:flex;justify-content:flex-end;gap:0.75rem;">
                      <button type="button" onclick="Settings.loadSettings()" style="padding:0.65rem 1.25rem;border-radius:10px;border:1px solid var(--border-color,rgba(255,255,255,0.1));background:transparent;color:var(--text-muted,#94a3b8);font-size:0.875rem;font-weight:600;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.color='var(--text-primary,#fff)'" onmouseout="this.style.color='var(--text-muted,#94a3b8)'">Reset</button>
                      <button type="submit" id="btn-save-settings" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.65rem 1.5rem;border-radius:10px;border:none;background:var(--felta-yellow,#F6C945);color:#070c20;font-size:0.875rem;font-weight:700;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 14px rgba(246,201,69,0.3);">
                        ${_icon('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>')}
                        Save Settings
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <!-- Portal Appearance Tab -->
            <div id="tab-portal" style="display:none;">
              <div class="glass rounded-2xl" style="overflow:hidden;">
                <div style="padding:1.5rem 1.75rem;border-bottom:1px solid var(--border-color,rgba(255,255,255,0.06));">
                  <div style="display:flex;align-items:center;gap:0.75rem;">
                    <div style="width:36px;height:36px;border-radius:10px;background:rgba(58,134,255,0.1);display:flex;align-items:center;justify-content:center;color:#3a86ff;">
                      ${_icon('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>')}
                    </div>
                    <div>
                      <h3 style="font-weight:700;font-size:1rem;">Portal Appearance</h3>
                      <p style="color:var(--text-muted,#94a3b8);font-size:0.8rem;margin-top:0.1rem;">Branding and display options for the public-facing WRO Philippines portal.</p>
                    </div>
                  </div>
                </div>
                <div style="padding:1.75rem;">
                  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem;text-align:center;">
                    <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.04);border:1px solid var(--border-color,rgba(255,255,255,0.06));display:flex;align-items:center;justify-content:center;color:var(--text-muted,#94a3b8);margin-bottom:1rem;">
                      ${_icon('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>')}
                    </div>
                    <p style="font-weight:600;color:var(--text-muted,#94a3b8);margin-bottom:0.4rem;">Coming Soon</p>
                    <p style="font-size:0.82rem;color:var(--text-muted,#94a3b8);opacity:0.7;">Portal appearance customization will be available in a future update.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    // Toggle switch interactivity
    const checkbox = document.getElementById('setting_enabled');
    const track = document.getElementById('toggle-track');
    const thumb = document.getElementById('toggle-thumb');
    const updateToggle = () => {
      if (checkbox.checked) {
        track.style.background = 'var(--felta-yellow,#F6C945)';
        thumb.style.left = '25px';
      } else {
        track.style.background = 'rgba(148,163,184,0.4)';
        thumb.style.left = '3px';
      }
    };
    checkbox.addEventListener('change', updateToggle);

    // URL preview
    const urlInput = document.getElementById('setting_link');
    const preview = document.getElementById('link-preview');
    const previewText = document.getElementById('link-preview-text');
    urlInput.addEventListener('input', () => {
      if (urlInput.value.trim()) {
        preview.style.display = 'block';
        previewText.textContent = urlInput.value.trim();
      } else {
        preview.style.display = 'none';
      }
    });

    await this.loadSettings();

    document.getElementById('settings-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveSettings();
    });
  }

  _switchTab(tab) {
    ['registration', 'portal'].forEach(t => {
      document.getElementById(`tab-${t}`).style.display = t === tab ? 'block' : 'none';
      const btn = document.getElementById(`nav-${t}`);
      if (t === tab) {
        btn.style.background = 'rgba(246,201,69,0.12)';
        btn.style.color = 'var(--felta-yellow,#F6C945)';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-muted,#94a3b8)';
      }
    });
  }

  async loadSettings() {
    try {
      const data = await DB.get('/settings');
      if (data && data.settings) {
        const urlInput = document.getElementById('setting_link');
        const checkbox = document.getElementById('setting_enabled');
        const preview = document.getElementById('link-preview');
        const previewText = document.getElementById('link-preview-text');

        urlInput.value = data.settings.team_registration_link || '';
        checkbox.checked = data.settings.team_registration_enabled === 'true';

        // Sync toggle visuals
        const track = document.getElementById('toggle-track');
        const thumb = document.getElementById('toggle-thumb');
        if (checkbox.checked) {
          track.style.background = 'var(--felta-yellow,#F6C945)';
          thumb.style.left = '25px';
        }

        // Show preview if URL exists
        if (urlInput.value.trim()) {
          preview.style.display = 'block';
          previewText.textContent = urlInput.value.trim();
        }
      }
    } catch (err) {
      console.error('Failed to load settings', err);
      Toast.error('Failed to load settings');
    }
  }

  async saveSettings() {
    const btn = document.getElementById('btn-save-settings');
    btn.disabled = true;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Saving...`;

    const settings = {
      team_registration_link: document.getElementById('setting_link').value.trim(),
      team_registration_enabled: document.getElementById('setting_enabled').checked ? 'true' : 'false'
    };

    try {
      const res = await DB.post('/settings', { settings });
      if (res && res.success) {
        Toast.success('Settings saved successfully');
      } else {
        Toast.error(res?.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      Toast.error('Failed to save settings');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Settings`;
    }
  }
}

window.Settings = new SettingsModule();
