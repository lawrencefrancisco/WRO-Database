// ============================================================
// WRO Philippines DBMS – Database Layer (API fetch)
// Replaces localStorage with HTTP calls to the Node.js server.
// All methods remain async so existing module code needs no changes.
// ============================================================

const API_BASE = 'https://wro-database.onrender.com/api';

// Map table names used by modules → API path segments
const TABLE_ROUTES = {
  schools:        'schools',
  coaches:        'coaches',
  students:       'students',
  teams:          'teams',
  competitions:   'competitions',
  seasons:        'seasons',
  judging:        'judging',
  awards:         'awards',
  payments:       'payments',
  communications: 'communications',
  delegation:     'delegation',
  announcements:  'announcements',
  notifications:  'notifications',
  users:          'users',
  audit_logs:     'audit-logs',
};

const DB = {

  // ── Internal fetch helper ────────────────────────────────
  async _request(method, path, body = null) {
    const session = AUTH ? AUTH.currentUser() : null;
    const token   = session?._token || null;

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body !== null) opts.body = JSON.stringify(body);

    try {
      const res  = await fetch(`${API_BASE}${path}`, opts);
      const data = await res.json();

      if (!res.ok) {
        console.error(`[DB] ${method} ${path} →`, res.status, data);
        return null;
      }
      return data;
    } catch (err) {
      console.error(`[DB] Network error ${method} ${path}:`, err);
      // Show user-friendly error if Toast is available
      if (typeof Toast !== 'undefined') {
        Toast.error('Cannot reach server. Make sure the API server is running on port 3000.');
      }
      return null;
    }
  },

  _route(table) {
    return TABLE_ROUTES[table] || table;
  },

  // ── CRUD Operations ─────────────────────────────────────

  /** Insert a new record */
  async insert(table, record) {
    const result = await this._request('POST', `/${this._route(table)}`, record);
    if (result) this._logAudit('INSERT', table, result.id);
    return result;
  },

  /** Get all records from a table */
  async getAll(table) {
    const data = await this._request('GET', `/${this._route(table)}`);
    return Array.isArray(data) ? data : [];
  },

  /** Get a single record by ID */
  async getById(table, id) {
    if (!id) return null;
    const data = await this._request('GET', `/${this._route(table)}/${id}`);
    // 404 returns null from _request; also handle error objects
    if (!data || data.success === false) return null;
    return data;
  },

  /** Get a map of ID → record */
  async getLookup(table) {
    const rows = await this.getAll(table);
    const map = {};
    for (const r of rows) map[r.id] = r;
    return map;
  },

  /**
   * Query with a client-side filter function.
   * Fetches all records then applies filterFn locally.
   * This keeps all existing module code working without changes.
   */
  async query(table, filterFn) {
    const rows = await this.getAll(table);
    return rows.filter(filterFn);
  },

  /** Update a record by ID */
  async update(table, id, changes) {
    const result = await this._request('PUT', `/${this._route(table)}/${id}`, changes);
    if (result) this._logAudit('UPDATE', table, id);
    return result;
  },

  /** Soft delete a record */
  async delete(table, id) {
    const result = await this._request('DELETE', `/${this._route(table)}/${id}`);
    if (result?.success) this._logAudit('DELETE', table, id);
    return result?.success || false;
  },

  /** Hard delete – permanently removes the record */
  async hardDelete(table, id) {
    const result = await this._request('DELETE', `/${this._route(table)}/${id}?hard=true`);
    return result?.success || false;
  },

  /** Count records (fetches all, then counts non-deleted) */
  async count(table, filterFn = null) {
    const rows = await this.getAll(table);
    const active = rows.filter(r => !r.isDeleted && !r.is_deleted);
    return filterFn ? active.filter(filterFn).length : active.length;
  },

  /** Search across multiple fields (client-side after fetch) */
  async search(table, query, fields) {
    const q    = query.toLowerCase();
    const rows = await this.getAll(table);
    return rows.filter(r =>
      !r.isDeleted && !r.is_deleted &&
      fields.some(f => {
        const v = r[f];
        return v && String(v).toLowerCase().includes(q);
      })
    );
  },

  /** Paginate results */
  async paginate(table, page = 1, perPage = 20, filterFn = null) {
    let rows = await this.getAll(table);
    rows = rows.filter(r => !r.isDeleted && !r.is_deleted);
    if (filterFn) rows = rows.filter(filterFn);
    const total = rows.length;
    const data  = rows.slice((page - 1) * perPage, page * perPage);
    return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  },

  // ── Audit Log ────────────────────────────────────────────
  async _logAudit(action, table, recordId) {
    try {
      const user = AUTH ? AUTH.currentUser() : null;
      await this._request('POST', '/users/audit-logs', {
        action,
        table,
        recordId,
        userId:   user?.userId || 'system',
        userName: user?.name   || 'System',
      });
    } catch {
      // Non-critical — silently ignore audit log failures
    }
  },

  // ── Table utilities ──────────────────────────────────────
  getTableNames() {
    return Object.keys(TABLE_ROUTES);
  },

  clearTable(table) {
    console.warn(`[DB] clearTable(${table}) is not supported in server mode.`);
  },

  // ── Column name normaliser ───────────────────────────────
  // MySQL returns snake_case columns; normalise frequently-used ones
  // to camelCase so existing module code keeps working.
  _normalise(row) {
    if (!row || typeof row !== 'object') return row;
    const map = {
      school_name:            'schoolName',
      school_type:            'schoolType',
      school_level:           'schoolLevel',
      deped_id:               'depedId',
      school_head:            'schoolHead',
      robotics_coordinator:   'roboticsCoordinator',
      years_joined:           'yearsJoined',
      contact_number:         'contactNumber',
      full_name:              'fullName',
      school_id:              'schoolId',
      coach_id:               'coachId',
      years_coaching:         'yearsCoaching',
      previous_awards:        'previousAwards',
      emergency_contact:      'emergencyContact',
      shirt_size:             'shirtSize',
      grade_level:            'gradeLevel',
      parent_name:            'parentName',
      parent_contact:         'parentContact',
      parent_email:           'parentEmail',
      medical_conditions:     'medicalConditions',
      previous_participation: 'previousParticipation',
      consent_signed:         'consentSigned',
      competition_id:         'competitionId',
      team_name:              'teamName',
      age_group:              'ageGroup',
      robot_platform:         'robotPlatform',
      programming_language:   'programmingLanguage',
      registration_status:    'registrationStatus',
      payment_status:         'paymentStatus',
      qualification_status:   'qualificationStatus',
      judge_name:             'judgeName',
      final_score:            'finalScore',
      judging_category:       'judgingCategory',
      contact_number:         'contactNumber',
      team_id:                'teamId',
      school_id:              'schoolId',
      has_trophy:             'hasTrophy',
      has_medal:              'hasMedal',
      has_certificate:        'hasCertificate',
      registration_fee:       'registrationFee',
      amount_paid:            'amountPaid',
      payment_date:           'paymentDate',
      payment_method:         'paymentMethod',
      or_number:              'orNumber',
      registration_confirmation: 'registrationConfirmation',
      payment_confirmation:   'paymentConfirmation',
      certificate_sent:       'certificateSent',
      email_history:          'emailHistory',
      sms_history:            'smsHistory',
      announcement_received:  'announcementReceived',
      feedback_submitted:     'feedbackSubmitted',
      destination_country:    'destinationCountry',
      wro_year:               'wroYear',
      passport_status:        'passportStatus',
      passport_expiry:        'passportExpiry',
      visa_status:            'visaStatus',
      parent_consent:         'parentConsent',
      dietary_restrictions:   'dietaryRestrictions',
      is_active:              'isActive',
      is_deleted:             'isDeleted',
      last_login:             'lastLogin',
      password_hash:          'passwordHash',
      created_at:             'createdAt',
      updated_at:             'updatedAt',
      deleted_at:             'deletedAt',
      school_code:             'schoolCode',
      coach_code:              'coachCode',
      student_code:            'studentCode',
      team_code:               'teamCode',
      competition_code:        'competitionCode',
      judge_code:              'judgeCode',
      season_code:             'seasonCode',
      award_code:              'awardCode',
      payment_code:            'paymentCode',
      comm_code:               'commCode',
      delegation_code:         'delegationCode',
      number_of_teams:        'numberOfTeams',
      number_of_schools:      'numberOfSchools',
      number_of_coaches:      'numberOfCoaches',
      number_of_students:     'numberOfStudents',
      registration_deadline:  'registrationDeadline',
      table_name:             'table',
      record_id:              'recordId',
      user_id:                'userId',
      user_name:              'userName',
    };
    const out = {};
    for (const [k, v] of Object.entries(row)) {
      const mapped = map[k];
      if (mapped) {
        out[mapped] = v;
        // Keep original too for compatibility
        out[k] = v;
      } else {
        out[k] = v;
      }
    }
    return out;
  },
};

// ── Patch _request to auto-normalise all response rows ────────
const _origRequest = DB._request.bind(DB);
DB._request = async function(method, path, body = null) {
  const data = await _origRequest(method, path, body);
  if (Array.isArray(data)) return data.map(r => DB._normalise(r));
  if (data && typeof data === 'object' && data.id) return DB._normalise(data);
  return data;
};

window.DB = DB;
