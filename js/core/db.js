// ============================================================
// WRO Philippines DBMS – Database Layer (localStorage)
// Simulates a relational database with CRUD operations
// ============================================================

const DB_VERSION = '1.0.0';
const DB_PREFIX  = 'wro_ph_';

const DB = {

  // ── Internal helpers ──────────────────────────────────────
  _key: (table) => `${DB_PREFIX}${table}`,

  _getAll(table) {
    try {
      const raw = localStorage.getItem(this._key(table));
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  _saveAll(table, data) {
    localStorage.setItem(this._key(table), JSON.stringify(data));
  },

  _genId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2,5).toUpperCase()}`;
  },

  _timestamp() {
    return new Date().toISOString();
  },

  // ── CRUD Operations ───────────────────────────────────────

  /** Insert a new record */
  insert(table, record) {
    const rows = this._getAll(table);
    const newRecord = {
      ...record,
      id: record.id || this._genId(table.toUpperCase().slice(0,3)),
      createdAt: this._timestamp(),
      updatedAt: this._timestamp(),
    };
    rows.push(newRecord);
    this._saveAll(table, rows);
    this._logAudit('INSERT', table, newRecord.id);
    return newRecord;
  },

  /** Get all records from a table */
  getAll(table) {
    return this._getAll(table);
  },

  /** Get a single record by ID */
  getById(table, id) {
    return this._getAll(table).find(r => r.id === id) || null;
  },

  /** Get a map of ID to record */
  getLookup(table) {
    const rows = this._getAll(table);
    const map = {};
    for (const r of rows) map[r.id] = r;
    return map;
  },

  /** Query with a filter function */
  query(table, filterFn) {
    return this._getAll(table).filter(filterFn);
  },

  /** Update a record by ID */
  update(table, id, changes) {
    const rows = this._getAll(table);
    const idx  = rows.findIndex(r => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...changes, updatedAt: this._timestamp() };
    this._saveAll(table, rows);
    this._logAudit('UPDATE', table, id);
    return rows[idx];
  },

  /** Delete a record by ID (soft delete) */
  delete(table, id) {
    const rows = this._getAll(table);
    const idx  = rows.findIndex(r => r.id === id);
    if (idx === -1) return false;
    rows[idx] = { ...rows[idx], deletedAt: this._timestamp(), isDeleted: true };
    this._saveAll(table, rows);
    this._logAudit('DELETE', table, id);
    return true;
  },

  /** Hard delete – permanently removes the record */
  hardDelete(table, id) {
    const rows = this._getAll(table).filter(r => r.id !== id);
    this._saveAll(table, rows);
    return true;
  },

  /** Count records (excluding soft-deleted) */
  count(table, filterFn = null) {
    const rows = this._getAll(table).filter(r => !r.isDeleted);
    return filterFn ? rows.filter(filterFn).length : rows.length;
  },

  /** Search across multiple fields */
  search(table, query, fields) {
    const q = query.toLowerCase();
    return this._getAll(table).filter(r =>
      !r.isDeleted && fields.some(f => {
        const v = r[f];
        return v && String(v).toLowerCase().includes(q);
      })
    );
  },

  /** Paginate results */
  paginate(table, page = 1, perPage = 20, filterFn = null) {
    let rows = this._getAll(table).filter(r => !r.isDeleted);
    if (filterFn) rows = rows.filter(filterFn);
    const total = rows.length;
    const data  = rows.slice((page - 1) * perPage, page * perPage);
    return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  },

  // ── Audit Log ─────────────────────────────────────────────
  _logAudit(action, table, recordId) {
    const logs  = this._getAll('audit_logs');
    const user  = AUTH.currentUser();
    logs.push({
      id:        this._genId('LOG'),
      action,
      table,
      recordId,
      userId:    user?.id || 'system',
      userName:  user?.name || 'System',
      timestamp: this._timestamp(),
    });
    // Keep only last 1000 logs
    if (logs.length > 1000) logs.splice(0, logs.length - 1000);
    this._saveAll('audit_logs', logs);
  },

  // ── Table Management ──────────────────────────────────────
  clearTable(table) {
    this._saveAll(table, []);
  },

  getTableNames() {
    return [
      'schools','coaches','students','teams','competitions',
      'judging','awards','payments','communications','delegation',
      'users','audit_logs','seasons','categories'
    ];
  },

  isSeeded() {
    return localStorage.getItem(`${DB_PREFIX}seeded`) === 'true';
  },

  markSeeded() {
    localStorage.setItem(`${DB_PREFIX}seeded`, 'true');
  },

  resetAll() {
    this.getTableNames().forEach(t => this.clearTable(t));
    localStorage.removeItem(`${DB_PREFIX}seeded`);
  }
};

window.DB = DB;
