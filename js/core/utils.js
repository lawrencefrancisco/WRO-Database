// ============================================================
// WRO Philippines DBMS – Utility Helpers
// ============================================================

const Utils = {

  // ── Formatting ────────────────────────────────────────────

  formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch { return iso; }
  },

  formatDateTime(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return iso; }
  },

  parseNumber(val) {
    if (val == null || val === '') return 0;
    if (typeof val === 'number') return val;
    const clean = String(val).replace(/[^0-9.-]+/g, "");
    const num = Number(clean);
    return isNaN(num) ? 0 : num;
  },

  formatCurrency(amount) {
    if (amount == null || amount === '') return '—';
    const num = this.parseNumber(amount);
    if (isNaN(num)) return '—';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency', currency: 'PHP', minimumFractionDigits: 2
    }).format(num);
  },

  formatNumber(n) {
    return new Intl.NumberFormat('en-PH').format(this.parseNumber(n));
  },

  /** Calculate age from birthday */
  calcAge(birthday) {
    if (!birthday) return null;
    const diff = Date.now() - new Date(birthday).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  },

  /** Truncate text */
  truncate(str, len = 30) {
    if (!str) return '—';
    return str.length > len ? str.slice(0, len) + '…' : str;
  },

  /** Generate a display ID */
  displayId(id) {
    if (!id) return '—';
    return id.split('_').slice(-2).join('-');
  },

  // ── DOM Helpers ───────────────────────────────────────────

  /** Create an HTML element with attributes and children */
  el(tag, attrs = {}, ...children) {
    const elem = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') elem.className = v;
      else if (k === 'html') elem.innerHTML = v;
      else if (k.startsWith('on')) elem.addEventListener(k.slice(2), v);
      else elem.setAttribute(k, v);
    });
    children.forEach(c => {
      if (typeof c === 'string') elem.appendChild(document.createTextNode(c));
      else if (c instanceof Node) elem.appendChild(c);
    });
    return elem;
  },

  /** Set innerHTML safely */
  setHTML(selector, html) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = html;
  },

  /** Show/hide element */
  show(selector) {
    const el = document.querySelector(selector);
    if (el) el.classList.remove('hidden');
  },
  hide(selector) {
    const el = document.querySelector(selector);
    if (el) el.classList.add('hidden');
  },

  // ── Validation ────────────────────────────────────────────

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  validatePhone(phone) {
    return /^(09|\+639)\d{9}$/.test(phone.replace(/\s/g, ''));
  },

  validateRequired(value) {
    return value !== null && value !== undefined && String(value).trim() !== '';
  },

  // ── String Helpers ────────────────────────────────────────

  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  titleCase(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  },

  slugify(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  },

  // ── Data Helpers ──────────────────────────────────────────

  groupBy(arr, key) {
    return arr.reduce((groups, item) => {
      const val = typeof key === 'function' ? key(item) : item[key];
      (groups[val] = groups[val] || []).push(item);
      return groups;
    }, {});
  },

  sortBy(arr, key, dir = 'asc') {
    return [...arr].sort((a, b) => {
      const va = a[key], vb = b[key];
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ?  1 : -1;
      return 0;
    });
  },

  uniqueBy(arr, key) {
    const seen = new Set();
    return arr.filter(item => {
      const v = item[key];
      if (seen.has(v)) return false;
      seen.add(v);
      return true;
    });
  },

  // ── File / Export ─────────────────────────────────────────

  downloadCSV(filename, headers, rows) {
    const csvRows = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },

  downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },

  // ── QR Code ───────────────────────────────────────────────

  generateQR(containerId, text, size = 128) {
    const container = document.getElementById(containerId);
    if (!container || typeof QRCode === 'undefined') return;
    container.innerHTML = '';
    new QRCode(container, { text, width: size, height: size,
      colorDark: '#4f6bf5', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
  },

  // ── Debounce ──────────────────────────────────────────────

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
  },

  // ── Random / ID ───────────────────────────────────────────

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  // ── Status Helpers ────────────────────────────────────────

  badge(text, type = 'gray') {
    return `<span class="badge badge-${type}">${text}</span>`;
  },

  statusBadge(status) {
    const map = {
      'active':     ['Active',     'green'],
      'inactive':   ['Inactive',   'red'],
      'pending':    ['Pending',    'yellow'],
      'confirmed':  ['Confirmed',  'blue'],
      'paid':       ['Paid',       'green'],
      'unpaid':     ['Unpaid',     'red'],
      'partial':    ['Partial',    'yellow'],
      'qualified':  ['Qualified',  'green'],
      'disqualified':['Disqualified','red'],
      'registered': ['Registered', 'blue'],
      'waitlisted': ['Waitlisted', 'yellow'],
      'withdrawn':  ['Withdrawn',  'gray'],
      'champion':   ['Champion',   'purple'],
      'gold':       ['Gold',       'yellow'],
      'silver':     ['Silver',     'gray'],
      'bronze':     ['Bronze',     'yellow'],
    };
    const [label, color] = map[status?.toLowerCase()] || [status || '—', 'gray'];
    return `<span class="badge badge-${color}">${label}</span>`;
  },

  // ── Pagination Helper ─────────────────────────────────────

  renderPagination(containerId, currentPage, totalPages, onPageChange) {
    const c = document.getElementById(containerId);
    if (!c) return;
    if (totalPages <= 1) { c.innerHTML = ''; return; }

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    c.innerHTML = pages.map(p =>
      p === '...'
        ? `<span class="px-3 py-1 text-slate-500">...</span>`
        : `<button onclick="${onPageChange}(${p})"
             class="px-3 py-1 rounded-lg text-sm font-medium transition-all
             ${p === currentPage
               ? 'bg-indigo-600 text-white'
               : 'text-slate-400 hover:bg-slate-700 hover:text-white'}">${p}</button>`
    ).join('');
  },
};

