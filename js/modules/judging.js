// ============================================================
// Module 6 – Judging & Scoring
// ============================================================

const Judging = {
  _page: 1, _perPage: 15, _search: '', _filterCategory: '',

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-view space-y-6">
        <div class="flex flex-wrap items-center gap-3">
          <div class="search-box flex-1 min-w-56">
            <span class="search-icon" style="display:flex;align-items:center"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input id="judging-search" type="text" class="form-input pl-10" placeholder="Search by team or judge..." oninput="Judging._onSearch(this.value)">
          </div>
          <select id="judging-category" class="form-input w-auto" onchange="Judging._onFilter()">
            <option value="">All Categories</option>
            ${Seeder.WRO_CATEGORIES.map(c=>`<option>${c}</option>`).join('')}
          </select>
          ${AUTH.can('judging.write') ? `
          <button onclick="Judging.openForm()" class="btn-primary text-white px-4 py-2 rounded-xl text-sm font-semibold">+ Add Score</button>` : ''}
          <button onclick="Judging.exportCSV()" class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button>
        </div>

        <!-- Live Rankings Banner -->
        <div class="glass rounded-2xl p-6 border border-indigo-500/20">
          <div class="flex items-center gap-3 mb-4">
            <div class="pulse-dot"></div>
            <h3 class="text-sm font-semibold text-white">Live Rankings – Top 10</h3>
          </div>
          <div id="rankings-list" class="space-y-2"></div>
        </div>

        <!-- Score Records Table -->
        <div class="glass rounded-2xl overflow-hidden">
          <div class="p-4 border-b border-slate-700/50">
            <h3 class="text-sm font-semibold text-slate-300">Score Records</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr><th>Team</th><th>Judge</th><th>Category</th><th>Design</th><th>Programming</th><th>Mission</th><th>Final Score</th><th>Rank</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody id="judging-tbody"></tbody>
            </table>
          </div>
          <div class="flex items-center justify-between p-4 border-t border-slate-700/50">
            <span id="judging-count" class="text-slate-400 text-sm"></span>
            <div id="judging-pagination" class="flex gap-1"></div>
          </div>
        </div>
      </div>`;
    await this._renderRankings();
    await this._loadTable();
  },

  async _renderRankings() {
    const _teamsMap = await DB.getLookup('teams');
    const all    = (await DB.getAll('judging')).filter(j => !j.isDeleted && j.finalScore != null);
    const sorted = all.sort((a,b) => (b.finalScore||0) - (a.finalScore||0)).slice(0,10);
    const el     = document.getElementById('rankings-list');
    if (!el) return;
    if (sorted.length === 0) { el.innerHTML = '<p class="text-slate-500 text-sm">No scores recorded yet.</p>'; return; }
    const rankColors = ['#D4A017','#a89060','#cd7f32'];
    const rankLabels = ['1st','2nd','3rd'];
    el.innerHTML = sorted.map((j, idx) => {
      const team = _teamsMap[j.teamId];
      const rankEl = idx < 3
        ? `<span style="color:${rankColors[idx]};font-weight:700;font-size:13px;width:32px;text-align:center;display:inline-block">${rankLabels[idx]}</span>`
        : `<span style="color:#5a6a8a;font-size:13px;width:32px;text-align:center;display:inline-block">${idx+1}.</span>`;
      const barW  = Math.round(((j.finalScore||0)/100)*100);
      return `
        <div class="flex items-center gap-3">
          ${rankEl}
          <div class="flex-1">
            <div class="flex justify-between text-sm mb-1">
              <span class="text-white font-medium">${team?.teamName || j.teamId}</span>
              <span class="text-indigo-400 font-bold">${j.finalScore} pts</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${barW}%"></div>
            </div>
          </div>
        </div>`;
    }).join('');
  },

  async _getData() {
    let rows = (await DB.getAll('judging')).filter(r => !r.isDeleted);
    if (this._search) {
      const q = this._search.toLowerCase();
      const _teamsMap = await DB.getLookup('teams');
      rows = rows.filter(r => {
        const team = _teamsMap[r.teamId];
        return team?.teamName?.toLowerCase().includes(q) || r.judgeName?.toLowerCase().includes(q);
      });
    }
    if (this._filterCategory) rows = rows.filter(r => r.category === this._filterCategory);
    return rows.sort((a,b) => (b.finalScore||0)-(a.finalScore||0));
  },

  async _loadTable() {
    const _teamsMap = await DB.getLookup('teams');
    const rows  = await this._getData();
    const start = (this._page - 1) * this._perPage;
    const page  = rows.slice(start, start + this._perPage);
    const tbody = document.getElementById('judging-tbody');
    if (!tbody) return;
    if (page.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><div style="opacity:0.3;display:flex;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a89060" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><div class="text-slate-300 text-lg font-semibold mt-2">No scores yet</div></div></td></tr>`;
      return;
    }
    const rankColors2 = ['#D4A017','#a89060','#cd7f32'];
    const rankLabels2 = ['1st','2nd','3rd'];
    tbody.innerHTML = page.map((j,idx) => {
      const team = _teamsMap[j.teamId];
      const rankBadge = idx < 3
        ? `<span style="color:${rankColors2[idx]};font-weight:700">${rankLabels2[idx]}</span>`
        : `<span style="color:#5a6a8a">#${j.ranking || idx+1+start}</span>`;
      return `
        <tr class="table-row">
          <td>
            <div class="font-semibold text-white text-sm">${team?.teamName || j.teamId}</div>
            <div class="text-xs text-slate-500">${team?.category || ''}</div>
          </td>
          <td class="text-sm text-slate-300">${j.judgeName}</td>
          <td class="text-xs text-slate-400">${j.category}</td>
          <td class="text-center text-white font-medium">${j.criteria?.robotDesign ?? '—'}</td>
          <td class="text-center text-white font-medium">${j.criteria?.programming ?? '—'}</td>
          <td class="text-center text-white font-medium">${j.criteria?.missionPoints ?? '—'}</td>
          <td class="text-center">
            <span class="text-xl font-bold ${j.finalScore >= 90 ? 'text-yellow-400' : j.finalScore >= 75 ? 'text-green-400' : 'text-slate-300'}">
              ${j.finalScore ?? '—'}
            </span>
          </td>
          <td class="text-center text-lg">${rankBadge}</td>
          <td>${Utils.statusBadge(j.status)}</td>
          <td>
            <div class="flex gap-2">
              ${AUTH.can('judging.write') ? `
          <button onclick="Judging.openForm('${j.id}')" class="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 text-xs transition flex items-center"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/><path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/></svg></button>
              ` : ''}
            </div>
          </td>
        </tr>`;
    }).join('');
    const total = rows.length;
    document.getElementById('judging-count').textContent = `${total} score records`;
    Utils.renderPagination('judging-pagination', this._page, Math.ceil(total/this._perPage), 'Judging._goPage');
  },

  async _goPage(p) { Judging._page = p; await Judging._loadTable(); },
  _onSearch: Utils.debounce(async function(v) { Judging._search = v; Judging._page = 1; await Judging._loadTable(); }, 300),
  async _onFilter() { this._filterCategory = document.getElementById('judging-category')?.value||''; this._page=1; await this._loadTable(); },

  async openForm(id = null) {
    const j     = id ? await DB.getById('judging', id) : null;
    const teams = (await DB.getAll('teams')).filter(t => !t.isDeleted);
    Modal.show(id ? 'Edit Score' : 'Submit Score', `
      <form id="judging-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2"><label class="form-label">Team *</label>
          <select class="form-input" name="teamId" required>
            <option value="">Select Team</option>
            ${teams.map(t=>`<option value="${t.id}" ${j?.teamId===t.id?'selected':''}>${t.teamName} (${t.season})</option>`).join('')}
          </select>
        </div>
        <div><label class="form-label">Judge Name *</label>
          <input class="form-input" name="judgeName" value="${j?.judgeName||AUTH.currentUser()?.name||''}" required>
        </div>
        <div><label class="form-label">Category</label>
          <select class="form-input" name="category">
            ${Seeder.WRO_CATEGORIES.map(c=>`<option ${j?.category===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>

        <div class="md:col-span-2">
          <div class="text-xs text-slate-400 font-semibold uppercase mb-3">Scoring Criteria</div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="form-label">Robot Design (0–20)</label>
              <input class="form-input" type="number" name="robotDesign" min="0" max="20" value="${j?.criteria?.robotDesign||0}" oninput="Judging._calcTotal()">
            </div>
            <div>
              <label class="form-label">Programming (0–20)</label>
              <input class="form-input" type="number" name="programming" min="0" max="20" value="${j?.criteria?.programming||0}" oninput="Judging._calcTotal()">
            </div>
            <div>
              <label class="form-label">Mission Points (0–60)</label>
              <input class="form-input" type="number" name="missionPoints" min="0" max="60" value="${j?.criteria?.missionPoints||0}" oninput="Judging._calcTotal()">
            </div>
          </div>
        </div>
        <div class="md:col-span-2">
          <div class="glass-light rounded-xl p-4 text-center">
            <div class="text-sm text-slate-400 mb-1">Total Score</div>
            <div id="total-score-display" class="text-4xl font-black gradient-text">0</div>
            <div class="text-xs text-slate-500">out of 100</div>
          </div>
        </div>
        <div class="md:col-span-2"><label class="form-label">Comments</label>
          <textarea class="form-input" name="comments" rows="3">${j?.comments||''}</textarea>
        </div>
        <div><label class="form-label">Violations</label>
          <input class="form-input" name="violations" value="${j?.violations||'None'}">
        </div>
        <div><label class="form-label">Status</label>
          <select class="form-input" name="status">
            ${['draft','submitted','finalized'].map(s=>`<option ${j?.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </form>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold">Cancel</button>
       <button onclick="Judging._save('${id||''}')" class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'/><polyline points='17 21 17 13 7 13 7 21'/><polyline points='7 3 7 8 15 8'/></svg> Submit Score</button>`,
      'max-w-3xl'
    );
    setTimeout(() => Judging._calcTotal(), 100);
  },

  _calcTotal() {
    const d = parseInt(document.querySelector('[name="robotDesign"]')?.value||0);
    const p = parseInt(document.querySelector('[name="programming"]')?.value||0);
    const m = parseInt(document.querySelector('[name="missionPoints"]')?.value||0);
    const total = d + p + m;
    const el = document.getElementById('total-score-display');
    if (el) el.textContent = total;
  },

  async _save(id) {
    const form = document.getElementById('judging-form');
    const raw  = Object.fromEntries(new FormData(form));
    const data = {
      teamId:    raw.teamId,
      judgeName: raw.judgeName,
      category:  raw.category,
      criteria:  { robotDesign: +raw.robotDesign, programming: +raw.programming, missionPoints: +raw.missionPoints },
      score:     +raw.robotDesign + +raw.programming + +raw.missionPoints,
      finalScore:+raw.robotDesign + +raw.programming + +raw.missionPoints,
      comments:  raw.comments,
      violations:raw.violations,
      status:    raw.status,
    };
    if (!data.teamId) { Toast.error('Team is required.'); return; }
    if (id) { await DB.update('judging', id, data); Toast.success('Score updated!'); }
    else    { await DB.insert('judging', data);     Toast.success('Score submitted!'); }
    Modal.close(); await this._renderRankings(); await this._loadTable();
  },

  async exportCSV() {
    const _teamsMap = await DB.getLookup('teams');
    const rows = await this._getData();
    Utils.downloadCSV('WRO_Scores.csv',
      ['ID','Team','Judge','Category','Robot Design','Programming','Mission Points','Final Score','Ranking','Violations','Status'],
      rows.map(j => {
        const t = _teamsMap[j.teamId];
        return [j.id,t?.teamName||'',j.judgeName,j.category,j.criteria?.robotDesign,j.criteria?.programming,j.criteria?.missionPoints,j.finalScore,j.ranking,j.violations,j.status];
      })
    );
    Toast.success('Scores exported!');
  },
};

window.Judging = Judging;
