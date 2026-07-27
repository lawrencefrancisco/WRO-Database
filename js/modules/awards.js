// ============================================================
// Module 7 – Awards & Recognition
// ============================================================

const Awards = {
  _page: 1, _perPage: 15, _search: '', _filterYear: '',

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-view space-y-6">
        <!-- Hall of Fame Banner -->
        <div class="glass rounded-2xl p-6 text-center border border-yellow-500/20"
             style="background: linear-gradient(135deg, rgba(245,158,11,0.08), rgba(168,85,247,0.05));">
          <div class="flex justify-center mb-3"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F6C945" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg></div>
          <h2 class="text-2xl font-black text-white mb-1">WRO Philippines Hall of Fame</h2>
          <p class="text-slate-400 text-sm">Celebrating excellence in robotics across all seasons</p>
          <div class="grid grid-cols-3 gap-4 mt-4" id="hof-stats"></div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="search-box flex-1 min-w-56">
            <span class="search-icon" style="display:flex;align-items:center"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input id="award-search" type="text" class="form-input pl-10" placeholder="Search awards..." oninput="Awards._onSearch(this.value)">
          </div>
          <select id="award-year" class="form-input w-auto" onchange="Awards._onFilter()">
            <option value="">All Years</option>
            ${Awards._yearOptions()}
          </select>
          ${AUTH.can('awards.write') ? `
          <button onclick="Awards.openForm()" class="btn-primary text-white px-4 py-2 rounded-xl text-sm font-semibold">+ Add Award</button>` : ''}
          <button onclick="Awards.exportCSV()" class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button>
        </div>

        <!-- Champion Schools -->
        <div class="glass rounded-2xl p-6">
          <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F6C945" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Most Awarded Schools</h3>
          <div id="top-schools" class="grid grid-cols-1 md:grid-cols-3 gap-3"></div>
        </div>

        <div class="glass rounded-2xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr><th>Team</th><th>School</th><th>Category</th><th>Award</th><th>Year</th><th>Event</th><th>Certificate</th><th>Actions</th></tr>
              </thead>
              <tbody id="awards-tbody"></tbody>
            </table>
          </div>
          <div class="flex items-center justify-between p-4 border-t border-slate-700/50">
            <span id="awards-count" class="text-slate-400 text-sm"></span>
            <div id="awards-pagination" class="flex gap-1"></div>
          </div>
        </div>
      </div>`;
    await this._renderHOF();
    await this._renderTopSchools();
    await this._loadTable();
  },

  async _renderHOF() {
    const all = (await DB.getAll('awards')).filter(a => !a.isDeleted);
    const champions = all.filter(a => a.award === 'Champion').length;
    const _si = (d,c) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    document.getElementById('hof-stats').innerHTML = [
      { label:'Total Awards',  value: all.length,   icon: _si('<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>','#F6C945') },
      { label:'Champions',     value: champions,    icon: _si('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>','#e8c027') },
      { label:'Competitions',  value: [...new Set(all.map(a=>a.year))].length, icon: _si('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>','#8338ec') },
    ].map(s=>`
      <div class="glass-light rounded-xl p-3 text-center">
        <div class="flex justify-center mb-1">${s.icon}</div>
        <div class="text-2xl font-bold text-white">${s.value}</div>
        <div class="text-xs text-slate-400">${s.label}</div>
      </div>`).join('');
  },

  async _renderTopSchools() {
    // School ranking: prefer snapshot_team data for historical accuracy.
    // If the team has a frozen snapshot, use schools from it; otherwise fall back to live joins.
    const allAwards    = (await DB.getAll('awards')).filter(a => !a.isDeleted);
    const _teamsMap    = await DB.getLookup('teams');
    const _studentsMap = await DB.getLookup('students');
    const _schoolsMap  = await DB.getLookup('schools');

    const schoolCounts   = {};
    const schoolNames    = {};  // sid -> best-known name

    allAwards.forEach(a => {
      // 1. Prefer snapshot data – fully historical
      if (a.snapshotTeam && a.snapshotTeam.schools && a.snapshotTeam.schools.length > 0) {
        a.snapshotTeam.schools.forEach(sc => {
          schoolCounts[sc.id] = (schoolCounts[sc.id] || 0) + 1;
          schoolNames[sc.id]  = sc.schoolName; // frozen name
        });
        return;
      }

      // 2. Fallback: live join via team -> members -> student -> school
      const team = _teamsMap[a.teamId];
      const sIds = new Set();
      if (team && team.members && team.members.length > 0) {
        team.members.forEach(mid => {
          const sid = _studentsMap[mid]?.schoolId;
          if (sid) sIds.add(sid);
        });
      }
      if (sIds.size === 0 && team && team.schoolId) sIds.add(team.schoolId);

      sIds.forEach(sid => {
        schoolCounts[sid] = (schoolCounts[sid] || 0) + 1;
        if (!schoolNames[sid]) schoolNames[sid] = _schoolsMap[sid]?.schoolName || null;
      });
    });

    const sorted = Object.entries(schoolCounts).sort((a,b) => b[1] - a[1]).slice(0,6);
    const rankColors = ['#F6C945','#F6C945','#cd7f32','#5a6a8a','#5a6a8a','#5a6a8a'];
    const rankLabels = ['1st','2nd','3rd','4th','5th','6th'];
    
    document.getElementById('top-schools').innerHTML = sorted.map(([sid, count], idx) => {
      const name  = schoolNames[sid] || _schoolsMap[sid]?.schoolName || 'Unknown';
      const color = rankColors[idx];
      return `
        <div class="glass-light rounded-xl p-4 flex items-center gap-3">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold" style="background:rgba(22,32,56,0.9);color:${color};border:1px solid ${color}40">${rankLabels[idx]}</div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-white truncate">${name}</div>
            <div class="text-xs text-slate-400">${count} award${count!==1?'s':''}</div>
          </div>
        </div>`;
    }).join('') || '<p class="text-slate-500 text-sm col-span-3">No data yet</p>';
  },

  async _getData() {
    let rows = (await DB.getAll('awards')).filter(r => !r.isDeleted);
    if (this._search) {
      const q = this._search.toLowerCase();
      rows = rows.filter(r => r.award?.toLowerCase().includes(q) || r.event?.toLowerCase().includes(q));
    }
    if (this._filterYear) rows = rows.filter(r => String(r.year) === String(this._filterYear));
    return rows.sort((a,b) => b.year - a.year);
  },

  async _loadTable() {
    const _teamsMap = await DB.getLookup('teams');
    const _schoolsMap = await DB.getLookup('schools');
    const _competitionsMap = await DB.getLookup('competitions');
    const _studentsMap = await DB.getLookup('students');
    const rows  = await this._getData();
    const start = (this._page - 1) * this._perPage;
    const page  = rows.slice(start, start + this._perPage);
    const tbody = document.getElementById('awards-tbody');
    if (!tbody) return;
    if (page.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div style="opacity:0.3;display:flex;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F6C945" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg></div><div class="text-slate-300 text-lg mt-2">No awards yet</div></div></td></tr>`;
      return;
    }
    tbody.innerHTML = page.map(a => {
      // Prefer frozen snapshot for historical accuracy; fall back to live joins
      let teamName, schoolDisplay;

      if (a.snapshotTeam) {
        teamName      = a.snapshotTeam.teamName || '—';
        const schools = a.snapshotTeam.schools  || [];
        schoolDisplay = schools.map(s => s.schoolName).filter(Boolean).join(', ') || '—';
      } else {
        const team   = _teamsMap[a.teamId];
        teamName     = team?.teamName || '—';
        let sNames   = [];
        if (team && team.members && team.members.length > 0) {
          const sIds = new Set(team.members.map(mid => _studentsMap[mid]?.schoolId).filter(Boolean));
          sNames     = Array.from(sIds).map(sid => _schoolsMap[sid]?.schoolName).filter(Boolean);
        }
        if (sNames.length === 0 && team && team.schoolId) sNames = [_schoolsMap[team.schoolId]?.schoolName];
        schoolDisplay = sNames.filter(Boolean).join(', ') || '—';
      }
      
      const comp = _competitionsMap[a.competitionId];
      const compDisplay = comp ? comp.name : (a.event || '—');

      const awardIcon = a.award==='Champion'
        ? `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#F6C945' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`
        : a.award?.includes('Runner')
          ? `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#F6C945' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='8' r='6'/><path d='M15.477 12.89 17 22l-5-3-5 3 1.523-9.11'/></svg>`
          : `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#cd7f32' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='8' r='6'/><path d='M15.477 12.89 17 22l-5-3-5 3 1.523-9.11'/></svg>`;
      return `
        <tr class="table-row">
          <td>
            <div class="font-semibold text-white text-sm">${teamName}</div>
            <div class="text-xs text-slate-500">${a.category}</div>
          </td>
          <td class="text-sm text-slate-300">${Utils.truncate(schoolDisplay,25)}</td>
          <td class="text-xs text-slate-400">${a.category}</td>
          <td>
            <div class="flex items-center gap-2">
              <span>${awardIcon}</span>
              <span class="text-sm font-semibold text-white">${a.award}</span>
            </div>
          </td>
          <td><span class="badge badge-purple">${a.year}</span></td>
          <td class="text-xs text-slate-400">${Utils.truncate(compDisplay,30)}</td>
          <td>${a.hasCertificate ? `<span class="badge badge-green"><svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='display:inline;vertical-align:middle'><polyline points='20 6 9 17 4 12'/></svg> Issued</span>` : '<span class="badge badge-gray">Pending</span>'}</td>
          <td>
            <div class="flex gap-2">
              ${AUTH.can('awards.write') ? `
              <button onclick="Awards.openForm('${a.id}')" class="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 text-xs transition flex items-center"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/><path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/></svg></button>
              <button onclick="Awards.confirmDelete('${a.id}')" class="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs transition flex items-center"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'/></svg></button>
              ` : ''}
            </div>
          </td>
        </tr>`;
    }).join('');
    const total = rows.length;
    document.getElementById('awards-count').textContent = `${total} awards`;
    Utils.renderPagination('awards-pagination', this._page, Math.ceil(total/this._perPage), 'Awards._goPage');
  },

  async _goPage(p) { Awards._page = p; await Awards._loadTable(); },
  _onSearch: Utils.debounce(async function(v) { Awards._search = v; Awards._page = 1; await Awards._loadTable(); }, 300),
  async _onFilter() { this._filterYear = document.getElementById('award-year')?.value||''; this._page=1; await this._loadTable(); },

  // Returns year <option> tags from 2022 to current year + 1
  _yearOptions(selected = null) {
    const end = new Date().getFullYear() + 1;
    const years = [];
    for (let y = 2022; y <= end; y++) years.push(y);
    return years.map(y => `<option value="${y}" ${selected == y ? 'selected' : ''}>${y}</option>`).join('');
  },

  async openForm(id = null) {
    const a      = id ? await DB.getById('awards', id) : null;
    const teams  = (await DB.getAll('teams')).filter(t => !t.isDeleted);
    const schools= (await DB.getAll('schools')).filter(s => !s.isDeleted);
    const coaches= (await DB.getAll('coaches')).filter(c => !c.isDeleted);
    const students= (await DB.getAll('students')).filter(s => !s.isDeleted);
    const competitions = (await DB.getAll('competitions')).filter(c => !c.isDeleted);

    // Pre-calculate schools and coaches per team for the UI map
    const _sMap = {}; schools.forEach(s => _sMap[s.id] = s.schoolName);
    const _cMap = {}; coaches.forEach(c => _cMap[c.id] = c.fullName);
    const _stMap = {}; students.forEach(s => _stMap[s.id] = s);

    const teamMetaMap = {};
    teams.forEach(t => {
      // Get all unique schools from team members, fallback to team.schoolId
      let sNames = [];
      if (t.members && t.members.length > 0) {
        const sIds = new Set(t.members.map(mid => _stMap[mid]?.schoolId).filter(Boolean));
        sNames = Array.from(sIds).map(sid => _sMap[sid]).filter(Boolean);
      }
      if (sNames.length === 0 && t.schoolId) sNames = [_sMap[t.schoolId]];

      // Get all coach names
      const cNames = (t.coaches || []).map(cid => _cMap[cid]).filter(Boolean);

      teamMetaMap[t.id] = {
        schools: sNames.length > 0 ? sNames : ['No School assigned'],
        coaches: cNames.length > 0 ? cNames : ['No Coach assigned'],
        category: t.category || '',
        season: t.season || ''
      };
    });
    window._awardsTeamMetaMap = teamMetaMap;

    Modal.show(id ? 'Edit Award' : 'Add Award', `
      <form id="award-form" class="grid grid-cols-1 md:grid-cols-2 gap-4" onsubmit="event.preventDefault();">

        <!-- Team selector – spans full width -->
        <div class="md:col-span-2"><label class="form-label">Team <span class="text-red-400">*</span></label>
          <select class="form-input" name="teamId" id="award-team-select" onchange="Awards._onTeamChange()">
            <option value="">— Select Team —</option>
            ${teams.map(t=>`<option value="${t.id}" ${a?.teamId===t.id?'selected':''}>${Utils.esc(t.teamName)} (${t.season||''})</option>`).join('')}
          </select>
        </div>

        <!-- Auto-detected school badges -->
        <div><label class="form-label">School(s)
          <span class="text-xs font-normal text-slate-500 ml-1">(auto-detected from team)</span>
        </label>
          <div id="award-school-display" class="form-input flex flex-wrap gap-1.5 min-h-[42px] items-center" style="background:rgba(255,255,255,0.04);cursor:default;">
            <span class="text-slate-500 text-sm">Select a team first</span>
          </div>
        </div>

        <!-- Auto-detected coach badges -->
        <div><label class="form-label">Coach(es)
          <span class="text-xs font-normal text-slate-500 ml-1">(auto-detected from team)</span>
        </label>
          <div id="award-coach-display" class="form-input flex flex-wrap gap-1.5 min-h-[42px] items-center" style="background:rgba(255,255,255,0.04);cursor:default;">
            <span class="text-slate-500 text-sm">Select a team first</span>
          </div>
        </div>

        <div><label class="form-label">Category</label>
          <select class="form-input" name="category">
            ${Seeder.WRO_CATEGORIES.map(c=>`<option value="${c}" ${a?.category===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>

        <div><label class="form-label">Award <span class="text-red-400">*</span></label>
          <select class="form-input" name="award" required>
            ${Seeder.AWARDS_LIST.map(aw=>`<option value="${aw}" ${a?.award===aw?'selected':''}>${aw}</option>`).join('')}
          </select>
        </div>

        <div><label class="form-label">Year</label>
          <select class="form-input" name="year">
            ${Awards._yearOptions(a?.year)}
          </select>
        </div>

        <!-- Competition dropdown – spans full width -->
        <div class="md:col-span-2"><label class="form-label">Competition</label>
          <select class="form-input" name="competitionId">
            <option value="">— Select Competition —</option>
            ${competitions.map(c => `<option value="${c.id}" ${a?.competitionId===c.id?'selected':''}>${c.name} (${c.season||''})</option>`).join('')}
          </select>
        </div>

        <div><label class="form-label">Trophy</label>
          <select class="form-input" name="hasTrophy">
            <option value="true" ${a?.hasTrophy?'selected':''}>Yes</option>
            <option value="false" ${!a?.hasTrophy?'selected':''}>No</option>
          </select>
        </div>

        <div><label class="form-label">Medal</label>
          <select class="form-input" name="hasMedal">
            <option value="true" ${a?.hasMedal?'selected':''}>Yes</option>
            <option value="false" ${!a?.hasMedal?'selected':''}>No</option>
          </select>
        </div>

        <div><label class="form-label">Certificate</label>
          <select class="form-input" name="hasCertificate">
            <option value="true" ${a?.hasCertificate?'selected':''}>Yes</option>
            <option value="false" ${!a?.hasCertificate?'selected':''}>No</option>
          </select>
        </div>

        <div><label class="form-label">Status</label>
          <select class="form-input" name="status">
            ${['confirmed','pending'].map(s=>`<option ${a?.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>

      </form>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold">Cancel</button>
       <button onclick="Awards._save('${id||''}')" class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'/><polyline points='17 21 17 13 7 13 7 21'/><polyline points='7 3 7 8 15 8'/></svg> Save Award</button>`,
      'max-w-3xl'
    );
    // Trigger team change on load if editing
    setTimeout(() => { if(a?.teamId) Awards._onTeamChange(a.teamId); }, 50);
  },

  _onTeamChange(overrideId = null) {
    const sMap = window._awardsTeamMetaMap || {};
    const teamId = overrideId || document.getElementById('award-team-select')?.value;
    const meta = sMap[teamId];

    const schoolDisp = document.getElementById('award-school-display');
    const coachDisp = document.getElementById('award-coach-display');

    if (!teamId || !meta) {
      if (schoolDisp) schoolDisp.innerHTML = '<span class="text-slate-500 text-sm">Select a team first</span>';
      if (coachDisp) coachDisp.innerHTML = '<span class="text-slate-500 text-sm">Select a team first</span>';
      return;
    }

    if (schoolDisp) {
      schoolDisp.innerHTML = meta.schools.map(s => `<span class="px-2 py-0.5 rounded-full text-xs font-semibold" style="background:rgba(30,158,191,0.15);color:#1E9EBF;">${s}</span>`).join('');
    }
    if (coachDisp) {
      coachDisp.innerHTML = meta.coaches.map(c => `<span class="px-2 py-0.5 rounded-full text-xs font-semibold" style="background:rgba(246,201,69,0.18);color:#F6C945;">${c}</span>`).join('');
    }
  },

  async _save(id) {
    const form = document.getElementById('award-form');
    const data = Object.fromEntries(new FormData(form));
    data.hasTrophy      = data.hasTrophy      === 'true';
    data.hasMedal       = data.hasMedal       === 'true';
    data.hasCertificate = data.hasCertificate === 'true';
    data.year           = parseInt(data.year);
    let res;
    if (id) { res = await DB.update('awards', id, data); }
    else    { res = await DB.insert('awards', data); }
    
    if (!res) return; // Halt on error
    
    Toast.success(id ? 'Award updated!' : 'Award added!');
    Modal.close(); await this._renderHOF(); await this._renderTopSchools(); await this._loadTable();
  },

  async confirmDelete(id) {
    Modal.confirm('Delete this award record?', async () => { await DB.delete('awards',id); Toast.success('Deleted.'); await Awards._renderHOF(); await Awards._renderTopSchools(); await Awards._loadTable(); });
  },

  async exportCSV() {
    const _teamsMap = await DB.getLookup('teams');
    const _schoolsMap = await DB.getLookup('schools');
    const _studentsMap = await DB.getLookup('students');
    const _competitionsMap = await DB.getLookup('competitions');
    const rows = await this._getData();
    Utils.downloadCSV('WRO_Awards.csv',
      ['ID','Team','School','Category','Award','Year','Event','Trophy','Medal','Certificate'],
      rows.map(a => {
        const team = _teamsMap[a.teamId];
        let sNames = [];
        if (team && team.members && team.members.length > 0) {
          const sIds = new Set(team.members.map(mid => _studentsMap[mid]?.schoolId).filter(Boolean));
          sNames = Array.from(sIds).map(sid => _schoolsMap[sid]?.schoolName).filter(Boolean);
        }
        if (sNames.length === 0 && team && team.schoolId) sNames = [_schoolsMap[team.schoolId]?.schoolName];
        const schoolDisplay = sNames.length > 0 ? sNames.join(', ') : '';
        
        const comp = _competitionsMap[a.competitionId];
        const compDisplay = comp ? comp.name : (a.event || '');

        return [a.id,team?.teamName||'',schoolDisplay,a.category,a.award,a.year,compDisplay,a.hasTrophy,a.hasMedal,a.hasCertificate];
      })
    );
    Toast.success('Awards exported!');
  },
};

window.Awards = Awards;
