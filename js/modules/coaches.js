// ============================================================
// Module 2 – Coach Management
// ============================================================

const Coaches = {
  _page: 1, _perPage: 15, _search: '', _filterStatus: '',

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-view space-y-6">
        <div class="flex flex-wrap items-center gap-3">
          <div class="search-box flex-1 min-w-56">
            <span class="search-icon" style="display:flex;align-items:center"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input id="coach-search" type="text" class="form-input pl-10" placeholder="Search coaches..." oninput="Coaches._onSearch(this.value)">
          </div>
          <select id="coach-status" class="form-input w-auto" onchange="Coaches._onFilter()">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          ${AUTH.can('coaches.write') ? `
          <button onclick="Coaches.openForm()" class="btn-primary text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
            <span>+</span> Add Coach
          </button>` : ''}
          <button onclick="Coaches.exportCSV()" class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="coach-stats"></div>
        <div class="glass rounded-2xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Coach</th><th>School</th><th>Position</th><th>Mobile</th><th>Experience</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody id="coaches-tbody"></tbody>
            </table>
          </div>
          <div class="flex items-center justify-between p-4 border-t border-slate-700/50">
            <span id="coaches-count" class="text-slate-400 text-sm"></span>
            <div id="coaches-pagination" class="flex gap-1"></div>
          </div>
        </div>
      </div>`;
    await this._renderStats();
    await this._loadTable();
  },

  async _renderStats() {
    const all    = (await DB.getAll('coaches')).filter(s => !s.isDeleted);
    const active = all.filter(s => s.status === 'active').length;
    const male   = all.filter(s => s.gender === 'Male').length;
    const _si = (d,c) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    document.getElementById('coach-stats').innerHTML = [
      { label:'Total Coaches',  value: all.length,           icon: _si('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>','#D4A017') },
      { label:'Active Coaches', value: active,               icon: _si('<polyline points="20 6 9 17 4 12"/>','#2dc653') },
      { label:'Male',           value: male,                 icon: _si('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>','#1d6fa4') },
      { label:'Female',         value: all.length - male,    icon: _si('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>','#e91e8c') },
    ].map(s => `
      <div class="kpi-card rounded-xl p-4">
        <div class="mb-2">${s.icon}</div>
        <div class="text-2xl font-bold text-white">${s.value}</div>
        <div class="text-xs text-slate-400 mt-1">${s.label}</div>
      </div>`).join('');
  },

  async _getData() {
    let rows = (await DB.getAll('coaches')).filter(r => !r.isDeleted);
    if (this._search) {
      const q = this._search.toLowerCase();
      rows = rows.filter(r => r.fullName?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.position?.toLowerCase().includes(q));
    }
    if (this._filterStatus) rows = rows.filter(r => r.status === this._filterStatus);
    return rows;
  },

  async _loadTable() {
    const _schoolsMap = await DB.getLookup('schools');
    const rows  = await this._getData();
    const start = (this._page - 1) * this._perPage;
    const page  = rows.slice(start, start + this._perPage);
    const tbody = document.getElementById('coaches-tbody');
    if (!tbody) return;

    if (page.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div style="opacity:0.3;display:flex;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a89060" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg></div><div class="text-lg font-semibold text-slate-300 mt-2">No coaches found</div></div></td></tr>`;
      return;
    }
    tbody.innerHTML = page.map(c => {
      const school = _schoolsMap[c.schoolId];
      return `
        <tr class="table-row cursor-pointer" onclick="Coaches.viewDetail('${c.id}')">
          <td>
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                ${(c.fullName||'?').charAt(0)}
              </div>
              <div>
                <div class="font-semibold text-white text-sm">${c.fullName}</div>
                <div class="text-xs text-slate-500">${c.email}</div>
              </div>
            </div>
          </td>
          <td class="text-sm text-slate-300">${Utils.truncate(school?.schoolName, 30) || '—'}</td>
          <td class="text-sm text-slate-400">${c.position || '—'}</td>
          <td class="text-sm text-slate-300">${c.mobile || '—'}</td>
          <td><span class="badge badge-blue">${c.yearsCoaching || 0} yrs</span></td>
          <td>${Utils.statusBadge(c.status)}</td>
          <td>
            <div class="flex gap-2">
              ${AUTH.can('coaches.write') ? `
              <button onclick="event.stopPropagation();Coaches.openForm('${c.id}')" class="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 transition text-xs flex items-center"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/><path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/></svg></button>
              <button onclick="event.stopPropagation();Coaches.confirmDelete('${c.id}')" class="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition text-xs flex items-center"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'/></svg></button>
              ` : ''}
            </div>
          </td>
        </tr>`;
    }).join('');

    const total = rows.length;
    document.getElementById('coaches-count').textContent = `${start+1}–${Math.min(start+this._perPage,total)} of ${total}`;
    Utils.renderPagination('coaches-pagination', this._page, Math.ceil(total/this._perPage), 'Coaches._goPage');
  },

  async _goPage(p) { Coaches._page = p; await Coaches._loadTable(); },
  _onSearch: Utils.debounce(async function(v) { Coaches._search = v; Coaches._page = 1; await Coaches._loadTable(); }, 300),
  async _onFilter() { this._filterStatus = document.getElementById('coach-status')?.value || ''; this._page = 1; await this._loadTable(); },

  async openForm(id = null) {
    const c      = id ? await DB.getById('coaches', id) : null;
    const schools= (await DB.getAll('schools')).filter(s => !s.isDeleted && s.status === 'active');
    Modal.show(id ? 'Edit Coach' : 'Add Coach', `
      <form id="coach-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="form-label">Full Name *</label>
          <input class="form-input" name="fullName" value="${c?.fullName||''}" required>
        </div>
        <div>
          <label class="form-label">Birthday</label>
          <input class="form-input" type="date" name="birthday" value="${c?.birthday||''}">
        </div>
        <div>
          <label class="form-label">Gender</label>
          <select class="form-input" name="gender">
            ${['Male','Female'].map(g => `<option ${c?.gender===g?'selected':''}>${g}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">Email</label>
          <input class="form-input" type="email" name="email" value="${c?.email||''}">
        </div>
        <div>
          <label class="form-label">Mobile Number</label>
          <input class="form-input" name="mobile" value="${c?.mobile||''}">
        </div>
        <div class="md:col-span-2">
          <label class="form-label">School *</label>
          <select class="form-input" name="schoolId" required>
            <option value="">Select School</option>
            ${schools.map(s => `<option value="${s.id}" ${c?.schoolId===s.id?'selected':''}>${s.schoolName}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">Position</label>
          <input class="form-input" name="position" value="${c?.position||''}">
        </div>
        <div>
          <label class="form-label">Shirt Size</label>
          <select class="form-input" name="shirtSize">
            ${['XS','S','M','L','XL','XXL'].map(s => `<option ${c?.shirtSize===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="md:col-span-2">
          <label class="form-label">Emergency Contact</label>
          <input class="form-input" name="emergencyContact" value="${c?.emergencyContact||''}">
        </div>
        <div>
          <label class="form-label">Certifications</label>
          <input class="form-input" name="certifications" value="${c?.certifications||''}">
        </div>
        <div>
          <label class="form-label">Years Coaching</label>
          <input class="form-input" type="number" name="yearsCoaching" value="${c?.yearsCoaching||0}">
        </div>
        <div>
          <label class="form-label">Previous Awards</label>
          <input class="form-input" name="previousAwards" value="${c?.previousAwards||''}">
        </div>
        <div>
          <label class="form-label">Status</label>
          <select class="form-input" name="status">
            <option ${c?.status==='active'?'selected':''} value="active">Active</option>
            <option ${c?.status==='inactive'?'selected':''} value="inactive">Inactive</option>
          </select>
        </div>
      </form>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold">Cancel</button>
       <button onclick="Coaches._save('${id||''}')" class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'/><polyline points='17 21 17 13 7 13 7 21'/><polyline points='7 3 7 8 15 8'/></svg> Save</button>`,
      'max-w-3xl'
    );
  },

  async _save(id) {
    const form = document.getElementById('coach-form');
    const data = Object.fromEntries(new FormData(form));
    if (!data.fullName.trim()) { Toast.error('Full name is required.'); return; }
    if (id) { await DB.update('coaches', id, data); Toast.success('Coach updated!'); }
    else    { await DB.insert('coaches', data);     Toast.success('Coach added!'); }
    Modal.close(); await this._renderStats(); await this._loadTable();
  },

  async confirmDelete(id) {
    const c = await DB.getById('coaches', id);
    Modal.confirm(`Delete coach "${c?.fullName}"?`, async () => { await DB.delete('coaches', id); Toast.success('Deleted.'); await Coaches._renderStats(); await Coaches._loadTable(); });
  },

  async viewDetail(id) {
    const c = await DB.getById('coaches', id);
    if (!c) return;
    const school = await DB.getById('schools', c.schoolId);
    const teams  = await DB.query('teams', t => t.coachId === id && !t.isDeleted);
    const awards = await DB.query('awards', a => a.coachId === id && !a.isDeleted);
    Modal.show(c.fullName, `
      <div class="flex items-center gap-4 mb-6 p-4 glass-light rounded-xl">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
          ${(c.fullName||'?').charAt(0)}
        </div>
        <div>
          <div class="text-xl font-bold text-white">${c.fullName}</div>
          <div class="text-sm text-slate-400">${c.position}</div>
          <div class="text-sm text-indigo-400">${school?.schoolName || '—'}</div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div><span class="text-slate-500">Email:</span> <span class="text-slate-200">${c.email}</span></div>
        <div><span class="text-slate-500">Mobile:</span> <span class="text-slate-200">${c.mobile}</span></div>
        <div><span class="text-slate-500">Birthday:</span> <span class="text-slate-200">${Utils.formatDate(c.birthday)}</span></div>
        <div><span class="text-slate-500">Gender:</span> <span class="text-slate-200">${c.gender}</span></div>
        <div><span class="text-slate-500">Certifications:</span> <span class="text-slate-200">${c.certifications}</span></div>
        <div><span class="text-slate-500">Years Coaching:</span> <span class="text-slate-200">${c.yearsCoaching}</span></div>
        <div class="col-span-2"><span class="text-slate-500">Awards:</span> <span class="text-slate-200">${c.previousAwards}</span></div>
      </div>
      <div class="grid grid-cols-2 gap-4 mt-4">
        <div class="glass-light rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-indigo-400">${teams.length}</div>
          <div class="text-xs text-slate-400">Teams Coached</div>
        </div>
        <div class="glass-light rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-yellow-400">${awards.length}</div>
          <div class="text-xs text-slate-400">Awards Won</div>
        </div>
      </div>`, '', 'max-w-xl');
  },

  async exportCSV() {
    const _schoolsMap = await DB.getLookup('schools');
    const rows = await this._getData();
    Utils.downloadCSV('WRO_Coaches.csv',
      ['ID','Full Name','Gender','Email','Mobile','School','Position','Years Coaching','Certifications','Status'],
      rows.map(c => {
        const s = _schoolsMap[c.schoolId];
        return [c.id,c.fullName,c.gender,c.email,c.mobile,s?.schoolName||'',c.position,c.yearsCoaching,c.certifications,c.status];
      })
    );
    Toast.success('Coach list exported!');
  },
};

window.Coaches = Coaches;
