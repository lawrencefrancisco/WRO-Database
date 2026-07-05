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
    const totalFee  = all.reduce((s,p) => s + (p.registrationFee||0), 0);
    const collected = all.reduce((s,p) => s + (p.amountPaid||0), 0);
    const pct       = totalFee > 0 ? Math.round((collected/totalFee)*100) : 0;

    const _si = (d,c) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    document.getElementById('pay-stats').innerHTML = [
      { label:'Total Registration', value: Utils.formatCurrency(totalFee),           icon: _si('<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>','#D4A017') },
      { label:'Collected',          value: Utils.formatCurrency(collected),           icon: _si('<polyline points="20 6 9 17 4 12"/>','#2dc653') },
      { label:'Outstanding',        value: Utils.formatCurrency(totalFee-collected), icon: _si('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>','#D4A017') },
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
      tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><div style="opacity:0.3;display:flex;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a89060" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div><div class="text-slate-300 text-lg mt-2">No payment records</div></div></td></tr>`;
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
          <td class="text-sm font-mono text-slate-300">${p.orNumber || '—'}</td>
          <td class="text-sm text-slate-400">${Utils.formatDate(p.paymentDate)}</td>
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
    Modal.show(id ? 'Edit Payment' : 'Record Payment', `
      <form id="pay-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label class="form-label">Team *</label>
          <select class="form-input" name="teamId" required>
            <option value="">Select Team</option>
            ${teams.map(t=>`<option value="${t.id}" ${p?.teamId===t.id?'selected':''}>${t.teamName}</option>`).join('')}
          </select>
        </div>
        <div><label class="form-label">School</label>
          <select class="form-input" name="schoolId">
            <option value="">Select School</option>
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
      </form>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold">Cancel</button>
       <button onclick="Payments._save('${id||''}')" class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'/><polyline points='17 21 17 13 7 13 7 21'/><polyline points='7 3 7 8 15 8'/></svg> Save Payment</button>`,
      'max-w-3xl'
    );
    setTimeout(() => Payments._calcBalance(), 100);
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
// Module 9 – Communications
// ============================================================