window.Utils = Utils;

// ── Toast Notification System ─────────────────────────────────
const Toast = {
  _container: null,

  _getContainer() {
    if (!this._container) {
      this._container = document.getElementById('toast-container');
      if (!this._container) {
        this._container = document.createElement('div');
        this._container.id = 'toast-container';
        document.body.appendChild(this._container);
      }
    }
    return this._container;
  },

  _show(message, type, icon, duration = 4000) {
    const c     = this._getContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span style="font-size:18px">${icon}</span>
      <div style="flex:1">
        <div style="font-weight:600;font-size:13px">${type.charAt(0).toUpperCase()+type.slice(1)}</div>
        <div style="font-size:12px;opacity:0.85;margin-top:2px">${message}</div>
      </div>
      <button onclick="this.parentElement.remove()" style="opacity:0.7;font-size:16px;background:none;border:none;color:inherit;cursor:pointer">×</button>`;
    c.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(msg) { this._show(msg, 'success', `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>`); },
  error(msg)   { this._show(msg, 'error',   `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><line x1='15' y1='9' x2='9' y2='15'/><line x1='9' y1='9' x2='15' y2='15'/></svg>`); },
  info(msg)    { this._show(msg, 'info',    `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><line x1='12' y1='16' x2='12' y2='12'/><line x1='12' y1='8' x2='12.01' y2='8'/></svg>`); },
  warning(msg) { this._show(msg, 'warning', `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/></svg>`); },
};

window.Toast = Toast;

// ── Modal System ──────────────────────────────────────────────
const Modal = {
  show(title, bodyHTML, footerHTML = '', size = 'max-w-2xl') {
    let overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="modal-box glass rounded-2xl w-full ${size} max-h-[90vh] flex flex-col border border-slate-700/50 shadow-2xl">
        <div class="flex items-center justify-between p-6 border-b border-slate-700/50">
          <h3 class="text-lg font-bold text-white">${title}</h3>
          <button onclick="Modal.close()" class="text-slate-400 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>
        <div class="flex-1 overflow-y-auto p-6">${bodyHTML}</div>
        ${footerHTML ? `<div class="p-6 border-t border-slate-700/50 flex justify-end gap-3">${footerHTML}</div>` : ''}
      </div>`;

    overlay.addEventListener('click', (e) => { if (e.target === overlay) Modal.close(); });
    document.body.appendChild(overlay);
  },

  close() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.remove();
  },

  // Internal registry so async callbacks are never serialized to strings
  _confirmCb: null,
  _cancelCb:  null,

  _triggerConfirm() {
    const cb = Modal._confirmCb;
    Modal._confirmCb = null;
    Modal._cancelCb  = null;
    Modal.close();
    if (typeof cb === 'function') cb();
  },

  _triggerCancel() {
    const cb = Modal._cancelCb;
    Modal._confirmCb = null;
    Modal._cancelCb  = null;
    Modal.close();
    if (typeof cb === 'function') cb();
  },

  confirm(message, onConfirm, onCancel) {
    // Store callbacks in the registry — never serialized to strings
    Modal._confirmCb = onConfirm || null;
    Modal._cancelCb  = onCancel  || null;

    this.show(
      'Confirm Action',
      `<div class="flex flex-col items-center text-center gap-4 py-4">
        <div class="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center"><svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#ef4444' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/></svg></div>
        <p class="text-slate-300 text-base">${message}</p>
      </div>`,
      `<button onclick="Modal._triggerCancel()"
         class="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition">Cancel</button>
       <button onclick="Modal._triggerConfirm()"
         class="px-5 py-2 rounded-lg btn-danger text-white text-sm font-medium">Confirm Delete</button>`,
      'max-w-md'
    );
  },
};

window.Modal = Modal;
