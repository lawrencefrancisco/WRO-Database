// ============================================================
// WRO Philippines – Automatic Database & Schema Initializer
// Guarantees all tables exist + seeds default admin account.
// Called BEFORE app.listen so tables are ready for all requests.
// ============================================================

const bcrypt = require('bcryptjs');

async function autoInitDatabase(pool) {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('🛠️  Running database auto-init...');

    // Disable FK checks for the duration of setup
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');

    // ── Core Tables ───────────────────────────────────────────
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

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS coaches (
        id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        coach_code          VARCHAR(60)   NOT NULL,
        full_name           VARCHAR(200)  NOT NULL,
        school_id           INT UNSIGNED  DEFAULT NULL,
        position            VARCHAR(100)  DEFAULT NULL,
        email               VARCHAR(200)  DEFAULT NULL,
        contact_number      VARCHAR(50)   DEFAULT NULL,
        specialization      VARCHAR(200)  DEFAULT NULL,
        status              ENUM('active','inactive') NOT NULL DEFAULT 'active',
        is_deleted          TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at          DATETIME      DEFAULT NULL,
        created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_coach_code (coach_code),
        KEY idx_school (school_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        student_code    VARCHAR(60)   NOT NULL,
        full_name       VARCHAR(200)  NOT NULL,
        school_id       INT UNSIGNED  DEFAULT NULL,
        grade_level     VARCHAR(50)   DEFAULT NULL,
        age             TINYINT UNSIGNED DEFAULT NULL,
        gender          ENUM('Male','Female','Other') DEFAULT NULL,
        email           VARCHAR(200)  DEFAULT NULL,
        contact_number  VARCHAR(50)   DEFAULT NULL,
        status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
        is_deleted      TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at      DATETIME      DEFAULT NULL,
        created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_student_code (student_code),
        KEY idx_school (school_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS seasons (
        id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        season_code     VARCHAR(60)   NOT NULL,
        season_name     VARCHAR(200)  NOT NULL,
        year            YEAR          DEFAULT NULL,
        start_date      DATE          DEFAULT NULL,
        end_date        DATE          DEFAULT NULL,
        status          ENUM('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
        is_deleted      TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at      DATETIME      DEFAULT NULL,
        created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_season_code (season_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS competitions (
        id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        competition_code    VARCHAR(60)   NOT NULL,
        competition_name    VARCHAR(300)  NOT NULL,
        season_id           INT UNSIGNED  DEFAULT NULL,
        category            VARCHAR(100)  DEFAULT NULL,
        venue               VARCHAR(300)  DEFAULT NULL,
        competition_date    DATE          DEFAULT NULL,
        status              ENUM('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
        is_deleted          TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at          DATETIME      DEFAULT NULL,
        created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_competition_code (competition_code),
        KEY idx_season (season_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS teams (
        id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        team_code         VARCHAR(60)   NOT NULL,
        team_name         VARCHAR(300)  NOT NULL,
        school_id         INT UNSIGNED  DEFAULT NULL,
        coach_id          INT UNSIGNED  DEFAULT NULL,
        competition_id    INT UNSIGNED  DEFAULT NULL,
        season_id         INT UNSIGNED  DEFAULT NULL,
        category          VARCHAR(100)  DEFAULT NULL,
        division          VARCHAR(100)  DEFAULT NULL,
        qualified         TINYINT(1)    DEFAULT 0,
        payment_status    ENUM('paid','unpaid','partial','waived') DEFAULT 'unpaid',
        status            ENUM('registered','active','disqualified','withdrawn') DEFAULT 'registered',
        is_deleted        TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at        DATETIME      DEFAULT NULL,
        created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_team_code (team_code),
        KEY idx_school       (school_id),
        KEY idx_competition  (competition_id),
        KEY idx_season       (season_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS team_members (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        team_id     INT UNSIGNED  NOT NULL,
        student_id  INT UNSIGNED  NOT NULL,
        role        VARCHAR(100)  DEFAULT 'Member',
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_team_member (team_id, student_id),
        KEY idx_student (student_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS judging (
        id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        judging_code      VARCHAR(60)   NOT NULL,
        team_id           INT UNSIGNED  DEFAULT NULL,
        competition_id    INT UNSIGNED  DEFAULT NULL,
        robot_design      DECIMAL(5,2)  DEFAULT 0,
        project_score     DECIMAL(5,2)  DEFAULT 0,
        programming_score DECIMAL(5,2)  DEFAULT 0,
        performance_score DECIMAL(5,2)  DEFAULT 0,
        total_score       DECIMAL(5,2)  DEFAULT 0,
        \`rank\`            INT UNSIGNED  DEFAULT NULL,
        remarks           TEXT          DEFAULT NULL,
        status            ENUM('pending','scored','finalized') DEFAULT 'pending',
        is_deleted        TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at        DATETIME      DEFAULT NULL,
        created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_judging_code (judging_code),
        KEY idx_team        (team_id),
        KEY idx_competition (competition_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS awards (
        id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        award_code      VARCHAR(60)   NOT NULL,
        team_id         INT UNSIGNED  DEFAULT NULL,
        competition_id  INT UNSIGNED  DEFAULT NULL,
        award_name      VARCHAR(300)  NOT NULL,
        award_type      VARCHAR(100)  DEFAULT NULL,
        placement       INT UNSIGNED  DEFAULT NULL,
        description     TEXT          DEFAULT NULL,
        is_deleted      TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at      DATETIME      DEFAULT NULL,
        created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_award_code (award_code),
        KEY idx_team        (team_id),
        KEY idx_competition (competition_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        payment_code      VARCHAR(60)   NOT NULL,
        team_id           INT UNSIGNED  DEFAULT NULL,
        school_id         INT UNSIGNED  DEFAULT NULL,
        registration_fee  DECIMAL(10,2) DEFAULT 0,
        amount_paid       DECIMAL(10,2) DEFAULT 0,
        balance           DECIMAL(10,2) DEFAULT 0,
        payment_date      DATE          DEFAULT NULL,
        payment_method    VARCHAR(100)  DEFAULT NULL,
        or_number         VARCHAR(100)  DEFAULT NULL,
        sponsorship       DECIMAL(10,2) DEFAULT 0,
        scholarship       ENUM('None','Partial','Full') DEFAULT 'None',
        status            ENUM('paid','unpaid','partial','waived') DEFAULT 'unpaid',
        is_deleted        TINYINT(1)    NOT NULL DEFAULT 0,
        deleted_at        DATETIME      DEFAULT NULL,
        created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_payment_code (payment_code),
        KEY idx_team   (team_id),
        KEY idx_school (school_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

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

    // ── Column migrations ──────────────────────────────────────
    // Ensure image_url exists on announcements
    try {
      await conn.execute('SELECT image_url FROM announcements LIMIT 1');
    } catch (e) {
      if (e.code === 'ER_BAD_FIELD_ERROR') {
        await conn.execute('ALTER TABLE announcements ADD COLUMN image_url MEDIUMTEXT DEFAULT NULL AFTER body');
        console.log('🛠️  Added image_url column to announcements.');
      }
    }

    // Ensure school_id exists on users
    try {
      await conn.execute('SELECT school_id FROM users LIMIT 1');
    } catch (e) {
      if (e.code === 'ER_BAD_FIELD_ERROR') {
        await conn.execute('ALTER TABLE users ADD COLUMN school_id INT UNSIGNED DEFAULT NULL AFTER email');
        console.log('🛠️  Added school_id column to users.');
      }
    }

    // ── Seed default accounts if table is empty ────────────────
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

      console.log('✅ Seed accounts created:');
      console.log('   👑 admin / password  (SUPER_ADMIN)');
      console.log('   👤 user  / password  (STANDARD_USER)');
    } else {
      console.log(`ℹ️  Users table already has ${count} account(s). Skipping seed.`);
    }

    console.log('🚀 Database auto-init complete.');
  } catch (err) {
    console.error('❌ Auto-init database error:', err.message);
    throw err; // Re-throw so server startup fails clearly
  } finally {
    if (conn) conn.release();
  }
}

module.exports = autoInitDatabase;
