// ============================================================
// Module 3 – Student Management
// ============================================================

const Students = {
  _page: 1, _perPage: 15, _search: '', _filterGender: '', _filterGrade: '',

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-view space-y-6">
        <div class="flex flex-wrap items-center gap-3">
          <div class="search-box flex-1 min-w-56">
            <span class="search-icon" style="display:flex;align-items:center"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input id="student-search" type="text" class="form-input pl-10" placeholder="Search students..." oninput="Students._onSearch(this.value)">
          </div>
          <select id="student-gender" class="form-input w-auto" onchange="Students._onFilter()">
            <option value="">All Genders</option>
            <option>Male</option><option>Female</option>
          </select>
          <select id="student-grade" class="form-input w-auto" onchange="Students._onFilter()">
            <option value="">All Grades</option>
            ${['Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(g=>`<option>${g}</option>`).join('')}
          </select>
          ${AUTH.can('students.write') ? `
          <button onclick="Students.openForm()" class="btn-primary text-white px-4 py-2 rounded-xl text-sm font-semibold">+ Add Student</button>` : ''}
          <button onclick="Students.exportCSV()" class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="student-stats"></div>
        <div class="glass rounded-2xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr><th>Student</th><th>Age/Grade</th><th>School</th><th>Parent</th><th>Medical</th><th>Actions</th></tr>
              </thead>
              <tbody id="students-tbody"></tbody>
            </table>
          </div>
          <div class="flex items-center justify-between p-4 border-t border-slate-700/50">
            <span id="students-count" class="text-slate-400 text-sm"></span>
            <div id="students-pagination" class="flex gap-1"></div>
          </div>
        </div>
      </div>`;
    await this._renderStats();
    await this._loadTable();
  },

  async _renderStats() {
    const all   = (await DB.getAll('students')).filter(s => !s.isDeleted);
    const male  = all.filter(s => s.gender === 'Male').length;
    const avgAge = all.length ? Math.round(all.reduce((acc,s) => acc + (s.age||0), 0)/all.length) : 0;
    const _si = (d,c) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    document.getElementById('student-stats').innerHTML = [
      { label:'Total Students', value: all.length,           icon: _si('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5"/>','#F6C945') },
      { label:'Male',           value: male,                 icon: _si('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>','#1d6fa4') },
      { label:'Female',         value: all.length - male,    icon: _si('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>','#e91e8c') },
      { label:'Avg Age',        value: avgAge,               icon: _si('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>','#2dc653') },
    ].map(s => `
      <div class="kpi-card rounded-xl p-4">
        <div class="mb-2">${s.icon}</div>
        <div class="text-2xl font-bold text-white">${s.value}</div>
        <div class="text-xs text-slate-400 mt-1">${s.label}</div>
      </div>`).join('');
  },

  async _getData() {
    let rows = (await DB.getAll('students')).filter(r => !r.isDeleted);
    if (this._search) {
      const q = this._search.toLowerCase();
      rows = rows.filter(r => r.fullName?.toLowerCase().includes(q) || r.parentName?.toLowerCase().includes(q));
    }
    if (this._filterGender) rows = rows.filter(r => r.gender === this._filterGender);
    if (this._filterGrade)  rows = rows.filter(r => r.gradeLevel === this._filterGrade);
    return rows;
  },

  async _loadTable() {
    const _schoolsMap = await DB.getLookup('schools');
    const rows  = await this._getData();
    const start = (this._page - 1) * this._perPage;
    const page  = rows.slice(start, start + this._perPage);
    const tbody = document.getElementById('students-tbody');
    if (!tbody) return;
    if (page.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div style="opacity:0.3;display:flex;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F6C945" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5"/></svg></div><div class="text-lg font-semibold text-slate-300 mt-2">No students found</div></div></td></tr>`;
      return;
    }
    tbody.innerHTML = page.map(s => {
      const school = _schoolsMap[s.schoolId];
      const gColor = s.gender === 'Male' ? 'from-blue-500 to-cyan-600' : 'from-pink-500 to-rose-600';
      return `
        <tr class="table-row cursor-pointer" onclick="Students.viewDetail('${s.id}')">
          <td>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br ${gColor} flex items-center justify-center text-white font-bold text-xs">
                ${(s.fullName||'?').charAt(0)}
              </div>
              <div>
                <div class="font-semibold text-white text-sm">${s.fullName}</div>
                <div class="text-xs text-slate-500">${s.id}</div>
              </div>
            </div>
          </td>
          <td>
            <div class="text-sm text-white">${s.age || Utils.calcAge(s.birthday) || '—'} yrs</div>
            <div class="text-xs text-slate-500">${s.gradeLevel}</div>
          </td>
          <td class="text-sm text-slate-300">${Utils.truncate(school?.schoolName,28)||'—'}</td>
          <td>
            <div class="text-sm text-slate-300">${s.parentName}</div>
            <div class="text-xs text-slate-500">${s.parentContact}</div>
          </td>

          <td>
            ${s.medicalConditions && s.medicalConditions !== 'None'
              ? `<span class="badge badge-yellow"><svg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='display:inline;vertical-align:middle'><path d='M22 12h-4l-3 9L9 3l-3 9H2'/></svg> ${s.medicalConditions}</span>`
              : `<span class="badge badge-green">None</span>`}
          </td>
          <td>
            <div class="flex gap-2">
              ${AUTH.can('students.write') ? `
              <button onclick="event.stopPropagation();Students.openForm('${s.id}')" class="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 text-xs transition flex items-center"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/><path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/></svg></button>
              <button onclick="event.stopPropagation();Students.confirmDelete('${s.id}')" class="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs transition flex items-center"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'/></svg></button>
              ` : ''}
            </div>
          </td>
        </tr>`;
    }).join('');
    const total = rows.length;
    document.getElementById('students-count').textContent = `${start+1}–${Math.min(start+this._perPage,total)} of ${total}`;
    Utils.renderPagination('students-pagination', this._page, Math.ceil(total/this._perPage), 'Students._goPage');
  },

  async _goPage(p) { Students._page = p; await Students._loadTable(); },
  _onSearch: Utils.debounce(async function(v) { Students._search = v; Students._page = 1; await Students._loadTable(); }, 300),
  async _onFilter() {
    this._filterGender = document.getElementById('student-gender')?.value || '';
    this._filterGrade  = document.getElementById('student-grade')?.value  || '';
    this._page = 1; await this._loadTable();
  },

  /** Converts any date value (Date object, ISO string, YYYY-MM-DD) → YYYY-MM-DD for <input type="date"> */
  _toDateInput(val) {
    if (!val) return '';
    // If it's already YYYY-MM-DD, return as-is
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    // Otherwise parse and convert (handles Date objects and ISO strings from MySQL)
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch { return ''; }
  },

  async openForm(id = null) {
    const s       = id ? await DB.getById('students', id) : null;
    const schools = (await DB.getAll('schools')).filter(x => !x.isDeleted);
    const birthdayValue = this._toDateInput(s?.birthday);
    Modal.show(id ? 'Edit Student' : 'Add Student', `
      <form id="student-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="form-label">Full Name *</label>
          <input class="form-input" name="fullName" value="${s?.fullName||''}" required>
        </div>
        <div><label class="form-label">Birthday</label>
          <input class="form-input" type="date" name="birthday" value="${birthdayValue}">
        </div>
        <div><label class="form-label">Gender</label>
          <select class="form-input" name="gender">
            ${['Male','Female'].map(g=>`<option ${s?.gender===g?'selected':''}>${g}</option>`).join('')}
          </select>
        </div>
        <div><label class="form-label">Grade Level</label>
          <select class="form-input" name="gradeLevel">
            ${['Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(g=>`<option ${s?.gradeLevel===g?'selected':''}>${g}</option>`).join('')}
          </select>
        </div>
        <div class="md:col-span-2"><label class="form-label">School *</label>
          <select class="form-input" name="schoolId" required>
            <option value="">Select School</option>
            ${schools.map(sc=>`<option value="${sc.id}" ${s?.schoolId===sc.id?'selected':''}>${sc.schoolName}</option>`).join('')}
          </select>
        </div>
        <div><label class="form-label">Parent / Guardian Name</label>
          <input class="form-input" name="parentName" value="${s?.parentName||''}">
        </div>
        <div><label class="form-label">Parent Contact</label>
          <input class="form-input" name="parentContact" value="${s?.parentContact||''}">
        </div>
        <div><label class="form-label">Parent Email</label>
          <input class="form-input" type="email" name="parentEmail" value="${s?.parentEmail||''}">
        </div>
        <div><label class="form-label">Shirt Size</label>
          <select class="form-input" name="shirtSize">
            ${['XS','S','M','L','XL'].map(sz=>`<option ${s?.shirtSize===sz?'selected':''}>${sz}</option>`).join('')}
          </select>
        </div>
        <div><label class="form-label">Medical Conditions</label>
          <input class="form-input" name="medicalConditions" value="${s?.medicalConditions||'None'}">
        </div>
        <div><label class="form-label">Allergies</label>
          <input class="form-input" name="allergies" value="${s?.allergies||'None'}">
        </div>

        <div><label class="form-label">Consent Signed</label>
          <select class="form-input" name="consentSigned">
            <option value="true" ${s?.consentSigned?'selected':''}>Yes</option>
            <option value="false" ${!s?.consentSigned?'selected':''}>No</option>
          </select>
        </div>
        <div><label class="form-label">Status</label>
          <select class="form-input" name="status">
            <option value="active"   ${(s?.status||'active')==='active'  ?'selected':''}>Active</option>
            <option value="inactive" ${s?.status==='inactive'            ?'selected':''}>Inactive</option>
          </select>
        </div>
      </form>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold">Cancel</button>
       <button onclick="Students._save('${id||''}')" class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'/><polyline points='17 21 17 13 7 13 7 21'/><polyline points='7 3 7 8 15 8'/></svg> Save</button>`,
      'max-w-3xl'
    );
  },

  async _save(id) {
    const form = document.getElementById('student-form');
    const data = Object.fromEntries(new FormData(form));
    if (!data.fullName.trim()) { Toast.error('Full name is required.'); return; }
    data.consentSigned = data.consentSigned === 'true';
    data.age = data.birthday ? Utils.calcAge(data.birthday) : null;
    if (id) { await DB.update('students', id, data); Toast.success('Student updated!'); }
    else    { await DB.insert('students', data);     Toast.success('Student added!'); }
    Modal.close(); await this._renderStats(); await this._loadTable();
  },

  async confirmDelete(id) {
    const s = await DB.getById('students', id);
    Modal.confirm(`Delete "${s?.fullName}"?`, async () => { await DB.delete('students',id); Toast.success('Deleted.'); await Students._renderStats(); await Students._loadTable(); });
  },

  async viewDetail(id) {
    const s      = await DB.getById('students', id);
    if (!s) return;
    const school = await DB.getById('schools', s.schoolId);
    const numId  = parseInt(id, 10);
    const teams  = await DB.query('teams', t => Array.isArray(t.members) && t.members.includes(numId) && !t.isDeleted);
    Modal.show(s.fullName, `
      <div class="grid grid-cols-2 gap-3 text-sm mb-4">
        <div><span class="text-slate-500">Birthday:</span> <span class="text-slate-200">${Utils.formatDate(s.birthday)}</span></div>
        <div><span class="text-slate-500">Age:</span> <span class="text-slate-200">${s.age || Utils.calcAge(s.birthday) || '—'} yrs</span></div>
        <div><span class="text-slate-500">Gender:</span> <span class="text-slate-200">${s.gender}</span></div>
        <div><span class="text-slate-500">Grade:</span> <span class="text-slate-200">${s.gradeLevel}</span></div>
        <div class="col-span-2"><span class="text-slate-500">School:</span> <span class="text-slate-200">${school?.schoolName||'—'}</span></div>
        <div><span class="text-slate-500">Parent:</span> <span class="text-slate-200">${s.parentName}</span></div>
        <div><span class="text-slate-500">Parent Contact:</span> <span class="text-slate-200">${s.parentContact}</span></div>
        <div><span class="text-slate-500">Medical:</span> <span class="${s.medicalConditions!=='None'?'text-yellow-400':'text-slate-200'}">${s.medicalConditions}</span></div>
        <div><span class="text-slate-500">Allergies:</span> <span class="${s.allergies!=='None'?'text-yellow-400':'text-slate-200'}">${s.allergies}</span></div>
        <div><span class="text-slate-500">Consent:</span> ${Utils.statusBadge(s.consentSigned ? 'active' : 'inactive')}</div>

      </div>
      <div class="mt-4">
        <div class="text-xs text-slate-500 uppercase font-semibold mb-2">Teams Participated</div>
        ${teams.length === 0 ? '<p class="text-slate-500 text-sm">No team records yet.</p>'
          : teams.map(t => `<div class="flex items-center justify-between p-2 glass-light rounded-lg mb-2">
              <span class="text-sm text-white">${t.teamName}</span>
              <span class="text-xs text-slate-400">${t.season} · ${t.category}</span>
            </div>`).join('')}
      </div>`, '', 'max-w-xl');
  },

  async exportCSV() {
    const _schoolsMap = await DB.getLookup('schools');
    const rows = await this._getData();
    Utils.downloadCSV('WRO_Students.csv',
      ['ID','Full Name','Birthday','Age','Gender','Grade','School','Parent','Contact','Medical','Allergies'],
      rows.map(s => {
        const sc = _schoolsMap[s.schoolId];
        return [s.id,s.fullName,s.birthday,s.age,s.gender,s.gradeLevel,sc?.schoolName||'',s.parentName,s.parentContact,s.medicalConditions,s.allergies];
      })
    );
    Toast.success('Student list exported!');
  },
};

window.Students = Students;
