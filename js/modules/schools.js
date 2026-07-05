// ============================================================
// Module 1 – School Management
// ============================================================

const Schools = {
  _page: 1,
  _perPage: 15,
  _search: '',
  _filterRegion: '',
  _filterStatus: '',

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-view space-y-6">
        <!-- Toolbar -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="search-box flex-1 min-w-56">
            <span class="search-icon" style="display:flex;align-items:center"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input id="school-search" type="text" class="form-input pl-10" placeholder="Search schools..." oninput="Schools._onSearch(this.value)">
          </div>
          <select id="school-region" class="form-input w-auto" onchange="Schools._onFilter()">
            <option value="">All Regions</option>
            ${Seeder.PH_REGIONS.map(r => `<option value="${r}">${r}</option>`).join('')}
          </select>
          <select id="school-status" class="form-input w-auto" onchange="Schools._onFilter()">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          ${AUTH.can('schools.write') ? `
          <button onclick="Schools.openForm()" class="btn-primary text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
            <span>+</span> Add School
          </button>` : ''}
          <button onclick="Schools.exportCSV()" class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export
          </button>
        </div>

        <!-- Stats Row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="school-stats"></div>

        <!-- Table Card -->
        <div class="glass rounded-2xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="data-table" id="schools-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Type</th>
                  <th>Region</th>
                  <th>City</th>
                  <th>Coordinator</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="schools-tbody">
                <tr><td colspan="7" class="text-center py-8 text-slate-500">Loading...</td></tr>
              </tbody>
            </table>
          </div>
          <div class="flex items-center justify-between p-4 border-t border-slate-700/50">
            <span id="schools-count" class="text-slate-400 text-sm"></span>
            <div id="schools-pagination" class="flex gap-1"></div>
          </div>
        </div>
      </div>`;
    await this._renderStats();
    await this._loadTable();
  },

  async _renderStats() {
    const all      = (await DB.getAll('schools')).filter(s => !s.isDeleted);
    const active   = all.filter(s => s.status === 'active').length;
    const regions  = [...new Set(all.map(s => s.region))].length;
    const types    = Utils.groupBy(all, 'schoolType');
    const _si = (d,c) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    document.getElementById('school-stats').innerHTML = [
      { label:'Total Schools',   value: all.length,                     icon: _si('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>','#D4A017') },
      { label:'Active Schools',  value: active,                          icon: _si('<polyline points="20 6 9 17 4 12"/>','#2dc653') },
      { label:'Regions Covered', value: regions,                         icon: _si('<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>','#8338ec') },
      { label:'Private Schools', value: types['Private']?.length || 0,  icon: _si('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><line x1="12" y1="22" x2="12" y2="12"/>','#e8c027') },
    ].map(s => `
      <div class="kpi-card rounded-xl p-4">
        <div class="mb-2">${s.icon}</div>
        <div class="text-2xl font-bold text-white">${s.value}</div>
        <div class="text-xs text-slate-400 mt-1">${s.label}</div>
      </div>`).join('');
  },

  async _getData() {
    let rows = (await DB.getAll('schools')).filter(r => !r.isDeleted);
    if (this._search) {
      const q = this._search.toLowerCase();
      rows = rows.filter(r =>
        r.schoolName?.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q) ||
        r.roboticsCoordinator?.toLowerCase().includes(q)
      );
    }
    if (this._filterRegion) rows = rows.filter(r => r.region === this._filterRegion);
    if (this._filterStatus) rows = rows.filter(r => r.status === this._filterStatus);
    return rows;
  },

  async _loadTable() {
    const rows  = await this._getData();
    const start = (this._page - 1) * this._perPage;
    const page  = rows.slice(start, start + this._perPage);
    const tbody = document.getElementById('schools-tbody');
    if (!tbody) return;

    if (page.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
        <div style="opacity:0.3;display:flex;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a89060" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
        <div class="text-lg font-semibold text-slate-300 mt-2">No schools found</div>
        <div class="text-sm mt-1">Try adjusting your search or filters</div>
      </div></td></tr>`;
      document.getElementById('schools-count').textContent = '0 records';
      return;
    }

    tbody.innerHTML = page.map(s => `
      <tr class="table-row cursor-pointer" onclick="Schools.viewDetail('${s.id}')">
        <td>
          <div class="font-semibold text-white text-sm">${s.schoolName}</div>
          <div class="text-xs text-slate-500">${s.id} · ${s.schoolLevel || ''}</div>
        </td>
        <td><span class="badge badge-blue">${s.schoolType || '—'}</span></td>
        <td class="text-xs text-slate-400">${(s.region || '').replace('– ','')}</td>
        <td class="text-sm">${s.city || '—'}</td>
        <td class="text-sm text-slate-300">${s.roboticsCoordinator || '—'}</td>
        <td>${Utils.statusBadge(s.status)}</td>
        <td>
          <div class="flex gap-2">
            ${AUTH.can('schools.write') ? `
            <button onclick="event.stopPropagation();Schools.openForm('${s.id}')" class="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 transition text-xs flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/><path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/></svg> Edit</button>
            <button onclick="event.stopPropagation();Schools.confirmDelete('${s.id}')" class="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition text-xs flex items-center"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'/><path d='M10 11v6'/><path d='M14 11v6'/></svg></button>
            ` : ''}
          </div>
        </td>
      </tr>`).join('');

    const total = rows.length;
    document.getElementById('schools-count').textContent = `Showing ${start+1}–${Math.min(start+this._perPage, total)} of ${total} schools`;
    Utils.renderPagination('schools-pagination', this._page, Math.ceil(total / this._perPage), 'Schools._goPage');
  },

  async _goPage(p) { Schools._page = p; await Schools._loadTable(); },
  _onSearch: Utils.debounce(async function(v) { Schools._search = v; Schools._page = 1; await Schools._loadTable(); }, 300),
  async _onFilter() {
    this._filterRegion = document.getElementById('school-region')?.value || '';
    this._filterStatus = document.getElementById('school-status')?.value || '';
    this._page = 1;
    await this._loadTable();
  },

  async openForm(id = null) {
    const school = id ? await DB.getById('schools', id) : null;
    const title  = school ? 'Edit School' : 'Add New School';
    Modal.show(title, `
      <form id="school-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="form-label">School Name *</label>
          <input class="form-input" name="schoolName" value="${school?.schoolName||''}" required>
        </div>
        <div>
          <label class="form-label">School Type</label>
          <select class="form-input" name="schoolType">
            ${['Private','Public','Sectarian'].map(t => `<option ${school?.schoolType===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">School Level</label>
          <select class="form-input" name="schoolLevel">
            ${['Elementary','High School','Senior High School','College','K-12'].map(t => `<option ${school?.schoolLevel===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">DepEd School ID</label>
          <input class="form-input" name="depedId" value="${school?.depedId||''}">
        </div>
        <div>
          <label class="form-label">Region</label>
          <select class="form-input" name="region">
            <option value="">Select Region</option>
            ${Seeder.PH_REGIONS.map(r => `<option ${school?.region===r?'selected':''}>${r}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">Province</label>
          <input class="form-input" name="province" value="${school?.province||''}">
        </div>
        <div>
          <label class="form-label">City / Municipality</label>
          <input class="form-input" name="city" value="${school?.city||''}">
        </div>
        <div class="md:col-span-2">
          <label class="form-label">Complete Address</label>
          <input class="form-input" name="address" value="${school?.address||''}">
        </div>
        <div>
          <label class="form-label">Contact Number</label>
          <input class="form-input" name="contactNumber" value="${school?.contactNumber||''}">
        </div>
        <div>
          <label class="form-label">School Email</label>
          <input class="form-input" type="email" name="email" value="${school?.email||''}">
        </div>
        <div>
          <label class="form-label">School Head</label>
          <input class="form-input" name="schoolHead" value="${school?.schoolHead||''}">
        </div>
        <div>
          <label class="form-label">Robotics Coordinator</label>
          <input class="form-input" name="roboticsCoordinator" value="${school?.roboticsCoordinator||''}">
        </div>
        <div>
          <label class="form-label">Website</label>
          <input class="form-input" name="website" value="${school?.website||''}">
        </div>
        <div>
          <label class="form-label">Year First Joined WRO</label>
          <input class="form-input" type="number" name="yearsJoined" value="${school?.yearsJoined||2025}">
        </div>
        <div>
          <label class="form-label">Status</label>
          <select class="form-input" name="status">
            <option ${school?.status==='active'?'selected':''} value="active">Active</option>
            <option ${school?.status==='inactive'?'selected':''} value="inactive">Inactive</option>
          </select>
        </div>
      </form>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition">Cancel</button>
       <button onclick="Schools._save('${id||''}')" class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'/><polyline points='17 21 17 13 7 13 7 21'/><polyline points='7 3 7 8 15 8'/></svg> Save School</button>`,
      'max-w-3xl'
    );
  },

  async _save(id) {
    const form  = document.getElementById('school-form');
    const data  = Object.fromEntries(new FormData(form));
    if (!data.schoolName.trim()) { Toast.error('School name is required.'); return; }
    if (id) {
      await DB.update('schools', id, data);
      Toast.success('School updated successfully!');
    } else {
      await DB.insert('schools', data);
      Toast.success('School added successfully!');
    }
    Modal.close();
    await this._renderStats();
    await this._loadTable();
  },

  async confirmDelete(id) {
    const s = await DB.getById('schools', id);
    Modal.confirm(`Delete "${s?.schoolName}"? This action cannot be undone.`, async () => { await DB.delete('schools', id);
      Toast.success('School deleted.');
      await Schools._renderStats();
      await Schools._loadTable();
    });
  },

  async viewDetail(id) {
    const s       = await DB.getById('schools', id);
    if (!s) return;
    const teams   = await DB.query('teams', t => t.schoolId === id && !t.isDeleted);
    const coaches = await DB.query('coaches', c => c.schoolId === id && !c.isDeleted);
    const awards  = await DB.query('awards', a => a.schoolId === id && !a.isDeleted);
    Modal.show(s.schoolName, `
      <div class="grid grid-cols-2 gap-4 text-sm mb-6">
        <div><span class="text-slate-500">Type:</span> <span class="text-slate-200">${s.schoolType}</span></div>
        <div><span class="text-slate-500">Level:</span> <span class="text-slate-200">${s.schoolLevel}</span></div>
        <div><span class="text-slate-500">Region:</span> <span class="text-slate-200">${s.region}</span></div>
        <div><span class="text-slate-500">City:</span> <span class="text-slate-200">${s.city}</span></div>
        <div><span class="text-slate-500">DepEd ID:</span> <span class="text-slate-200">${s.depedId}</span></div>
        <div><span class="text-slate-500">First Joined:</span> <span class="text-slate-200">${s.yearsJoined}</span></div>
        <div><span class="text-slate-500">Coordinator:</span> <span class="text-slate-200">${s.roboticsCoordinator}</span></div>
        <div><span class="text-slate-500">Status:</span> ${Utils.statusBadge(s.status)}</div>
        <div class="col-span-2"><span class="text-slate-500">Address:</span> <span class="text-slate-200">${s.address}</span></div>
        <div><span class="text-slate-500">Email:</span> <span class="text-slate-200">${s.email}</span></div>
        <div><span class="text-slate-500">Contact:</span> <span class="text-slate-200">${s.contactNumber}</span></div>
      </div>
      <div class="grid grid-cols-3 gap-4 mt-4">
        <div class="glass-light rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-indigo-400">${teams.length}</div>
          <div class="text-xs text-slate-400 mt-1">Teams</div>
        </div>
        <div class="glass-light rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-green-400">${coaches.length}</div>
          <div class="text-xs text-slate-400 mt-1">Coaches</div>
        </div>
        <div class="glass-light rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-yellow-400">${awards.length}</div>
          <div class="text-xs text-slate-400 mt-1">Awards</div>
        </div>
      </div>`, '', 'max-w-2xl');
  },

  async exportCSV() {
    const rows = await this._getData();
    Utils.downloadCSV('WRO_Schools.csv',
      ['ID','School Name','Type','Level','Region','Province','City','DepEd ID','Email','Contact','Coordinator','Status'],
      rows.map(s => [s.id,s.schoolName,s.schoolType,s.schoolLevel,s.region,s.province,s.city,s.depedId,s.email,s.contactNumber,s.roboticsCoordinator,s.status])
    );
    Toast.success('School list exported!');
  },
};

window.Schools = Schools;
