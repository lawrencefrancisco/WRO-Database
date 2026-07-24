// ============================================================
// WRO Philippines DBMS – Bulk Import Module
// Shared across Schools, Coaches, Students, Teams.
// Provides a drag-and-drop modal with template download.
// ============================================================

const BulkImport = {

  // ── Config per entity ──────────────────────────────────────
  _config: {
    schools: {
      label:    'Schools',
      endpoint: '/api/import/schools',
      headers:  ['School Name', 'School Type', 'School Level', 'Region', 'Province', 'City', 'Address', 'Contact Number', 'Email', 'School Head', 'Robotics Coordinator', 'Website', 'Status'],
      required: ['School Name'],
      sample:   [['Laguna School of Technology', 'Private', 'High School', 'CALABARZON', 'Laguna', 'Santa Rosa', '123 Main St', '09171234567', 'lag.tech@school.ph', 'Dr. Ana Reyes', 'Mr. Ben Cruz', '', 'active']],
    },
    coaches: {
      label:    'Coaches',
      endpoint: '/api/import/coaches',
      headers:  ['Full Name', 'Email', 'Birthday', 'Gender', 'Mobile', 'School Name', 'Position', 'Shirt Size', 'Emergency Contact'],
      required: ['Full Name', 'Email'],
      sample:   [['Maria Santos', 'msantos@school.ph', '1990-05-12', 'Female', '09181234567', 'Laguna School of Technology', 'Head Coach', 'M', 'Juan Santos - 09181234568']],
    },
    students: {
      label:    'Students',
      endpoint: '/api/import/students',
      headers:  ['Full Name', 'School Name', 'Birthday', 'Age', 'Gender', 'Grade Level', 'Parent Name', 'Parent Contact', 'Parent Email', 'Shirt Size'],
      required: ['Full Name', 'School Name'],
      sample:   [['Juan Dela Cruz', 'Laguna School of Technology', '2010-03-15', '14', 'Male', 'Grade 9', 'Pedro Dela Cruz', '09201234567', 'pedro@email.com', 'S']],
    },
    teams: {
      label:    'Teams',
      endpoint: '/api/import/teams',
      headers:  ['Team Name', 'School Name', 'Coach Email', 'Category', 'Season', 'Age Group', 'Members (comma-separated full names)'],
      required: ['Team Name'],
      sample:   [['Team Alpha', 'Laguna School of Technology', 'msantos@school.ph', 'WRO Regular Category', '2024', 'Junior', 'Juan Dela Cruz, Maria Lim']],
    },
  },

  // ── Current entity being imported ─────────────────────────
  _entity: null,
  _file:   null,

  // ── Open the import modal ─────────────────────────────────
  open(entity) {
    this._entity = entity;
    this._file   = null;
    const cfg    = this._config[entity];
    if (!cfg) return console.error('[BulkImport] Unknown entity:', entity);

    const existing = document.getElementById('bulk-import-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id    = 'bulk-import-modal';
    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);">
        <div class="glass rounded-2xl w-full max-w-lg" style="max-height:90vh;overflow-y:auto;">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b" style="border-color:var(--border-primary);">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:rgba(246,201,69,0.15);">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F6C945" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <div>
                <h3 class="font-bold text-base" style="color:var(--txt-primary);">Import ${cfg.label}</h3>
                <p class="text-xs" style="color:var(--txt-muted);">Upload an Excel or CSV file to bulk add records</p>
              </div>
            </div>
            <button onclick="BulkImport.close()" class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition" style="color:var(--txt-muted);">✕</button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4">
            <!-- Template Download -->
            <div class="rounded-xl p-4 flex items-center justify-between gap-3" style="background:rgba(246,201,69,0.07);border:1px solid rgba(246,201,69,0.2);">
              <div>
                <p class="text-sm font-semibold" style="color:var(--txt-primary);">📋 Download Template</p>
                <p class="text-xs mt-0.5" style="color:var(--txt-muted);">Use this template so your file has the correct columns.</p>
              </div>
              <button onclick="BulkImport.downloadTemplate('${entity}')"
                class="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition"
                style="background:#F6C945;color:#1a1a2e;">
                Download .csv
              </button>
            </div>

            <!-- Required columns notice -->
            <div class="rounded-xl p-3" style="background:rgba(255,255,255,0.04);border:1px solid var(--border-primary);">
              <p class="text-xs font-semibold mb-1.5" style="color:var(--txt-secondary);">Required columns:</p>
              <div class="flex flex-wrap gap-1.5">
                ${cfg.required.map(h => `<span class="px-2 py-0.5 rounded-md text-xs font-mono" style="background:rgba(230,57,70,0.12);color:#e63946;border:1px solid rgba(230,57,70,0.2);">${h}</span>`).join('')}
              </div>
            </div>

            <!-- Drop Zone -->
            <div id="bulk-drop-zone"
              onclick="document.getElementById('bulk-file-input').click()"
              ondragover="event.preventDefault();this.style.borderColor='#F6C945';"
              ondragleave="this.style.borderColor=''"
              ondrop="BulkImport._onDrop(event)"
              class="rounded-xl p-8 text-center cursor-pointer transition-all"
              style="border:2px dashed var(--border-primary);background:rgba(255,255,255,0.02);">
              <div id="bulk-drop-content">
                <svg class="mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--txt-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p class="text-sm font-semibold" style="color:var(--txt-secondary);">Drop your file here</p>
                <p class="text-xs mt-1" style="color:var(--txt-muted);">or click to browse — .xlsx, .xls, .csv accepted</p>
              </div>
              <input id="bulk-file-input" type="file" accept=".xlsx,.xls,.csv" class="hidden" onchange="BulkImport._onFileSelect(this)">
            </div>

            <!-- Results -->
            <div id="bulk-results" style="display:none;"></div>
          </div>

          <!-- Footer -->
          <div class="flex justify-end gap-3 px-6 pb-6">
            <button onclick="BulkImport.close()" class="px-4 py-2 rounded-xl text-sm font-semibold transition" style="background:rgba(255,255,255,0.06);color:var(--txt-secondary);border:1px solid var(--border-primary);">Cancel</button>
            <button id="bulk-import-btn" onclick="BulkImport._doImport()" disabled
              class="px-5 py-2 rounded-xl text-sm font-bold transition btn-primary text-white"
              style="opacity:0.4;cursor:not-allowed;">
              📥 Import Now
            </button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(modal);
  },

  close() {
    const m = document.getElementById('bulk-import-modal');
    if (m) m.remove();
    this._entity = null;
    this._file   = null;
  },

  // ── Handle drag-and-drop ──────────────────────────────────
  _onDrop(event) {
    event.preventDefault();
    const zone = document.getElementById('bulk-drop-zone');
    if (zone) zone.style.borderColor = '';
    const file = event.dataTransfer?.files?.[0];
    if (file) this._setFile(file);
  },

  _onFileSelect(input) {
    const file = input.files?.[0];
    if (file) this._setFile(file);
  },

  _setFile(file) {
    const ok = /\.(xlsx|xls|csv)$/i.test(file.name);
    if (!ok) {
      Toast.error('Only .xlsx, .xls, or .csv files are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      Toast.error('File too large. Maximum size is 10 MB.');
      return;
    }
    this._file = file;

    // Update drop zone UI
    const content = document.getElementById('bulk-drop-content');
    if (content) {
      content.innerHTML = `
        <svg class="mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2dc653" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <p class="text-sm font-bold" style="color:#2dc653;">${file.name}</p>
        <p class="text-xs mt-0.5" style="color:var(--txt-muted);">${(file.size / 1024).toFixed(1)} KB — ready to import</p>`;
    }

    // Enable import button
    const btn = document.getElementById('bulk-import-btn');
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; }

    // Clear previous results
    const results = document.getElementById('bulk-results');
    if (results) results.style.display = 'none';
  },

  // ── Execute import ────────────────────────────────────────
  async _doImport() {
    if (!this._file || !this._entity) return;

    const cfg = this._config[this._entity];
    const btn = document.getElementById('bulk-import-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="animate-spin">⏳</span> Importing…'; }

    try {
      const formData = new FormData();
      formData.append('file', this._file);

      const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000/api'
        : window.location.origin + '/api';

      const token = AUTH.currentUser()?._token;
      const res   = await fetch(`${API_BASE}/import/${this._entity}`, {
        method:  'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Import failed.');
      }

      this._showResults(data);

      // Refresh the relevant module's table
      const refreshMap = { schools: 'Schools', coaches: 'Coaches', students: 'Students', teams: 'Teams' };
      const mod = window[refreshMap[this._entity]];
      if (mod?.render) await mod.render();

    } catch (err) {
      Toast.error('Import failed: ' + err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '📥 Import Now'; btn.style.opacity = '1'; }
    }
  },

  _showResults(data) {
    const el = document.getElementById('bulk-results');
    if (!el) return;

    const hasErrors = data.errors?.length > 0;
    el.style.display = 'block';
    el.innerHTML = `
      <div class="rounded-xl p-4 space-y-3" style="background:rgba(255,255,255,0.03);border:1px solid var(--border-primary);">
        <p class="text-sm font-bold" style="color:var(--txt-primary);">Import Complete</p>
        <div class="flex gap-3 flex-wrap">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm" style="background:rgba(45,198,83,0.1);color:#2dc653;border:1px solid rgba(45,198,83,0.2);">
            ✅ <span><strong>${data.inserted}</strong> inserted</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm" style="background:rgba(246,201,69,0.1);color:#e8a800;border:1px solid rgba(246,201,69,0.2);">
            ⏭️ <span><strong>${data.skipped}</strong> skipped (already exist)</span>
          </div>
          ${hasErrors ? `<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm" style="background:rgba(230,57,70,0.1);color:#e63946;border:1px solid rgba(230,57,70,0.2);">❌ <span><strong>${data.errors.length}</strong> error(s)</span></div>` : ''}
        </div>
        ${hasErrors ? `
        <div class="mt-2 rounded-lg p-3 text-xs space-y-1" style="background:rgba(230,57,70,0.06);border:1px solid rgba(230,57,70,0.15);color:#e63946;max-height:120px;overflow-y:auto;">
          ${data.errors.map(e => `<div>• ${e}</div>`).join('')}
        </div>` : ''}
      </div>`;
  },

  // ── Download CSV template ─────────────────────────────────
  downloadTemplate(entity) {
    const cfg = this._config[entity];
    if (!cfg) return;

    const rows    = [cfg.headers, ...cfg.sample];
    const csvStr  = rows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\r\n');

    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `wro_${entity}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

window.BulkImport = BulkImport;
