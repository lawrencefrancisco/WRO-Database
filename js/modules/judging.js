// ============================================================
// Module 6 – Judges (Master Data Repository)
// A centralized database of judges who participate in WRO
// competitions. No scoring or evaluation features.
// ============================================================

const Judging = {
  _page: 1, _perPage: 15, _search: '', _filterSeason: '', _filterCategory: '',

  async render() {
    const content = document.getElementById('page-content');

    const _icon = (d, color = 'currentColor') =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

    content.innerHTML = `
      <div class="page-view space-y-6">

        <!-- Page Header -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              ${_icon('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', '#D4A017')}
              Judges
            </h2>
            <p class="text-xs text-slate-500 mt-1">Master data repository for WRO Philippines competition judges</p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            ${AUTH.can('judging.write') ? `
            <button id="add-judge-btn" onclick="Judging.openForm()"
              class="btn-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition">
              ${_icon('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>')}
              Add Judge
            </button>` : ''}
            <button onclick="Judging.exportCSV()"
              class="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition flex items-center gap-2">
              ${_icon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>')}
              Export
            </button>
          </div>
        </div>

        <!-- KPI Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="judge-stats"></div>

        <!-- Search & Filters -->
        <div class="glass rounded-2xl p-4">
          <div class="flex flex-wrap items-center gap-3">
            <div class="search-box flex-1 min-w-56">
              <span class="search-icon" style="display:flex;align-items:center">
                ${_icon('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>')}
              </span>
              <input id="judge-search" type="text" class="form-input pl-10"
                placeholder="Search by name or contact..." oninput="Judging._onSearch(this.value)">
            </div>
            <select id="judge-season" class="form-input w-auto" onchange="Judging._onFilter()">
              <option value="">All Seasons</option>
              ${Seeder.SEASONS.map(s => `<option>${s}</option>`).join('')}
            </select>
            <select id="judge-category" class="form-input w-auto" onchange="Judging._onFilter()">
              <option value="">All Categories</option>
              ${Seeder.WRO_CATEGORIES.map(c => `<option>${c}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Judges Table -->
        <div class="glass rounded-2xl overflow-hidden">
          <div class="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
              ${_icon('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', '#a89060')}
              Judge Records
            </h3>
            <span id="judge-count" class="text-slate-500 text-xs"></span>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Judge</th>
                  <th>Gender</th>
                  <th>Contact Number</th>
                  <th>Season</th>
                  <th>Judging Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="judges-tbody"></tbody>
            </table>
          </div>
          <div class="flex items-center justify-between p-4 border-t border-slate-700/50">
            <span class="text-slate-400 text-sm" id="judge-count-bottom"></span>
            <div id="judges-pagination" class="flex gap-1"></div>
          </div>
        </div>

      </div>`;

    await this._renderStats();
    await this._loadTable();
  },

  // ── KPI Cards ──────────────────────────────────────────────
  async _renderStats() {
    const all    = (await DB.getAll('judging')).filter(j => !j.isDeleted && !j.is_deleted);
    const active = all.filter(j => (j.status || j.status) === 'active').length;
    const male   = all.filter(j => j.gender === 'Male').length;
    const female = all.filter(j => j.gender === 'Female').length;

    const _si = (d, c) => `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

    const cards = [
      { label: 'Total Judges',  value: all.length, icon: _si('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', '#D4A017'),   color: '#D4A017' },
      { label: 'Active',        value: active,      icon: _si('<polyline points="20 6 9 17 4 12"/>',                                   '#2dc653'),   color: '#2dc653' },
      { label: 'Male',          value: male,        icon: _si('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', '#1d6fa4'), color: '#1d6fa4' },
      { label: 'Female',        value: female,      icon: _si('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', '#e91e8c'), color: '#e91e8c' },
    ];

    const el = document.getElementById('judge-stats');
    if (!el) return;
    el.innerHTML = cards.map(k => `
      <div class="kpi-card rounded-xl p-4">
        <div class="mb-2" style="color:${k.color}">${k.icon}</div>
        <div class="text-2xl font-bold text-white">${k.value}</div>
        <div class="text-xs text-slate-400 mt-1">${k.label}</div>
      </div>`).join('');
  },

  // ── Data Retrieval ─────────────────────────────────────────
  async _getData() {
    let rows = (await DB.getAll('judging')).filter(r => !r.isDeleted && !r.is_deleted);

    if (this._search) {
      const q = this._search.toLowerCase();
      rows = rows.filter(r =>
        (r.fullName  || r.full_name  || '').toLowerCase().includes(q) ||
        (r.contactNumber || r.contact_number || '').toLowerCase().includes(q)
      );
    }
    if (this._filterSeason) {
      rows = rows.filter(r => r.season === this._filterSeason);
    }
    if (this._filterCategory) {
      rows = rows.filter(r =>
        (r.judgingCategory || r.judging_category) === this._filterCategory
      );
    }

    return rows.sort((a, b) => {
      const nameA = (a.fullName || a.full_name || '').toLowerCase();
      const nameB = (b.fullName || b.full_name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  },

  // ── Table Render ───────────────────────────────────────────
  async _loadTable() {
    const rows  = await this._getData();
    const start = (this._page - 1) * this._perPage;
    const page  = rows.slice(start, start + this._perPage);
    const tbody = document.getElementById('judges-tbody');
    if (!tbody) return;

    const genderBadge = (g) => {
      const colors = { Male: '#1d6fa4', Female: '#e91e8c', Other: '#8338ec' };
      const color  = colors[g] || '#5a6a8a';
      return g ? `<span class="text-xs font-medium px-2 py-0.5 rounded-full" style="background:${color}20;color:${color}">${g}</span>` : '<span class="text-slate-600">—</span>';
    };

    if (page.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="7">
          <div class="empty-state">
            <div style="opacity:0.3;display:flex;justify-content:center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a89060" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div class="text-lg font-semibold text-slate-300 mt-2">No judges found</div>
            <p class="text-sm text-slate-500 mt-1">Click "Add Judge" to register a new judge.</p>
          </div>
        </td></tr>`;
    } else {
      tbody.innerHTML = page.map(j => {
        const name     = j.fullName     || j.full_name     || '—';
        const contact  = j.contactNumber|| j.contact_number|| '—';
        const category = j.judgingCategory || j.judging_category || '—';
        const season   = j.season || '—';
        const initial  = name.charAt(0).toUpperCase();
        const statusBadge = (j.status === 'active')
          ? `<span class="badge" style="background:rgba(45,198,83,0.15);color:#2dc653;">Active</span>`
          : `<span class="badge" style="background:rgba(90,106,138,0.2);color:#5a6a8a;">Inactive</span>`;

        return `
          <tr class="table-row">
            <td>
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style="background:linear-gradient(135deg,#D4A017,#8B6914);">
                  ${initial}
                </div>
                <div>
                  <div class="font-semibold text-white text-sm">${name}</div>
                  <div class="text-xs text-slate-500">Judge</div>
                </div>
              </div>
            </td>
            <td>${genderBadge(j.gender)}</td>
            <td class="text-sm text-slate-300">${contact}</td>
            <td>
              <span class="text-xs font-medium px-2 py-0.5 rounded-full" style="background:rgba(212,160,23,0.12);color:#D4A017;">
                ${season}
              </span>
            </td>
            <td class="text-sm text-slate-400 max-w-48 truncate" title="${category}">${category}</td>
            <td>${statusBadge}</td>
            <td>
              <div class="flex gap-2">
                ${AUTH.can('judging.write') ? `
                <button onclick="Judging.openForm('${j.id}')"
                  title="Edit Judge"
                  class="p-1.5 rounded-lg text-xs transition flex items-center"
                  style="background:rgba(212,160,23,0.12);color:#D4A017;"
                  onmouseover="this.style.background='rgba(212,160,23,0.25)'"
                  onmouseout="this.style.background='rgba(212,160,23,0.12)'">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onclick="Judging._confirmDelete('${j.id}', '${name.replace(/'/g, "\\'")}')"
                  title="Remove Judge"
                  class="p-1.5 rounded-lg text-xs transition flex items-center"
                  style="background:rgba(230,57,70,0.12);color:#e63946;"
                  onmouseover="this.style.background='rgba(230,57,70,0.25)'"
                  onmouseout="this.style.background='rgba(230,57,70,0.12)'">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>` : ''}
              </div>
            </td>
          </tr>`;
      }).join('');
    }

    const total = rows.length;
    const countEl = document.getElementById('judge-count');
    const countBotEl = document.getElementById('judge-count-bottom');
    if (countEl)    countEl.textContent    = `${total} judge${total !== 1 ? 's' : ''}`;
    if (countBotEl) countBotEl.textContent = `Showing ${Math.min(start + 1, total)}–${Math.min(start + this._perPage, total)} of ${total}`;

    Utils.renderPagination('judges-pagination', this._page, Math.ceil(total / this._perPage), 'Judging._goPage');
  },

  // ── Pagination & Filters ───────────────────────────────────
  async _goPage(p) { Judging._page = p; await Judging._loadTable(); },
  _onSearch: Utils.debounce(async function(v) {
    Judging._search = v;
    Judging._page   = 1;
    await Judging._loadTable();
  }, 300),
  async _onFilter() {
    this._filterSeason   = document.getElementById('judge-season')?.value   || '';
    this._filterCategory = document.getElementById('judge-category')?.value || '';
    this._page = 1;
    await this._loadTable();
  },

  // ── Add / Edit Form ────────────────────────────────────────
  async openForm(id = null) {
    const j = id ? await DB.getById('judging', id) : null;

    const seasonOptions = Seeder.SEASONS.map(s =>
      `<option ${(j?.season === s) ? 'selected' : ''}>${s}</option>`
    ).join('');

    const categoryOptions = Seeder.WRO_CATEGORIES.map(c => {
      const cat = j?.judgingCategory || j?.judging_category;
      return `<option ${cat === c ? 'selected' : ''}>${c}</option>`;
    }).join('');

    const name    = j?.fullName    || j?.full_name    || '';
    const contact = j?.contactNumber || j?.contact_number || '';

    Modal.show(id ? 'Edit Judge' : 'Add Judge', `
      <form id="judge-form" class="grid grid-cols-1 md:grid-cols-2 gap-5">

        <!-- Full Name -->
        <div class="md:col-span-2">
          <label class="form-label">Full Name <span style="color:#e63946">*</span></label>
          <input class="form-input" name="fullName" value="${name}"
            placeholder="e.g. Maria Santos" required>
        </div>

        <!-- Contact Number -->
        <div>
          <label class="form-label">Contact Number</label>
          <input class="form-input" name="contactNumber" value="${contact}"
            placeholder="e.g. 09171234567">
        </div>

        <!-- Gender -->
        <div>
          <label class="form-label">Gender</label>
          <select class="form-input" name="gender">
            <option value="">— Select Gender —</option>
            ${['Male','Female','Other'].map(g =>
              `<option ${j?.gender === g ? 'selected' : ''}>${g}</option>`
            ).join('')}
          </select>
        </div>

        <!-- Season -->
        <div>
          <label class="form-label">Season</label>
          <select class="form-input" name="season">
            <option value="">— Select Season —</option>
            ${seasonOptions}
          </select>
        </div>

        <!-- Judging Category -->
        <div>
          <label class="form-label">Judging Category</label>
          <select class="form-input" name="judgingCategory">
            <option value="">— Select Category —</option>
            ${categoryOptions}
          </select>
        </div>

        <!-- Status -->
        <div class="md:col-span-2">
          <label class="form-label">Status</label>
          <select class="form-input" name="status">
            <option ${(!j || j.status === 'active') ? 'selected' : ''}>active</option>
            <option ${j?.status === 'inactive' ? 'selected' : ''}>inactive</option>
          </select>
        </div>

      </form>`,
      `<button onclick="Modal.close()"
         class="px-5 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold">
         Cancel
       </button>
       <button onclick="Judging._save('${id || ''}')"
         class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2">
         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
         ${id ? 'Save Changes' : 'Add Judge'}
       </button>`,
      'max-w-2xl'
    );
  },

  // ── Save Judge ─────────────────────────────────────────────
  async _save(id) {
    const form = document.getElementById('judge-form');
    if (!form) return;
    const raw = Object.fromEntries(new FormData(form));

    if (!raw.fullName?.trim()) {
      Toast.error('Full name is required.');
      return;
    }

    const data = {
      fullName:        raw.fullName.trim(),
      contactNumber:   raw.contactNumber || null,
      gender:          raw.gender        || null,
      season:          raw.season        || null,
      judgingCategory: raw.judgingCategory || null,
      status:          raw.status || 'active',
    };

    try {
      if (id) {
        await DB.update('judging', id, data);
        Toast.success('Judge updated successfully!');
      } else {
        await DB.insert('judging', data);
        Toast.success('Judge added successfully!');
      }
      Modal.close();
      await this._renderStats();
      await this._loadTable();
    } catch (err) {
      Toast.error('Failed to save judge. Please try again.');
      console.error('[Judging] Save error:', err);
    }
  },

  // ── Delete Confirmation ────────────────────────────────────
  _confirmDelete(id, name) {
    Modal.show('Remove Judge', `
      <div class="text-center py-4">
        <div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style="background:rgba(230,57,70,0.12);">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </div>
        <p class="text-white font-semibold text-base">Remove <span style="color:#D4A017">${name}</span>?</p>
        <p class="text-slate-400 text-sm mt-2">This judge will be removed from the database. This action can be reviewed in the audit log.</p>
      </div>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold">Cancel</button>
       <button onclick="Judging._delete('${id}')" class="px-5 py-2 rounded-xl text-white text-sm font-semibold" style="background:#e63946;">Remove Judge</button>`,
      'max-w-md'
    );
  },

  async _delete(id) {
    await DB.delete('judging', id);
    Toast.success('Judge removed.');
    Modal.close();
    await this._renderStats();
    await this._loadTable();
  },

  // ── CSV Export ─────────────────────────────────────────────
  async exportCSV() {
    const rows = await this._getData();
    Utils.downloadCSV('WRO_Judges.csv',
      ['ID', 'Full Name', 'Gender', 'Contact Number', 'Season', 'Judging Category', 'Status', 'Created At'],
      rows.map(j => [
        j.id,
        j.fullName    || j.full_name     || '',
        j.gender      || '',
        j.contactNumber || j.contact_number || '',
        j.season      || '',
        j.judgingCategory || j.judging_category || '',
        j.status      || '',
        j.createdAt   || j.created_at   || '',
      ])
    );
    Toast.success('Judges exported to CSV!');
  },
};

window.Judging = Judging;
