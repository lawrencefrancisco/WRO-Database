// ============================================================
// WRO Philippines – Automatic Database & Schema Initializer
// Guarantees all tables exist + seeds default admin account.
// Called BEFORE app.listen so tables are ready for all requests.
// Uses exact schemas matching database.sql.
// ============================================================

const bcrypt = require('bcryptjs');

async function autoInitDatabase(pool) {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('🛠️  Running database auto-init...');

    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');

    // ── 1. users ─────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_code       VARCHAR(60)   NOT NULL,
        username        VARCHAR(100)  NOT NULL,
        password_hash   VARCHAR(255)  NOT NULL,
        name            VARCHAR(200)  NOT NULL,
        role            ENUM('SUPER_ADMIN','EVENT_ADMIN','STANDARD_USER') NOT NULL DEFAULT 'STANDARD_USER',
        email           VARCHAR(200)  DEFAULT NULL,
        school_id       INT UNSIGNED  DEFAULT NULL,
        avatar          VARCHAR(500)  DEFAULT NULL,
        is_active       TINYINT(1)    NOT NULL DEFAULT 1,
        last_login      DATETIME      DEFAULT NULL,
        is_deleted      TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at      DATETIME      DEFAULT NULL,
        created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_user_code (user_code),
        UNIQUE KEY uq_username  (username),
        KEY idx_role      (role),
        KEY idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 2. schools ───────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS schools (
        id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        school_code             VARCHAR(60)   NOT NULL,
        school_name             VARCHAR(300)  NOT NULL,
        school_type             ENUM('Private','Public','Sectarian') DEFAULT 'Private',
        school_level            VARCHAR(100)  DEFAULT NULL,
        deped_id                VARCHAR(50)   DEFAULT NULL,
        region                  VARCHAR(200)  DEFAULT NULL,
        province                VARCHAR(200)  DEFAULT NULL,
        city                    VARCHAR(200)  DEFAULT NULL,
        address                 VARCHAR(500)  DEFAULT NULL,
        contact_number          VARCHAR(50)   DEFAULT NULL,
        email                   VARCHAR(200)  DEFAULT NULL,
        school_head             VARCHAR(200)  DEFAULT NULL,
        robotics_coordinator    VARCHAR(200)  DEFAULT NULL,
        website                 VARCHAR(300)  DEFAULT NULL,
        years_joined            YEAR          DEFAULT NULL,
        status                  ENUM('active','inactive') NOT NULL DEFAULT 'active',
        is_deleted              TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at              DATETIME      DEFAULT NULL,
        created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_school_code (school_code),
        KEY idx_region      (region(100)),
        KEY idx_status      (status),
        KEY idx_school_name (school_name(100))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 3. coaches ───────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS coaches (
        id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        coach_code          VARCHAR(60)   NOT NULL,
        full_name           VARCHAR(200)  NOT NULL,
        birthday            DATE          DEFAULT NULL,
        gender              ENUM('Male','Female','Other') DEFAULT NULL,
        email               VARCHAR(200)  DEFAULT NULL,
        mobile              VARCHAR(20)   DEFAULT NULL,
        school_id           INT UNSIGNED  DEFAULT NULL,
        position            VARCHAR(200)  DEFAULT NULL,
        shirt_size          ENUM('XS','S','M','L','XL','XXL') DEFAULT 'M',
        emergency_contact   VARCHAR(300)  DEFAULT NULL,
        certifications      VARCHAR(300)  DEFAULT NULL,
        years_coaching      INT           DEFAULT 0,
        previous_awards     VARCHAR(300)  DEFAULT NULL,
        status              ENUM('active','inactive') NOT NULL DEFAULT 'active',
        is_deleted          TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at          DATETIME      DEFAULT NULL,
        created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_coach_code (coach_code),
        KEY idx_school_id (school_id),
        KEY idx_full_name (full_name(100))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 4. students ──────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        student_code            VARCHAR(60)   NOT NULL,
        full_name               VARCHAR(200)  NOT NULL,
        birthday                DATE          DEFAULT NULL,
        age                     INT           DEFAULT NULL,
        gender                  ENUM('Male','Female','Other') DEFAULT NULL,
        grade_level             VARCHAR(50)   DEFAULT NULL,
        school_id               INT UNSIGNED  DEFAULT NULL,
        parent_name             VARCHAR(200)  DEFAULT NULL,
        parent_contact          VARCHAR(20)   DEFAULT NULL,
        parent_email            VARCHAR(200)  DEFAULT NULL,
        medical_conditions      VARCHAR(300)  DEFAULT 'None',
        allergies               VARCHAR(300)  DEFAULT 'None',
        shirt_size              ENUM('XS','S','M','L','XL') DEFAULT 'M',
        previous_participation  INT           DEFAULT 0,
        consent_signed          TINYINT(1)    NOT NULL DEFAULT 0,
        status                  ENUM('active','inactive') NOT NULL DEFAULT 'active',
        is_deleted              TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at              DATETIME      DEFAULT NULL,
        created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_student_code (student_code),
        KEY idx_school_id (school_id),
        KEY idx_full_name (full_name(100)),
        KEY idx_gender    (gender)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 5. competitions ──────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS competitions (
        id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        competition_code        VARCHAR(60)   NOT NULL,
        name                    VARCHAR(300)  NOT NULL,
        season                  VARCHAR(50)   DEFAULT NULL,
        theme                   VARCHAR(200)  DEFAULT NULL,
        date                    DATE          DEFAULT NULL,
        venue                   VARCHAR(300)  DEFAULT NULL,
        organizer               VARCHAR(200)  DEFAULT NULL,
        registration_deadline   DATE          DEFAULT NULL,
        categories              JSON          DEFAULT NULL,
        status                  ENUM('upcoming','ongoing','completed','cancelled') NOT NULL DEFAULT 'upcoming',
        is_deleted              TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at              DATETIME      DEFAULT NULL,
        created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_competition_code (competition_code),
        KEY idx_season (season),
        KEY idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 6. teams ─────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS teams (
        id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        team_code               VARCHAR(60)   NOT NULL,
        season                  VARCHAR(50)   DEFAULT NULL,
        competition_id          INT UNSIGNED  DEFAULT NULL,
        team_name               VARCHAR(200)  NOT NULL,
        category                VARCHAR(200)  DEFAULT NULL,
        age_group               ENUM('Elementary','Junior','Senior','Open') DEFAULT NULL,
        school_id               INT UNSIGNED  DEFAULT NULL,
        coach_id                INT UNSIGNED  DEFAULT NULL,
        robot_platform          VARCHAR(200)  DEFAULT NULL,
        programming_language    VARCHAR(200)  DEFAULT NULL,
        registration_status     ENUM('registered','confirmed','waitlisted','withdrawn') DEFAULT 'registered',
        payment_status          ENUM('unpaid','partial','paid') DEFAULT 'unpaid',
        qualification_status    ENUM('pending','qualified','disqualified') DEFAULT 'pending',
        status                  ENUM('active','inactive') NOT NULL DEFAULT 'active',
        is_deleted              TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at              DATETIME      DEFAULT NULL,
        created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_team_code (team_code),
        KEY idx_competition (competition_id),
        KEY idx_school      (school_id),
        KEY idx_coach       (coach_id),
        KEY idx_season      (season),
        KEY idx_category    (category(100))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 7. team_members ──────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS team_members (
        team_id     INT UNSIGNED NOT NULL,
        student_id  INT UNSIGNED NOT NULL,
        PRIMARY KEY (team_id, student_id),
        KEY idx_student (student_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 8. judges ────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS judges (
        id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        judge_code        VARCHAR(60)   NOT NULL,
        full_name         VARCHAR(200)  NOT NULL,
        contact_number    VARCHAR(50)   DEFAULT NULL,
        gender            ENUM('Male','Female','Other') DEFAULT NULL,
        season            VARCHAR(50)   DEFAULT NULL,
        judging_category  VARCHAR(200)  DEFAULT NULL,
        status            ENUM('active','inactive') NOT NULL DEFAULT 'active',
        is_deleted        TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at        DATETIME      DEFAULT NULL,
        created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_judge_code (judge_code),
        KEY idx_season   (season),
        KEY idx_status   (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 9. seasons ───────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS seasons (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        season_code VARCHAR(20)   NOT NULL,
        name        VARCHAR(30)   NOT NULL,
        year        YEAR          NOT NULL,
        is_active   TINYINT(1)    NOT NULL DEFAULT 1,
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_season_code (season_code),
        UNIQUE KEY uq_name        (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 10. judge_assignments ────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS judge_assignments (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        judge_id    INT UNSIGNED  NOT NULL,
        season      VARCHAR(50)   NOT NULL,
        category    VARCHAR(200)  NOT NULL,
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_judge_season_cat (judge_id, season, category(100)),
        KEY idx_judge_id (judge_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 11. awards ───────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS awards (
        id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        award_code      VARCHAR(60)   NOT NULL,
        team_id         INT UNSIGNED  DEFAULT NULL,
        school_id       INT UNSIGNED  DEFAULT NULL,
        coach_id        INT UNSIGNED  DEFAULT NULL,
        category        VARCHAR(200)  DEFAULT NULL,
        award           VARCHAR(200)  NOT NULL,
        year            YEAR          DEFAULT NULL,
        event           VARCHAR(300)  DEFAULT NULL,
        has_trophy      TINYINT(1)    DEFAULT 0,
        has_medal       TINYINT(1)    DEFAULT 0,
        has_certificate TINYINT(1)    DEFAULT 1,
        status          ENUM('confirmed','pending','revoked') DEFAULT 'confirmed',
        is_deleted      TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at      DATETIME      DEFAULT NULL,
        created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_award_code (award_code),
        KEY idx_team   (team_id),
        KEY idx_school (school_id),
        KEY idx_year   (year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 12. payments ─────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        payment_code        VARCHAR(60)   NOT NULL,
        team_id             INT UNSIGNED  DEFAULT NULL,
        school_id           INT UNSIGNED  DEFAULT NULL,
        registration_fee    DECIMAL(10,2) DEFAULT 0.00,
        amount_paid         DECIMAL(10,2) DEFAULT 0.00,
        balance             DECIMAL(10,2) DEFAULT 0.00,
        payment_date        DATE          DEFAULT NULL,
        payment_method      VARCHAR(100)  DEFAULT NULL,
        or_number           VARCHAR(50)   DEFAULT NULL,
        sponsorship         DECIMAL(10,2) DEFAULT 0.00,
        scholarship         VARCHAR(100)  DEFAULT 'None',
        status              ENUM('unpaid','partial','paid') DEFAULT 'unpaid',
        is_deleted          TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at          DATETIME      DEFAULT NULL,
        created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_payment_code (payment_code),
        KEY idx_team   (team_id),
        KEY idx_school (school_id),
        KEY idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 13. communications ───────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS communications (
        id                          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        comm_code                   VARCHAR(60)   NOT NULL,
        team_id                     INT UNSIGNED  DEFAULT NULL,
        registration_confirmation   TINYINT(1)    DEFAULT 0,
        payment_confirmation        TINYINT(1)    DEFAULT 0,
        certificate_sent            TINYINT(1)    DEFAULT 0,
        email_history               JSON          DEFAULT NULL,
        sms_history                 JSON          DEFAULT NULL,
        announcement_received       TINYINT(1)    DEFAULT 0,
        feedback_submitted          TINYINT(1)    DEFAULT 0,
        status                      ENUM('active','inactive') DEFAULT 'active',
        is_deleted                  TINYINT(1)    DEFAULT 0,
        deleted_at                  DATETIME      DEFAULT NULL,
        created_at                  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at                  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_comm_code (comm_code),
        KEY idx_team (team_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 14. delegation ───────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS delegation (
        id                    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        delegation_code       VARCHAR(60)   NOT NULL,
        team_id               INT UNSIGNED  DEFAULT NULL,
        destination_country   VARCHAR(200)  DEFAULT NULL,
        wro_year              YEAR          DEFAULT NULL,
        passport_status       ENUM('submitted','processing','approved','expired') DEFAULT 'submitted',
        passport_expiry       DATE          DEFAULT NULL,
        visa_status           ENUM('not required','applied','approved','denied') DEFAULT 'not required',
        parent_consent        TINYINT(1)    DEFAULT 0,
        flight                VARCHAR(300)  DEFAULT NULL,
        hotel                 VARCHAR(200)  DEFAULT NULL,
        dietary_restrictions  VARCHAR(200)  DEFAULT 'None',
        shirt_size            ENUM('XS','S','M','L','XL','XXL') DEFAULT 'M',
        emergency_contact     VARCHAR(200)  DEFAULT NULL,
        status                ENUM('confirmed','pending','cancelled') DEFAULT 'pending',
        is_deleted            TINYINT(1)    DEFAULT 0,
        deleted_at            DATETIME      DEFAULT NULL,
        created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_delegation_code (delegation_code),
        KEY idx_team (team_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 15. audit_logs ───────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        log_code    VARCHAR(80)   NOT NULL,
        action      ENUM('INSERT','UPDATE','DELETE','LOGIN','LOGOUT') NOT NULL,
        table_name  VARCHAR(100)  NOT NULL,
        record_id   INT UNSIGNED  DEFAULT NULL,
        user_id     INT UNSIGNED  DEFAULT NULL,
        user_name   VARCHAR(200)  DEFAULT NULL,
        timestamp   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_log_code (log_code),
        KEY idx_action    (action),
        KEY idx_table     (table_name),
        KEY idx_timestamp (timestamp),
        KEY idx_user      (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 16. announcements ────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS announcements (
        id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        announcement_code   VARCHAR(60)   NOT NULL,
        title               VARCHAR(300)  NOT NULL,
        body                LONGTEXT,
        image_url           MEDIUMTEXT    DEFAULT NULL,
        category            ENUM('general','payment','qualification','delegation','competition') DEFAULT 'general',
        recipients          ENUM('all','schools','coaches','teams','judges','volunteers','delegates') DEFAULT 'all',
        status              ENUM('draft','published','archived') DEFAULT 'draft',
        publish_at          DATETIME      DEFAULT NULL,
        created_by          INT UNSIGNED  DEFAULT NULL,
        is_deleted          TINYINT(1)    DEFAULT 0,
        deleted_at          DATETIME      DEFAULT NULL,
        created_at          DATETIME      DEFAULT CURRENT_TIMESTAMP,
        updated_at          DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_announcement_code (announcement_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 17. notification_log ─────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS notification_log (
        id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        event_type      VARCHAR(100)  NOT NULL,
        title           VARCHAR(300)  NOT NULL,
        message         LONGTEXT,
        team_id         INT UNSIGNED  DEFAULT NULL,
        school_id       INT UNSIGNED  DEFAULT NULL,
        triggered_by    VARCHAR(200),
        is_read         TINYINT(1)    DEFAULT 0,
        read_at         DATETIME      DEFAULT NULL,
        created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ All tables verified/created.');

    // ── Column migrations (idempotent) ────────────────────────

    // announcements.image_url
    try { await conn.execute('SELECT image_url FROM announcements LIMIT 1'); }
    catch (e) {
      if (e.code === 'ER_BAD_FIELD_ERROR') {
        await conn.execute('ALTER TABLE announcements ADD COLUMN image_url MEDIUMTEXT DEFAULT NULL AFTER body');
        console.log('🛠️  Added image_url to announcements.');
      }
    }

    // users.school_id
    try { await conn.execute('SELECT school_id FROM users LIMIT 1'); }
    catch (e) {
      if (e.code === 'ER_BAD_FIELD_ERROR') {
        await conn.execute('ALTER TABLE users ADD COLUMN school_id INT UNSIGNED DEFAULT NULL AFTER email');
        console.log('🛠️  Added school_id to users.');
      }
    }

    // ── Seed default accounts if empty ───────────────────────
    const [[{ count }]] = await conn.execute(
      'SELECT COUNT(*) AS count FROM users WHERE is_deleted = 0'
    );

    if (parseInt(count) === 0) {
      console.log('🌱 Seeding default admin accounts...');
      const adminHash = await bcrypt.hash('password', 10);
      const userHash  = await bcrypt.hash('password', 10);

      await conn.execute(`
        INSERT INTO users (user_code, username, password_hash, name, role, email, is_active, created_at)
        VALUES
          ('USER_SUPERADMIN', 'admin', ?, 'System Administrator', 'SUPER_ADMIN', 'admin@wroph.org', 1, NOW()),
          ('USER_STANDARD',   'user',  ?, 'Standard Portal User', 'STANDARD_USER','user@wroph.org',  1, NOW())
      `, [adminHash, userHash]);

      console.log('✅ Seeded: admin/password (SUPER_ADMIN) and user/password (STANDARD_USER)');
    } else {
      console.log(`ℹ️  ${count} user(s) already exist. Skipping seed.`);
    }

    console.log('🚀 Database auto-init complete.');
  } catch (err) {
    console.error('❌ Auto-init database error:', err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = autoInitDatabase;
