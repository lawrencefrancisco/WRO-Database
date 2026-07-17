// ============================================================
// Module 8 – Payment Management
// ============================================================

const Payments = {
  _page: 1, _perPage: 15, _search: '', _filterStatus: '',

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-view space-y-6">
        <div class="flex flex-wrap items-center gap-3">
          <div class="search-box flex-1 min-w-56">
            <span class="search-icon" style="display:flex;align-items:center"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input id="pay-search" type="text" class="form-input pl-10" placeholder="Search by team or OR number..." oninput="Payments._onSearch(this.value)">
          </div>
          <select id="pay-status" class="form-input w-auto" onchange="Payments._onFilter()">
            <option value="">All Status</option>
            <option>paid</option><option>unpaid</option><option>partial</option>
          </select>
          ${AUTH.can('payments.write') ? `
          <button onclick="Payments.openForm()" class="btn-primary text-white px-4 py-2 rounded-xl text-sm font-semibold">+ Record Payment</button>` : ''}
          <button onclick="Payments.exportCSV()" class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button>
        </div>

        <!-- Financial Summary -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="pay-stats"></div>

        <!-- Progress Bar -->
        <div class="glass rounded-2xl p-6">
          <div class="flex justify-between text-sm mb-2">
            <span class="text-slate-300">Collection Progress</span>
            <span id="collection-pct" class="text-indigo-400 font-bold">0%</span>
          </div>
          <div class="progress-bar">
            <div id="collection-bar" class="progress-fill" style="width:0%"></div>
          </div>
          <div class="flex justify-between text-xs text-slate-500 mt-2">
            <span id="amount-collected">Collected: ₱0</span>
            <span id="amount-total">Total: ₱0</span>
          </div>
        </div>

        <div class="glass rounded-2xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr><th>Team</th><th>School</th><th>Reg Fee</th><th>Paid</th><th>Balance</th><th>Method</th><th>OR Number</th><th>Date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody id="payments-tbody"></tbody>
            </table>
          </div>
          <div class="flex items-center justify-between p-4 border-t border-slate-700/50">
            <span id="payments-count" class="text-slate-400 text-sm"></span>
            <div id="payments-pagination" class="flex gap-1"></div>
          </div>
        </div>
      </div>`;
    await this._renderStats();
    await this._loadTable();
  },

  async _renderStats() {
    const all       = (await DB.getAll('payments')).filter(p => !p.isDeleted);
    const paid      = all.filter(p => p.status === 'paid');
    const unpaid    = all.filter(p => p.status === 'unpaid');
    const partial   = all.filter(p => p.status === 'partial');
    const totalFee  = all.reduce((s,p) => s + Utils.parseNumber(p.registrationFee), 0);
    const collected = all.reduce((s,p) => s + Utils.parseNumber(p.amountPaid), 0);
    const pct       = totalFee > 0 ? Math.round((collected/totalFee)*100) : 0;

    const _si = (d,c) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    document.getElementById('pay-stats').innerHTML = [
      { label:'Total Registration', value: Utils.formatCurrency(totalFee),           icon: _si('<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>','#F6C945') },
      { label:'Collected',          value: Utils.formatCurrency(collected),           icon: _si('<polyline points="20 6 9 17 4 12"/>','#2dc653') },
      { label:'Outstanding',        value: Utils.formatCurrency(totalFee-collected), icon: _si('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>','#F6C945') },
      { label:'Paid Teams',         value: `${paid.length}/${all.length}`,          icon: _si('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>','#8338ec') },
    ].map(s => `
      <div class="kpi-card rounded-xl p-4">
        <div class="mb-2">${s.icon}</div>
        <div class="text-lg font-bold text-white">${s.value}</div>
        <div class="text-xs text-slate-400 mt-1">${s.label}</div>
      </div>`).join('');

    const bar = document.getElementById('collection-bar');
    const pctEl = document.getElementById('collection-pct');
    if (bar) bar.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    const ce = document.getElementById('amount-collected');
    const te = document.getElementById('amount-total');
    if (ce) ce.textContent = `Collected: ${Utils.formatCurrency(collected)}`;
    if (te) te.textContent = `Total: ${Utils.formatCurrency(totalFee)}`;
  },

  async _getData() {
    let rows = (await DB.getAll('payments')).filter(r => !r.isDeleted);
    if (this._search) {
      const q = this._search.toLowerCase();
      const _teamsMap = await DB.getLookup('teams');
      rows = rows.filter(r => {
        const t = _teamsMap[r.teamId];
        return t?.teamName?.toLowerCase().includes(q) || r.orNumber?.toLowerCase().includes(q);
      });
    }
    if (this._filterStatus) rows = rows.filter(r => r.status === this._filterStatus);
    return rows;
  },

  async _loadTable() {
    const _teamsMap = await DB.getLookup('teams');
    const _schoolsMap = await DB.getLookup('schools');
    const rows  = await this._getData();
    const start = (this._page - 1) * this._perPage;
    const page  = rows.slice(start, start + this._perPage);
    const tbody = document.getElementById('payments-tbody');
    if (!tbody) return;
    if (page.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><div style="opacity:0.3;display:flex;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F6C945" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div><div class="text-slate-300 text-lg mt-2">No payment records</div></div></td></tr>`;
      return;
    }
    tbody.innerHTML = page.map(p => {
      const team   = _teamsMap[p.teamId];
      const school = _schoolsMap[p.schoolId];
      return `
        <tr class="table-row">
          <td>
            <div class="font-semibold text-white text-sm">${team?.teamName || '—'}</div>
            <div class="text-xs text-slate-500">${p.teamId}</div>
          </td>
          <td class="text-sm text-slate-300">${Utils.truncate(school?.schoolName,22)||'—'}</td>
          <td class="text-sm font-semibold text-white">${Utils.formatCurrency(p.registrationFee)}</td>
          <td class="text-sm text-green-400 font-medium">${Utils.formatCurrency(p.amountPaid)}</td>
          <td class="text-sm ${p.balance>0?'text-red-400':'text-green-400'} font-medium">${Utils.formatCurrency(p.balance)}</td>
          <td class="text-sm text-slate-400">${p.paymentMethod || '—'}</td>
          <td class="text-sm font-mono text-slate-300 whitespace-nowrap">${p.orNumber || '—'}</td>
          <td class="text-sm text-slate-400 whitespace-nowrap">${Utils.formatDate(p.paymentDate)}</td>
          <td>${Utils.statusBadge(p.status)}</td>
          <td>
            <div class="flex gap-2">
              ${AUTH.can('payments.write') ? `
              <button onclick="Payments.openForm('${p.id}')" class="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 text-xs transition flex items-center"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/><path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/></svg></button>
              ` : ''}
            </div>
          </td>
        </tr>`;
    }).join('');
    const total = rows.length;
    document.getElementById('payments-count').textContent = `${total} records`;
    Utils.renderPagination('payments-pagination', this._page, Math.ceil(total/this._perPage), 'Payments._goPage');
  },

  async _goPage(p) { Payments._page = p; await Payments._loadTable(); },
  _onSearch: Utils.debounce(async function(v) { Payments._search = v; Payments._page = 1; await Payments._loadTable(); }, 300),
  async _onFilter() { this._filterStatus = document.getElementById('pay-status')?.value||''; this._page=1; await this._loadTable(); },

  async openForm(id = null) {
    const p     = id ? await DB.getById('payments', id) : null;
    const teams = (await DB.getAll('teams')).filter(t => !t.isDeleted);
    const schools = (await DB.getAll('schools')).filter(s => !s.isDeleted);
    const allPayments = await DB.getAll('payments');

    // Build team→school map for auto-detection
    const teamSchoolMap = {};
    const schoolNameMap = {};
    schools.forEach(s => { schoolNameMap[s.id] = s.schoolName; });
    teams.forEach(t => { if (t.schoolId) teamSchoolMap[t.id] = t.schoolId; });

    // Map each team to its payment status
    const payStatusMap = {};
    allPayments.forEach(pay => { payStatusMap[pay.teamId] = pay.status || 'unpaid'; });

    const getStatusBadge = (status) => {
      if (status === 'paid') return `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-500 border border-green-500/20">Paid</span>`;
      if (status === 'partial') return `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-500 border border-orange-500/20">Partial</span>`;
      return `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-500 border border-slate-500/20">Unpaid</span>`;
    };

    Payments._teamListCache = teams.map(t => {
      const status = payStatusMap[t.id] || 'unpaid';
      return { ...t, statusHtml: getStatusBadge(status), schoolName: schoolNameMap[t.schoolId] || 'No School' };
    });

    Modal.show(id ? 'Edit Payment' : 'Record Payment', `
      <div class="flex flex-col md:flex-row gap-6">
        
        <!-- Left Sidebar: Team List -->
        <div class="w-full md:w-1/3 flex flex-col h-[55vh]">
          <h3 class="text-xs font-bold mb-3 uppercase tracking-widest" style="color:var(--txt-muted);">Team Payment Status</h3>
          <input type="text" id="pay-team-search" class="form-input mb-3" placeholder="Search teams..." oninput="Payments._filterTeamList()">
          
          <div id="pay-team-list-container" class="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            ${Payments._renderTeamList(Payments._teamListCache, p?.teamId)}
          </div>
        </div>

        <!-- Right Side: Form -->
        <form id="pay-form" class="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
          <div><label class="form-label">Team *</label>
            <select class="form-input" name="teamId" id="pay-team-select" required onchange="Payments._onTeamChange()">
              <option value="">Select Team</option>
              ${teams.map(t=>`<option value="${t.id}" ${p?.teamId===t.id?'selected':''}>${t.teamName}</option>`).join('')}
            </select>
          </div>
          <div><label class="form-label">School <span class="text-[10px] font-normal ml-1 opacity-70">(auto-detected)</span></label>
            <select class="form-input" name="schoolId" id="pay-school-select">
              <option value="">— auto-detected —</option>
              ${schools.map(s=>`<option value="${s.id}" ${p?.schoolId===s.id?'selected':''}>${s.schoolName}</option>`).join('')}
            </select>
          </div>
          <div><label class="form-label">Registration Fee (₱)</label>
            <input class="form-input" type="number" name="registrationFee" value="${p?.registrationFee||4000}" oninput="Payments._calcBalance()">
          </div>
          <div><label class="form-label">Amount Paid (₱)</label>
            <input class="form-input" type="number" name="amountPaid" value="${p?.amountPaid||0}" oninput="Payments._calcBalance()">
          </div>
          <div><label class="form-label">Balance (₱)</label>
            <input class="form-input" type="number" name="balance" id="balance-field" value="${p?.balance||4000}" readonly>
          </div>
          <div><label class="form-label">Payment Date</label>
            <input class="form-input" type="date" name="paymentDate" value="${p?.paymentDate||''}">
          </div>
          <div><label class="form-label">Payment Method</label>
            <select class="form-input" name="paymentMethod">
              <option value="">Select Method</option>
              ${Seeder.PAYMENT_METHODS.map(m=>`<option ${p?.paymentMethod===m?'selected':''}>${m}</option>`).join('')}
            </select>
          </div>
          <div><label class="form-label">OR Number</label>
            <input class="form-input" name="orNumber" value="${p?.orNumber||''}">
          </div>
          <div><label class="form-label">Sponsorship (₱)</label>
            <input class="form-input" type="number" name="sponsorship" value="${p?.sponsorship||0}">
          </div>
          <div><label class="form-label">Scholarship</label>
            <select class="form-input" name="scholarship">
              ${['None','Partial','Full'].map(s=>`<option ${p?.scholarship===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div><label class="form-label">Status</label>
            <select class="form-input" name="status">
              ${['unpaid','partial','paid'].map(s=>`<option ${p?.status===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
        </form>
      </div>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-slate-500/10" style="border-color:var(--border-primary); color:var(--txt-primary);">Cancel</button>
       <button onclick="Payments._save('${id||''}')" class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'/><polyline points='17 21 17 13 7 13 7 21'/><polyline points='7 3 7 8 15 8'/></svg> Save Payment</button>`,
      'max-w-5xl w-full'
    );

    // Store map on the module for the onchange handler
    Payments._teamSchoolMap = teamSchoolMap;
    setTimeout(() => Payments._calcBalance(), 100);
  },

  _renderTeamList(teams, selectedId) {
    if (!teams.length) return `<div class="text-xs text-center mt-4" style="color:var(--txt-muted);">No teams found</div>`;
    return teams.map(t => `
      <div class="p-3 rounded-xl border cursor-pointer transition-all hover:border-[var(--felta-yellow)] ${t.id === selectedId ? 'border-[var(--felta-yellow)] bg-[var(--felta-yellow)]/10' : ''}" 
           style="border-color:${t.id === selectedId ? 'var(--felta-yellow)' : 'var(--border-primary)'}; background:${t.id === selectedId ? 'rgba(246,201,69,0.05)' : 'transparent'};"
           onclick="Payments._selectTeamFromList('${t.id}')" id="team-list-item-${t.id}">
        <div class="flex justify-between items-start mb-1">
          <div class="font-bold text-sm truncate pr-2" style="color:var(--txt-primary);">${t.teamName}</div>
          <div class="shrink-0">${t.statusHtml}</div>
        </div>
        <div class="text-[10px] truncate" style="color:var(--txt-muted);">${t.schoolName}</div>
      </div>
    `).join('');
  },

  _filterTeamList() {
    const term = document.getElementById('pay-team-search')?.value.toLowerCase() || '';
    const filtered = Payments._teamListCache.filter(t => t.teamName.toLowerCase().includes(term) || t.schoolName.toLowerCase().includes(term));
    const selectedId = document.getElementById('pay-team-select')?.value;
    document.getElementById('pay-team-list-container').innerHTML = Payments._renderTeamList(filtered, selectedId);
  },

  _selectTeamFromList(teamId) {
    const select = document.getElementById('pay-team-select');
    if (select) {
      select.value = teamId;
      Payments._onTeamChange();
    }
    // Update active visual state
    document.querySelectorAll('[id^="team-list-item-"]').forEach(el => {
      el.style.borderColor = 'var(--border-primary)';
      el.style.background = 'transparent';
    });
    const active = document.getElementById(`team-list-item-${teamId}`);
    if (active) {
      active.style.borderColor = 'var(--felta-yellow)';
      active.style.background = 'rgba(246,201,69,0.05)';
    }
  },

  // Auto-fill school when team changes
  _onTeamChange() {
    const teamSel   = document.getElementById('pay-team-select');
    const schoolSel = document.getElementById('pay-school-select');
    if (!teamSel || !schoolSel) return;
    const teamId = teamSel.value;
    const schoolId = Payments._teamSchoolMap?.[teamId];
    if (schoolId) {
      schoolSel.value = schoolId;
    }
    
    // Sync sidebar list active state
    document.querySelectorAll('[id^="team-list-item-"]').forEach(el => {
      el.style.borderColor = 'var(--border-primary)';
      el.style.background = 'transparent';
    });
    if (teamId) {
      const active = document.getElementById(`team-list-item-${teamId}`);
      if (active) {
        active.style.borderColor = 'var(--felta-yellow)';
        active.style.background = 'rgba(246,201,69,0.05)';
        // Smoothly scroll the selected item into view within the container
        active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  },

  _calcBalance() {
    const fee  = parseFloat(document.querySelector('[name="registrationFee"]')?.value||0);
    const paid = parseFloat(document.querySelector('[name="amountPaid"]')?.value||0);
    const bf   = document.getElementById('balance-field');
    if (bf) bf.value = Math.max(0, fee - paid);
  },

  async _save(id) {
    const form = document.getElementById('pay-form');
    const data = Object.fromEntries(new FormData(form));
    if (!data.teamId) { Toast.error('Team is required.'); return; }
    data.registrationFee = parseFloat(data.registrationFee)||0;
    data.amountPaid      = parseFloat(data.amountPaid)||0;
    data.balance         = data.registrationFee - data.amountPaid;
    if (data.balance <= 0) data.status = 'paid';
    else if (data.amountPaid > 0) data.status = 'partial';
    else data.status = 'unpaid';
    if (id) { await DB.update('payments', id, data); Toast.success('Payment updated!'); }
    else    { await DB.insert('payments', data);     Toast.success('Payment recorded!'); }
    Modal.close(); await this._renderStats(); await this._loadTable();
  },

  async exportCSV() {
    const _teamsMap = await DB.getLookup('teams');
    const _schoolsMap = await DB.getLookup('schools');
    const rows = await this._getData();
    Utils.downloadCSV('WRO_Payments.csv',
      ['ID','Team','School','Reg Fee','Amount Paid','Balance','Method','OR Number','Date','Status'],
      rows.map(p => {
        const t = _teamsMap[p.teamId];
        const s = _schoolsMap[p.schoolId];
        return [p.id,t?.teamName||'',s?.schoolName||'',p.registrationFee,p.amountPaid,p.balance,p.paymentMethod||'',p.orNumber||'',p.paymentDate||'',p.status];
      })
    );
    Toast.success('Payments exported!');
  },
};

window.Payments = Payments;

// ============================================================
// Module 9 – Communications (Full Rewrite)
// ============================================================

const Communications = {
  _tab: 'announcements',

  async render() {
    document.getElementById('page-content').innerHTML = `
      <div class="page-view space-y-6">

        <!-- Header -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black" style="color:var(--txt-primary);">Communications Hub</h1>
            <p class="text-sm mt-1" style="color:var(--txt-muted);">Manage announcements, notifications & team communication status</p>
          </div>
          <button onclick="Communications.openAnnouncement()" class="btn-primary px-5 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Announcement
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 p-1 rounded-xl" style="background:var(--bg-surface); border:1px solid var(--border-subtle);">
          ${[['announcements','Announcements','<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>'],
             ['history','Notification History','<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'],
             ['tracker','Team Status Tracker','<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/>']
          ].map(([id, label, paths]) => `
            <button id="comm-tab-${id}" onclick="Communications._switchTab('${id}')"
              class="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                ${Communications._tab === id ? 'text-white' : ''}"
              style="${Communications._tab === id
                ? 'background:var(--felta-yellow); color:#07120c;'
                : 'color:var(--txt-muted);'}">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>
              ${label}
            </button>`).join('')}
        </div>

        <!-- Tab Content -->
        <div id="comm-content"></div>
      </div>`;

    await this._renderTab();
  },

  async _switchTab(tab) {
    this._tab = tab;
    // Update tab button styles
    ['announcements','history','tracker'].forEach(id => {
      const btn = document.getElementById(`comm-tab-${id}`);
      if (!btn) return;
      if (id === tab) {
        btn.style.background = 'var(--felta-yellow)';
        btn.style.color = '#07120c';
      } else {
        btn.style.background = '';
        btn.style.color = 'var(--txt-muted)';
      }
    });
    await this._renderTab();
  },

  async _renderTab() {
    const el = document.getElementById('comm-content');
    if (!el) return;
    if (this._tab === 'announcements') await this._renderAnnouncements(el);
    else if (this._tab === 'history') await this._renderHistory(el);
    else await this._renderTracker(el);
  },

  async _renderAnnouncements(el) {
    const all = (await DB.getAll('announcements')).filter(a => !a.isDeleted);
    const catColors = { general:'#1d6fa4', payment:'#2dc653', qualification:'#e8c027', delegation:'#8338ec', competition:'#e63946' };
    const catIcon   = { general:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', payment:'<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>', qualification:'<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>', delegation:'<path d="M22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>', competition:'<path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/><path d="M4 22h16"/>'};
    const statusBg  = { draft:'rgba(107,116,148,0.15)', published:'rgba(45,198,83,0.12)', archived:'rgba(107,116,148,0.12)' };
    const statusClr = { draft:'#6B7494', published:'#2dc653', archived:'#6B7494' };

    const published = all.filter(a => a.status === 'published').length;
    const drafts    = all.filter(a => a.status === 'draft').length;

    el.innerHTML = `
      <!-- Stats row -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        ${[{l:'Total',v:all.length,c:'#F6C945'},{l:'Published',v:published,c:'#2dc653'},{l:'Drafts',v:drafts,c:'#e8c027'}].map(s=>`
          <div class="glass rounded-xl p-4 flex items-center gap-3">
            <div class="text-2xl font-black" style="color:${s.c};">${s.v}</div>
            <div class="text-sm" style="color:var(--txt-muted);">${s.l}</div>
          </div>`).join('')}
      </div>

      <!-- Announcement Cards -->
      <div class="space-y-4">
        ${all.length === 0 ? `<div class="glass rounded-2xl p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(246,201,69,0.3)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <p style="color:var(--txt-muted);">No announcements yet. Click <strong>New Announcement</strong> to create one.</p>
        </div>` : all.map(a => {
          const img = a.imageUrl || a.image_url;
          return `
          <div class="glass rounded-2xl border transition-all hover:-translate-y-0.5" style="border-color:var(--border-subtle);overflow:hidden;">
            ${img ? `
            <!-- Image banner -->
            <div style="width:100%;max-height:240px;overflow:hidden;background:#0b1524;">
              <img src="${img}" alt="Announcement poster"
                style="width:100%;max-height:240px;object-fit:contain;display:block;background:#0b1524;">
            </div>` : ''}
            <div class="flex items-start justify-between gap-4 p-5">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background:${catColors[a.category] || '#1d6fa4'}20;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${catColors[a.category] || '#1d6fa4'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${catIcon[a.category] || catIcon.general}</svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 class="font-bold text-base" style="color:var(--txt-primary);">${a.title}</h3>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style="background:${statusBg[a.status]||statusBg.draft}; color:${statusClr[a.status]||statusClr.draft};">${a.status}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style="background:${catColors[a.category]||'#1d6fa4'}20; color:${catColors[a.category]||'#1d6fa4'};">${a.category}</span>
                  </div>
                  <p class="text-sm" style="color:var(--txt-muted);line-height:1.6;">${a.body || '—'}</p>
                  <div class="flex flex-wrap gap-4 mt-2.5 text-xs" style="color:var(--txt-muted);">
                    <span>To: <strong style="color:var(--txt-secondary);">${Utils.capitalize(a.recipients || 'all')}</strong></span>
                    <span>${new Date(a.createdAt || a.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</span>
                    ${img ? `<span style="color:#8338ec;">📷 Has image</span>` : ''}
                  </div>
                </div>
              </div>
            </div>
            ${AUTH.can('communications.write') ? `
            <div class="flex gap-2 px-5 pb-4 border-t pt-3" style="border-color:var(--border-subtle);">
              ${a.status === 'draft' ? `<button onclick="Communications.publishAnnouncement('${a.id}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition" style="background:rgba(45,198,83,0.15);color:#2dc653;">Publish</button>` : ''}
              <button onclick="Communications.openAnnouncement('${a.id}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition" style="background:rgba(246,201,69,0.12);color:var(--felta-yellow);">Edit</button>
              <button onclick="Communications.deleteAnnouncement('${a.id}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition" style="background:rgba(230,57,70,0.12);color:#e63946;">Delete</button>
            </div>` : ''}
          </div>`;
        }).join('')}
      </div>`;
  },

  async _renderHistory(el) {
    const logs = await DB._request('GET', '/notifications');
    const rows = Array.isArray(logs) ? logs : [];
    const eventColors = { payment:'#2dc653', qualification:'#e8c027', system:'#1d6fa4', delegation:'#8338ec', general:'#F6C945' };

    el.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold" style="color:var(--txt-primary);">Event Notification Log</h3>
        ${rows.some(r=>!r.is_read) ? `<button onclick="Communications.markAllRead()" class="text-xs px-3 py-1.5 rounded-lg font-semibold" style="background:rgba(246,201,69,0.12);color:var(--felta-yellow);">Mark All Read</button>` : ''}
      </div>
      <div class="glass rounded-2xl overflow-hidden">
        ${rows.length === 0 ? `<div class="p-12 text-center" style="color:var(--txt-muted);">No notifications logged yet. Events like payments and qualifications will appear here automatically.</div>` :
          `<div class="divide-y" style="border-color:var(--border-subtle);">
            ${rows.map(n => `
              <div class="flex items-start gap-4 p-4 transition-all ${!n.is_read ? 'bg-[var(--felta-yellow)]/[0.03]' : ''}">
                <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style="background:${eventColors[n.event_type]||'#1d6fa4'}20;">
                  <div class="w-2 h-2 rounded-full" style="background:${eventColors[n.event_type]||'#1d6fa4'};"></div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-0.5">
                    <span class="font-semibold text-sm" style="color:var(--txt-primary);">${n.title}</span>
                    ${!n.is_read ? `<span class="w-1.5 h-1.5 rounded-full bg-[var(--felta-yellow)] shrink-0"></span>` : ''}
                  </div>
                  <p class="text-xs" style="color:var(--txt-muted);">${n.message || ''}</p>
                  <div class="flex gap-3 mt-1 text-[10px]" style="color:var(--txt-muted);">
                    ${n.team_name ? `<span>Team: <strong style="color:var(--txt-secondary);">${n.team_name}</strong></span>` : ''}
                    <span>${new Date(n.created_at).toLocaleString('en-PH',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                    <span>via ${n.triggered_by || 'System'}</span>
                  </div>
                </div>
                ${!n.is_read ? `<button onclick="Communications.markRead('${n.id}')" class="text-[10px] px-2 py-1 rounded shrink-0 transition" style="background:var(--bg-surface);color:var(--txt-muted);">Read</button>` : ''}
              </div>`).join('')}
          </div>`}
      </div>`;
  },

  async _renderTracker(el) {
    const all       = (await DB.getAll('communications')).filter(c => !c.isDeleted);
    const _teamsMap = await DB.getLookup('teams');

    el.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold" style="color:var(--txt-primary);">Team Communication Status</h3>
        <button onclick="Communications.exportCSV()" class="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition" style="background:var(--bg-surface);color:var(--txt-muted);border:1px solid var(--border-subtle);">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </div>
      <div class="glass rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead><tr>
              <th>Team</th>
              <th class="text-center">Reg. Confirmed</th>
              <th class="text-center">Payment Confirmed</th>
              <th class="text-center">Certificate Sent</th>
              <th class="text-center">Announcement</th>
              <th class="text-center">Feedback</th>
              ${AUTH.can('communications.write') ? '<th>Actions</th>' : ''}
            </tr></thead>
            <tbody>
              ${all.length === 0 ? `<tr><td colspan="7"><div class="empty-state" style="color:var(--txt-muted);">No communication records. Records are auto-created when teams are qualified.</div></td></tr>` :
                all.map(c => {
                  const team = _teamsMap[c.teamId];
                  const chk = `<span style="color:#2dc653;"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg></span>`;
                  const xmk = `<span style="color:#e63946;"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/></svg></span>`;
                  return `<tr class="table-row">
                    <td class="font-semibold text-sm" style="color:var(--txt-primary);">${team?.teamName || c.teamId}</td>
                    <td class="text-center">${c.registrationConfirmation ? chk : xmk}</td>
                    <td class="text-center">${c.paymentConfirmation ? chk : xmk}</td>
                    <td class="text-center">${c.certificateSent ? chk : `<span style="color:#e8c027;"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><line x1='12' y1='8' x2='12' y2='12'/><line x1='12' y1='16' x2='12.01' y2='16'/></svg></span>`}</td>
                    <td class="text-center">${c.announcementReceived ? chk : xmk}</td>
                    <td class="text-center">${c.feedbackSubmitted ? chk : `<span style="color:var(--txt-muted);">—</span>`}</td>
                    ${AUTH.can('communications.write') ? `<td><button onclick="Communications.toggleCert('${c.id}',${!c.certificateSent})" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition" style="background:rgba(131,56,236,0.15);color:#8338ec;">Toggle Cert</button></td>` : ''}
                  </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  async openAnnouncement(id = null) {
    const a = id ? await DB.getById('announcements', id) : null;
    const existingImg = a?.imageUrl || a?.image_url || null;

    Modal.show(id ? 'Edit Announcement' : 'New Announcement', `
      <form id="ann-form" class="space-y-4">
        <div><label class="form-label">Title *</label>
          <input class="form-input" name="title" required placeholder="Announcement title" value="${a?.title || ''}"></div>

        <div class="grid grid-cols-2 gap-4">
          <div><label class="form-label">Category</label>
            <select class="form-input" name="category">
              ${['general','payment','qualification','delegation','competition'].map(c=>`<option value="${c}" ${a?.category===c?'selected':''}>${Utils.capitalize(c)}</option>`).join('')}
            </select></div>
          <div><label class="form-label">Recipients</label>
            <select class="form-input" name="recipients">
              ${['all','schools','coaches','teams','judges','volunteers','delegates'].map(r=>`<option value="${r}" ${a?.recipients===r?'selected':''}>${Utils.capitalize(r)}</option>`).join('')}
            </select></div>
        </div>

        <div><label class="form-label">Message *</label>
          <textarea class="form-input" name="body" rows="5" placeholder="Write your announcement here...">${a?.body || ''}</textarea></div>

        <!-- ── Image Uploader ─────────────────────────── -->
        <div>
          <label class="form-label">Poster / Banner Image <span style="font-weight:400;text-transform:none;opacity:0.6;">(optional · max 2 MB)</span></label>
          <!-- Drop Zone -->
          <div id="ann-drop-zone"
            onclick="document.getElementById('ann-img-input').click()"
            ondragover="event.preventDefault();this.style.borderColor='var(--felta-yellow)';"
            ondragleave="this.style.borderColor='var(--border-subtle)';"
            ondrop="Communications._onImgDrop(event)"
            style="border:2px dashed var(--border-subtle);border-radius:12px;padding:1.25rem;text-align:center;cursor:pointer;transition:border-color 0.2s;position:relative;">
            <input type="file" id="ann-img-input" accept="image/*" style="display:none" onchange="Communications._onImgPick(event)">
            <div id="ann-drop-prompt">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--txt-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 0.5rem"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <p style="color:var(--txt-muted);font-size:0.8rem;">Click to upload or drag &amp; drop an image</p>
              <p style="color:var(--txt-muted);font-size:0.7rem;opacity:0.6;margin-top:0.25rem;">PNG, JPG, WEBP · max 2 MB · aspect ratio preserved</p>
            </div>
            <div id="ann-img-preview-wrap" style="display:${existingImg ? 'block' : 'none'}">
              <img id="ann-img-preview" src="${existingImg || ''}" alt="Preview"
                style="max-height:200px;max-width:100%;object-fit:contain;border-radius:8px;display:block;margin:0 auto;">
              <div style="margin-top:0.75rem;display:flex;gap:0.5rem;justify-content:center;">
                <button type="button" onclick="Communications._replaceImg()" style="padding:0.35rem 0.8rem;border-radius:8px;border:1px solid var(--border-subtle);background:transparent;color:var(--txt-muted);font-size:0.75rem;cursor:pointer;">Replace</button>
                <button type="button" onclick="Communications._removeImg()" style="padding:0.35rem 0.8rem;border-radius:8px;border:none;background:rgba(230,57,70,0.12);color:#e63946;font-size:0.75rem;cursor:pointer;">Remove</button>
              </div>
            </div>
          </div>
          <div id="ann-img-error" style="color:#e63946;font-size:0.75rem;margin-top:0.35rem;display:none;"></div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div><label class="form-label">Status</label>
            <select class="form-input" name="status">
              ${['draft','published','archived'].map(s=>`<option value="${s}" ${a?.status===s?'selected':''}>${Utils.capitalize(s)}</option>`).join('')}
            </select></div>
          <div><label class="form-label">Publish At (optional)</label>
            <input class="form-input" type="datetime-local" name="publishAt" value="${a?.publishAt||a?.publish_at||''}"></div>
        </div>
      </form>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl text-sm font-semibold border transition" style="border-color:var(--border-primary);color:var(--txt-primary);">Cancel</button>
       <button onclick="Communications._saveAnnouncement('${id||''}')" class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold">Save</button>`,
      'max-w-2xl'
    );

    // Store existing image for later save
    Communications._pendingImage = existingImg;
  },

  _onImgPick(event) {
    const file = event.target.files[0];
    Communications._loadImageFile(file);
  },

  _onImgDrop(event) {
    event.preventDefault();
    document.getElementById('ann-drop-zone').style.borderColor = 'var(--border-subtle)';
    const file = event.dataTransfer.files[0];
    Communications._loadImageFile(file);
  },

  _loadImageFile(file) {
    const errEl = document.getElementById('ann-img-error');
    errEl.style.display = 'none';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      errEl.textContent = 'Please upload an image file (PNG, JPG, WEBP).'; errEl.style.display = 'block'; return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      errEl.textContent = 'Image is too large. Please use an image under 2 MB.'; errEl.style.display = 'block'; return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      Communications._pendingImage = base64;
      const preview = document.getElementById('ann-img-preview');
      const wrap    = document.getElementById('ann-img-preview-wrap');
      const prompt  = document.getElementById('ann-drop-prompt');
      if (preview) preview.src = base64;
      if (wrap)    wrap.style.display    = 'block';
      if (prompt)  prompt.style.display  = 'none';
    };
    reader.readAsDataURL(file);
  },

  _replaceImg() {
    document.getElementById('ann-img-input')?.click();
  },

  _removeImg() {
    Communications._pendingImage = null;
    const preview = document.getElementById('ann-img-preview');
    const wrap    = document.getElementById('ann-img-preview-wrap');
    const prompt  = document.getElementById('ann-drop-prompt');
    if (preview) preview.src = '';
    if (wrap)    wrap.style.display   = 'none';
    if (prompt)  prompt.style.display = 'block';
  },

  async _saveAnnouncement(id) {
    const form = document.getElementById('ann-form');
    const data = Object.fromEntries(new FormData(form));
    if (!data.title?.trim()) { Toast.error('Title is required.'); return; }
    // Attach the pending image (base64 string, null to clear, or undefined to leave unchanged)
    data.imageUrl = Communications._pendingImage !== undefined ? Communications._pendingImage : null;
    if (id) { await DB.update('announcements', id, data); Toast.success('Announcement updated!'); }
    else     { await DB.insert('announcements', data);    Toast.success('Announcement created!'); }
    Communications._pendingImage = undefined;
    Modal.close();
    await this._renderTab();
  },

  async publishAnnouncement(id) {
    await DB.update('announcements', id, { status: 'published' });
    Toast.success('Announcement published!');
    await this._renderTab();
  },

  async deleteAnnouncement(id) {
    if (!confirm('Delete this announcement?')) return;
    await DB.delete('announcements', id);
    Toast.success('Announcement deleted.');
    await this._renderTab();
  },

  async markRead(id) {
    await DB._request('PUT', `/notifications/${id}/read`);
    await this._renderTab();
  },

  async markAllRead() {
    await DB._request('PUT', '/notifications/mark-all-read');
    Toast.success('All notifications marked as read.');
    await this._renderTab();
  },

  async toggleCert(id, value) {
    await DB.update('communications', id, { certificateSent: value });
    Toast.success('Certificate status updated.');
    await this._renderTab();
  },

  async exportCSV() {
    const all = (await DB.getAll('communications')).filter(c => !c.isDeleted);
    Utils.downloadCSV('WRO_Communications.csv',
      ['ID','Team ID','Reg Confirmation','Payment Confirmation','Certificate Sent','Feedback'],
      all.map(c => [c.id, c.teamId, c.registrationConfirmation, c.paymentConfirmation, c.certificateSent, c.feedbackSubmitted])
    );
    Toast.success('Communications exported!');
  },
};

window.Communications = Communications;

// ============================================================
// Module 10 – International Delegation (Full Rewrite)
// ============================================================

const Delegation = {
  _selectedTeamId: null,
  _filter: 'all',

  async render() {
    const [all, teams, schools, coaches] = await Promise.all([
      DB.getAll('delegation').then(d => d.filter(x => !x.isDeleted)),
      DB.getAll('teams').then(t => t.filter(x => !x.isDeleted)),
      DB.getAll('schools').then(s => s.filter(x => !x.isDeleted)),
      DB.getAll('coaches').then(c => c.filter(x => !x.isDeleted)),
    ]);
    this._teamsMap   = Object.fromEntries(teams.map(t=>[t.id||t._id||t.id,t]));
    this._schoolsMap = Object.fromEntries(schools.map(s=>[s.id,s]));
    this._coachesMap = Object.fromEntries(coaches.map(c=>[c.id,c]));
    this._allDelegations = all;

    const qualified = teams.filter(t => t.qualificationStatus === 'qualified').length;
    const ready     = all.filter(d => ['approved','confirmed'].includes(d.passportStatus) && ['approved','not required'].includes(d.visaStatus)).length;
    const pending   = all.filter(d => d.status === 'pending').length;
    const passportOk = all.filter(d => d.passportStatus === 'approved').length;
    const visaOk     = all.filter(d => d.visaStatus === 'approved').length;
    const avgPct = all.length > 0
      ? Math.round(all.reduce((sum,d) => sum + this._calcProgress(d), 0) / all.length)
      : 0;

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-view space-y-6">

        <!-- Header -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black" style="color:var(--txt-primary);">International Delegation</h1>
            <p class="text-sm mt-1" style="color:var(--txt-muted);">Manage travel requirements for qualified teams</p>
          </div>
          ${AUTH.can('delegation.write') ? `
          <button onclick="Delegation.openForm()" class="btn-primary px-5 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Delegation
          </button>` : ''}
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          ${[
            {l:'Total',      v:all.length,    c:'#1d6fa4', icon:'<path d="M22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'},
            {l:'Qualified',  v:qualified,     c:'#e8c027', icon:'<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>'},
            {l:'Ready',      v:ready,         c:'#2dc653', icon:'<polyline points="20 6 9 17 4 12"/>'},
            {l:'Pending',    v:pending,       c:'#F6C945', icon:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'},
            {l:'Passport OK',v:passportOk,   c:'#8338ec', icon:'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'},
            {l:'Visa OK',    v:visaOk,        c:'#e63946', icon:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'},
          ].map(s=>`
            <div class="kpi-card rounded-xl p-4">
              <div class="mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${s.c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${s.icon}</svg></div>
              <div class="text-2xl font-black" style="color:var(--txt-primary);">${s.v}</div>
              <div class="text-xs mt-1 font-semibold" style="color:${s.c};">${s.l}</div>
            </div>`).join('')}
        </div>

        <!-- Avg completion bar -->
        ${all.length > 0 ? `
        <div class="glass rounded-2xl p-5">
          <div class="flex justify-between text-sm mb-2">
            <span style="color:var(--txt-muted);">Average Delegation Completion</span>
            <span class="font-bold" style="color:#F6C945;">${avgPct}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${avgPct}%;"></div></div>
        </div>` : ''}

        <!-- Filter + Two-Panel Layout -->
        <div class="flex flex-col lg:flex-row gap-6">

          <!-- Left: Team List -->
          <div class="w-full lg:w-80 shrink-0 space-y-3">
            <div class="flex gap-2">
              <input id="del-search" type="text" class="form-input flex-1" placeholder="Search teams…" oninput="Delegation._filterList()">
              <select id="del-filter" class="form-input w-auto text-sm" onchange="Delegation._filterList()">
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div id="del-team-list" class="space-y-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
              ${this._renderTeamList(all)}
            </div>
          </div>

          <!-- Right: Detail Panel -->
          <div id="del-detail" class="flex-1">
            <div class="glass rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(246,201,69,0.25)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="mb-4"><path d="M22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              <p class="text-base font-semibold" style="color:var(--txt-muted);">Select a delegation from the list</p>
              <p class="text-sm mt-1" style="color:var(--txt-muted);">Click any team to view and manage its requirements</p>
            </div>
          </div>
        </div>
      </div>`;
  },

  _calcProgress(d) {
    const checks = [
      d.passportStatus === 'approved',
      ['approved','not required'].includes(d.visaStatus),
      d.parentConsent == 1,
      !!d.flight,
      !!d.hotel,
      !!d.emergencyContact,
      d.dietaryRestrictions && d.dietaryRestrictions !== 'None',
      d.status === 'confirmed',
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  },

  _renderTeamList(delegations) {
    if (!delegations || delegations.length === 0) {
      return `<div class="glass rounded-xl p-6 text-center text-sm" style="color:var(--txt-muted);">No delegation records. Add delegations or qualify a team to start.</div>`;
    }
    const statusClr = { pending:'#F6C945', confirmed:'#2dc653', cancelled:'#e63946' };
    return delegations.map(d => {
      const team = this._teamsMap?.[d.teamId];
      const pct  = this._calcProgress(d);
      const isSelected = String(d.id) === String(this._selectedTeamId);
      return `
        <div class="p-4 rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5"
          style="border-color:${isSelected ? 'var(--felta-yellow)' : 'var(--border-subtle)'};
                 background:${isSelected ? 'rgba(246,201,69,0.05)' : 'transparent'};"
          onclick="Delegation.selectDelegation('${d.id}')" id="del-item-${d.id}">
          <div class="flex justify-between items-start mb-2">
            <div class="font-bold text-sm" style="color:var(--txt-primary);">${team?.teamName || `Team #${d.teamId}`}</div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase" style="background:${statusClr[d.status]||'#6B7494'}20;color:${statusClr[d.status]||'#6B7494'};">${d.status}</span>
          </div>
          <div class="text-[11px] mb-2" style="color:var(--txt-muted);">${d.destinationCountry || 'TBD'} · ${d.wroYear || '—'}</div>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-1.5 rounded-full" style="background:var(--border-subtle);">
              <div class="h-full rounded-full transition-all" style="width:${pct}%;background:${pct>=80?'#2dc653':pct>=50?'#F6C945':'#e63946'};"></div>
            </div>
            <span class="text-[10px] font-bold" style="color:${pct>=80?'#2dc653':pct>=50?'#F6C945':'#e63946'};">${pct}%</span>
          </div>
        </div>`;
    }).join('');
  },

  _filterList() {
    const term   = document.getElementById('del-search')?.value.toLowerCase() || '';
    const filter = document.getElementById('del-filter')?.value || 'all';
    let list = this._allDelegations || [];
    if (filter !== 'all') list = list.filter(d => d.status === filter);
    if (term) list = list.filter(d => {
      const t = this._teamsMap?.[d.teamId];
      return (t?.teamName||'').toLowerCase().includes(term) || (d.destinationCountry||'').toLowerCase().includes(term);
    });
    const el = document.getElementById('del-team-list');
    if (el) el.innerHTML = this._renderTeamList(list);
  },

  async selectDelegation(id) {
    this._selectedTeamId = id;
    // Update sidebar highlight
    document.querySelectorAll('[id^="del-item-"]').forEach(el => {
      el.style.borderColor = 'var(--border-subtle)';
      el.style.background = 'transparent';
    });
    const active = document.getElementById(`del-item-${id}`);
    if (active) { active.style.borderColor = 'var(--felta-yellow)'; active.style.background = 'rgba(246,201,69,0.05)'; }
    
    const d     = this._allDelegations?.find(x => String(x.id) === String(id));
    const team  = this._teamsMap?.[d?.teamId];
    const school = this._schoolsMap?.[d?.schoolId || team?.schoolId];
    const coach  = this._coachesMap?.[team?.coachId];
    const detail = document.getElementById('del-detail');
    if (!d || !detail) return;

    const pct = this._calcProgress(d);
    const pctColor = pct >= 80 ? '#2dc653' : pct >= 50 ? '#F6C945' : '#e63946';

    const REQ = [
      { key:'passportStatus',   label:'Passport',          val:d.passportStatus,   type:'status', statuses:['submitted','processing','approved','expired'] },
      { key:'visaStatus',       label:'Visa',              val:d.visaStatus,       type:'status', statuses:['not required','applied','approved','denied'] },
      { key:'parentConsent',    label:'Parent Consent',    val:d.parentConsent==1, type:'bool' },
      { key:'flight',           label:'Flight Details',    val:d.flight,           type:'text' },
      { key:'hotel',            label:'Hotel Details',     val:d.hotel,            type:'text' },
      { key:'emergencyContact', label:'Emergency Contact', val:d.emergencyContact, type:'text' },
      { key:'dietaryRestrictions', label:'Dietary Info',  val:d.dietaryRestrictions!=='None'?d.dietaryRestrictions:null, type:'text' },
      { key:'status',           label:'Delegation Status', val:d.status,           type:'status', statuses:['pending','confirmed','cancelled'] },
    ];

    const statusColor = { submitted:'#F6C945', processing:'#1d6fa4', approved:'#2dc653', expired:'#e63946', 'not required':'#6B7494', applied:'#F6C945', denied:'#e63946', pending:'#F6C945', confirmed:'#2dc653', cancelled:'#e63946' };

    detail.innerHTML = `
      <div class="glass rounded-2xl overflow-hidden">
        <!-- Header -->
        <div class="p-6 border-b" style="border-color:var(--border-subtle);">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-black" style="color:var(--txt-primary);">${team?.teamName || `Delegation #${d.id}`}</h2>
              <div class="flex flex-wrap gap-3 mt-1 text-sm" style="color:var(--txt-muted);">
                ${school ? `<span>🏫 ${school.schoolName}</span>` : ''}
                ${coach  ? `<span>👤 Coach ${coach.firstName} ${coach.lastName}</span>` : ''}
                <span>🌍 ${d.destinationCountry || 'TBD'}</span>
                <span>📅 WRO ${d.wroYear || '—'}</span>
              </div>
            </div>
            ${AUTH.can('delegation.write') ? `
            <div class="flex gap-2">
              <button onclick="Delegation.openForm('${d.id}')" class="px-4 py-2 rounded-xl text-sm font-semibold transition" style="background:rgba(246,201,69,0.12);color:var(--felta-yellow);">Edit</button>
              <button onclick="Delegation.exportCSV()" class="px-4 py-2 rounded-xl text-sm font-semibold transition" style="background:var(--bg-surface);color:var(--txt-muted);border:1px solid var(--border-subtle);">Export</button>
            </div>` : ''}
          </div>
          <!-- Progress bar -->
          <div class="mt-5">
            <div class="flex justify-between text-xs mb-1.5">
              <span style="color:var(--txt-muted);">Requirements Completion</span>
              <span class="font-bold" style="color:${pctColor};">${pct}%</span>
            </div>
            <div class="h-2 rounded-full" style="background:var(--border-subtle);">
              <div class="h-full rounded-full transition-all" style="width:${pct}%;background:${pctColor};"></div>
            </div>
          </div>
        </div>

        <!-- Requirement Rows -->
        <div class="divide-y" style="border-color:var(--border-subtle);">
          ${REQ.map(r => {
            const isDone = r.type==='bool' ? r.val===true : (r.type==='status' ? ['approved','confirmed','not required'].includes(r.val) : !!r.val);
            const dotClr = isDone ? '#2dc653' : (r.val ? '#F6C945' : '#e63946');
            return `
            <div class="flex items-center justify-between p-4 gap-4 transition-all hover:bg-white/[0.02]">
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style="background:${dotClr}18;">
                  ${isDone
                    ? `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${dotClr}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
                    : `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${dotClr}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`}
                </div>
                <div>
                  <div class="text-sm font-semibold" style="color:var(--txt-primary);">${r.label}</div>
                  <div class="text-xs mt-0.5" style="color:var(--txt-muted);">
                    ${r.type==='bool' ? (r.val ? 'Submitted' : 'Not submitted') :
                      r.type==='status' ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase" style="background:${statusColor[r.val]||'#6B7494'}18;color:${statusColor[r.val]||'#6B7494'};">${r.val||'—'}</span>` :
                      (r.val || '<em>Not provided</em>')}
                  </div>
                </div>
              </div>
              ${AUTH.can('delegation.write') ? `
              <div class="flex gap-2 shrink-0">
                ${r.type==='status' ? r.statuses.filter(s=>s!==r.val).slice(0,2).map(s=>`
                  <button onclick="Delegation.updateField('${d.id}','${r.key}','${s}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition" style="background:${statusColor[s]||'#6B7494'}18;color:${statusColor[s]||'#6B7494'};">→ ${Utils.capitalize(s)}</button>`).join('') : ''}
                ${r.type==='bool' ? `<button onclick="Delegation.updateField('${d.id}','${r.key}',${!r.val})" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition" style="background:${r.val?'rgba(230,57,70,0.12)':'rgba(45,198,83,0.12)'};color:${r.val?'#e63946':'#2dc653'};">${r.val?'Revoke':'Confirm'}</button>` : ''}
                ${r.type==='text' ? `<button onclick="Delegation.editTextField('${d.id}','${r.key}','${r.label}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition" style="background:rgba(246,201,69,0.1);color:var(--felta-yellow);">Edit</button>` : ''}
              </div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;
  },

  async updateField(id, field, value) {
    await DB.update('delegation', id, { [field]: value });
    Toast.success('Updated successfully!');
    // Refresh the delegation data and re-render detail
    this._allDelegations = (await DB.getAll('delegation')).filter(x => !x.isDeleted);
    const d = this._allDelegations.find(x => String(x.id) === String(id));
    if (d) {
      const listEl = document.getElementById('del-team-list');
      if (listEl) listEl.innerHTML = this._renderTeamList(this._allDelegations);
      await this.selectDelegation(id);
    }
  },

  async editTextField(id, field, label) {
    const d = this._allDelegations?.find(x => String(x.id) === String(id));
    Modal.show(`Edit ${label}`, `
      <div class="space-y-3">
        <label class="form-label">${label}</label>
        <input id="del-text-field" class="form-input w-full" value="${d?.[field] || ''}" placeholder="Enter ${label}…">
      </div>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl text-sm font-semibold border" style="border-color:var(--border-primary);color:var(--txt-primary);">Cancel</button>
       <button onclick="Delegation._saveTextField('${id}','${field}')" class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold">Save</button>`,
      'max-w-md'
    );
  },

  async _saveTextField(id, field) {
    const val = document.getElementById('del-text-field')?.value || '';
    await this.updateField(id, field, val);
    Modal.close();
  },

  async openForm(id = null) {
    const d    = id ? await DB.getById('delegation', id) : null;
    const teams = (await DB.getAll('teams')).filter(t => !t.isDeleted);

    Modal.show(id ? 'Edit Delegation' : 'Add Delegation', `
      <form id="del-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label class="form-label">Team *</label>
          <select class="form-input" name="teamId" required>
            <option value="">Select Team</option>
            ${teams.map(t=>`<option value="${t.id}" ${d?.teamId==t.id?'selected':''}>${t.teamName}</option>`).join('')}
          </select></div>
        <div><label class="form-label">Destination Country</label>
          <input class="form-input" name="destinationCountry" value="${d?.destinationCountry||''}" placeholder="e.g. Turkey"></div>
        <div><label class="form-label">WRO Year</label>
          <input class="form-input" type="number" name="wroYear" value="${d?.wroYear||new Date().getFullYear()}"></div>
        <div><label class="form-label">Shirt Size</label>
          <select class="form-input" name="shirtSize">
            ${['XS','S','M','L','XL','XXL'].map(s=>`<option ${d?.shirtSize===s?'selected':''}>${s}</option>`).join('')}
          </select></div>
        <div><label class="form-label">Passport Status</label>
          <select class="form-input" name="passportStatus">
            ${['submitted','processing','approved','expired'].map(s=>`<option ${d?.passportStatus===s?'selected':''}>${s}</option>`).join('')}
          </select></div>
        <div><label class="form-label">Passport Expiry</label>
          <input class="form-input" type="date" name="passportExpiry" value="${d?.passportExpiry||''}"></div>
        <div><label class="form-label">Visa Status</label>
          <select class="form-input" name="visaStatus">
            ${['not required','applied','approved','denied'].map(s=>`<option ${d?.visaStatus===s?'selected':''}>${s}</option>`).join('')}
          </select></div>
        <div><label class="form-label">Dietary Restrictions</label>
          <input class="form-input" name="dietaryRestrictions" value="${d?.dietaryRestrictions||'None'}" placeholder="None"></div>
        <div class="md:col-span-2"><label class="form-label">Flight Details</label>
          <input class="form-input" name="flight" value="${d?.flight||''}" placeholder="Flight number, date, airline…"></div>
        <div class="md:col-span-2"><label class="form-label">Hotel Details</label>
          <input class="form-input" name="hotel" value="${d?.hotel||''}" placeholder="Hotel name and address…"></div>
        <div class="md:col-span-2"><label class="form-label">Emergency Contact</label>
          <input class="form-input" name="emergencyContact" value="${d?.emergencyContact||''}" placeholder="Name, relationship, phone…"></div>
        <div><label class="form-label">Parent Consent</label>
          <select class="form-input" name="parentConsent">
            <option value="0" ${!d?.parentConsent?'selected':''}>Not Submitted</option>
            <option value="1" ${d?.parentConsent==1?'selected':''}>Submitted</option>
          </select></div>
        <div><label class="form-label">Status</label>
          <select class="form-input" name="status">
            ${['pending','confirmed','cancelled'].map(s=>`<option ${d?.status===s?'selected':''}>${s}</option>`).join('')}
          </select></div>
      </form>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl text-sm font-semibold border" style="border-color:var(--border-primary);color:var(--txt-primary);">Cancel</button>
       <button onclick="Delegation._save('${id||''}')" class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold">Save</button>`,
      'max-w-3xl'
    );
  },

  async _save(id) {
    const form = document.getElementById('del-form');
    const data = Object.fromEntries(new FormData(form));
    if (!data.teamId) { Toast.error('Team is required.'); return; }
    data.parentConsent = data.parentConsent === '1';
    if (id) { await DB.update('delegation', id, data); Toast.success('Delegation updated!'); }
    else     { await DB.insert('delegation', data);    Toast.success('Delegation created!'); }
    Modal.close();
    await this.render();
  },

  async exportCSV() {
    const all = (await DB.getAll('delegation')).filter(d => !d.isDeleted);
    const _teamsMap = await DB.getLookup('teams');
    Utils.downloadCSV('WRO_Delegation.csv',
      ['ID','Team','Country','Year','Passport Status','Visa Status','Parent Consent','Flight','Hotel','Dietary','Emergency Contact','Shirt Size','Status'],
      all.map(d => {
        const t = _teamsMap[d.teamId];
        return [d.id, t?.teamName||'', d.destinationCountry, d.wroYear, d.passportStatus, d.visaStatus, d.parentConsent?'Yes':'No', d.flight||'', d.hotel||'', d.dietaryRestrictions||'', d.emergencyContact||'', d.shirtSize||'', d.status];
      })
    );
    Toast.success('Delegation data exported!');
  },
};

window.Delegation = Delegation;

