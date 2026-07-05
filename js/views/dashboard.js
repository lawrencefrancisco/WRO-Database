// ============================================================
// Dashboard View – Real-time Statistics & Charts
// ============================================================

const Dashboard = {
  _charts: {},

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-view space-y-6">

        <!-- Welcome Banner -->
        <div class="rounded-2xl p-6 welcome-banner gold-glow">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs font-semibold uppercase tracking-wider mb-1" style="color:#D4A017;">Welcome back</div>
              <h2 class="text-2xl font-black" style="color:#f0e9d2;">
                ${AUTH.currentUser()?.name || 'Administrator'}
              </h2>
              <p class="text-sm mt-1" style="color:#a89060;">
                ${new Date().toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
              </p>
            </div>
            <div>
              <img src="assets/image/felta-logo-new.png" alt="FELTA WRO"
                style="height:56px;opacity:0.25;filter:grayscale(1) brightness(2);">
            </div>
          </div>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4" id="kpi-grid"></div>

        <!-- Charts Row 1 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="glass rounded-2xl p-6">
            <h3 class="text-sm font-semibold text-white mb-4">Teams per Category</h3>
            <div class="chart-container" style="height:240px">
              <canvas id="chart-category"></canvas>
            </div>
          </div>
          <div class="glass rounded-2xl p-6">
            <h3 class="text-sm font-semibold text-white mb-4">Participation Growth by Year</h3>
            <div class="chart-container" style="height:240px">
              <canvas id="chart-growth"></canvas>
            </div>
          </div>
        </div>

        <!-- Charts Row 2 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="glass rounded-2xl p-6">
            <h3 class="text-sm font-semibold text-white mb-4">School Types</h3>
            <div class="chart-container" style="height:200px">
              <canvas id="chart-school-type"></canvas>
            </div>
          </div>
          <div class="glass rounded-2xl p-6">
            <h3 class="text-sm font-semibold text-white mb-4">Gender Distribution</h3>
            <div class="chart-container" style="height:200px">
              <canvas id="chart-gender"></canvas>
            </div>
          </div>
          <div class="glass rounded-2xl p-6">
            <h3 class="text-sm font-semibold text-white mb-4">Payment Status</h3>
            <div class="chart-container" style="height:200px">
              <canvas id="chart-payment"></canvas>
            </div>
          </div>
        </div>

        <!-- Regional Map + Recent Activity -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="glass rounded-2xl p-6">
            <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4A017" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
              Regional Distribution
            </h3>
            <div id="region-bars" class="space-y-2"></div>
          </div>
          <div class="glass rounded-2xl p-6">
            <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4A017" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Recent Activity
            </h3>
            <div id="recent-activity" class="space-y-3"></div>
          </div>
        </div>

        <!-- Quick Stats Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="glass rounded-2xl p-6">
            <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4A017" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
              Top Performing Schools
            </h3>
            <div id="top-schools-dash" class="space-y-2"></div>
          </div>
          <div class="glass rounded-2xl p-6">
            <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4A017" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Financial Summary
            </h3>
            <div id="financial-summary"></div>
          </div>
        </div>

      </div>`;

    this._renderKPIs();
    this._renderCharts();
    this._renderRegionalBars();
    this._renderActivity();
    await this._renderTopSchools();
    this._renderFinancial();
  },

  async _renderKPIs() {
    const schools  = await DB.count('schools');
    const teams    = await DB.count('teams');
    const coaches  = await DB.count('coaches');
    const students = await DB.count('students');
    const comps    = await DB.count('competitions');
    const awards   = await DB.count('awards');
    // Inline SVG icons (Lucide-style, monochrome outline)
    const _svg = (paths, extra='') => `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ${extra}>${paths}</svg>`;
    document.getElementById('kpi-grid').innerHTML = [
      { label:'Schools',      value: schools,  icon: _svg('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),      grad:'from-yellow-700 to-yellow-900',  glow:'rgba(212,160,23,0.2)',  color:'#D4A017' },
      { label:'Teams',        value: teams,    icon: _svg('<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 17h6M17 14v6"/>'),                              grad:'from-amber-600 to-amber-900',    glow:'rgba(184,134,11,0.2)',  color:'#e8c027' },
      { label:'Coaches',      value: coaches,  icon: _svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>'),                                                                grad:'from-orange-700 to-orange-900',  glow:'rgba(244,132,26,0.2)',  color:'#f4841a' },
      { label:'Students',     value: students, icon: _svg('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5"/>'),                                                                                                           grad:'from-blue-700 to-blue-900',      glow:'rgba(29,111,164,0.2)', color:'#1d6fa4' },
      { label:'Competitions', value: comps,    icon: _svg('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>'), grad:'from-red-700 to-red-900',        glow:'rgba(230,57,70,0.2)',  color:'#e63946' },
      { label:'Awards',       value: awards,   icon: _svg('<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>'),                                                                                                              grad:'from-green-700 to-green-900',    glow:'rgba(45,198,83,0.2)',  color:'#2dc653' },
    ].map(k => `
      <div class="kpi-card rounded-2xl p-5 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br ${k.grad} opacity-15 transform translate-x-6 -translate-y-6"></div>
        <div class="kpi-icon-wrap mb-3" style="color:${k.color}">${k.icon}</div>
        <div class="text-3xl font-black" style="color:#f0e9d2;">${Utils.formatNumber(k.value)}</div>
        <div class="text-xs mt-1" style="color:#a89060;">${k.label}</div>
      </div>`).join('');
  },

  async _renderCharts() {
    if (typeof Chart === 'undefined') {
      setTimeout(() => this._renderCharts(), 500);
      return;
    }

    Chart.defaults.color = '#a89060';
    Chart.defaults.borderColor = 'rgba(212,160,23,0.15)';
    const gradColors = ['#D4A017','#f4841a','#e63946','#2dc653','#1d6fa4','#8338ec','#f9c61b','#e91e8c'];

    // ── Category Chart ────────────────────────────────────
    const teams   = (await DB.getAll('teams')).filter(t => !t.isDeleted);
    const byCat   = Utils.groupBy(teams, 'category');
    const catLabels = Object.keys(byCat);
    const catData   = catLabels.map(c => byCat[c].length);
    this._destroyChart('chart-category');
    const ctx1 = document.getElementById('chart-category');
    if (ctx1) {
      this._charts['chart-category'] = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: catLabels.map(l => l.split('–').pop().trim()),
          datasets: [{
            data: catData,
            backgroundColor: gradColors.slice(0, catLabels.length),
            borderRadius: 8, borderSkipped: false,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#a89060' } },
            y: { beginAtZero: true, grid: { color: 'rgba(212,160,23,0.1)' }, ticks: { color: '#a89060' } }
          }
        }
      });
    }

    // ── Growth Chart ──────────────────────────────────────
    const byYear = Utils.groupBy(teams, t => (t.season||'').replace(/\D+/g,'').slice(-4));
    const years  = ['2022','2023','2024','2025'];
    this._destroyChart('chart-growth');
    const ctx2 = document.getElementById('chart-growth');
    if (ctx2) {
      this._charts['chart-growth'] = new Chart(ctx2, {
        type: 'line',
        data: {
          labels: years,
          datasets: [{
            label: 'Teams',
            data: years.map(y => (byYear[y]||[]).length),
            borderColor: '#D4A017',
            backgroundColor: 'rgba(212,160,23,0.12)',
            fill: true, tension: 0.4, pointRadius: 6,
            pointBackgroundColor: '#D4A017', pointBorderColor: '#fff', pointBorderWidth: 2,
          }, {
            label: 'Students',
            data: years.map(y => (byYear[y]||[]).length * 2.2),
            borderColor: '#f4841a',
            backgroundColor: 'rgba(244,132,26,0.07)',
            fill: true, tension: 0.4, pointRadius: 6,
            pointBackgroundColor: '#f4841a', pointBorderColor: '#fff', pointBorderWidth: 2,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { color: '#a89060' } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#a89060' } },
            y: { beginAtZero: true, grid: { color: 'rgba(212,160,23,0.1)' }, ticks: { color: '#a89060' } }
          }
        }
      });
    }

    // ── School Type Doughnut ──────────────────────────────
    const schools = (await DB.getAll('schools')).filter(s => !s.isDeleted);
    const byType  = Utils.groupBy(schools, 'schoolType');
    this._destroyChart('chart-school-type');
    const ctx3 = document.getElementById('chart-school-type');
    if (ctx3) {
      this._charts['chart-school-type'] = new Chart(ctx3, {
        type: 'doughnut',
        data: {
          labels: Object.keys(byType),
          datasets: [{ data: Object.values(byType).map(v=>v.length), backgroundColor: ['#D4A017','#f4841a','#2dc653'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#a89060' } } }, cutout: '65%' }
      });
    }

    // ── Gender Chart ──────────────────────────────────────
    const students = (await DB.getAll('students')).filter(s => !s.isDeleted);
    const male     = students.filter(s => s.gender === 'Male').length;
    const female   = students.filter(s => s.gender === 'Female').length;
    this._destroyChart('chart-gender');
    const ctx4 = document.getElementById('chart-gender');
    if (ctx4) {
      this._charts['chart-gender'] = new Chart(ctx4, {
        type: 'doughnut',
        data: {
          labels: ['Male','Female'],
          datasets: [{ data: [male,female], backgroundColor: ['#1d6fa4','#e91e8c'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#a89060' } } }, cutout: '65%' }
      });
    }

    // ── Payment Status ────────────────────────────────────
    const payments = (await DB.getAll('payments')).filter(p => !p.isDeleted);
    const payGroups= Utils.groupBy(payments, 'status');
    this._destroyChart('chart-payment');
    const ctx5 = document.getElementById('chart-payment');
    if (ctx5) {
      this._charts['chart-payment'] = new Chart(ctx5, {
        type: 'pie',
        data: {
          labels: Object.keys(payGroups).map(Utils.capitalize),
          datasets: [{ data: Object.values(payGroups).map(v=>v.length), backgroundColor: ['#2dc653','#e63946','#D4A017'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#a89060' } } } }
      });
    }
  },

  _destroyChart(id) {
    if (this._charts[id]) { this._charts[id].destroy(); delete this._charts[id]; }
  },

  async _renderRegionalBars() {
    const schools = (await DB.getAll('schools')).filter(s => !s.isDeleted);
    const byReg   = Utils.groupBy(schools, 'region');
    const sorted  = Object.entries(byReg).sort((a,b) => b[1].length - a[1].length);
    const max     = sorted[0]?.[1]?.length || 1;
    const el      = document.getElementById('region-bars');
    if (!el) return;
    el.innerHTML = sorted.map(([reg, schs]) => {
      const label = reg.replace(/Region\s*([\w\-]+)\s*–\s*/i, 'R$1 – ');
      const pct   = Math.round((schs.length/max)*100);
      return `
        <div class="flex items-center gap-3 text-sm">
          <span class="text-slate-400 text-xs w-28 truncate" title="${reg}">${label}</span>
          <div class="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style="width:${pct}%"></div>
          </div>
          <span class="text-white font-semibold w-6 text-right">${schs.length}</span>
        </div>`;
    }).join('') || '<p class="text-slate-500 text-sm">No data</p>';
  },

  async _renderActivity() {
    const logs  = (await DB.getAll('audit_logs')).reverse().slice(0, 8);
    const el    = document.getElementById('recent-activity');
    if (!el) return;
    const _svg = (paths, color) => `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
    const icons = {
      INSERT: _svg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>', '#2dc653'),
      UPDATE: _svg('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>', '#D4A017'),
      DELETE: _svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>', '#e63946'),
    };
    const defaultIcon = _svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>', '#a89060');
    el.innerHTML = logs.map(l => `
      <div class="flex items-center gap-3 p-3 glass-light rounded-xl">
        <span class="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style="background:rgba(22,32,56,0.8)">${icons[l.action]||defaultIcon}</span>
        <div class="flex-1 min-w-0">
          <div class="text-sm text-white truncate">${l.action} in ${l.table}</div>
          <div class="text-xs text-slate-500">${l.userName} · ${Utils.formatDateTime(l.timestamp)}</div>
        </div>
      </div>`).join('') || '<p class="text-slate-500 text-sm">No activity yet</p>';
  },

  async _renderTopSchools() {
    const _schoolsMap = await DB.getLookup('schools');
    const awards  = (await DB.getAll('awards')).filter(a => !a.isDeleted);
    const bySchool= Utils.groupBy(awards, 'schoolId');
    const sorted  = Object.entries(bySchool).sort((a,b) => b[1].length-a[1].length).slice(0,5);
    const el      = document.getElementById('top-schools-dash');
    if (!el) return;
    // Rank badge SVG icons
    const rankColors = ['#D4A017','#a89060','#cd7f32','#5a6a8a','#5a6a8a'];
    const rankLabels = ['1st','2nd','3rd','4th','5th'];
    el.innerHTML = sorted.map(([sid, aList], idx) => {
      const school = _schoolsMap[sid];
      const color  = rankColors[idx];
      return `
        <div class="flex items-center gap-3 p-3 glass-light rounded-xl">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold" style="background:rgba(22,32,56,0.9);color:${color};border:1px solid ${color}40">${rankLabels[idx]}</div>
          <div class="flex-1 min-w-0">
            <div class="text-sm text-white truncate">${school?.schoolName||'Unknown'}</div>
            <div class="text-xs text-slate-500">${school?.region||''}</div>
          </div>
          <span class="badge badge-yellow">${aList.length} awards</span>
        </div>`;
    }).join('') || '<p class="text-slate-500 text-sm">No award data yet.</p>';
  },

  async _renderFinancial() {
    const payments = (await DB.getAll('payments')).filter(p => !p.isDeleted);
    const totalFee = payments.reduce((s,p) => s + (p.registrationFee||0), 0);
    const collected= payments.reduce((s,p) => s + (p.amountPaid||0), 0);
    const balance  = totalFee - collected;
    const sponsors = payments.reduce((s,p) => s + (p.sponsorship||0), 0);
    const pct      = totalFee > 0 ? Math.round((collected/totalFee)*100) : 0;
    const el       = document.getElementById('financial-summary');
    if (!el) return;
    const _svg = (paths, color) => `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
    el.innerHTML = `
      <div class="space-y-4">
        ${[
          { label:'Total Registration Income', value: Utils.formatCurrency(totalFee),  color:'text-white',        icon: _svg('<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>','#a89060') },
          { label:'Amount Collected',          value: Utils.formatCurrency(collected), color:'text-green-400',     icon: _svg('<polyline points="20 6 9 17 4 12"/>','#2dc653') },
          { label:'Outstanding Balance',       value: Utils.formatCurrency(balance),   color:'text-yellow-400',    icon: _svg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>','#D4A017') },
          { label:'Sponsorship Income',        value: Utils.formatCurrency(sponsors),  color:'text-indigo-400',    icon: _svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>','#8338ec') },
        ].map(f=>`
          <div class="flex items-center justify-between p-3 glass-light rounded-xl">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style="background:rgba(22,32,56,0.9)">${f.icon}</span>
              <span class="text-sm text-slate-400">${f.label}</span>
            </div>
            <span class="font-bold ${f.color}">${f.value}</span>
          </div>`).join('')}
        <div class="mt-2">
          <div class="flex justify-between text-xs text-slate-500 mb-1">
            <span>Collection Rate</span><span>${pct}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      </div>`;
  },
};

window.Dashboard = Dashboard;
