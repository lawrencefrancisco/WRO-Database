// ============================================================
// Module 5 – Competition Management (Redesigned)
// Seasons are first-class DB records; statistics are computed
// live from the teams / team_members tables — never stored.
// ============================================================

const Competitions = {
  _page: 1, _perPage: 10, _search: '', _filterSeason: '',
  _allComps: [],  // cached for client-side filtering / pagination

  // ── Inline SVG helper ──────────────────────────────────────
  _icon(d, color = 'currentColor', size = 18) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  },

  // ── Main render ───────────────────────────────────────────
  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-view space-y-6">

        <!-- Page Header -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              ${this._icon('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>', '#F6C945')}
              Competition Management
            </h2>
            <p class="text-xs text-slate-500 mt-1">WRO Philippines seasons and competition events — statistics update automatically</p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            ${AUTH.can('competitions.write') ? `
            <button id="new-season-btn" onclick="Competitions.openSeasonForm()"
              class="btn-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition">
              ${this._icon('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>')}
              New Season
            </button>` : ''}
            <button onclick="Competitions.exportCSV()"
              class="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition flex items-center gap-2">
              ${this._icon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>')}
              Export
            </button>
          </div>
        </div>

        <!-- Season Cards -->
        <div>
          <div class="flex items-center gap-2 mb-4">
            ${this._icon('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>', '#F6C945', 16)}
            <span class="text-sm font-semibold text-slate-300">WRO Seasons</span>
            <span class="text-slate-600 text-xs ml-1">— statistics computed live from Team Management</span>
          </div>
          <div id="season-cards" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <div class="flex items-center justify-center py-10 text-slate-600 col-span-3">
              <div class="spinner"></div>
            </div>
          </div>
        </div>

        <!-- Competition Events Table -->
        <div class="glass rounded-2xl overflow-hidden">
          <div class="p-4 border-b border-slate-700/50 flex items-center justify-between flex-wrap gap-3">
            <h3 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
              ${this._icon('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>', '#F6C945', 14)}
              Competition Events
            </h3>
            <div class="flex items-center gap-3 flex-wrap">
              <div class="search-box">
                <span class="search-icon" style="display:flex;align-items:center">
                  ${this._icon('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', 'currentColor', 15)}
                </span>
                <input id="comp-search" type="text" class="form-input pl-10" placeholder="Search events..." oninput="Competitions._onSearch(this.value)">
              </div>
              <select id="comp-season-filter" class="form-input w-auto" onchange="Competitions._onFilter()">
                <option value="">All Seasons</option>
              </select>
              ${AUTH.can('competitions.write') ? `
              <button onclick="Competitions.openForm()"
                class="px-4 py-2 rounded-xl text-white text-sm font-semibold transition flex items-center gap-2"
                style="background:rgba(246,201,69,0.18);color:#F6C945;border:1px solid rgba(246,201,69,0.3);"
                onmouseover="this.style.background='rgba(246,201,69,0.30)'"
                onmouseout="this.style.background='rgba(246,201,69,0.18)'">
                ${this._icon('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', 'currentColor', 14)}
                Add Event
              </button>` : ''}
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Season</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="comp-tbody">
                <tr><td colspan="6"><div class="flex items-center justify-center py-8"><div class="spinner"></div></div></td></tr>
              </tbody>
            </table>
          </div>
          <div class="flex items-center justify-between p-4 border-t border-slate-700/50">
            <span id="comp-count" class="text-slate-400 text-sm"></span>
            <div id="comp-pagination" class="flex gap-1"></div>
          </div>
        </div>
      </div>`;

    await this._loadAll();
  },

  // ── Load everything concurrently ──────────────────────────
  async _loadAll() {
    const [seasons, comps] = await Promise.all([
      DB.getAll('seasons'),
      DB.getAll('competitions'),
    ]);

    const sorted = [...seasons].sort((a, b) => (b.year || 0) - (a.year || 0));

    // Kick off both renders; stats load asynchronously inside _renderSeasonCards
    await this._renderSeasonCards(sorted);
    this._populateSeasonFilter(sorted);
    this._allComps = comps;
    this._redrawTable();
  },

  // ── Season Cards ──────────────────────────────────────────
  async _renderSeasonCards(seasons) {
    const grid = document.getElementById('season-cards');
    if (!grid) return;

    if (seasons.length === 0) {
      grid.innerHTML = `
        <div class="col-span-3">
          <div class="empty-state">
            <div style="opacity:0.35;display:flex;justify-content:center">
              ${this._icon('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>', '#F6C945', 48)}
            </div>
            <div class="text-slate-400 mt-3 font-semibold">No seasons yet</div>
            <div class="text-slate-600 text-sm mt-1">Click "New Season" to create the first WRO season.</div>
          </div>
        </div>`;
      return;
    }

    grid.innerHTML = seasons.map(s => {
      const isCompleted = s.status === 'completed';
      const statusBadge = isCompleted
        ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(100,116,139,0.15);color:#64748b;border:1px solid rgba(100,116,139,0.30);">
             <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
             Completed
           </span>`
        : `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(45,198,83,0.12);color:#2dc653;border:1px solid rgba(45,198,83,0.28);">
             <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="5"/></svg>
             Ongoing
           </span>`;

      return `
      <div class="glass rounded-2xl p-5 border transition-all hover:shadow-lg ${isCompleted ? 'border-slate-700/50 hover:border-slate-500/40 hover:shadow-slate-500/5' : 'border-slate-700/30 hover:border-yellow-500/40 hover:shadow-yellow-500/5'}" id="season-card-${s.id}">

        <!-- Card Header -->
        <div class="flex items-start justify-between mb-5">
          <!-- Clickable title area -->
          <div class="flex-1 cursor-pointer" onclick="Competitions.viewSeasonDetail('${s.name.replace(/'/g, "\\'")}')"
            title="Click to view all participants for ${s.name}">
            <div class="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">WRO Season</div>
            <div class="text-2xl font-extrabold leading-none transition-colors ${isCompleted ? 'text-slate-400 hover:text-slate-200' : 'text-white hover:text-yellow-400'}">${s.name}</div>
            <div class="flex items-center gap-2 mt-1.5">
              <div class="text-xs text-slate-600">${s.year}</div>
              ${statusBadge}
            </div>
          </div>
          <div class="flex gap-1.5">
            ${AUTH.can('competitions.write') ? `
            <button onclick="Competitions.openSeasonStatusModal('${s.id}', '${s.name}', '${s.status || 'ongoing'}')"
              title="${isCompleted ? 'Reactivate Season' : 'Mark as Completed'}"
              class="p-2 rounded-lg transition"
              style="background:${isCompleted ? 'rgba(45,198,83,0.10)' : 'rgba(100,116,139,0.15)'};color:${isCompleted ? '#2dc653' : '#64748b'};"
              onmouseover="this.style.background='${isCompleted ? 'rgba(45,198,83,0.22)' : 'rgba(100,116,139,0.30)'}'"
              onmouseout="this.style.background='${isCompleted ? 'rgba(45,198,83,0.10)' : 'rgba(100,116,139,0.15)'}'">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </button>
            ${ isCompleted
              ? `<button disabled
                  title="Season is completed — events are frozen in the historical snapshot"
                  class="p-2 rounded-lg"
                  style="background:rgba(100,116,139,0.06);color:#374151;cursor:not-allowed;opacity:0.45;"
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>`
              : `<button onclick="Competitions.openForm(null, '${s.name}')"
                  title="Add Competition Event to ${s.name}"
                  class="p-2 rounded-lg transition"
                  style="background:rgba(246,201,69,0.10);color:#F6C945;"
                  onmouseover="this.style.background='rgba(246,201,69,0.22)'"
                  onmouseout="this.style.background='rgba(246,201,69,0.10)'">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>`
            }
            <button onclick="Competitions.confirmDeleteSeason('${s.id}', '${s.name}')"
              title="Delete Season ${s.name}"
              class="p-2 rounded-lg transition"
              style="background:rgba(230,57,70,0.10);color:#e63946;"
              onmouseover="this.style.background='rgba(230,57,70,0.22)'"
              onmouseout="this.style.background='rgba(230,57,70,0.10)'">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>` : ''}
          </div>
        </div>

        <!-- Stats grid (clickable — opens same modal) -->
        <div class="grid grid-cols-2 gap-3 cursor-pointer" id="stats-${s.id}"
          onclick="Competitions.viewSeasonDetail('${s.name.replace(/'/g, "\\'")}')"
          title="Click to view all participants for ${s.name}">
          ${['Teams','Schools','Coaches','Students'].map(() => `
            <div class="glass-light rounded-xl p-3 text-center">
              <div class="flex justify-center mb-1"><div class="spinner" style="width:12px;height:12px;border-width:2px;"></div></div>
              <div class="text-xs text-slate-600 mt-1">—</div>
            </div>`).join('')}
        </div>

        <!-- Participating Categories (placeholder; filled async) -->
        <div class="mt-4 pt-4" style="border-top:1px solid rgba(100,116,139,0.18)">
          <div class="flex items-center gap-1.5 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F6C945" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            <span class="text-xs font-semibold uppercase tracking-widest" style="color:#F6C945">Participating Categories</span>
          </div>
          <div id="categories-${s.id}" class="flex flex-wrap gap-1.5">
            <div class="flex items-center gap-1" style="opacity:0.5">
              <div class="spinner" style="width:10px;height:10px;border-width:2px;"></div>
              <span class="text-xs text-slate-600">Loading…</span>
            </div>
          </div>
        </div>

        <!-- View Details hint -->
        <div class="mt-3 pt-3 flex items-center justify-center gap-1 text-xs text-slate-600 cursor-pointer hover:text-yellow-400 transition-colors"
          onclick="Competitions.viewSeasonDetail('${s.name.replace(/'/g, "\\'")}')"
          title="View all participants">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          View all participants
        </div>

      </div>`;
    }).join('');


    // Load all stats in parallel — each card updates itself when ready
    await Promise.all(seasons.map(s => this._loadSeasonStats(s.name, s.id)));
  },

  // ── Category badge color palette ──────────────────────────
  // Maps known WRO category names to distinct accent colours.
  // Unknown categories fall back to a neutral slate style.
  _categoryBadge(name) {
    const palette = {
      'RoboMission':       { bg: 'rgba(246,201,69,0.14)',  text: '#F6C945', border: 'rgba(246,201,69,0.32)' },
      'Future Innovators': { bg: 'rgba(79,156,249,0.14)',  text: '#4f9cf9', border: 'rgba(79,156,249,0.32)' },
      'Future Engineers':  { bg: 'rgba(45,198,83,0.14)',   text: '#2dc653', border: 'rgba(45,198,83,0.32)'  },
      'RoboSports':        { bg: 'rgba(233,30,140,0.14)',  text: '#e91e8c', border: 'rgba(233,30,140,0.32)' },
      'Advanced Robotics': { bg: 'rgba(168,144,240,0.14)', text: '#a890f0', border: 'rgba(168,144,240,0.32)' },
    };
    // Partial-match fallback (case-insensitive prefix) so slight name variations still get a colour
    const key = Object.keys(palette).find(k => name.toLowerCase().startsWith(k.toLowerCase()));
    const c   = palette[key] || { bg: 'rgba(100,116,139,0.14)', text: '#94a3b8', border: 'rgba(100,116,139,0.30)' };
    return `<span style="
        display:inline-flex;align-items:center;gap:5px;
        padding:3px 10px 3px 8px;border-radius:20px;font-size:11px;font-weight:600;
        background:${c.bg};color:${c.text};border:1px solid ${c.border};
        letter-spacing:0.01em;white-space:nowrap;
        transition:filter 0.15s;
      "
      onmouseover="this.style.filter='brightness(1.2)'"
      onmouseout="this.style.filter=''"
      title="${name}">
      <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><circle cx="12" cy="12" r="6"/></svg>
      ${name}
    </span>`;
  },

  async _loadSeasonStats(seasonName, seasonId) {
    const el   = document.getElementById(`stats-${seasonId}`);
    const catEl = document.getElementById(`categories-${seasonId}`);
    if (!el) return;
    try {
      const stats = await DB._request(
        'GET', `/competitions/stats?season=${encodeURIComponent(seasonName)}`
      );
      if (!stats || stats.success === false) return;

      const items = [
        { label: 'Teams',    value: stats.teams,    color: '#F6C945', icon: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 17h6M17 14v6"/>' },
        { label: 'Schools',  value: stats.schools,  color: '#4f9cf9', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
        { label: 'Coaches',  value: stats.coaches,  color: '#2dc653', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
        { label: 'Students', value: stats.students, color: '#e91e8c', icon: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5"/>' },
      ];

      el.innerHTML = items.map(s => `
        <div class="glass-light rounded-xl p-3 text-center">
          <div class="flex justify-center mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${s.icon}</svg>
          </div>
          <div class="text-xl font-bold" style="color:${s.color}">${s.value}</div>
          <div class="text-xs text-slate-500 mt-0.5">${s.label}</div>
        </div>`).join('');

      // ── Participating Categories ──────────────────────────
      if (catEl) {
        const cats = Array.isArray(stats.categories) ? stats.categories : [];
        if (cats.length === 0) {
          catEl.innerHTML = `<span class="text-xs italic" style="color:rgba(100,116,139,0.6)">No participating categories yet.</span>`;
        } else {
          catEl.innerHTML = cats.map(c => this._categoryBadge(c)).join('');
        }
      }
    } catch (_) { /* silently ignore — stats are supplemental */ }
  },

  // ── Season Filter Dropdown ────────────────────────────────
  _populateSeasonFilter(seasons) {
    const sel = document.getElementById('comp-season-filter');
    if (!sel) return;
    // Remove all but the "All Seasons" option
    while (sel.options.length > 1) sel.remove(1);
    seasons.forEach(s => {
      const opt = document.createElement('option');
      opt.value       = s.name;
      opt.textContent = s.name;
      if (s.name === this._filterSeason) opt.selected = true;
      sel.appendChild(opt);
    });
  },

  // ── Competition Events Table ──────────────────────────────
  _getFiltered() {
    let rows = (this._allComps || []).filter(c => !c.isDeleted && !c.is_deleted);
    if (this._search) {
      const q = this._search.toLowerCase();
      rows = rows.filter(r =>
        (r.name   || '').toLowerCase().includes(q) ||
        (r.venue  || '').toLowerCase().includes(q) ||
        (r.theme  || '').toLowerCase().includes(q)
      );
    }
    if (this._filterSeason) {
      rows = rows.filter(r => r.season === this._filterSeason);
    }
    return rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  },

  _redrawTable() {
    const rows  = this._getFiltered();
    const start = (this._page - 1) * this._perPage;
    const page  = rows.slice(start, start + this._perPage);
    const tbody = document.getElementById('comp-tbody');
    const countEl = document.getElementById('comp-count');
    if (!tbody) return;

    if (page.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="6">
          <div class="empty-state">
            <div style="opacity:0.3;display:flex;justify-content:center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F6C945" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
              </svg>
            </div>
            <div class="text-slate-400 mt-2">No competition events found</div>
            <div class="text-slate-600 text-sm mt-1">Use "Add Event" to register a competition event.</div>
          </div>
        </td></tr>`;
    } else {
      tbody.innerHTML = page.map(c => `
        <tr class="table-row cursor-pointer" onclick="Competitions.viewDetail('${c.id}')">
          <td>
            <div class="font-semibold text-white text-sm">${c.name}</div>
            <div class="text-xs text-slate-500">${c.theme || ''}</div>
          </td>
          <td><span class="badge badge-purple">${c.season || '—'}</span></td>
          <td class="text-sm text-slate-300">${Utils.formatDate(c.date)}</td>
          <td class="text-sm text-slate-400">${Utils.truncate(c.venue, 30)}</td>
          <td>${Utils.statusBadge(c.status)}</td>
          <td>
            <div class="flex gap-2">
              ${AUTH.can('competitions.write') ? `
              <button onclick="event.stopPropagation();Competitions.openForm('${c.id}')"
                title="Edit"
                class="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 text-xs transition flex items-center">
                <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/><path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/></svg>
              </button>
              <button onclick="event.stopPropagation();Competitions.confirmDelete('${c.id}')"
                title="Delete"
                class="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs transition flex items-center">
                <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'/></svg>
              </button>` : ''}
            </div>
          </td>
        </tr>`).join('');
    }

    const total = rows.length;
    if (countEl) {
      countEl.textContent = total === 0
        ? '0 events'
        : `${start + 1}–${Math.min(start + this._perPage, total)} of ${total} event${total !== 1 ? 's' : ''}`;
    }
    Utils.renderPagination('comp-pagination', this._page, Math.ceil(total / this._perPage), 'Competitions._goPage');
  },

  _goPage(p)  { Competitions._page = p; Competitions._redrawTable(); },
  _onSearch: Utils.debounce(function(v) {
    Competitions._search = v;
    Competitions._page   = 1;
    Competitions._redrawTable();
  }, 300),
  _onFilter() {
    Competitions._filterSeason = document.getElementById('comp-season-filter')?.value || '';
    Competitions._page = 1;
    Competitions._redrawTable();
  },

  // ── New Season Modal ──────────────────────────────────────
  async openSeasonForm() {
    const currentYear  = new Date().getFullYear();
    const existingYears = (await DB.getAll('seasons')).map(s => parseInt(s.year, 10));

    // Year range: 2015 → current+6
    const years = [];
    for (let y = currentYear + 6; y >= 2015; y--) years.push(y);

    Modal.show('Create New WRO Season', `
      <div class="space-y-5">
        <p class="text-sm text-slate-400 leading-relaxed">
          Select a year to create a new season. The season name will be generated automatically
          in the format <strong class="text-white">WRO YYYY</strong>.
        </p>

        <div>
          <label class="form-label">Year <span style="color:#e63946">*</span></label>
          <select id="season-year-select" class="form-input" onchange="Competitions._previewSeason(this.value)">
            <option value="">— Select Year —</option>
            ${years.map(y => {
              const exists = existingYears.includes(y);
              return `<option value="${y}" ${exists ? 'disabled' : ''}>${y}${exists ? ' (already exists)' : ''}</option>`;
            }).join('')}
          </select>
        </div>

        <!-- Preview -->
        <div id="season-preview" class="hidden">
          <div class="glass-light rounded-xl p-5 text-center border border-yellow-500/20">
            <div class="text-xs text-slate-500 uppercase tracking-widest mb-2">Season will be created as</div>
            <div id="season-preview-name" class="text-3xl font-extrabold text-white"></div>
          </div>
        </div>
      </div>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition">Cancel</button>
       <button onclick="Competitions._createSeason()"
         class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2">
         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
         Create Season
       </button>`,
      'max-w-md'
    );
  },

  _previewSeason(year) {
    const preview = document.getElementById('season-preview');
    const nameEl  = document.getElementById('season-preview-name');
    if (year && preview && nameEl) {
      preview.classList.remove('hidden');
      nameEl.textContent = `WRO ${year}`;
    } else if (preview) {
      preview.classList.add('hidden');
    }
  },

  async _createSeason() {
    const yearSelect = document.getElementById('season-year-select');
    const year = yearSelect?.value;
    if (!year) { Toast.warning('Please select a year.'); return; }

    const btn = document.querySelector('#modal-overlay button[onclick*="_createSeason"]');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }

    try {
      const res = await DB.insert('seasons', { year: parseInt(year, 10) });
      if (!res || res.success === false) {
        Toast.error(res?.error || 'Failed to create season.');
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        return;
      }
      Toast.success(`Season "WRO ${year}" created successfully!`);
      Modal.close();
      await this._loadAll();
    } catch (err) {
      console.error('[Competitions] Create season error:', err);
      Toast.error('Network error. Please check the server and try again.');
      if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
    }
  },

  confirmDeleteSeason(id, name) {
    Modal.show('Delete Season', `
      <div class="text-center py-4">
        <div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style="background:rgba(230,57,70,0.12);">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <p class="text-white font-semibold text-base">Delete <span style="color:#e63946">${name}</span>?</p>
        <p class="text-slate-400 text-sm mt-2 leading-relaxed">
          The season record will be removed. Teams already assigned to <em>${name}</em>
          will retain their season label but the season will no longer appear in dropdowns.
        </p>
      </div>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold">Cancel</button>
       <button onclick="Competitions._deleteSeason('${id}', '${name}')"
         class="px-5 py-2 rounded-xl text-white text-sm font-semibold"
         style="background:#e63946;">Delete Season</button>`,
      'max-w-md'
    );
  },

  async _deleteSeason(id, name) {
    try {
      const success = await DB.delete('seasons', id);
      if (success) {
        Toast.success(`Season "${name}" deleted.`);
        Modal.close();
        await this._loadAll();
      } else {
        Toast.error('Failed to delete season.');
      }
    } catch (_) {
      Toast.error('Network error. Please try again.');
    }
  },

  // ── Season Status Toggle (Ongoing ↔ Completed) ────────────
  openSeasonStatusModal(id, name, currentStatus) {
    const isCompleted = currentStatus === 'completed';
    const title = isCompleted ? `Reactivate ${name}` : `Complete ${name}`;
    const iconColor = isCompleted ? '#2dc653' : '#64748b';

    Modal.show(title, `
      <div class="text-center py-4">
        <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style="background:${isCompleted ? 'rgba(45,198,83,0.12)' : 'rgba(100,116,139,0.12)'};">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <p class="text-white font-bold text-base mb-2">${isCompleted ? `Reactivate <span style="color:#2dc653">${name}</span>?` : `Mark <span style="color:#F6C945">${name}</span> as Completed?`}</p>
        <p class="text-slate-400 text-sm leading-relaxed mx-auto max-w-sm">
          ${isCompleted
            ? `This will <strong style="color:#fff">unfreeze</strong> the season and restore live data. All future changes to master records will be reflected again.`
            : `This will <strong style="color:#fff">freeze all data</strong> for this season — teams, schools, coaches, judges, students, and events will be captured as a permanent historical snapshot. Changes to master records will no longer affect this season's record.`
          }
        </p>
        ${!isCompleted ? `
        <div class="mt-4 text-xs text-amber-400/80 flex items-center justify-center gap-1.5 bg-amber-400/8 rounded-lg px-3 py-2 mx-auto max-w-xs border border-amber-400/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          This action can be reversed by reactivating the season
        </div>` : ''}
      </div>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition">Cancel</button>
       <button onclick="Competitions._setSeasonStatus('${id}', '${name}', '${isCompleted ? 'ongoing' : 'completed'}')"
         class="px-5 py-2 rounded-xl text-white text-sm font-semibold transition"
         style="background:${isCompleted ? '#2dc653' : '#475569'};">
         ${isCompleted ? '✓ Reactivate Season' : '🔒 Mark as Completed'}
       </button>`,
      'max-w-md'
    );
  },

  async _setSeasonStatus(id, name, newStatus) {
    const btn = document.querySelector('#modal-overlay button[onclick*="_setSeasonStatus"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Processing…'; btn.style.opacity = '0.7'; }

    try {
      const res = await DB._request('PUT', `/seasons/${id}/status`, { status: newStatus });
      if (!res || res.success === false) {
        Toast.error(res?.error || 'Failed to update season status.');
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        return;
      }
      Toast.success(newStatus === 'completed'
        ? `"${name}" has been completed and all data has been frozen.`
        : `"${name}" has been reactivated. Live data is now active.`
      );
      Modal.close();
      if (typeof DB.invalidateAll === 'function') DB.invalidateAll();
      await this._loadAll();
    } catch (err) {
      console.error('[Competitions] Set season status error:', err);
      Toast.error('Network error. Please try again.');
      if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
    }
  },

  // ── Add / Edit Competition Event Form ─────────────────────
  async openForm(id = null, presetSeason = null) {
    const [c, seasons] = await Promise.all([
      id ? DB.getById('competitions', id) : Promise.resolve(null),
      DB.getAll('seasons'),
    ]);
    const sorted        = [...seasons].sort((a, b) => (b.year || 0) - (a.year || 0));
    const currentSeason = c?.season || presetSeason || '';

    Modal.show(id ? 'Edit Competition Event' : 'Add Competition Event', `
      <form id="comp-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div class="md:col-span-2">
          <label class="form-label">Event Name <span style="color:#e63946">*</span></label>
          <input class="form-input" name="name" value="${Utils.esc(c?.name || '')}"
                 placeholder="e.g., WRO Philippines 2026 National Final" required>
        </div>

        <div>
          <label class="form-label">Season <span style="color:#e63946">*</span></label>
          <select class="form-input" name="season">
            <option value="">— Select Season —</option>
            ${sorted.map(s => `<option value="${s.name}" ${currentSeason === s.name ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="form-label">Theme</label>
          <input class="form-input" name="theme" value="${Utils.esc(c?.theme || '')}"
                 placeholder="e.g., Earth Allies">
        </div>

        <div class="md:col-span-2">
          <label class="form-label">Venue</label>
          <input class="form-input" name="venue" value="${Utils.esc(c?.venue || '')}"
                 placeholder="e.g., SMX Convention Center, Manila">
        </div>

        <div>
          <label class="form-label">Competition Date</label>
          <input class="form-input" type="date" name="date" value="${c?.date || ''}">
        </div>

        <div>
          <label class="form-label">Registration Deadline</label>
          <input class="form-input" type="date" name="registrationDeadline"
            value="${c?.registrationDeadline || c?.registration_deadline || ''}">
        </div>

        <div>
          <label class="form-label">Organizer</label>
          <input class="form-input" name="organizer"
            value="${Utils.esc(c?.organizer || 'WRO Philippines National Office')}">
        </div>

        <div>
          <label class="form-label">Status</label>
          <select class="form-input" name="status">
            ${['upcoming','ongoing','completed'].map(s =>
              `<option ${(c?.status || 'upcoming') === s ? 'selected' : ''}>${s}</option>`
            ).join('')}
          </select>
        </div>

      </form>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition">Cancel</button>
       <button onclick="Competitions._save('${id || ''}')"
         class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2">
         <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
           <path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'/>
           <polyline points='17 21 17 13 7 13 7 21'/><polyline points='7 3 7 8 15 8'/>
         </svg>
         Save Event
       </button>`,
      'max-w-2xl'
    );
  },

  async _save(id) {
    const form = document.getElementById('comp-form');
    if (!form) return;
    const data = Object.fromEntries(new FormData(form));

    if (!data.name?.trim()) { Toast.error('Event name is required.'); return; }
    if (!data.season)       { Toast.error('Please select a season.'); return; }

    if (id) {
      const existing    = await DB.getById('competitions', id);
      data.categories   = existing?.categories || [];
      await DB.update('competitions', id, data);
      Toast.success('Competition event updated!');
    } else {
      data.categories = [];
      await DB.insert('competitions', data);
      Toast.success('Competition event added!');
    }

    Modal.close();
    await this._loadAll();
  },

  confirmDelete(id) {
    Modal.confirm('Delete this competition event?', async () => {
      await DB.delete('competitions', id);
      Toast.success('Event deleted.');
      await Competitions._loadAll();
    });
  },

  // ── Detail View (Full Participants Modal) ─────────────────
  async viewDetail(id) {
    // Show loading modal immediately
    Modal.show('Loading…', `
      <div class="flex flex-col items-center justify-center py-12 gap-3">
        <div class="spinner" style="width:28px;height:28px;border-width:3px"></div>
        <span class="text-slate-500 text-sm">Fetching competition details…</span>
      </div>`, '', 'max-w-5xl');

    let data;
    try {
      data = await DB._request('GET', `/competitions/details/${id}`);
    } catch (_) { data = null; }

    if (!data || data.success === false) {
      Modal.show('Error', `<p class="text-red-400">Could not load competition details.</p>`, '', 'max-w-md');
      return;
    }

    const { competition: c, teams, schools, coaches, judges, students } = data;
    const tabs = [
      { key: 'teams',    label: 'Teams',    count: teams.length,    color: '#F6C945' },
      { key: 'schools',  label: 'Schools',  count: schools.length,  color: '#4f9cf9' },
      { key: 'coaches',  label: 'Coaches',  count: coaches.length,  color: '#2dc653' },
      { key: 'judges',   label: 'Judges',   count: judges.length,   color: '#a890f0' },
      { key: 'students', label: 'Students', count: students.length, color: '#e91e8c' },
    ];

    const _badge = (txt, color = '#F6C945') =>
      `<span style="display:inline-block;padding:2px 9px;border-radius:20px;font-size:10px;font-weight:700;background:${color}22;color:${color};border:1px solid ${color}44;white-space:nowrap">${txt}</span>`;

    const _statusBadge = v => {
      const m = { active:'#2dc653', inactive:'#e63946', registered:'#4f9cf9', confirmed:'#2dc653',
                  waitlisted:'#F6C945', withdrawn:'#e63946', paid:'#2dc653', partial:'#F6C945',
                  unpaid:'#e63946', pending:'#F6C945', qualified:'#2dc653', disqualified:'#e63946' };
      return _badge(v || '—', m[v] || '#F6C945');
    };

    const _row = (label, value) => value
      ? `<div class="flex gap-2 text-sm"><span class="text-slate-500 w-28 flex-shrink-0">${label}</span><span class="text-slate-200 min-w-0 break-words">${value}</span></div>`
      : '';

    const _empty = (msg = 'No records found.') =>
      `<div class="text-center py-8 text-slate-500 text-sm italic">${msg}</div>`;

    // ── Teams Tab ─────────────────────────────────────────────
    const teamsHTML = teams.length === 0 ? _empty('No teams registered for this season.') :
      teams.map(t => `
        <div class="glass-light rounded-xl p-4 space-y-3">
          <div class="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div class="font-bold text-white text-sm">${t.team_name}</div>
              <div class="text-xs text-slate-500 mt-0.5">${t.school_name || '—'}</div>
            </div>
            <div class="flex flex-wrap gap-1.5">
              ${_badge(t.category || 'No Category', '#F6C945')}
              ${_badge(t.age_group || '—', '#4f9cf9')}
              ${_statusBadge(t.registration_status)}
              ${_statusBadge(t.qualification_status)}
              ${_statusBadge(t.payment_status)}
            </div>
          </div>
          ${t.coach_name ? `<div class="text-xs text-slate-400 flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
            Coach: <span class="text-slate-300">${t.coach_name}</span>
            ${t.coach_mobile ? `· ${t.coach_mobile}` : ''}
          </div>` : ''}
          ${(t.members || []).length > 0 ? `
          <div class="border-t border-slate-700/40 pt-3">
            <div class="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-2">Members</div>
            <div class="grid grid-cols-1 gap-1.5">
              ${t.members.map(m => `
                <div class="flex items-center gap-2 text-xs">
                  <div class="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0" style="font-size:9px">${(m.full_name||'?')[0]}</div>
                  <span class="text-slate-200">${m.full_name}</span>
                  ${m.grade_level ? `<span class="text-slate-500">· ${m.grade_level}</span>` : ''}
                  ${m.student_school ? `<span class="text-slate-600">· ${m.student_school}</span>` : ''}
                </div>`).join('')}
            </div>
          </div>` : '<div class="text-xs text-slate-600 italic">No members assigned</div>'}
        </div>`).join('');

    // ── Schools Tab ────────────────────────────────────────────
    const schoolsHTML = schools.length === 0 ? _empty('No schools participating in this season.') :
      `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${schools.map(s => `
          <div class="glass-light rounded-xl p-4 space-y-1.5">
            <div class="font-bold text-white text-sm">${s.school_name}</div>
            ${_row('Type', s.school_type)}
            ${_row('City', s.city)}
            ${_row('Region', s.region)}
            ${_row('Address', s.address)}
            ${_row('Contact', s.contact_number)}
            ${_row('Email', s.email)}
            ${_row('Head', s.school_head)}
            ${_row('Coordinator', s.robotics_coordinator)}
          </div>`).join('')}
      </div>`;

    // ── Coaches Tab ────────────────────────────────────────────
    const coachesHTML = coaches.length === 0 ? _empty('No coaches assigned for this season.') :
      `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${coaches.map(c => `
          <div class="glass-light rounded-xl p-4 space-y-1.5">
            <div class="flex items-start justify-between">
              <div class="font-bold text-white text-sm">${c.full_name}</div>
              ${_badge(c.position || 'Coach', '#2dc653')}
            </div>
            ${_row('School', c.school_name)}
            ${_row('Mobile', c.mobile)}
            ${_row('Email', c.email)}
          </div>`).join('')}
      </div>`;

    // ── Judges Tab ─────────────────────────────────────────────
    const judgesHTML = judges.length === 0 ? _empty('No judges assigned for this season.') :
      `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${judges.map(j => `
          <div class="glass-light rounded-xl p-4 space-y-1.5">
            <div class="flex items-start justify-between">
              <div class="font-bold text-white text-sm">${j.full_name}</div>
              ${_statusBadge(j.status)}
            </div>
            ${_row('Category', j.judging_category ? j.judging_category.split(',').map(c => _badge(c.trim(), '#a890f0')).join(' ') : '—')}
            ${_row('Gender', j.gender)}
            ${_row('Contact No.', j.contact_number)}
            ${_row('Email', j.email)}
          </div>`).join('')}
      </div>`;

    // ── Students Tab ───────────────────────────────────────────
    const studentsHTML = students.length === 0 ? _empty('No students enrolled for this season.') : `
      <div class="overflow-x-auto rounded-xl">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:rgba(22,32,56,0.9)">
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:.05em">Name</th>
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:.05em">Team</th>
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:.05em">School</th>
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:.05em">Grade</th>
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:.05em">Age</th>
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:.05em">Gender</th>
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:.05em">Consent</th>
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:.05em">Email</th>
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:.05em">Parent</th>
            </tr>
          </thead>
          <tbody>
            ${students.map((s, i) => `
              <tr style="border-top:1px solid rgba(100,116,139,0.12);background:${i%2===0?'rgba(15,23,42,0.2)':'transparent'}">
                <td style="padding:9px 12px;color:#e2e8f0;font-weight:500">${s.full_name}</td>
                <td style="padding:9px 12px;color:#94a3b8">${s.team_name || '—'}</td>
                <td style="padding:9px 12px;color:#94a3b8">${s.school_name || '—'}</td>
                <td style="padding:9px 12px;color:#94a3b8">${s.grade_level || '—'}</td>
                <td style="padding:9px 12px;color:#94a3b8">${s.age || '—'}</td>
                <td style="padding:9px 12px;color:#94a3b8">${s.gender || '—'}</td>
                <td style="padding:9px 12px">${s.consent_signed ? _badge('Signed','#2dc653') : _badge('Pending','#e63946')}</td>
                <td style="padding:9px 12px;color:#94a3b8">${s.personal_email || '—'}</td>
                <td style="padding:9px 12px;color:#94a3b8">${s.parent_name || '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    const tabContents = { teams: teamsHTML, schools: schoolsHTML, coaches: coachesHTML, judges: judgesHTML, students: studentsHTML };

    const modalBody = `
      <div class="space-y-4" id="comp-detail-root">

        <!-- Competition Header Info -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 glass-light rounded-xl text-sm">
          <div><span class="text-slate-500">Season:</span> <span class="badge badge-purple ml-1">${c.season || '—'}</span></div>
          <div><span class="text-slate-500">Date:</span> <span class="text-slate-200 ml-1">${Utils.formatDate(c.date)}</span></div>
          <div><span class="text-slate-500">Status:</span> <span class="ml-1">${Utils.statusBadge(c.status)}</span></div>
          <div class="col-span-2 md:col-span-2"><span class="text-slate-500">Venue:</span> <span class="text-slate-200 ml-1">${c.venue || '—'}</span></div>
          <div><span class="text-slate-500">Organizer:</span> <span class="text-slate-200 ml-1">${c.organizer || '—'}</span></div>
        </div>

        <!-- Summary Counts -->
        <div class="grid grid-cols-5 gap-2">
          ${tabs.map(t => `
            <div class="glass-light rounded-xl p-3 text-center">
              <div class="text-xl font-extrabold" style="color:${t.color}">${t.count}</div>
              <div class="text-xs text-slate-500 mt-0.5">${t.label}</div>
            </div>`).join('')}
        </div>

        <!-- Tab Bar -->
        <div class="flex gap-1 border-b border-slate-700/50 pb-0" id="comp-tab-bar">
          ${tabs.map((t, i) => `
            <button id="comp-tab-${t.key}"
              onclick="Competitions._switchTab('${t.key}')"
              style="padding:8px 14px;border-radius:8px 8px 0 0;font-size:12px;font-weight:600;border:none;cursor:pointer;transition:all .2s;
                     background:${i===0?'rgba(246,201,69,0.15)':'transparent'};
                     color:${i===0?t.color:'#64748b'};
                     border-bottom:${i===0?`2px solid ${t.color}`:'2px solid transparent'}">
              ${t.label}
              <span style="margin-left:5px;font-size:10px;background:rgba(100,116,139,0.2);border-radius:10px;padding:1px 6px">${t.count}</span>
            </button>`).join('')}
        </div>

        <!-- Tab Content -->
        <div id="comp-tab-content" class="space-y-3 max-h-96 overflow-y-auto pr-1">
          ${teamsHTML}
        </div>
      </div>`;

    // Store tab data for switching
    Competitions._detailTabs = tabContents;
    Competitions._detailTabColors = Object.fromEntries(tabs.map(t => [t.key, t.color]));

    Modal.show(c.name, modalBody,
      AUTH.can('competitions.write')
        ? `<button onclick="Competitions.openForm('${c.id}')" class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
             Edit Event
           </button>`
        : '',
      'max-w-5xl'
    );
  },

  // ── Tab Switcher ───────────────────────────────────────────
  _switchTab(key) {
    const content = document.getElementById('comp-tab-content');
    if (!content || !Competitions._detailTabs) return;
    content.innerHTML = Competitions._detailTabs[key] || '';

    // Update tab button styles
    const colors = Competitions._detailTabColors || {};
    ['teams','schools','coaches','judges','students'].forEach(k => {
      const btn = document.getElementById(`comp-tab-${k}`);
      if (!btn) return;
      const isActive = k === key;
      const color    = colors[k] || '#F6C945';
      btn.style.background   = isActive ? `${color}22` : 'transparent';
      btn.style.color        = isActive ? color : '#64748b';
      btn.style.borderBottom = isActive ? `2px solid ${color}` : '2px solid transparent';
    });
  },


  // ── Season Detail Full-Screen Modal ──────────────────────────
  async viewSeasonDetail(seasonName) {
    // Show full-screen overlay with loading state immediately
    this._showSeasonOverlay(seasonName, null);

    let data;
    try {
      data = await DB._request('GET', `/competitions/season-details?season=${encodeURIComponent(seasonName)}`);
    } catch (_) { data = null; }

    if (!data || data.success === false) {
      const bodyEl = document.getElementById('season-overlay-body');
      if (bodyEl) bodyEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:12px;"><div style="font-size:3rem;opacity:0.4;">⚠️</div><div style="color:#e63946;font-weight:700;font-size:15px;">Could not load season details</div><div style="color:#475569;font-size:13px;">Please try again later</div></div>`;
      return;
    }

    this._showSeasonOverlay(seasonName, data);
  },

  _showSeasonOverlay(seasonName, data) {
    document.getElementById('season-fullscreen-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'season-fullscreen-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(4,9,20,0.97);display:flex;flex-direction:column;overflow:hidden;opacity:0;transition:opacity 0.22s ease;';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
    this._setupOverlayEscape();

    if (!data) {
      overlay.innerHTML = `
        <div style="flex-shrink:0;background:rgba(4,9,20,0.99);border-bottom:1px solid rgba(246,201,69,0.15);padding:16px 24px;display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:20px;font-weight:900;color:#fff;">${seasonName}</div>
          <button onclick="Competitions._closeSeasonOverlay()" style="background:rgba(100,116,139,0.2);border:none;color:#94a3b8;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:22px;display:flex;align-items:center;justify-content:center;">&times;</button>
        </div>
        <div id="season-overlay-body" style="flex:1;display:flex;align-items:center;justify-content:center;">
          <div style="text-align:center;">
            <div style="width:40px;height:40px;border-radius:50%;border:3px solid rgba(246,201,69,0.3);border-top-color:#F6C945;animation:spin 0.8s linear infinite;margin:0 auto 14px;"></div>
            <div style="color:#475569;font-size:13px;">Loading season participants…</div>
          </div>
        </div>`;
      return;
    }

    const { teams, schools, coaches, judges, students, events, awards, payments, _frozen, _frozen_at } = data;

    const tabs = [
      { key: 'schools',  label: 'Schools',  count: schools.length,  color: '#4f9cf9', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
      { key: 'coaches',  label: 'Coaches',  count: coaches.length,  color: '#2dc653', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
      { key: 'students', label: 'Students', count: students.length, color: '#e91e8c', icon: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5"/>' },
      { key: 'teams',    label: 'Teams',    count: teams.length,    color: '#F6C945', icon: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 17h6M17 14v6"/>' },
      { key: 'judges',   label: 'Judges',   count: judges.length,   color: '#a890f0', icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
      { key: 'events',   label: 'Events',   count: events.length,   color: '#fb923c', icon: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>' },
      { key: 'awards',   label: 'Awards',   count: (awards||[]).length, color: '#F6C945', icon: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>' },
    ];

    const _badge = (txt, color = '#F6C945') =>
      `<span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:20px;font-size:10px;font-weight:700;background:${color}22;color:${color};border:1px solid ${color}44;white-space:nowrap;">${txt}</span>`;

    const _statusBadge = v => {
      const m = { active:'#2dc653', inactive:'#e63946', upcoming:'#4f9cf9', ongoing:'#F6C945',
                  completed:'#2dc653', cancelled:'#e63946', registered:'#4f9cf9',
                  confirmed:'#2dc653', waitlisted:'#F6C945', withdrawn:'#e63946',
                  paid:'#2dc653', partial:'#F6C945', unpaid:'#e63946',
                  pending:'#F6C945', qualified:'#2dc653', disqualified:'#e63946' };
      return _badge(v || '—', m[v] || '#F6C945');
    };

    const _avatar = (name, color = '#F6C945', size = 38) =>
      `<div style="width:${size}px;height:${size}px;border-radius:${Math.round(size/3.5)}px;background:${color}22;border:1px solid ${color}44;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size/2.7)}px;font-weight:900;color:${color};flex-shrink:0;">${(name||'?')[0].toUpperCase()}</div>`;

    const _field = (label, val) => val
      ? `<div style="display:flex;gap:8px;font-size:12px;line-height:1.6;"><span style="color:#475569;min-width:120px;flex-shrink:0;font-weight:600;">${label}</span><span style="color:#cbd5e1;word-break:break-word;">${val}</span></div>`
      : '';

    const _empty = msg =>
      `<div style="text-align:center;padding:3.5rem 1rem;color:#475569;font-size:13px;">
        <div style="font-size:2.5rem;margin-bottom:0.75rem;opacity:0.3;">📭</div>
        ${msg || 'No records yet.'}
      </div>`;

    // ── Events Tab ────────────────────────────────────────────
    const eventsHTML = events.length === 0 ? _empty('No competition events in this season yet.') :
      `<div style="display:flex;flex-direction:column;gap:10px;">
        ${events.map(e => `
          <div style="background:rgba(168,144,240,0.06);border:1px solid rgba(168,144,240,0.18);border-radius:14px;padding:14px 16px;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <div style="display:flex;align-items:center;gap:10px;">
                ${_avatar(e.name, '#a890f0')}
                <div>
                  <div style="font-weight:700;color:#f1f5f9;font-size:13px;">${e.name}</div>
                  <div style="font-size:11px;color:#64748b;margin-top:2px;">${e.venue || '—'} · ${Utils.formatDate(e.date)}</div>
                </div>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;">
                ${_statusBadge(e.status)}
                ${(e.categories || []).map(c => _badge(c, '#F6C945')).join('')}
              </div>
            </div>
          </div>`).join('')}
      </div>`;

    // ── Teams Tab ─────────────────────────────────────────────
    const teamsHTML = teams.length === 0 ? _empty('No teams registered for this season.') :
      `<div style="display:flex;flex-direction:column;gap:14px;">
        ${teams.map(t => {
          const memberSchools = [...new Set((t.members || []).map(m => m.student_school).filter(Boolean))];
          const displaySchool = memberSchools.length > 0 ? memberSchools.join(', ') : (t.school_name || '—');
          return `
          <div style="background:rgba(246,201,69,0.04);border:1px solid rgba(246,201,69,0.16);border-radius:16px;padding:18px;transition:border-color .2s;" onmouseover="this.style.borderColor='rgba(246,201,69,0.4)'" onmouseout="this.style.borderColor='rgba(246,201,69,0.16)'">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
              <div style="display:flex;align-items:center;gap:12px;">
                ${_avatar(t.team_name, '#F6C945', 44)}
                <div>
                  <div style="font-weight:800;color:#f1f5f9;font-size:14px;">${t.team_name}</div>
                  <div style="font-size:11px;color:#64748b;margin-top:2px;">${displaySchool}</div>
                </div>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:5px;">
                ${_badge(t.category || '—', '#F6C945')}
                ${_badge(t.age_group || '—', '#4f9cf9')}
                ${_statusBadge(t.registration_status)}
                ${_statusBadge(t.qualification_status)}
                ${_statusBadge(t.payment_status)}
              </div>
            </div>
            ${(t.coach_name || t.coach_mobile || t.coach_email) ? `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:4px;margin-bottom:${(t.members||[]).length>0?'14px':'0'};">
              ${_field('Coach', t.coach_name)}
              ${_field('Coach Mobile', t.coach_mobile)}
              ${_field('Coach Email', t.coach_email)}
            </div>` : ''}
            ${(t.members || []).length > 0 ? `
              <div style="border-top:1px solid rgba(246,201,69,0.12);padding-top:12px;">
                <div style="font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:.07em;font-weight:700;margin-bottom:9px;">Members (${t.members.length})</div>
                <div style="display:flex;flex-wrap:wrap;gap:7px;">
                  ${t.members.map(m => `
                    <div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:24px;padding:5px 12px 5px 6px;">
                      <div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,${m.gender==='Female'?'#ec4899,#f43f5e':'#6366f1,#8b5cf6'});display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:800;">${(m.full_name||'?')[0]}</div>
                      <span style="font-size:12px;color:#cbd5e1;font-weight:600;">${m.full_name}</span>
                      ${m.grade_level ? `<span style="font-size:10px;color:#475569;">· ${m.grade_level}</span>` : ''}
                      ${m.student_school ? `<span style="font-size:10px;color:#374151;">· ${m.student_school}</span>` : ''}
                    </div>`).join('')}
                </div>
              </div>` : ''}
          </div>`;
        }).join('')}
      </div>`;

    // ── Schools Tab ────────────────────────────────────────────
    const schoolsHTML = schools.length === 0 ? _empty('No schools participating in this season.') :
      `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">
        ${schools.map(s => `
          <div style="background:rgba(79,156,249,0.05);border:1px solid rgba(79,156,249,0.18);border-radius:16px;padding:18px;transition:border-color .2s;" onmouseover="this.style.borderColor='rgba(79,156,249,0.45)'" onmouseout="this.style.borderColor='rgba(79,156,249,0.18)'">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
              ${_avatar(s.school_name, '#4f9cf9', 42)}
              <div>
                <div style="font-weight:800;color:#f1f5f9;font-size:13px;line-height:1.3;">${s.school_name||'—'}</div>
                ${s.school_type ? `<div style="font-size:11px;color:#4f9cf9;margin-top:3px;font-weight:600;">${s.school_type}</div>` : ''}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${_field('Type / Level', s.school_type)}
              ${_field('Region', s.region)}
              ${_field('City', s.city)}
              ${_field('Address', s.address)}
              ${_field('School Head', s.school_head)}
              ${_field('Coordinator', s.robotics_coordinator)}
              ${_field('Email', s.email)}
              ${_field('Contact No.', s.contact_number)}
              ${s.status ? `<div style="display:flex;gap:8px;font-size:12px;line-height:1.6;"><span style="color:#475569;min-width:120px;flex-shrink:0;font-weight:600;">Status</span><span>${_statusBadge(s.status)}</span></div>` : ''}
            </div>
          </div>`).join('')}
      </div>`;

    // ── Coaches Tab ────────────────────────────────────────────
    const coachesHTML = coaches.length === 0 ? _empty('No coaches assigned for this season.') :
      `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;">
        ${coaches.map(c => `
          <div style="background:rgba(45,198,83,0.04);border:1px solid rgba(45,198,83,0.18);border-radius:16px;padding:18px;transition:border-color .2s;" onmouseover="this.style.borderColor='rgba(45,198,83,0.45)'" onmouseout="this.style.borderColor='rgba(45,198,83,0.18)'">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
              ${_avatar(c.full_name, '#2dc653', 42)}
              <div>
                <div style="font-weight:800;color:#f1f5f9;font-size:13px;">${c.full_name||'—'}</div>
                <div style="margin-top:5px;">${_badge(c.position || 'Coach', '#2dc653')}</div>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${_field('School', c.school_name)}
              ${_field('Gender', c.gender)}
              ${c.birthday ? _field('Birthday', (() => { try { return new Date(c.birthday).toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'}); } catch(e){ return c.birthday; } })()) : ''}
              ${_field('Mobile', c.mobile)}
              ${_field('Email', c.email)}
              ${c.status ? `<div style="display:flex;gap:8px;font-size:12px;line-height:1.6;"><span style="color:#475569;min-width:120px;flex-shrink:0;font-weight:600;">Status</span><span>${_statusBadge(c.status)}</span></div>` : ''}
            </div>
          </div>`).join('')}
      </div>`;

    // ── Judges Tab ─────────────────────────────────────────────
    const judgesHTML = judges.length === 0 ? _empty('No judges assigned for this season.') :
      `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;">
        ${judges.map(j => `
          <div style="background:rgba(168,144,240,0.04);border:1px solid rgba(168,144,240,0.18);border-radius:16px;padding:18px;transition:border-color .2s;" onmouseover="this.style.borderColor='rgba(168,144,240,0.45)'" onmouseout="this.style.borderColor='rgba(168,144,240,0.18)'">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px;">
              <div style="display:flex;align-items:center;gap:10px;">
                ${_avatar(j.full_name, '#a890f0', 42)}
                <div style="font-weight:800;color:#f1f5f9;font-size:13px;">${j.full_name||'—'}</div>
              </div>
              ${_statusBadge(j.status)}
            </div>
            ${j.judging_category ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">${j.judging_category.split(',').map(c => _badge(c.trim(), '#a890f0')).join('')}</div>` : ''}
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${_field('Gender', j.gender)}
              ${_field('Contact No.', j.contact_number)}
              ${_field('Email', j.email)}
            </div>
          </div>`).join('')}
      </div>`;

    // ── Students Tab ───────────────────────────────────────────
    const studentsHTML = students.length === 0 ? _empty('No students enrolled for this season.') : `
      <div style="overflow-x:auto;border-radius:14px;border:1px solid rgba(100,116,139,0.15);">
        <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:1100px;">
          <thead>
            <tr style="background:rgba(4,9,20,0.9);">
              ${['Name','Gender','Age','Grade','School','Parent','Parent Email','Parent Contact','Personal Email','Consent','Teams Participated'].map(h =>
                `<th style="padding:12px 14px;text-align:left;color:#475569;font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:.05em;white-space:nowrap;border-bottom:1px solid rgba(100,116,139,0.15);">${h}</th>`
              ).join('')}
            </tr>
          </thead>
          <tbody>
            ${students.map((s, i) => `
              <tr style="border-bottom:1px solid rgba(100,116,139,0.08);background:${i%2===0?'rgba(15,23,42,0.25)':'transparent'};transition:background .15s;" onmouseover="this.style.background='rgba(233,30,140,0.04)'" onmouseout="this.style.background='${i%2===0?'rgba(15,23,42,0.25)':'transparent'}'">
                <td style="padding:10px 14px;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,${s.gender==='Female'?'#ec4899,#f43f5e':'#6366f1,#8b5cf6'});display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;flex-shrink:0;">${(s.full_name||'?')[0]}</div>
                    <span style="color:#e2e8f0;font-weight:700;white-space:nowrap;">${s.full_name}</span>
                  </div>
                </td>
                <td style="padding:10px 14px;color:#94a3b8;white-space:nowrap;">${s.gender||'—'}</td>
                <td style="padding:10px 14px;color:#94a3b8;">${s.age||'—'}</td>
                <td style="padding:10px 14px;color:#94a3b8;white-space:nowrap;">${s.grade_level||'—'}</td>
                <td style="padding:10px 14px;color:#94a3b8;max-width:160px;">${s.school_name||'—'}</td>
                <td style="padding:10px 14px;color:#94a3b8;white-space:nowrap;">${s.parent_name||'—'}</td>
                <td style="padding:10px 14px;color:#94a3b8;">${s.parent_email||'—'}</td>
                <td style="padding:10px 14px;color:#94a3b8;white-space:nowrap;">${s.parent_contact||'—'}</td>
                <td style="padding:10px 14px;color:#94a3b8;">${s.personal_email||'—'}</td>
                <td style="padding:10px 14px;">${s.consent_signed ? _badge('Signed','#2dc653') : _badge('Pending','#e63946')}</td>
                <td style="padding:10px 14px;color:#94a3b8;white-space:nowrap;">${s.team_name||'—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    // ── Awards Tab ────────────────────────────────────────────
    const awardsHTML = !awards || awards.length === 0
      ? _empty('No awards recorded for this season.')
      : `<div style="display:flex;flex-direction:column;gap:10px;">
          ${(awards || []).map((a, i) => `
            <div style="display:flex;align-items:flex-start;gap:14px;background:rgba(246,201,69,0.05);border:1px solid rgba(246,201,69,0.15);border-radius:14px;padding:14px 18px;">
              <div style="min-width:32px;height:32px;border-radius:50%;background:rgba(246,201,69,0.15);border:1px solid rgba(246,201,69,0.3);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#F6C945;flex-shrink:0;">${a.placement || (i+1)}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:800;color:#f1f5f9;font-size:14px;">${a.title || '—'}</div>
                <div style="font-size:11px;color:#64748b;margin-top:3px;display:flex;flex-wrap:wrap;gap:8px;">
                  ${a.team_name   ? `<span>🏆 ${a.team_name}</span>` : ''}
                  ${a.school_name ? `<span>🏫 ${a.school_name}</span>` : ''}
                  ${a.category    ? `<span>🏷 ${a.category}</span>` : ''}
                  ${a.award_date  ? `<span>📅 ${new Date(a.award_date).toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'})}</span>` : ''}
                </div>
                ${a.awarded_to ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;">Awarded to: ${a.awarded_to}</div>` : ''}
                ${a.notes ? `<div style="font-size:11px;color:#475569;margin-top:2px;font-style:italic;">${a.notes}</div>` : ''}
              </div>
            </div>`).join('')}
        </div>`;

    const tabContents = { schools:schoolsHTML, coaches:coachesHTML, students:studentsHTML,
                          teams:teamsHTML, judges:judgesHTML, events:eventsHTML,
                          awards:awardsHTML };

    Competitions._seasonTabs       = tabContents;
    Competitions._seasonTabColors  = Object.fromEntries(tabs.map(t => [t.key, t.color]));
    Competitions._seasonTabKeys    = tabs.map(t => t.key);
    Competitions._seasonExportData = { seasonName, teams, schools, coaches, judges, students, events,
                                       awards: awards || [], payments: payments || [] };

    const firstTab = 'schools';

    overlay.innerHTML = `
      <!-- Fixed Header -->
      <div style="flex-shrink:0;background:rgba(4,9,20,0.99);border-bottom:1px solid rgba(246,201,69,0.15);">
        <!-- Top bar: title + buttons -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 24px;gap:16px;">
          <div style="display:flex;align-items:center;gap:14px;min-width:0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F6C945" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
            <div style="min-width:0;">
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                <div style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${seasonName}</div>
                ${_frozen
                  ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:rgba(100,116,139,0.18);color:#94a3b8;border:1px solid rgba(100,116,139,0.30);white-space:nowrap;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Historical Record
                    </span>`
                  : `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:rgba(45,198,83,0.12);color:#2dc653;border:1px solid rgba(45,198,83,0.28);white-space:nowrap;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="6"/></svg>
                      Live Data
                    </span>`}
              </div>
              <div style="font-size:11px;color:#475569;margin-top:3px;">
                ${_frozen
                  ? `Frozen on ${_frozen_at ? new Date(_frozen_at).toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}) : 'unknown date'} — changes to master records no longer affect this season`
                  : 'Ongoing season — displaying live data from master records'}
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
            <button onclick="Competitions._exportSeasonToExcel()"
              style="display:flex;align-items:center;gap:7px;padding:8px 16px;border-radius:10px;border:1px solid rgba(45,198,83,0.3);background:rgba(45,198,83,0.1);color:#2dc653;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;white-space:nowrap;"
              onmouseover="this.style.background='rgba(45,198,83,0.22)'" onmouseout="this.style.background='rgba(45,198,83,0.1)'">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export Excel
            </button>
            <button onclick="Competitions._closeSeasonOverlay()"
              style="width:38px;height:38px;border-radius:50%;border:none;background:rgba(100,116,139,0.2);color:#94a3b8;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;line-height:1;"
              title="Close (Esc)" onmouseover="this.style.background='rgba(230,57,70,0.2)';this.style.color='#e63946';" onmouseout="this.style.background='rgba(100,116,139,0.2)';this.style.color='#94a3b8';">&times;</button>
          </div>
        </div>
        <!-- Stat cards -->
        <div style="display:flex;gap:8px;padding:0 24px 14px;overflow-x:auto;scrollbar-width:none;">
          ${tabs.map(t => `
            <div onclick="Competitions._switchSeasonTab('${t.key}')" id="season-stat-${t.key}"
              style="display:flex;align-items:center;gap:10px;padding:10px 18px;border-radius:12px;border:1px solid ${t.color}28;background:${t.color}0d;cursor:pointer;transition:all .2s;white-space:nowrap;flex-shrink:0;"
              onmouseover="this.style.background='${t.color}20';this.style.borderColor='${t.color}55';" onmouseout="Competitions._statHoverOut('${t.key}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${t.color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg>
              <div>
                <div style="font-size:20px;font-weight:900;color:${t.color};line-height:1;">${t.count}</div>
                <div style="font-size:10px;color:#64748b;font-weight:600;margin-top:1px;">${t.label}</div>
              </div>
            </div>`).join('')}
        </div>
        <!-- Tab bar -->
        <div style="display:flex;gap:2px;padding:0 24px;overflow-x:auto;scrollbar-width:none;border-top:1px solid rgba(100,116,139,0.1);" id="season-tab-bar">
          ${tabs.map((t, i) => `
            <button id="season-tab-${t.key}" onclick="Competitions._switchSeasonTab('${t.key}')"
              style="display:flex;align-items:center;gap:6px;padding:12px 16px;border-radius:10px 10px 0 0;font-size:12px;font-weight:700;border:none;cursor:pointer;transition:all .2s;white-space:nowrap;outline:none;
                     background:${i===0?`${t.color}18`:'transparent'};color:${i===0?t.color:'#475569'};border-bottom:${i===0?`2px solid ${t.color}`:'2px solid transparent'}">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg>
              ${t.label}
              <span style="margin-left:2px;font-size:10px;background:rgba(100,116,139,0.15);border-radius:10px;padding:1px 6px;">${t.count}</span>
            </button>`).join('')}
        </div>
      </div>
      <!-- Scrollable tab content -->
      <div id="season-tab-content" style="flex:1;overflow-y:auto;padding:24px;scrollbar-width:thin;scrollbar-color:rgba(246,201,69,0.3) transparent;">
        ${tabContents[firstTab]}
      </div>`;
  },

  // ── Season Overlay Helpers ────────────────────────────────────
  _statHoverOut(key) {
    const color = (Competitions._seasonTabColors || {})[key] || '#F6C945';
    const el = document.getElementById(`season-stat-${key}`);
    if (el) { el.style.background = `${color}0d`; el.style.borderColor = `${color}28`; }
  },

  _closeSeasonOverlay() {
    const overlay = document.getElementById('season-fullscreen-overlay');
    if (!overlay) return;
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 220);
    if (this._overlayEscapeHandler) {
      document.removeEventListener('keydown', this._overlayEscapeHandler);
      this._overlayEscapeHandler = null;
    }
  },

  _setupOverlayEscape() {
    if (this._overlayEscapeHandler) {
      document.removeEventListener('keydown', this._overlayEscapeHandler);
    }
    this._overlayEscapeHandler = (e) => {
      if (e.key === 'Escape') Competitions._closeSeasonOverlay();
    };
    document.addEventListener('keydown', this._overlayEscapeHandler);
  },

  // ── Season Tab Switcher ────────────────────────────────────
  _switchSeasonTab(key) {
    const content = document.getElementById('season-tab-content');
    if (!content || !Competitions._seasonTabs) return;
    content.innerHTML = Competitions._seasonTabs[key] || '';
    content.scrollTop = 0;
    (Competitions._seasonTabKeys || []).forEach(k => {
      const btn    = document.getElementById(`season-tab-${k}`);
      const statEl = document.getElementById(`season-stat-${k}`);
      if (!btn) return;
      const color    = (Competitions._seasonTabColors || {})[k] || '#F6C945';
      const isActive = k === key;
      btn.style.background   = isActive ? `${color}22` : 'transparent';
      btn.style.color        = isActive ? color : '#475569';
      btn.style.borderBottom = isActive ? `2px solid ${color}` : '2px solid transparent';
      if (statEl) {
        statEl.style.background  = isActive ? `${color}20` : `${color}0d`;
        statEl.style.borderColor = isActive ? `${color}55` : `${color}28`;
      }
    });
  },

  // ── Export Season to Excel (.xlsx) ────────────────────────
  _exportSeasonToExcel() {
    const d = Competitions._seasonExportData;
    if (!d) { Toast.error('No season data to export.'); return; }

    if (typeof XLSX === 'undefined') {
      Toast.error('Excel library not loaded. Please refresh the page and try again.');
      return;
    }

    const wb = XLSX.utils.book_new();
    const season = d.seasonName;

    // ── Helper: add a sheet from an array of row objects ──
    const addSheet = (name, rows) => {
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'No records' }]);
      // Style header row (bold) — SheetJS CE supports basic cell metadata
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
        if (cell) cell.s = { font: { bold: true } };
      }
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    // ── Sheet 1: Events ───────────────────────────────────
    addSheet('Events', d.events.map(e => ({
      'Event Name':  e.name,
      'Season':      season,
      'Date':        e.date ? new Date(e.date).toLocaleDateString() : '',
      'Venue':       e.venue        || '',
      'Status':      e.status       || '',
      'Categories':  (e.categories  || []).join(', '),
    })));

    // ── Sheet 2: Teams ────────────────────────────────────
    addSheet('Teams', d.teams.map(t => ({
      'Team Name':            t.team_name,
      'Season':               season,
      'Category':             t.category             || '',
      'Age Group':            t.age_group            || '',
      'School':               t.school_name          || '',
      'Coach':                t.coach_name           || '',
      'Coach Mobile':         t.coach_mobile         || '',
      'Registration Status':  t.registration_status  || '',
      'Qualification Status': t.qualification_status || '',
      'Payment Status':       t.payment_status       || '',
      'Members': (t.members || []).map(m => m.full_name).join(', '),
    })));

    // ── Sheet 3: Schools ──────────────────────────────────
    addSheet('Schools', d.schools.map(s => ({
      'School Name':         s.school_name          || '',
      'Type':                s.school_type          || '',
      'City':                s.city                 || '',
      'Region':              s.region               || '',
      'Address':             s.address              || '',
      'Contact Number':      s.contact_number       || '',
      'Email':               s.email                || '',
      'School Head':         s.school_head          || '',
      'Robotics Coordinator':s.robotics_coordinator || '',
    })));

    // ── Sheet 4: Coaches ──────────────────────────────────
    addSheet('Coaches', d.coaches.map(c => ({
      'Coach Name':     c.full_name       || '',
      'School':         c.school_name     || '',
      'Position':       c.position        || '',
      'Mobile':         c.mobile          || '',
      'Email':          c.email           || '',
    })));

    // ── Sheet 5: Judges ───────────────────────────────────
    addSheet('Judges', d.judges.map(j => ({
      'Judge Name':      j.full_name        || '',
      'Judging Category':j.judging_category || '',
      'Gender':          j.gender           || '',
      'Contact Number':  j.contact_number   || '',
      'Status':          j.status           || '',
    })));

    // ── Sheet 6: Students ─────────────────────────────────
    addSheet('Students', d.students.map(s => ({
      'Full Name':    s.full_name    || '',
      'Team':         s.team_name   || '',
      'School':       s.school_name || '',
      'Grade Level':  s.grade_level || '',
      'Age':          s.age         ?? '',
      'Gender':       s.gender      || '',
      'Shirt Size':   s.shirt_size  || '',
      'Consent Signed': s.consent_signed ? 'Yes' : 'No',
    })));

    // ── Sheet 7: Awards ───────────────────────────────────
    addSheet('Awards', (d.awards || []).map(a => ({
      'Title':       a.title       || '',
      'Placement':   a.placement   || '',
      'Team':        a.team_name   || '',
      'School':      a.school_name || '',
      'Category':    a.category    || '',
      'Awarded To':  a.awarded_to  || '',
      'Award Date':  a.award_date ? new Date(a.award_date).toLocaleDateString() : '',
      'Notes':       a.notes       || '',
    })));

    // ── Sheet 8: Payments ─────────────────────────────────
    addSheet('Payments', (d.payments || []).map(p => ({
      'Team':           p.team_name      || '',
      'Team Code':      p.team_code      || '',
      'School':         p.school_name    || '',
      'Payment Code':   p.payment_code   || '',
      'Amount':         p.amount         ?? '',
      'Balance':        p.balance        ?? '',
      'Status':         p.payment_status || '',
      'Payment Date':   p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '',
      'OR Number':      p.or_number      || '',
      'Method':         p.payment_method || '',
      'Notes':          p.notes          || '',
    })));

    // ── Download ──────────────────────────────────────────
    const safeName = season.replace(/[^a-zA-Z0-9_\- ]/g, '_');
    XLSX.writeFile(wb, `WRO_${safeName}_Export.xlsx`);
    Toast.success(`Excel file for ${season} downloaded!`);
  },

  async exportCSV() {
    const rows = (await DB.getAll('competitions')).filter(c => !c.isDeleted && !c.is_deleted);
    Utils.downloadCSV('WRO_Competitions.csv',
      ['ID', 'Name', 'Season', 'Theme', 'Date', 'Venue', 'Organizer', 'Status'],
      rows.map(c => [c.id, c.name, c.season, c.theme, c.date, c.venue, c.organizer, c.status])
    );
    Toast.success('Competitions exported to CSV!');
  },
};

window.Competitions = Competitions;
