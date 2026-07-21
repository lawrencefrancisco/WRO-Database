// ============================================================
// Reports View – Downloadable Reports
// ============================================================

const Reports = {
  async render() {
    document.getElementById('page-content').innerHTML = `
      <div class="page-view space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" id="reports-grid"></div>
      </div>`;
    await this._renderReports();
  },

  async _renderReports() {
    const reports = [
      { id:'school-master',  color:'#4F46E5', title:'School Master List',      desc:'All registered schools with contact information', paths:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',    count: await DB.count('schools'),  action: 'generateSchoolList' },
      { id:'coach-master',   color:'#0EA5E9', title:'Coach Master List',       desc:'All coach profiles with school assignments',       paths:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>', count: await DB.count('coaches'),  action: 'generateCoachList' },
      { id:'student-master', color:'#10B981', title:'Student Master List',     desc:'All student profiles with parent information',     paths:'<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5"/>',                count: await DB.count('students'), action: 'generateStudentList' },
      { id:'team-list',      color:'#F59E0B', title:'Team List',               desc:'All teams with category and registration status',  paths:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 17h6M17 14v6"/>',count: await DB.count('teams'),    action: 'generateTeamList' },
      { id:'payment-summary',color:'#8B5CF6', title:'Payment Summary',         desc:'Financial report with OR numbers and balances',    paths:'<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',            count: await DB.count('payments'), action: 'generatePaymentReport' },
      { id:'award-winners',  color:'#EC4899', title:'Award Winners',           desc:'All award recipients by year and category',        paths:'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',count: await DB.count('awards'),   action: 'generateAwardList' },
      { id:'judging-sheet',  color:'#EF4444', title:'Judging Report',          desc:'Score sheets and rankings by category',            paths:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',                                               count: await DB.count('judging'),  action: 'generateJudgingReport' },
      { id:'delegation-list',color:'#14B8A6', title:'International Delegation',desc:'Delegates for international competition',          paths:'<path d="M22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',                                     count: await DB.count('delegation'),action: 'generateDelegationList' },
      { id:'participation',  color:'#F97316', title:'Participation Summary',   desc:'Schools, teams, coaches, and students stats',      paths:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',count: null,                action: 'generateParticipationReport' },
    ];
    document.getElementById('reports-grid').innerHTML = reports.map(r => `
      <div class="report-card glass rounded-2xl p-6 border relative overflow-hidden transition-all duration-300" style="--card-color: ${r.color};" onmouseover="this.querySelector('.report-card-bg').style.opacity='1'" onmouseout="this.querySelector('.report-card-bg').style.opacity='0'">
        <!-- Hover Gradient Background -->
        <div class="report-card-bg absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none" style="background: linear-gradient(135deg, ${r.color}15 0%, transparent 60%);"></div>
        
        <div class="flex items-start gap-4 mb-5 relative z-10">
          <div class="report-icon-wrap w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300" style="color:${r.color}; background:${r.color}12; border-color:${r.color}25;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${r.paths}</svg>
          </div>
          <div class="flex-1 min-w-0 pt-1">
            <h3 class="font-black text-[15px] truncate transition-colors duration-300 report-card-title" data-color="${r.color}" style="color:var(--txt-primary);">${r.title}</h3>
            <p class="text-xs leading-relaxed mt-1 line-clamp-2" style="color:var(--txt-muted);">${r.desc}</p>
            ${r.count !== null ? `<div class="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase border" style="color:${r.color};background:${r.color}15;border-color:${r.color}30;"><span class="w-1.5 h-1.5 rounded-full" style="background:${r.color};box-shadow:0 0 6px ${r.color};"></span>${r.count} records</div>` : ''}
          </div>
        </div>
        <div class="flex gap-3 relative z-10">
          <button onclick="Reports.${r.action}('csv')" class="report-btn csv-btn flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border">
            <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/></svg> CSV
          </button>
          <button onclick="Reports.${r.action}('pdf')" class="report-btn pdf-btn flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border">
            <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/><line x1='16' y1='13' x2='8' y2='13'/><line x1='16' y1='17' x2='8' y2='17'/></svg> PDF
          </button>
        </div>
      </div>`).join('');
  },

  // ── Report Generators ─────────────────────────────────────

  async generateSchoolList(format) {
    const rows = (await DB.getAll('schools')).filter(s => !s.isDeleted);
    if (format === 'csv') {
      Utils.downloadCSV('WRO_Schools.csv',
        ['ID','School Name','Type','Level','Region','Province','City','DepEd ID','Email','Contact','Head','Coordinator','Status'],
        rows.map(s => [s.id,s.schoolName,s.schoolType,s.schoolLevel,s.region,s.province,s.city,s.depedId,s.email,s.contactNumber,s.schoolHead,s.roboticsCoordinator,s.status])
      );
    } else {
      this._printReport('WRO Philippines School Master List', rows, ['School Name','Type','Region','City','Coordinator','Status'], (s) => [s.schoolName,s.schoolType,(s.region||'').slice(0,20),s.city,s.roboticsCoordinator,s.status]);
    }
    Toast.success(`School list exported as ${format.toUpperCase()}!`);
  },

  async generateCoachList(format) {
    const rows = (await DB.getAll('coaches')).filter(c => !c.isDeleted);
    const _schoolsMap = await DB.getLookup('schools');
    if (format === 'csv') {
      Utils.downloadCSV('WRO_Coaches.csv',
        ['ID','Full Name','Gender','Email','Mobile','School','Position','Certifications','Years Coaching','Status'],
        rows.map(c => {
          const s = _schoolsMap[c.schoolId];
          return [c.id,c.fullName,c.gender,c.email,c.mobile,s?.schoolName||'',c.position,c.certifications,c.yearsCoaching,c.status];
        })
      );
    } else {
      this._printReport('WRO Philippines Coach Master List', rows,
        ['Full Name','Gender','School','Position','Mobile','Status'],
        (c) => { const s=_schoolsMap[c.schoolId]; return [c.fullName,c.gender,s?.schoolName||'',c.position,c.mobile,c.status]; }
      );
    }
    Toast.success(`Coach list exported as ${format.toUpperCase()}!`);
  },

  async generateStudentList(format) {
    const rows = (await DB.getAll('students')).filter(s => !s.isDeleted);
    const _schoolsMap = await DB.getLookup('schools');
    if (format === 'csv') {
      Utils.downloadCSV('WRO_Students.csv',
        ['ID','Full Name','Birthday','Age','Gender','Grade','School','Parent Name','Contact','Medical','Allergies'],
        rows.map(s => {
          const sc = _schoolsMap[s.schoolId];
          return [s.id,s.fullName,s.birthday,s.age,s.gender,s.gradeLevel,sc?.schoolName||'',s.parentName,s.parentContact,s.medicalConditions,s.allergies];
        })
      );
    } else {
      this._printReport('WRO Philippines Student Master List', rows,
        ['Full Name','Age','Gender','Grade','School','Parent'],
        (s) => { const sc=_schoolsMap[s.schoolId]; return [s.fullName,s.age,s.gender,s.gradeLevel,sc?.schoolName||'',s.parentName]; }
      );
    }
    Toast.success(`Student list exported as ${format.toUpperCase()}!`);
  },

  async generateTeamList(format) {
    const rows = (await DB.getAll('teams')).filter(t => !t.isDeleted);
    const _schoolsMap = await DB.getLookup('schools');
    const _coachesMap = await DB.getLookup('coaches');
    if (format === 'csv') {
      Utils.downloadCSV('WRO_Teams.csv',
        ['ID','Team Name','Season','Category','School','Coach','Registration','Payment','Qualification'],
        rows.map(t => {
          const sc=_schoolsMap[t.schoolId], co=_coachesMap[t.coachId];
          return [t.id,t.teamName,t.season,t.category,sc?.schoolName||'',co?.fullName||'',t.registrationStatus,t.paymentStatus,t.qualificationStatus];
        })
      );
    } else {
      this._printReport('WRO Philippines Team List', rows,
        ['Team Name','Season','Category','School','Payment','Qualification'],
        (t) => { const sc=_schoolsMap[t.schoolId]; return [t.teamName,t.season,t.category,sc?.schoolName||'',t.paymentStatus,t.qualificationStatus]; }
      );
    }
    Toast.success(`Team list exported as ${format.toUpperCase()}!`);
  },

  async generatePaymentReport(format) {
    const rows = (await DB.getAll('payments')).filter(p => !p.isDeleted);
    const _teamsMap = await DB.getLookup('teams');
    if (format === 'csv') {
      Utils.downloadCSV('WRO_Payments.csv',
        ['ID','Team','Reg Fee','Paid','Balance','Method','OR Number','Date','Status'],
        rows.map(p => {
          const t=_teamsMap[p.teamId];
          return [p.id,t?.teamName||'',p.registrationFee,p.amountPaid,p.balance,p.paymentMethod||'',p.orNumber||'',p.paymentDate||'',p.status];
        })
      );
    } else {
      this._printReport('WRO Philippines Payment Summary', rows,
        ['Team','Reg Fee','Paid','Balance','OR Number','Status'],
        (p) => { const t=_teamsMap[p.teamId]; return [t?.teamName||'',Utils.formatCurrency(p.registrationFee),Utils.formatCurrency(p.amountPaid),Utils.formatCurrency(p.balance),p.orNumber||'',p.status]; }
      );
    }
    Toast.success(`Payment report exported as ${format.toUpperCase()}!`);
  },

  async generateAwardList(format) {
    const rows = (await DB.getAll('awards')).filter(a => !a.isDeleted);
    const _teamsMap = await DB.getLookup('teams');
    const _schoolsMap = await DB.getLookup('schools');
    if (format === 'csv') {
      Utils.downloadCSV('WRO_Awards.csv',
        ['ID','Team','School','Category','Award','Year','Event','Trophy','Medal','Certificate'],
        rows.map(a => {
          const t=_teamsMap[a.teamId], s=_schoolsMap[a.schoolId];
          return [a.id,t?.teamName||'',s?.schoolName||'',a.category,a.award,a.year,a.event,a.hasTrophy,a.hasMedal,a.hasCertificate];
        })
      );
    } else {
      this._printReport('WRO Philippines Award Winners', rows,
        ['Team','School','Category','Award','Year','Certificate'],
        (a) => { const t=_teamsMap[a.teamId], s=_schoolsMap[a.schoolId]; return [t?.teamName||'',s?.schoolName||'',a.category,a.award,a.year,a.hasCertificate?'Issued':'Pending']; }
      );
    }
    Toast.success(`Awards list exported as ${format.toUpperCase()}!`);
  },

  async generateJudgingReport(format) {
    const rows = (await DB.getAll('judging')).filter(j => !j.isDeleted).sort((a,b) => (b.finalScore||0)-(a.finalScore||0));
    const _teamsMap = await DB.getLookup('teams');
    if (format === 'csv') {
      Utils.downloadCSV('WRO_Scores.csv',
        ['Rank','Team','Judge','Category','Design','Programming','Mission','Total','Violations','Status'],
        rows.map((j,idx) => {
          const t=_teamsMap[j.teamId];
          return [idx+1,t?.teamName||'',j.judgeName,j.category,j.criteria?.robotDesign,j.criteria?.programming,j.criteria?.missionPoints,j.finalScore,j.violations,j.status];
        })
      );
    } else {
      this._printReport('WRO Philippines Judging Report', rows,
        ['Rank','Team','Judge','Category','Score','Status'],
        (j,idx) => { const t=_teamsMap[j.teamId]; return [idx+1,t?.teamName||'',j.judgeName,j.category,j.finalScore,j.status]; }
      );
    }
    Toast.success(`Judging report exported as ${format.toUpperCase()}!`);
  },

  async generateDelegationList(format) {
    const rows = (await DB.getAll('delegation')).filter(d => !d.isDeleted);
    const _teamsMap = await DB.getLookup('teams');
    if (format === 'csv') {
      Utils.downloadCSV('WRO_Delegation.csv',
        ['ID','Team','Destination','Year','Passport','Visa','Flight','Hotel','Dietary','Status'],
        rows.map(d => {
          const t=_teamsMap[d.teamId];
          return [d.id,t?.teamName||'',d.destinationCountry,d.wroYear,d.passportStatus,d.visaStatus,d.flight,d.hotel,d.dietaryRestrictions,d.status];
        })
      );
    } else {
      this._printReport('WRO Philippines International Delegation', rows,
        ['Team','Country','Year','Passport','Visa','Status'],
        (d) => { const t=_teamsMap[d.teamId]; return [t?.teamName||'',d.destinationCountry,d.wroYear,d.passportStatus,d.visaStatus,d.status]; }
      );
    }
    Toast.success(`Delegation list exported!`);
  },

  async generateParticipationReport(format) {
    const schools  = await DB.count('schools');
    const teams    = await DB.count('teams');
    const coaches  = await DB.count('coaches');
    const students = await DB.count('students');
    const male     = (await DB.query('students', s => s.gender==='Male' && !s.isDeleted)).length;
    const female   = (await DB.query('students', s => s.gender==='Female' && !s.isDeleted)).length;
    const paid     = (await DB.query('payments', p => p.status==='paid' && !p.isDeleted)).length;
    const totalPay = (await DB.query('payments', p => !p.isDeleted)).length;
    const summary  = [['Total Schools',schools],['Total Teams',teams],['Total Coaches',coaches],['Total Students',students],['Male Students',male],['Female Students',female],['Paid Teams',paid],['Total Payments',totalPay]];
    if (format === 'csv') {
      Utils.downloadCSV('WRO_Participation.csv', ['Metric','Value'], summary);
    } else {
      this._printReport('WRO Philippines Participation Summary', summary, ['Metric','Value'], (r) => r);
    }
    Toast.success(`Participation report exported!`);
  },

  _printReport(title, rows, headers, rowFn) {
    const tableRows = rows.map((r, idx) => {
      const cells = rowFn(r, idx);
      return `<tr>${cells.map(c=>`<td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:12px">${c??''}</td>`).join('')}</tr>`;
    }).join('');
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>${title}</title>
      <style>body{font-family:Inter,sans-serif;padding:20px;color:#1e293b}table{width:100%;border-collapse:collapse}
        th{background:#1e293b;color:white;padding:8px 10px;text-align:left;font-size:12px}
        tr:hover td{background:#f8fafc}
        h1{font-size:20px;margin-bottom:4px}p{color:#64748b;font-size:12px;margin:0 0 16px}
        .footer{margin-top:20px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
      </style></head>
      <body>
        <h1>WRO Philippines – ${title}</h1>
        <p>WRO Philippines · Generated: ${new Date().toLocaleString('en-PH')} · Total: ${rows.length} records</p>
        <table>
          <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div class="footer">WRO Philippines Integrated Database System · Confidential</div>
        <script>window.print();</script>
      </body></html>`);
    win.document.close();
  },
};

window.Reports = Reports;