const Communications = {
  async render() {
    const all    = (await DB.getAll('communications')).filter(c => !c.isDeleted);
    const _teamsMap = await DB.getLookup('teams');
    const sent   = all.filter(c => c.registrationConfirmation).length;
    const certs  = all.filter(c => c.certificateSent).length;
    const content= document.getElementById('page-content');
    const _sic = (d,c) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    content.innerHTML = `
      <div class="page-view space-y-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${[
            { label:'Total Records',       value: all.length, icon: _sic('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 0 2 2z"/>','#D4A017') },
            { label:'Confirmations Sent',  value: sent,       icon: _sic('<polyline points="20 6 9 17 4 12"/>','#2dc653') },
            { label:'Certificates Sent',   value: certs,      icon: _sic('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>','#e8c027') },
            { label:'Feedback Received',   value: all.filter(c=>c.feedbackSubmitted).length, icon: _sic('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 0 2 2z"/>','#8338ec') },
          ].map(s=>`
            <div class="kpi-card rounded-xl p-4">
              <div class="mb-2">${s.icon}</div>
              <div class="text-2xl font-bold text-white">${s.value}</div>
              <div class="text-xs text-slate-400 mt-1">${s.label}</div>
            </div>`).join('')}
        </div>
        <div class="glass rounded-2xl overflow-hidden">
          <div class="p-4 border-b border-slate-700/50 flex justify-between items-center">
            <h3 class="text-sm font-semibold text-white">Communication Records</h3>
            <button onclick="Communications.exportCSV()" class="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr><th>Team</th><th>Reg Confirmation</th><th>Payment Confirmation</th><th>Certificate</th><th>Announcement</th><th>Feedback</th><th>Actions</th></tr>
              </thead>
              <tbody>
                ${all.slice(0,30).map(c => {
                  const team = _teamsMap[c.teamId];
                  return `
                    <tr class="table-row">
                      <td class="font-semibold text-white text-sm">${team?.teamName||c.teamId}</td>
                      <td class="text-center">${c.registrationConfirmation ? '<span class="text-green-400"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'20 6 9 17 4 12\'/></svg></span>' : '<span class="text-red-400"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><line x1=\'18\' y1=\'6\' x2=\'6\' y2=\'18\'/><line x1=\'6\' y1=\'6\' x2=\'18\' y2=\'18\'/></svg></span>'}</td>
                      <td class="text-center">${c.paymentConfirmation ? '<span class="text-green-400"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'20 6 9 17 4 12\'/></svg></span>' : '<span class="text-red-400"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><line x1=\'18\' y1=\'6\' x2=\'6\' y2=\'18\'/><line x1=\'6\' y1=\'6\' x2=\'18\' y2=\'18\'/></svg></span>'}</td>
                      <td class="text-center">${c.certificateSent ? '<span class="text-green-400"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'20 6 9 17 4 12\'/></svg></span>' : '<span class="text-yellow-500"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><circle cx=\'12\' cy=\'12\' r=\'10\'/><line x1=\'12\' y1=\'8\' x2=\'12\' y2=\'12\'/><line x1=\'12\' y1=\'16\' x2=\'12.01\' y2=\'16\'/></svg></span>'}</td>
                      <td class="text-center">${c.announcementReceived ? '<span class="text-green-400"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'20 6 9 17 4 12\'/></svg></span>' : '<span class="text-red-400"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><line x1=\'18\' y1=\'6\' x2=\'6\' y2=\'18\'/><line x1=\'6\' y1=\'6\' x2=\'18\' y2=\'18\'/></svg></span>'}</td>
                      <td class="text-center">${c.feedbackSubmitted ? '<span class="text-green-400"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'20 6 9 17 4 12\'/></svg></span>' : '<span class="text-slate-600">—</span>'}</td>
                      <td>
                        ${AUTH.can('communications.write') ? `
                        <button onclick="Communications.toggleCert('${c.id}',${!c.certificateSent})" class="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 text-xs transition flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/></svg> Toggle Cert</button>
                        ` : ''}
                      </td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  async toggleCert(id, value) {
    await DB.update('communications', id, { certificateSent: value });
    Toast.success(`Certificate status updated.`);
    await this.render();
  },

  async exportCSV() {
    const all = (await DB.getAll('communications')).filter(c => !c.isDeleted);
    Utils.downloadCSV('WRO_Communications.csv',
      ['ID','Team ID','Reg Confirmation','Payment Confirmation','Certificate Sent','Feedback'],
      all.map(c => [c.id,c.teamId,c.registrationConfirmation,c.paymentConfirmation,c.certificateSent,c.feedbackSubmitted])
    );
    Toast.success('Communications exported!');
  },
};

window.Communications = Communications;

// ============================================================
// Module 10 – International Delegation
// ============================================================

const Delegation = {
  async render() {
    const all     = (await DB.getAll('delegation')).filter(d => !d.isDeleted);
    const _teamsMap = await DB.getLookup('teams');
    const content = document.getElementById('page-content');
    const _sid = (d,c) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    content.innerHTML = `
      <div class="page-view space-y-6">
        <div class="glass rounded-2xl p-6 border border-blue-500/20" style="background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(6,182,212,0.05));">
          <div class="flex justify-center mb-3"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1d6fa4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div>
          <h2 class="text-xl font-bold text-white">International Delegation Management</h2>
          <p class="text-slate-400 text-sm mt-1">Only for teams qualified for international competition</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${[
            { label:'Total Delegates', value: all.length,                                       icon: _sid('<path d="M22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>','#1d6fa4') },
            { label:'Passport OK',     value: all.filter(d=>d.passportStatus==='approved').length, icon: _sid('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>','#2dc653') },
            { label:'Visa Approved',   value: all.filter(d=>d.visaStatus==='approved').length,    icon: _sid('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>','#e8c027') },
            { label:'Confirmed',       value: all.filter(d=>d.status==='confirmed').length,       icon: _sid('<polyline points="20 6 9 17 4 12"/>','#2dc653') },
          ].map(s=>`
            <div class="kpi-card rounded-xl p-4">
              <div class="mb-2">${s.icon}</div>
              <div class="text-2xl font-bold text-white">${s.value}</div>
              <div class="text-xs text-slate-400 mt-1">${s.label}</div>
            </div>`).join('')}
        </div>
        ${AUTH.can('delegation.read') ? `
        <div class="glass rounded-2xl overflow-hidden">
          <div class="p-4 border-b border-slate-700/50 flex justify-between">
            <h3 class="text-sm font-semibold text-white">Delegation Records</h3>
            <button onclick="Delegation.exportCSV()" class="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr><th>Team</th><th>Destination</th><th>Year</th><th>Passport</th><th>Visa</th><th>Flight</th><th>Hotel</th><th>Dietary</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${all.map(d => {
                  const team = _teamsMap[d.teamId];
                  return `
                    <tr class="table-row">
                      <td class="font-semibold text-white text-sm">${team?.teamName||'—'}</td>
                      <td><span class="badge badge-blue flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><line x1='2' y1='12' x2='22' y2='12'/><path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/></svg> ${d.destinationCountry}</span></td>
                      <td class="text-sm text-slate-300">${d.wroYear}</td>
                      <td>${Utils.statusBadge(d.passportStatus)}</td>
                      <td>${Utils.statusBadge(d.visaStatus)}</td>
                      <td class="text-xs text-slate-400">${d.flight||'—'}</td>
                      <td class="text-xs text-slate-400">${d.hotel||'—'}</td>
                      <td class="text-xs text-slate-400">${d.dietaryRestrictions||'None'}</td>
                      <td>${Utils.statusBadge(d.status)}</td>
                    </tr>`;
                }).join('')}
                ${all.length === 0 ? `<tr><td colspan="9"><div class="empty-state"><div style="opacity:0.3;display:flex;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a89060" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div><div class="text-slate-400 mt-2">No delegation records</div></div></td></tr>` : ''}
              </tbody>
            </table>
          </div>
        </div>` : '<div class="glass rounded-2xl p-8 text-center text-slate-400">Access restricted.</div>'}
      </div>`;
  },

  async exportCSV() {
    const all = (await DB.getAll('delegation')).filter(d => !d.isDeleted);
    const _teamsMap = await DB.getLookup('teams');
    Utils.downloadCSV('WRO_Delegation.csv',
      ['ID','Team','Country','Year','Passport Status','Visa Status','Flight','Hotel','Dietary','Status'],
      all.map(d => {
        const t = _teamsMap[d.teamId];
        return [d.id,t?.teamName||'',d.destinationCountry,d.wroYear,d.passportStatus,d.visaStatus,d.flight,d.hotel,d.dietaryRestrictions,d.status];
      })
    );
    Toast.success('Delegation data exported!');
  },
};

window.Delegation = Delegation;
