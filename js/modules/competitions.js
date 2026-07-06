// ============================================================
// Module 5 – Competition Management
// ============================================================

const Competitions = {
  _page: 1, _perPage: 10, _search: '',

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-view space-y-6">
        <div class="flex flex-wrap items-center gap-3">
          <div class="search-box flex-1 min-w-56">
            <span class="search-icon" style="display:flex;align-items:center"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input id="comp-search" type="text" class="form-input pl-10" placeholder="Search competitions..." oninput="Competitions._onSearch(this.value)">
          </div>
          ${AUTH.can('competitions.write') ? `
          <button onclick="Competitions.openForm()" class="btn-primary text-white px-4 py-2 rounded-xl text-sm font-semibold">+ New Competition</button>` : ''}
          <button onclick="Competitions.exportCSV()" class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button>
        </div>

        <!-- Competition Cards Grid -->
        <div id="comp-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6"></div>

        <!-- Table View -->
        <div class="glass rounded-2xl overflow-hidden">
          <div class="p-4 border-b border-slate-700/50">
            <h3 class="text-sm font-semibold text-slate-300">All Competitions</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr><th>Competition</th><th>Season</th><th>Date</th><th>Venue</th><th>Teams</th><th>Schools</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody id="comp-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>`;
    await this._renderCards();
    await this._loadTable();
  },

  async _renderCards() {
    const comps = (await DB.getAll('competitions')).filter(c => !c.isDeleted);
    const grid  = document.getElementById('comp-grid');
    if (!grid) return;
    grid.innerHTML = comps.map(c => `
      <div class="glass rounded-2xl p-6 cursor-pointer hover:border-indigo-500/40 transition-all border border-slate-700/30" onclick="Competitions.viewDetail('${c.id}')">
        <div class="flex items-start justify-between mb-4">
          <div>
            <div class="text-xs text-indigo-400 font-semibold mb-1">${c.season}</div>
            <div class="text-lg font-bold text-white leading-tight">${c.name}</div>
            <div class="text-sm text-slate-400 mt-1">${c.theme}</div>
          </div>
          ${Utils.statusBadge(c.status)}
        </div>
        <div class="text-sm text-slate-400 mb-4 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${c.venue}</div>
        <div class="text-sm text-slate-400 mb-4 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${Utils.formatDate(c.date)}</div>
        <div class="grid grid-cols-4 gap-2">
          ${[
            { label:'Teams',   value: c.numberOfTeams   || '—' },
            { label:'Schools', value: c.numberOfSchools || '—' },
            { label:'Coaches', value: c.numberOfCoaches || '—' },
            { label:'Students',value: c.numberOfStudents|| '—' },
          ].map(s => `<div class="glass-light rounded-lg p-2 text-center">
            <div class="text-lg font-bold text-white">${s.value}</div>
            <div class="text-xs text-slate-500">${s.label}</div>
          </div>`).join('')}
        </div>
      </div>`).join('') || '<div class="empty-state col-span-2"><div style="opacity:0.3;display:flex;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a89060" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg></div><div class="text-slate-400 mt-2">No competitions yet</div></div>';
  },

  async _loadTable() {
    const rows  = (await DB.getAll('competitions')).filter(c => !c.isDeleted);
    const tbody = document.getElementById('comp-tbody');
    if (!tbody) return;
    tbody.innerHTML = rows.map(c => `
      <tr class="table-row cursor-pointer" onclick="Competitions.viewDetail('${c.id}')">
        <td>
          <div class="font-semibold text-white text-sm">${c.name}</div>
          <div class="text-xs text-slate-500">${c.theme}</div>
        </td>
        <td><span class="badge badge-purple">${c.season}</span></td>
        <td class="text-sm text-slate-300">${Utils.formatDate(c.date)}</td>
        <td class="text-sm text-slate-400">${Utils.truncate(c.venue, 30)}</td>
        <td class="text-sm text-white">${c.numberOfTeams || '—'}</td>
        <td class="text-sm text-white">${c.numberOfSchools || '—'}</td>
        <td>${Utils.statusBadge(c.status)}</td>
        <td>
          <div class="flex gap-2">
            ${AUTH.can('competitions.write') ? `
            <button onclick="event.stopPropagation();Competitions.openForm('${c.id}')" class="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 text-xs transition flex items-center"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/><path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/></svg></button>
            <button onclick="event.stopPropagation();Competitions.confirmDelete('${c.id}')" class="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs transition flex items-center"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'/></svg></button>
            ` : ''}
          </div>
        </td>
      </tr>`).join('') || `<tr><td colspan="8"><div class="empty-state"><div style="opacity:0.3;display:flex;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a89060" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg></div></div></td></tr>`;
  },

  _onSearch: Utils.debounce(async function(v) { Competitions._search = v; await Competitions._loadTable(); }, 300),

  async openForm(id = null) {
    const c = id ? await DB.getById('competitions', id) : null;
    Modal.show(id ? 'Edit Competition' : 'New Competition', `
      <form id="comp-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2"><label class="form-label">Competition Name *</label>
          <input class="form-input" name="name" value="${c?.name||''}" required>
        </div>
        <div><label class="form-label">Season</label>
          <select class="form-input" name="season">
            ${Seeder.SEASONS.map(s=>`<option ${c?.season===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div><label class="form-label">Theme</label>
          <input class="form-input" name="theme" value="${c?.theme||''}">
        </div>
        <div class="md:col-span-2"><label class="form-label">Venue</label>
          <input class="form-input" name="venue" value="${c?.venue||''}">
        </div>
        <div><label class="form-label">Competition Date</label>
          <input class="form-input" type="date" name="date" value="${c?.date||''}">
        </div>
        <div><label class="form-label">Registration Deadline</label>
          <input class="form-input" type="date" name="registrationDeadline" value="${c?.registrationDeadline||''}">
        </div>
        <div><label class="form-label">Organizer</label>
          <input class="form-input" name="organizer" value="${c?.organizer||'WRO Philippines National Office'}">
        </div>
        <div><label class="form-label">Status</label>
          <select class="form-input" name="status">
            ${['upcoming','ongoing','completed'].map(s=>`<option ${c?.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div><label class="form-label">Number of Teams</label>
          <input class="form-input" type="number" name="numberOfTeams" value="${c?.numberOfTeams||''}">
        </div>
        <div><label class="form-label">Number of Schools</label>
          <input class="form-input" type="number" name="numberOfSchools" value="${c?.numberOfSchools||''}">
        </div>
        <div><label class="form-label">Number of Coaches</label>
          <input class="form-input" type="number" name="numberOfCoaches" value="${c?.numberOfCoaches||''}">
        </div>
        <div><label class="form-label">Number of Students</label>
          <input class="form-input" type="number" name="numberOfStudents" value="${c?.numberOfStudents||''}">
        </div>
      </form>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold">Cancel</button>
       <button onclick="Competitions._save('${id||''}')" class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'/><polyline points='17 21 17 13 7 13 7 21'/><polyline points='7 3 7 8 15 8'/></svg> Save</button>`,
      'max-w-3xl'
    );
  },

  async _save(id) {
    const form = document.getElementById('comp-form');
    const data = Object.fromEntries(new FormData(form));
    if (!data.name.trim()) { Toast.error('Name required.'); return; }
    if (id) {
      // Preserve the existing categories so they are not overwritten with defaults on every edit
      const existing = await DB.getById('competitions', id);
      data.categories = existing?.categories || Seeder.WRO_CATEGORIES;
      await DB.update('competitions', id, data); Toast.success('Competition updated!');
    } else {
      data.categories = Seeder.WRO_CATEGORIES;
      await DB.insert('competitions', data); Toast.success('Competition added!');
    }
    Modal.close(); await this._renderCards(); await this._loadTable();
  },

  async confirmDelete(id) {
    const c = await DB.getById('competitions', id);
    Modal.confirm(`Delete "${c?.name}"?`, async () => { await DB.delete('competitions',id); Toast.success('Deleted.'); await Competitions._renderCards(); await Competitions._loadTable(); });
  },

  async viewDetail(id) {
    const c = await DB.getById('competitions', id);
    if (!c) return;
    Modal.show(c.name, `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-slate-500">Season:</span> <span class="text-slate-200">${c.season}</span></div>
          <div><span class="text-slate-500">Theme:</span> <span class="text-slate-200">${c.theme}</span></div>
          <div><span class="text-slate-500">Date:</span> <span class="text-slate-200">${Utils.formatDate(c.date)}</span></div>
          <div><span class="text-slate-500">Deadline:</span> <span class="text-slate-200">${Utils.formatDate(c.registrationDeadline)}</span></div>
          <div class="col-span-2"><span class="text-slate-500">Venue:</span> <span class="text-slate-200">${c.venue}</span></div>
          <div class="col-span-2"><span class="text-slate-500">Organizer:</span> <span class="text-slate-200">${c.organizer}</span></div>
        </div>
        <div class="grid grid-cols-4 gap-3">
          ${[['<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',c.numberOfTeams,'Teams'],['<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',c.numberOfSchools,'Schools'],['<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>',c.numberOfCoaches,'Coaches'],['<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5"/>',c.numberOfStudents,'Students']].map(([paths,val,label])=>
            `<div class="glass-light rounded-xl p-3 text-center">
              <div class="flex justify-center mb-1"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a89060" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></div>
              <div class="text-xl font-bold text-white">${val||'—'}</div>
              <div class="text-xs text-slate-400">${label}</div>
            </div>`).join('')}
        </div>
        <div>
          <div class="text-xs text-slate-500 uppercase font-semibold mb-2">Categories</div>
          <div class="flex flex-wrap gap-2">
            ${(c.categories||Seeder.WRO_CATEGORIES).map(cat=>
              `<span class="badge badge-blue">${cat}</span>`).join('')}
          </div>
        </div>
      </div>`, '', 'max-w-xl');
  },

  async exportCSV() {
    const rows = (await DB.getAll('competitions')).filter(c => !c.isDeleted);
    Utils.downloadCSV('WRO_Competitions.csv',
      ['ID','Name','Season','Theme','Date','Venue','Teams','Schools','Coaches','Students','Status'],
      rows.map(c => [c.id,c.name,c.season,c.theme,c.date,c.venue,c.numberOfTeams,c.numberOfSchools,c.numberOfCoaches,c.numberOfStudents,c.status])
    );
    Toast.success('Competitions exported!');
  },
};

window.Competitions = Competitions;
