// ============================================================
// User Management Module
// ============================================================

const Users = {
  async render() {
    if (!AUTH.requireRole('SUPER_ADMIN')) {
      document.getElementById('page-content').innerHTML = `
        <div class="page-view">
          <div class="glass rounded-2xl p-12 text-center">
            <div class="flex justify-center mb-4"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F6C945" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
            <h3 class="text-xl font-bold text-white mb-2">Access Restricted</h3>
            <p class="text-slate-400">Only Super Administrators can manage users.</p>
          </div>
        </div>`;
      return;
    }
    const all = (await DB.getAll('users')).filter(u => !u.isDeleted);
    document.getElementById('page-content').innerHTML = `
      <div class="page-view space-y-6">
        <div class="flex justify-end">
          <button onclick="Users.openForm()" class="btn-primary text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
            <span>+</span> Add User
          </button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          ${Object.entries(AUTH.ROLES).map(([role, info]) => {
            const count = all.filter(u => u.role === role).length;
            return `
              <div class="kpi-card rounded-xl p-4">
                <div class="mb-2">${info.icon}</div>
                <div class="text-xl font-bold text-white">${count}</div>
                <div class="text-xs text-slate-400 mt-1">${info.label}</div>
              </div>`;
          }).join('')}
        </div>

        <div class="glass rounded-2xl overflow-hidden">
          <div class="p-4 border-b border-slate-700/50">
            <h3 class="text-sm font-semibold text-white">System Users</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr><th>User</th><th>Username</th><th>Role</th><th>Last Login</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                ${all.map(u => {
                  const ri = AUTH.getRoleInfo(u.role);
                  return `
                    <tr class="table-row">
                      <td>
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            ${(u.name||'?').charAt(0)}
                          </div>
                          <div>
                            <div class="font-semibold text-white text-sm">${u.name}</div>
                            <div class="text-xs text-slate-500">${u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td class="font-mono text-sm text-slate-300">${u.username}</td>
                      <td><span class="badge badge-${ri.color}">${ri.label}</span></td>
                      <td class="text-sm text-slate-400">${Utils.formatDateTime(u.lastLogin)}</td>
                      <td>${Utils.statusBadge(u.isActive ? 'active' : 'inactive')}</td>
                      <td>
                        <div class="flex gap-2">
                          <button onclick="Users.openForm('${u.id}')" class="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 text-xs transition flex items-center"><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/><path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/></svg></button>
                        <button onclick="Users.toggleActive('${u.id}',${!u.isActive})" class="p-1.5 rounded-lg ${u.isActive?'bg-red-500/20 text-red-400':'bg-green-500/20 text-green-400'} hover:opacity-80 text-xs transition flex items-center gap-1">
                          ${u.isActive
                            ? `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='11' width='18' height='11' rx='2' ry='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/></svg> Deactivate`
                            : `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='11' width='18' height='11' rx='2' ry='2'/><path d='M7 11V7a5 5 0 0 1 9.9-1'/></svg> Activate`}
                        </button>
                        </div>
                      </td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  async openForm(id = null) {
    const u = id ? await DB.getById('users', id) : null;
    Modal.show(id ? 'Edit User' : 'Add User', `
      <form id="user-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2"><label class="form-label">Full Name *</label>
          <input class="form-input" name="name" value="${u?.name||''}" required>
        </div>
        <div><label class="form-label">Username *</label>
          <input class="form-input" name="username" value="${u?.username||''}" required>
        </div>
        <div><label class="form-label">Password ${id?'(leave blank to keep)':' *'}</label>
          <input class="form-input" type="password" name="password" placeholder="${id?'••••••••':'Enter password'}">
        </div>
        <div><label class="form-label">Email</label>
          <input class="form-input" type="email" name="email" value="${u?.email||''}">
        </div>
        <div><label class="form-label">Role</label>
          <select class="form-input" name="role">
            ${Object.entries(AUTH.ROLES).map(([r,info])=>`<option value="${r}" ${u?.role===r?'selected':''}>${info.label}</option>`).join('')}
          </select>
        </div>
        <div><label class="form-label">Active</label>
          <select class="form-input" name="isActive">
            <option value="true" ${u?.isActive!==false?'selected':''}>Active</option>
            <option value="false" ${u?.isActive===false?'selected':''}>Inactive</option>
          </select>
        </div>
      </form>`,
      `<button onclick="Modal.close()" class="px-5 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold">Cancel</button>
       <button onclick="Users._save('${id||''}')" class="btn-primary px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'/><polyline points='17 21 17 13 7 13 7 21'/><polyline points='7 3 7 8 15 8'/></svg> Save User</button>`,
      'max-w-2xl'
    );
  },

  async _save(id) {
    const form = document.getElementById('user-form');
    const data = Object.fromEntries(new FormData(form));
    data.isActive = data.isActive === 'true';
    if (!id && !data.password) { Toast.error('Password is required for new users.'); return; }
    if (!data.name || !data.username) { Toast.error('Name and username are required.'); return; }
    if (id) {
      const changes = { name: data.name, username: data.username, email: data.email, role: data.role, isActive: data.isActive };
      if (data.password) changes.password = data.password;
      await DB.update('users', id, changes);
      Toast.success('User updated!');
    } else {
      await DB.insert('users', data);
      Toast.success('User added!');
    }
    Modal.close(); await this.render();
  },

  async toggleActive(id, active) {
    const u = await DB.getById('users', id);
    if (!u) return;
    await DB.update('users', id, { ...u, isActive: active });
    Toast.success(`User ${active ? 'activated' : 'deactivated'}.`);
    await this.render();
  },
};

window.Users = Users;

// ============================================================
// Audit Logs Module
// ============================================================

const AuditLogs = {
  async render() {
    const logs  = (await DB.getAll('audit_logs')).reverse().slice(0, 100);
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-view space-y-6">
        <div class="glass rounded-2xl overflow-hidden">
          <div class="p-4 border-b border-slate-700/50">
            <h3 class="text-sm font-semibold text-white">Recent System Activity (Last 100 actions)</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr><th>Action</th><th>Table</th><th>Record ID</th><th>User</th><th>Timestamp</th></tr>
              </thead>
              <tbody>
                ${logs.map(l => {
                  const actionColor = l.action==='INSERT'?'green':l.action==='UPDATE'?'blue':l.action==='DELETE'?'red':'gray';
                  return `
                    <tr class="table-row">
                      <td><span class="badge badge-${actionColor}">${l.action}</span></td>
                      <td class="font-mono text-sm text-slate-300">${l.table}</td>
                      <td class="font-mono text-xs text-slate-500">${Utils.truncate(l.recordId, 20)}</td>
                      <td class="text-sm text-slate-300">${l.userName}</td>
                      <td class="text-sm text-slate-400">${Utils.formatDateTime(l.timestamp)}</td>
                    </tr>`;
                }).join('')}
                ${logs.length === 0 ? '<tr><td colspan="5" class="text-center py-8 text-slate-500">No activity yet</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  },
};

window.AuditLogs = AuditLogs;
