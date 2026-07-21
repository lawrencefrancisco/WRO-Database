// ============================================================
// Module 4 – Team Management (Core Module)
// ============================================================

const Teams = {
  _page: 1, _perPage: 15, _search: '', _filterSeason: '', _filterCategory: '', _filterStatus: '',

  async render() {
    const dbSeasons = (await DB.getAll('seasons')).sort((a,b) => (b.year||0) - (a.year||0));
    const dbSeasonNames = dbSeasons.map(s => s.name);
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-view space-y-6">
        <div class="flex flex-wrap items-center gap-3">
          <div class="search-box flex-1 min-w-56">
            <span class="search-icon" style="display:flex;align-items:center"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input id="team-search" type="text" class="form-input pl-10" placeholder="Search teams..." oninput="Teams._onSearch(this.value)">
          </div>
          <select id="team-season" class="form-input w-auto" onchange="Teams._onFilter()">
            <option value="">All Seasons</option>
            ${dbSeasonNames.map(s=>`<option>${s}</option>`).join('')}
          </select>
          <select id="team-category" class="form-input w-auto" onchange="Teams._onFilter()">
            <option value="">All Categories</option>
            ${Seeder.WRO_CATEGORIES.map(c=>`<option>${c}</option>`).join('')}
          </select>
          <select id="team-reg-status" class="form-input w-auto" onchange="Teams._onFilter()">
            <option value="">All Status</option>
            <option>registered</option><option>confirmed</option><option>waitlisted</option><option>withdrawn</option>
          </select>
          ${AUTH.can('teams.write') ? `
          <button onclick="Teams.openForm()" class="btn-primary text-white px-4 py-2 rounded-xl text-sm font-semibold">+ New Team</button>` : ''}
          <button onclick="Teams.exportCSV()" class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="team-stats"></div>
        <div class="glass rounded-2xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr><th>Team</th><th>Season</th><th>Category</th><th>School</th><th>Coach</th><th>Payment</th><th>Qualification</th><th>Actions</th></tr>
              </thead>
              <tbody id="teams-tbody"></tbody>
            </table>
          </div>
          <div class="flex items-center justify-between p-4 border-t border-slate-700/50">
            <span id="teams-count" class="text-slate-400 text-sm"></span>
            <div id="teams-pagination" class="flex gap-1"></div>
          </div>
        </div>
      </div>`;
    await this._renderStats();
    await this._loadTable();
  },

  async _renderStats() {
    const all       = (await DB.getAll('teams')).filter(t => !t.isDeleted);
    const paid      = all.filter(t => t.paymentStatus === 'paid').length;
    const qualified = all.filter(t => t.qualificationStatus === 'qualified').length;
    const byCat     = Utils.groupBy(all, 'category');
    const _si = (d,c) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    document.getElementById('team-stats').innerHTML = [
      { label:'Total Teams', value: all.length,                    icon: _si('<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 17h6M17 14v6"/>','#F6C945') },
      { label:'Paid',        value: paid,                         icon: _si('<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>','#2dc653') },
      { label:'Qualified',   value: qualified,                    icon: _si('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>','#e8c027') },
      { label:'Categories',  value: Object.keys(byCat).length,   icon: _si('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>','#8338ec') },
    ].map(s => `
      <div class="kpi-card rounded-xl p-4">
        <div class="mb-2">${s.icon}</div>
        <div class="text-2xl font-bold text-white">${s.value}</div>
        <div class="text-xs text-slate-400 mt-1">${s.label}</div>
      </div>`).join('');
  },

  async _getData() {
    let rows = (await DB.getAll('teams')).filter(r => !r.isDeleted);
    if (this._search) {
      const q = this._search.toLowerCase();
      rows = rows.filter(r => r.teamName?.toLowerCase().includes(q) || r.id?.toLowerCase().includes(q));
    }
    if (this._filterSeason)   rows = rows.filter(r => r.season === this._filterSeason);
    if (this._filterCategory) rows = rows.filter(r => r.category === this._filterCategory);
    if (this._filterStatus)   rows = rows.filter(r => r.registrationStatus === this._filterStatus);
    return rows;
  },

  async _loadTable() {
    const _schoolsMap = await DB.getLookup('schools');
    const _coachesMap = await DB.getLookup('coaches');
    const rows  = await this._getData();
    const start = (this._page - 1) * this._perPage;
    const page  = rows.slice(start, start + this._perPage);
    const tbody = document.getElementById('teams-tbody');
    if (!tbody) return;
    if (page.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div style="opacity:0.3;display:flex;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F6C945" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 17h6M17 14v6"/></svg></div><div class="text-lg font-semibold text-slate-300 mt-2">No teams found</div></div></td></tr>`;
      return;
    }
    tbody.innerHTML = page.map(t => {
      const school = _schoolsMap[t.schoolId];
      const coach  = _coachesMap[t.coachId];
      return `
        <tr class="table-row cursor-pointer" onclick="Teams.viewDetail('${t.id}')">
          <td>
            <div class="font-semibold text-white text-sm">${t.teamName}</div>
            <div class="text-xs text-slate-500">${t.id}</div>
          </td>
          <td><span class="badge badge-purple">${t.season}</span></td>
          <td class="text-xs text-slate-300">${t.category}</td>
          <td class="text-sm text-slate-300">${Utils.truncate(school?.schoolName,25)||'—'}</td>
          <td class="text-sm text-slate-300">${coach?.fullName||'—'}</td>
          <td>${Utils.statusBadge(t.paymentStatus)}</td>
          <td>${Utils.statusBadge(t.qualificationStatus)}</td>
          <td>
            <div class="flex gap-2">
              ${AUTH.can('teams.write') ? `
              <button onclick="event.stopPropagation();Teams.openForm('${t.id}')" class="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 text-xs transition flex items-center"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/><path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/></svg></button>
              <button onclick="event.stopPropagation();Teams.openQR('${t.id}')" class="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/40 text-green-400 text-xs transition flex items-center"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg></button>
              <button onclick="event.stopPropagation();Teams.confirmDelete('${t.id}')" class="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs transition flex items-center"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'/></svg></button>
              ` : ''}
            </div>
          </td>
        </tr>`;
    }).join('');
    const total = rows.length;
    document.getElementById('teams-count').textContent = `${start+1}–${Math.min(start+this._perPage,total)} of ${total}`;
    Utils.renderPagination('teams-pagination', this._page, Math.ceil(total/this._perPage), 'Teams._goPage');
  },

  async _goPage(p) { Teams._page = p; await Teams._loadTable(); },
  _onSearch: Utils.debounce(async function(v) { Teams._search = v; Teams._page = 1; await Teams._loadTable(); }, 300),
  async _onFilter() {
    this._filterSeason   = document.getElementById('team-season')?.value    || '';
    this._filterCategory = document.getElementById('team-category')?.value  || '';
    this._filterStatus   = document.getElementById('team-reg-status')?.value|| '';
    this._page = 1; await this._loadTable();
  },

  async openForm(id = null) {
    const t       = id ? await DB.getById('teams', id) : null;
    const schools = (await DB.getAll('schools')).filter(s => !s.isDeleted);
    const coaches = (await DB.getAll('coaches')).filter(c => !c.isDeleted);
    const students= (await DB.getAll('students')).filter(s => !s.isDeleted);
    const dbSeasons = (await DB.getAll('seasons')).sort((a,b) => (b.year||0) - (a.year||0));
    const selectedMembers = t?.members || [];

    // Build lookup maps for auto-detection
    const schoolMap = {};  // id → schoolName
    schools.forEach(s => { schoolMap[s.id] = s.schoolName; });
    const studentSchoolMap = {}; // studentId → { schoolId, schoolName }
    students.forEach(s => {
      studentSchoolMap[s.id] = {
        schoolId:   s.schoolId   || s.school_id || '',
        schoolName: schoolMap[s.schoolId || s.school_id] || '—',
      };
    });
    // Serialise for inline use in onclick handlers
    const mapJson = JSON.stringify(studentSchoolMap).replace(/"/g, '&quot;');

    // Derive initial school display from already-selected members
    const _initSchools = [...new Set(
      selectedMembers
        .map(mid => studentSchoolMap[mid]?.schoolName)
        .filter(Boolean)
    )];

    Modal.show(id ? 'Edit Team' : 'New Team', `
      <form id="team-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label class="form-label">Team Name *</label>
          <input class="form-input" name="teamName" value="${t?.teamName||''}" required>
        </div>
        <div><label class="form-label">Season *</label>
          <select class="form-input" name="season">
            <option value="">— Select Season —</option>
            ${dbSeasons.map(s=>`<option value="${s.name}" ${t?.season===s.name?'selected':''}>${s.name}</option>`).join('')}
          </select>
        </div>
        <div><label class="form-label">Category *</label>
          <select class="form-input" name="category">
            ${Seeder.WRO_CATEGORIES.map(c=>`<option ${t?.category===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div><label class="form-label">Age Group</label>
          <select class="form-input" name="ageGroup">
            ${['Elementary','Junior','Senior','Open'].map(a=>`<option ${t?.ageGroup===a?'selected':''}>${a}</option>`).join('')}
          </select>
        </div>

        <!-- School — auto-detected from selected members -->
        <div class="md:col-span-2">
          <label class="form-label">School
            <span class="text-xs font-normal text-slate-500 ml-1">(auto-detected from members)</span>
          </label>
          <div id="team-school-display"
               class="form-input flex flex-wrap gap-1.5 min-h-[42px] items-center"
               style="background:rgba(255,255,255,0.04);cursor:default;">
            ${_initSchools.length
              ? _initSchools.map(n => `<span class="px-2 py-0.5 rounded-full text-xs font-semibold" style="background:rgba(246,201,69,0.18);color:#F6C945;">${n}</span>`).join('')
              : '<span class="text-slate-500 text-sm">Select team members below to auto-detect schools</span>'}
          </div>
          <!-- Hidden field carries the primary school id for saving -->
          <input type="hidden" id="team-school-id" name="schoolId"
                 value="${t?.schoolId || t?.school_id || ''}">
        </div>

        <div><label class="form-label">Coach</label>
          <select class="form-input" name="coachId">
            <option value="">Select Coach</option>
            ${coaches.map(c=>`<option value="${c.id}" ${t?.coachId===c.id?'selected':''}>${c.fullName}</option>`).join('')}
          </select>
        </div>

        <!-- Team Members with per-student school badges -->
        <div class="md:col-span-2"><label class="form-label">Team Members (select 2–3)</label>
          <div class="max-h-52 overflow-y-auto glass-light rounded-xl p-3 space-y-1"
               id="members-list">
            ${students.map(s => {
              const info = studentSchoolMap[s.id];
              return `
              <label class="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded-lg cursor-pointer"
                     title="${info.schoolName}">
                <input type="checkbox" name="members" value="${s.id}"
                       data-school-id="${info.schoolId}"
                       data-school-name="${info.schoolName.replace(/"/g,'&quot;')}"
                       ${selectedMembers.includes(s.id)?'checked':''}
                       class="rounded text-indigo-500"
                       onchange="Teams._onMemberToggle()">
                <span class="text-sm text-slate-200 flex-1">${s.fullName}</span>
                <span class="text-xs text-slate-500">${s.gradeLevel}</span>
                <span class="px-2 py-0.5 rounded-full text-xs ml-1"
                      style="background:rgba(30,158,191,0.15);color:#1E9EBF;white-space:nowrap;">
                  ${info.schoolName}
                </span>
              </label>`;
            }).join('')}
          </div>
        </div>


        <div><label class="form-label">Registration Status</label>
          <select class="form-input" name="registrationStatus">
            ${['registered','confirmed','waitlisted','withdrawn'].map(s=>`<option ${t?.registrationStatus===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">Payment Status
            <span class="text-xs font-normal ml-1" style="color:var(--txt-muted);text-transform:none;letter-spacing:0;">(managed in Payment Management)</span>
          </label>
          <div class="form-input flex items-center gap-2" style="background:rgba(0,0,0,0.06);cursor:default;user-select:none;pointer-events:none;opacity:0.85;">
            ${Utils.statusBadge(t?.paymentStatus || 'unpaid')}
            <span class="text-xs" style="color:var(--txt-muted);">Read-only — update via Payment Management</span>
          </div>
        </div>
        <div><label class="form-label">Qualification Status</label>
          <select class="form-input" name="qualificationStatus">
            ${['pending','qualified','disqualified'].map(s=>`<option ${t?.qualificationStatus===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div><label class="form-label">Status</label>
          <select class="form-input" name="status">
            <option value="active"   ${(t?.status||'active')==='active'  ?'selected':''}>Active</option>
            <option value="inactive" ${t?.status==='inactive'            ?'selected':''}>Inactive</option>
          </select>
        </div>
      </form>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold">Cancel</button>
       <button onclick="Teams._save('${id||''}')" class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'/><polyline points='17 21 17 13 7 13 7 21'/><polyline points='7 3 7 8 15 8'/></svg> Save Team</button>`,
      'max-w-3xl'
    );
  },

  // Called whenever a member checkbox changes — refreshes the school display
  _onMemberToggle() {
    const checked = [...document.querySelectorAll('#team-form input[name="members"]:checked')];
    const display = document.getElementById('team-school-display');
    const hiddenSchool = document.getElementById('team-school-id');
    if (!display) return;

    // Collect unique school names and IDs from checked members
    const seen = new Map(); // schoolId → schoolName
    checked.forEach(cb => {
      const sid  = cb.dataset.schoolId;
      const name = cb.dataset.schoolName;
      if (sid && !seen.has(sid)) seen.set(sid, name);
    });

    if (seen.size === 0) {
      display.innerHTML = '<span class="text-slate-500 text-sm">Select team members below to auto-detect schools</span>';
      if (hiddenSchool) hiddenSchool.value = '';
    } else {
      display.innerHTML = [...seen.values()]
        .map(n => `<span class="px-2 py-0.5 rounded-full text-xs font-semibold" style="background:rgba(246,201,69,0.18);color:#F6C945;">${n}</span>`)
        .join('');
      // Store the first school id as the primary (for the teams.school_id FK)
      if (hiddenSchool) hiddenSchool.value = [...seen.keys()][0];
    }
  },

  async _save(id) {
    const form    = document.getElementById('team-form');
    const data    = Object.fromEntries(new FormData(form));
    const members = [...form.querySelectorAll('input[name="members"]:checked')].map(cb => cb.value);
    data.members  = members;
    // Payment status is managed exclusively in Payment Management — never send it from here
    delete data.paymentStatus;
    delete data.payment_status;
    if (!data.teamName.trim()) { Toast.error('Team name is required.'); return; }
    if (id) { await DB.update('teams', id, data); Toast.success('Team updated!'); }
    else    { await DB.insert('teams', data);     Toast.success('Team created!'); }
    Modal.close(); await this._renderStats(); await this._loadTable();
  },

  async confirmDelete(id) {
    const t = await DB.getById('teams', id);
    Modal.confirm(`Delete "${t?.teamName}"?`, async () => { await DB.delete('teams',id); Toast.success('Deleted.'); await Teams._renderStats(); await Teams._loadTable(); });
  },

  async openQR(id) {
    const t = await DB.getById('teams', id);
    Modal.show(`Team QR – ${t?.teamName}`, `
      <div class="flex flex-col items-center gap-4 py-4">
        <div id="qr-container" class="bg-white p-4 rounded-2xl"></div>
        <div class="text-center">
          <div class="text-lg font-bold text-white">${t?.teamName}</div>
          <div class="text-sm text-slate-400">${t?.season} · ${t?.category}</div>
          <div class="text-xs text-slate-500 mt-1">${t?.id}</div>
        </div>
        <button onclick="Teams._printQR()" class="btn-primary px-6 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 6 2 18 2 18 9'/><path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'/><rect x='6' y='14' width='12' height='8'/></svg> Print QR</button>
      </div>`, '', 'max-w-sm'
    );
    setTimeout(() => Utils.generateQR('qr-container', `WRO-PH|${t?.id}|${t?.teamName}|${t?.season}`, 200), 100);
  },

  _printQR() {
    window.print();
  },

  async viewDetail(id) {
    const t       = await DB.getById('teams', id);
    if (!t) return;
    const coach   = await DB.getById('coaches', t.coachId);

    // Load both students and schools in one pass
    const _allStudents  = await DB.getAll('students');
    const _allSchools   = await DB.getAll('schools');
    const _sMap  = {};  _allStudents.forEach(s => { _sMap[s.id]  = s; });
    const _scMap = {};  _allSchools.forEach(s  => { _scMap[s.id] = s; });

    const members = (t.members || []).map(mid => _sMap[mid]).filter(Boolean);

    // Derive unique school names from member records for the header
    const memberSchools = [...new Map(
      members
        .filter(m => m.schoolId || m.school_id)
        .map(m => {
          const sid = m.schoolId || m.school_id;
          return [sid, _scMap[sid]?.schoolName || sid];
        })
    ).values()];

    // Fallback to team.school_id if no member school data available
    const schoolDisplay = memberSchools.length
      ? memberSchools.join(', ')
      : (_scMap[t.schoolId]?.schoolName || '—');

    const pay = await DB.query('payments', p => p.teamId === id)[0];

    Modal.show(t.teamName, `
      <div class="grid grid-cols-2 gap-3 text-sm mb-4">
        <div><span class="text-slate-500">Season:</span> <span class="text-slate-200">${t.season}</span></div>
        <div><span class="text-slate-500">Category:</span> <span class="text-slate-200">${t.category}</span></div>
        <div class="${memberSchools.length > 1 ? 'col-span-2' : ''}">
          <span class="text-slate-500">School${memberSchools.length > 1 ? 's' : ''}:</span>
          <span class="text-slate-200">${schoolDisplay}</span>
          ${memberSchools.length > 1 ? '<span class="ml-2 px-1.5 py-0.5 rounded text-xs font-semibold" style="background:rgba(30,158,191,0.18);color:#1E9EBF;">Multi-school</span>' : ''}
        </div>
        <div><span class="text-slate-500">Coach:</span> <span class="text-slate-200">${coach?.fullName||'—'}</span></div>

        <div><span class="text-slate-500">Registration:</span> ${Utils.statusBadge(t.registrationStatus)}</div>
        <div><span class="text-slate-500">Payment:</span> ${Utils.statusBadge(t.paymentStatus)}</div>
        <div><span class="text-slate-500">Qualification:</span> ${Utils.statusBadge(t.qualificationStatus)}</div>
        ${pay ? `<div><span class="text-slate-500">Fee:</span> <span class="text-slate-200">${Utils.formatCurrency(pay.registrationFee)}</span></div>` : ''}
      </div>
      <div class="mt-4">
        <div class="text-xs text-slate-500 uppercase font-semibold mb-2">Team Members</div>
        <div class="space-y-2">
          ${members.map(m => {
            const sid        = m.schoolId || m.school_id;
            const schoolName = _scMap[sid]?.schoolName || null;
            const gColor     = m.gender === 'Female'
              ? 'from-pink-500 to-rose-600'
              : 'from-indigo-500 to-purple-600';
            return `
            <div class="flex items-center gap-3 p-2 glass-light rounded-lg">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br ${gColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                ${m.fullName.charAt(0)}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm text-white font-medium">${m.fullName}</div>
                <div class="text-xs text-slate-500">${m.gradeLevel} · ${m.gender}</div>
                ${schoolName ? `<div class="text-xs mt-0.5" style="color:#1E9EBF;">
                  <svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='display:inline;vertical-align:middle;margin-right:3px'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg>${schoolName}
                </div>` : ''}
              </div>
            </div>`;
          }).join('')}
          ${members.length === 0 ? '<p class="text-slate-500 text-sm">No members assigned.</p>' : ''}
        </div>
      </div>`, '', 'max-w-xl');
  },

  async exportCSV() {
    const _schoolsMap = await DB.getLookup('schools');
    const _coachesMap = await DB.getLookup('coaches');
    const rows = await this._getData();
    Utils.downloadCSV('WRO_Teams.csv',
      ['ID','Team Name','Season','Category','Age Group','School','Coach','Registration','Payment','Qualification'],
      rows.map(t => {
        const sc = _schoolsMap[t.schoolId];
        const co = _coachesMap[t.coachId];
        return [t.id,t.teamName,t.season,t.category,t.ageGroup,sc?.schoolName||'',co?.fullName||'',t.registrationStatus,t.paymentStatus,t.qualificationStatus];
      })
    );
    Toast.success('Team list exported!');
  },
};

window.Teams = Teams;
