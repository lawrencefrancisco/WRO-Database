// ============================================================
// Module 6 – Judges (Master Data Repository)
// A centralized database of judges who participate in WRO
// competitions. No scoring or evaluation features.
// ============================================================

const Judging = {
  _page: 1, _perPage: 15, _search: '', _filterSeason: '', _filterCategory: '',

  async render() {
    const content = document.getElementById('page-content');
    const dbSeasons = (await DB.getAll('seasons')).sort((a, b) => (b.year || 0) - (a.year || 0));

    const _icon = (d, color = 'currentColor') =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

    content.innerHTML = `
      <div class="page-view space-y-6">

        <!-- Page Header -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              ${_icon('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', '#F6C945')}
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
              ${dbSeasons.map(s => `<option>${s.name}</option>`).join('')}
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
              ${_icon('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', '#F6C945')}
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
    const all = (await DB.getAll('judging')).filter(j => !j.isDeleted && !j.is_deleted);
    const active = all.filter(j => (j.status || j.status) === 'active').length;
    const male = all.filter(j => j.gender === 'Male').length;
    const female = all.filter(j => j.gender === 'Female').length;

    const _si = (d, c) => `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

    const cards = [
      { label: 'Total Judges', value: all.length, icon: _si('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', '#F6C945'), color: '#F6C945' },
      { label: 'Active', value: active, icon: _si('<polyline points="20 6 9 17 4 12"/>', '#2dc653'), color: '#2dc653' },
      { label: 'Male', value: male, icon: _si('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', '#1d6fa4'), color: '#1d6fa4' },
      { label: 'Female', value: female, icon: _si('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', '#e91e8c'), color: '#e91e8c' },
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
        (r.fullName || r.full_name || '').toLowerCase().includes(q) ||
        (r.contactNumber || r.contact_number || '').toLowerCase().includes(q)
      );
    }

    // Build a set of judge IDs that have matching assignments so the filter
    // captures judges assigned via judge_assignments (not just their own row field).
    if (this._filterSeason || this._filterCategory) {
      // Fetch assignments for all visible judges in one batch via the API
      const assignmentMap = {}; // judgeId -> { seasons: [], categories: [] }
      await Promise.all(rows.map(async r => {
        try {
          const res = await DB._request('GET', `/judging/${r.id}/assignments`);
          if (res && !res.error) assignmentMap[r.id] = res;
        } catch { /* silently ignore */ }
      }));

      rows = rows.filter(r => {
        const asgn = assignmentMap[r.id];
        const seasonMatch = !this._filterSeason || (
          r.season === this._filterSeason ||
          (asgn?.seasons || []).includes(this._filterSeason)
        );
        const catMatch = !this._filterCategory || (
          (r.judgingCategory || r.judging_category) === this._filterCategory ||
          (asgn?.categories || []).includes(this._filterCategory)
        );
        return seasonMatch && catMatch;
      });
    }

    return rows.sort((a, b) => {
      const nameA = (a.fullName || a.full_name || '').toLowerCase();
      const nameB = (b.fullName || b.full_name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  },

  // ── Table Render ───────────────────────────────────────────
  async _loadTable() {
    const rows = await this._getData();
    const start = (this._page - 1) * this._perPage;
    const page = rows.slice(start, start + this._perPage);
    const tbody = document.getElementById('judges-tbody');
    if (!tbody) return;

    const genderBadge = (g) => {
      const colors = { Male: '#1d6fa4', Female: '#e91e8c', Other: '#8338ec' };
      const color = colors[g] || '#5a6a8a';
      return g ? `<span class="text-xs font-medium px-2 py-0.5 rounded-full" style="background:${color}20;color:${color}">${g}</span>` : '<span class="text-slate-600">—</span>';
    };

    if (page.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="5">
          <div class="empty-state">
            <div style="opacity:0.3;display:flex;justify-content:center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F6C945" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div class="text-lg font-semibold text-slate-300 mt-2">No judges found</div>
            <p class="text-sm text-slate-500 mt-1">Click "Add Judge" to register a new judge.</p>
          </div>
        </td></tr>`;
    } else {
      tbody.innerHTML = page.map(j => {
        const name = j.fullName || j.full_name || '—';
        const contact = j.contactNumber || j.contact_number || '—';
        const category = j.judgingCategory || j.judging_category || '—';
        const season = j.season || '—';
        const initial = name.charAt(0).toUpperCase();
        const statusBadge = (j.status === 'active')
          ? `<span class="badge" style="background:rgba(45,198,83,0.15);color:#2dc653;">Active</span>`
          : `<span class="badge" style="background:rgba(90,106,138,0.2);color:#5a6a8a;">Inactive</span>`;

        return `
          <tr class="table-row cursor-pointer transition-colors" onclick="Judging.viewJudge('${j.id}')" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background=''">
            <td>
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style="background:linear-gradient(135deg,#F6C945,#8B6914);">
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
            <td>${statusBadge}</td>
            <td>
              <div class="flex gap-2" onclick="event.stopPropagation();">
                ${AUTH.can('judging.write') ? `
                <button onclick="Judging.openForm('${j.id}')"
                  title="Edit Judge"
                  class="p-1.5 rounded-lg text-xs transition flex items-center"
                  style="background:rgba(246,201,69,0.12);color:#F6C945;"
                  onmouseover="this.style.background='rgba(246,201,69,0.25)'"
                  onmouseout="this.style.background='rgba(246,201,69,0.12)'">
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
    if (countEl) countEl.textContent = `${total} judge${total !== 1 ? 's' : ''}`;
    if (countBotEl) countBotEl.textContent = `Showing ${Math.min(start + 1, total)}–${Math.min(start + this._perPage, total)} of ${total}`;

    Utils.renderPagination('judges-pagination', this._page, Math.ceil(total / this._perPage), 'Judging._goPage');
  },

  // ── Pagination & Filters ───────────────────────────────────
  async _goPage(p) { Judging._page = p; await Judging._loadTable(); },
  _onSearch: Utils.debounce(async function (v) {
    Judging._search = v;
    Judging._page = 1;
    await Judging._loadTable();
  }, 300),
  async _onFilter() {
    this._filterSeason = document.getElementById('judge-season')?.value || '';
    this._filterCategory = document.getElementById('judge-category')?.value || '';
    this._page = 1;
    await this._loadTable();
  },

  async viewJudge(id) {
    const [j, assignments] = await Promise.all([
      DB.getById('judging', id),
      DB._request('GET', `/judging/${id}/assignments`).catch(() => null)
    ]);
    if (!j) return;
    
    const name = j.fullName || j.full_name || '—';
    const email = j.email || '—';
    const contact = j.contactNumber || j.contact_number || '—';
    const gender = j.gender || '—';
    const status = j.status === 'active' 
      ? '<span class="badge" style="background:rgba(45,198,83,0.15);color:#2dc653;">Active</span>'
      : '<span class="badge" style="background:rgba(90,106,138,0.2);color:#5a6a8a;">Inactive</span>';
    
    const seasons = assignments?.seasons?.length ? assignments.seasons.join(', ') : (j.season || 'None');
    const categories = assignments?.categories?.length ? assignments.categories.join(', ') : (j.judgingCategory || j.judging_category || 'None');

    Modal.show('Judge Details', `
      <div class="space-y-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0" style="background:linear-gradient(135deg,#F6C945,#8B6914);">
            ${name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 class="text-xl font-bold text-white">${name}</h3>
            <p class="text-sm text-slate-400">Judge Code: ${j.judge_code || '—'}</p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
          <div>
            <div class="text-xs text-slate-500 uppercase font-bold mb-1">Email</div>
            <div class="text-sm text-slate-200 break-words">${email}</div>
          </div>
          <div>
            <div class="text-xs text-slate-500 uppercase font-bold mb-1">Contact Number</div>
            <div class="text-sm text-slate-200">${contact}</div>
          </div>
          <div>
            <div class="text-xs text-slate-500 uppercase font-bold mb-1">Gender</div>
            <div class="text-sm text-slate-200">${gender}</div>
          </div>
          <div>
            <div class="text-xs text-slate-500 uppercase font-bold mb-1">Status</div>
            <div class="text-sm text-slate-200">${status}</div>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <div class="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F6C945" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Assigned Seasons
            </div>
            <div class="text-sm text-slate-300 bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
              ${seasons}
            </div>
          </div>
          <div>
            <div class="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E9EBF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              Assigned Categories
            </div>
            <div class="text-sm text-slate-300 bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
              ${categories}
            </div>
          </div>
        </div>
      </div>
    `, `<button onclick="Modal.close()" class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold">Close</button>`, 'max-w-xl');
  },

  // ── Add / Edit Form ────────────────────────────────────────
  async openForm(id = null) {
    // Fetch judge data + all seasons, and (for edit) existing assignments in parallel
    const [j, rawSeasons, existingAssignments] = await Promise.all([
      id ? DB.getById('judging', id)                              : Promise.resolve(null),
      DB.getAll('seasons'),
      id ? DB._request('GET', `/judging/${id}/assignments`).catch(() => null) : Promise.resolve(null),
    ]);

    const liveSeasons    = rawSeasons.sort((a, b) => (b.year || 0) - (a.year || 0)).map(s => s.name);
    const allCategories  = Seeder.WRO_CATEGORIES;

    // Resolve pre-selected values:
    // Priority: judge_assignments table (authoritative) → fallback to judge row columns
    const savedSeasons = existingAssignments?.seasons?.length
      ? existingAssignments.seasons
      : (j?.season ? [j.season] : []);

    const savedCategories = existingAssignments?.categories?.length
      ? existingAssignments.categories
      : (j?.judgingCategory || j?.judging_category
          ? [j.judgingCategory || j.judging_category]
          : []);

    const name    = j?.fullName || j?.full_name || '';
    const email   = j?.email || '';
    const contact = j?.contactNumber || j?.contact_number || '';

    // Chip builder — same style as the Assignments modal
    const chipSet = (items, selectedSet, groupId, activeColor, activeBorder, activeBg) =>
      items.map(item => {
        const isSel = selectedSet.includes(item);
        return `
          <button type="button"
            data-group="${groupId}"
            data-value="${item.replace(/"/g, '&quot;')}"
            onclick="Judging._toggleChip(this)"
            class="assignment-chip px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style="${isSel
              ? `background:${activeBg};color:${activeColor};border-color:${activeBorder};`
              : 'background:rgba(255,255,255,0.04);color:#6B7494;border-color:rgba(255,255,255,0.10);'}"
            aria-pressed="${isSel}">${item}</button>`;
      }).join('');

    Modal.show(id ? 'Edit Judge' : 'Add Judge', `
      <form id="judge-form" class="space-y-5">

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Full Name -->
          <div class="md:col-span-2">
            <label class="form-label">Full Name <span style="color:#e63946">*</span></label>
            <input class="form-input" name="fullName" value="${name}"
              placeholder="e.g. Maria Santos" required>
          </div>

          <!-- Email -->
          <div>
            <label class="form-label">Email Address</label>
            <input class="form-input" name="email" type="email" value="${email}"
              placeholder="e.g. maria@example.com">
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
              ${['Male', 'Female', 'Other'].map(g =>
                `<option ${j?.gender === g ? 'selected' : ''}>${g}</option>`
              ).join('')}
            </select>
          </div>

          <!-- Status -->
          <div class="md:col-span-2">
            <label class="form-label">Status</label>
            <select class="form-input" name="status">
              <option ${(!j || j.status === 'active')   ? 'selected' : ''}>active</option>
              <option ${j?.status === 'inactive'        ? 'selected' : ''}>inactive</option>
            </select>
          </div>
        </div>

        <!-- Divider -->
        <div style="height:1px;background:rgba(255,255,255,0.07);"></div>

        <!-- Seasons Multi-Select (chips) -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="form-label mb-0" style="color:#F6C945;">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;margin-right:4px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Seasons Available
            </label>
            <div class="flex gap-2">
              <button type="button" onclick="Judging._selectAll('season')" class="text-xs text-slate-400 hover:text-white transition">Select all</button>
              <span class="text-slate-700">·</span>
              <button type="button" onclick="Judging._clearAll('season')" class="text-xs text-slate-400 hover:text-white transition">Clear</button>
            </div>
          </div>
          <div id="chips-season" class="flex flex-wrap gap-2">
            ${liveSeasons.length
              ? chipSet(liveSeasons, savedSeasons, 'season', '#F6C945', 'rgba(246,201,69,0.55)', 'rgba(246,201,69,0.22)')
              : '<p class="text-xs text-slate-500">No seasons found. Create a season first.</p>'}
          </div>
        </div>

        <!-- Divider -->
        <div style="height:1px;background:rgba(255,255,255,0.07);"></div>

        <!-- Judging Categories Multi-Select (chips) -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="form-label mb-0" style="color:#1E9EBF;">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;margin-right:4px"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              Judging Categories
            </label>
            <div class="flex gap-2">
              <button type="button" onclick="Judging._selectAll('category')" class="text-xs text-slate-400 hover:text-white transition">Select all</button>
              <span class="text-slate-700">·</span>
              <button type="button" onclick="Judging._clearAll('category')" class="text-xs text-slate-400 hover:text-white transition">Clear</button>
            </div>
          </div>
          <div id="chips-category" class="flex flex-wrap gap-2">
            ${chipSet(allCategories, savedCategories, 'category', '#1E9EBF', 'rgba(30,158,191,0.55)', 'rgba(30,158,191,0.22)')}
          </div>
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

  // Helper: collect selected chip values from the modal form
  _getChipValues(group) {
    return Array.from(
      document.querySelectorAll(`#judge-form [data-group="${group}"][aria-pressed="true"]`)
    ).map(b => b.dataset.value);
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

    // Collect chip multi-selections
    const selectedSeasons    = this._getChipValues('season');
    const selectedCategories = this._getChipValues('category');

    // For the legacy single-value columns on the judges row, use the first chip selection
    const primarySeason   = selectedSeasons[0]    || null;
    const primaryCategory = selectedCategories[0] || null;

    const data = {
      fullName:        raw.fullName.trim(),
      email:           raw.email?.trim() || null,
      contactNumber:   raw.contactNumber || null,
      gender:          raw.gender        || null,
      season:          primarySeason,
      judgingCategory: primaryCategory,
      status:          raw.status        || 'active',
    };

    // Disable save button to prevent double-submit
    const saveBtn = document.querySelector('#modal-overlay button[onclick*="_save"]');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.style.opacity = '0.6'; }

    try {
      let judgeId = id;

      if (id) {
        await DB.update('judging', id, data);
      } else {
        const created = await DB.insert('judging', data);
        // DB.insert returns the full created record or { id } depending on backend
        judgeId = created?.id || created?.insertId || null;
      }

      // Sync assignments table (seasons × categories) — same as the Assignments modal
      if (judgeId && (selectedSeasons.length > 0 || selectedCategories.length > 0)) {
        try {
          await DB._request('PUT', `/judging/${judgeId}/assignments`, {
            seasons:    selectedSeasons,
            categories: selectedCategories,
          });
        } catch (aErr) {
          console.warn('[Judging] Assignments sync failed (non-fatal):', aErr);
        }
      }

      DB.invalidateAll(); // ensure fresh data on next load
      Toast.success(id ? 'Judge updated successfully!' : 'Judge added successfully!');
      Modal.close();
      await this._renderStats();
      await this._loadTable();
    } catch (err) {
      Toast.error('Failed to save judge. Please try again.');
      console.error('[Judging] Save error:', err);
      if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = '1'; }
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
        <p class="text-white font-semibold text-base">Remove <span style="color:#F6C945">${name}</span>?</p>
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



  // Toggle a chip's selected state
  _toggleChip(btn) {
    const group = btn.dataset.group;
    const isSelected = btn.getAttribute('aria-pressed') === 'true';
    const nextState = !isSelected;

    const activeStyle = group === 'season'
      ? 'background:rgba(246,201,69,0.22);color:#F6C945;border-color:rgba(246,201,69,0.55);'
      : 'background:rgba(30,158,191,0.22);color:#1E9EBF;border-color:rgba(30,158,191,0.55);';
    const inactiveStyle = 'background:rgba(255,255,255,0.04);color:#6B7494;border-color:rgba(255,255,255,0.10);';

    btn.style.cssText = nextState ? activeStyle : inactiveStyle;
    btn.setAttribute('aria-pressed', String(nextState));
  },

  // Select all chips in a group
  _selectAll(group) {
    const container = document.getElementById(`chips-${group}`);
    if (!container) return;
    container.querySelectorAll('.assignment-chip').forEach(btn => {
      if (btn.getAttribute('aria-pressed') !== 'true') this._toggleChip(btn);
    });
  },

  // Clear all chips in a group
  _clearAll(group) {
    const container = document.getElementById(`chips-${group}`);
    if (!container) return;
    container.querySelectorAll('.assignment-chip').forEach(btn => {
      if (btn.getAttribute('aria-pressed') === 'true') this._toggleChip(btn);
    });
  },



  // ── CSV Export ─────────────────────────────────────────────
  async exportCSV() {
    const rows = await this._getData();
    Utils.downloadCSV('WRO_Judges.csv',
      ['ID', 'Full Name', 'Gender', 'Contact Number', 'Season', 'Judging Category', 'Status', 'Created At'],
      rows.map(j => [
        j.id,
        j.fullName || j.full_name || '',
        j.gender || '',
        j.contactNumber || j.contact_number || '',
        j.season || '',
        j.judgingCategory || j.judging_category || '',
        j.status || '',
        j.createdAt || j.created_at || '',
      ])
    );
    Toast.success('Judges exported to CSV!');
  },
};

window.Judging = Judging;
