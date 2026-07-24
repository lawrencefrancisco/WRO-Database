-- ============================================================
-- WRO Philippines DBMS – Database Schema
-- MySQL 8.0+ compatible
-- Design: INT AUTO_INCREMENT surrogate PKs on every table.
--         Human-readable business codes stored in separate
--         UNIQUE VARCHAR columns (e.g. school_code, coach_code).
--         All Foreign Keys reference the parent integer id.
-- Run: mysql -u root wro_philippines < server/database.sql
-- ============================================================

-- Disable FK checks globally so DROP/CREATE order is flexible
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS wro_philippines
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE wro_philippines;

-- ── Drop all tables in dependency-safe order ─────────────────
-- (child tables first so no FK violations on re-runs)
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS delegation;
DROP TABLE IF EXISTS communications;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS awards;
DROP TABLE IF EXISTS judge_assignments;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS judges;
DROP TABLE IF EXISTS competitions;
DROP TABLE IF EXISTS seasons;
DROP TABLE IF EXISTS coaches;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS schools;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS judging;


-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE users (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_code       VARCHAR(60)   NOT NULL,               -- e.g. USER_SUPERADMIN (business ID)
  username        VARCHAR(100)  NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  name            VARCHAR(200)  NOT NULL,
  role            ENUM('SUPER_ADMIN','EVENT_ADMIN','JUDGE','COACH','VOLUNTEER') NOT NULL DEFAULT 'VOLUNTEER',
  email           VARCHAR(200)  DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Schools ───────────────────────────────────────────────────
CREATE TABLE schools (
  id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  school_code             VARCHAR(60)   NOT NULL,               -- e.g. SCH_001 (internal business code)
  school_name             VARCHAR(300)  NOT NULL,
  school_type             ENUM('Private','Public','Sectarian') DEFAULT 'Private',
  school_level            VARCHAR(100)  DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Coaches ───────────────────────────────────────────────────
CREATE TABLE coaches (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  coach_code          VARCHAR(60)   NOT NULL,               -- e.g. COA_001
  full_name           VARCHAR(200)  NOT NULL,
  birthday            DATE          DEFAULT NULL,
  gender              ENUM('Male','Female','Other') DEFAULT NULL,
  email               VARCHAR(200)  DEFAULT NULL,
  mobile              VARCHAR(20)   DEFAULT NULL,
  school_id           INT UNSIGNED  DEFAULT NULL,           -- FK → schools.id
  position            VARCHAR(200)  DEFAULT NULL,
  shirt_size          ENUM('XS','S','M','L','XL','XXL') DEFAULT 'M',
  emergency_contact   VARCHAR(300)  DEFAULT NULL,
  status              ENUM('active','inactive') NOT NULL DEFAULT 'active',
  is_deleted          TINYINT(1)    NOT NULL DEFAULT 0,
  deleted_at          DATETIME      DEFAULT NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_coach_code (coach_code),
  KEY idx_school_id (school_id),
  KEY idx_full_name (full_name(100)),
  CONSTRAINT fk_coaches_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Students ──────────────────────────────────────────────────
CREATE TABLE students (
  id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  student_code            VARCHAR(60)   NOT NULL,               -- e.g. STU_0001
  full_name               VARCHAR(200)  NOT NULL,
  birthday                DATE          DEFAULT NULL,
  age                     INT           DEFAULT NULL,
  gender                  ENUM('Male','Female','Other') DEFAULT NULL,
  grade_level             VARCHAR(50)   DEFAULT NULL,
  school_id               INT UNSIGNED  DEFAULT NULL,           -- FK → schools.id
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
  KEY idx_gender    (gender),
  CONSTRAINT fk_students_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Competitions ──────────────────────────────────────────────
CREATE TABLE competitions (
  id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  competition_code        VARCHAR(60)   NOT NULL,               -- e.g. COMP_001
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Teams ─────────────────────────────────────────────────────
CREATE TABLE teams (
  id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  team_code               VARCHAR(60)   NOT NULL,               -- e.g. TEAM_0001
  season                  VARCHAR(50)   DEFAULT NULL,
  competition_id          INT UNSIGNED  DEFAULT NULL,           -- FK → competitions.id
  team_name               VARCHAR(200)  NOT NULL,
  category                VARCHAR(200)  DEFAULT NULL,
  age_group               ENUM('Elementary','Junior','Senior','Open') DEFAULT NULL,
  school_id               INT UNSIGNED  DEFAULT NULL,           -- FK → schools.id
  coach_id                INT UNSIGNED  DEFAULT NULL,           -- FK → coaches.id
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
  KEY idx_category    (category(100)),
  CONSTRAINT fk_teams_competition FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE SET NULL,
  CONSTRAINT fk_teams_school      FOREIGN KEY (school_id)      REFERENCES schools      (id) ON DELETE SET NULL,
  CONSTRAINT fk_teams_coach       FOREIGN KEY (coach_id)       REFERENCES coaches      (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Team Members (junction table) ─────────────────────────────
CREATE TABLE team_members (
  team_id     INT UNSIGNED NOT NULL,                           -- FK → teams.id
  student_id  INT UNSIGNED NOT NULL,                           -- FK → students.id
  PRIMARY KEY (team_id, student_id),
  CONSTRAINT fk_tm_team    FOREIGN KEY (team_id)    REFERENCES teams    (id) ON DELETE CASCADE,
  CONSTRAINT fk_tm_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Judges (Master Data) ──────────────────────────────────────
CREATE TABLE judges (
  id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  judge_code        VARCHAR(60)   NOT NULL,               -- e.g. JDG_0001
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
  KEY idx_category (judging_category(100)),
  KEY idx_status   (status),
  KEY idx_gender   (gender),
  KEY idx_name     (full_name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seasons ───────────────────────────────────────────────────
CREATE TABLE seasons (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  season_code VARCHAR(20)  NOT NULL,                      -- e.g. WRO_2026
  name       VARCHAR(30)   NOT NULL,                      -- e.g. WRO 2026
  year       YEAR          NOT NULL,
  is_active  TINYINT(1)    NOT NULL DEFAULT 1,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_season_code (season_code),
  UNIQUE KEY uq_name        (name),
  UNIQUE KEY uq_year        (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Judge Assignments ─────────────────────────────────────────
CREATE TABLE judge_assignments (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  judge_id    INT UNSIGNED  NOT NULL,                     -- FK → judges.id
  season      VARCHAR(50)   NOT NULL,
  category    VARCHAR(200)  NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_judge_season_cat (judge_id, season, category(100)),
  KEY idx_judge_id (judge_id),
  CONSTRAINT fk_ja_judge FOREIGN KEY (judge_id) REFERENCES judges (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Awards ────────────────────────────────────────────────────
CREATE TABLE awards (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  award_code      VARCHAR(60)   NOT NULL,               -- e.g. AWD_0001
  team_id         INT UNSIGNED  DEFAULT NULL,           -- FK → teams.id
  school_id       INT UNSIGNED  DEFAULT NULL,           -- FK → schools.id
  coach_id        INT UNSIGNED  DEFAULT NULL,           -- FK → coaches.id
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
  KEY idx_year   (year),
  CONSTRAINT fk_awards_team   FOREIGN KEY (team_id)   REFERENCES teams   (id) ON DELETE SET NULL,
  CONSTRAINT fk_awards_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE SET NULL,
  CONSTRAINT fk_awards_coach  FOREIGN KEY (coach_id)  REFERENCES coaches (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Payments ──────────────────────────────────────────────────
CREATE TABLE payments (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  payment_code        VARCHAR(60)   NOT NULL,               -- e.g. PAY_0001
  team_id             INT UNSIGNED  DEFAULT NULL,           -- FK → teams.id
  school_id           INT UNSIGNED  DEFAULT NULL,           -- FK → schools.id
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
  KEY idx_status (status),
  CONSTRAINT fk_payments_team   FOREIGN KEY (team_id)   REFERENCES teams   (id) ON DELETE SET NULL,
  CONSTRAINT fk_payments_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Communications ────────────────────────────────────────────
CREATE TABLE communications (
  id                          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  comm_code                   VARCHAR(60)   NOT NULL,               -- e.g. COM_0001
  team_id                     INT UNSIGNED  DEFAULT NULL,           -- FK → teams.id
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
  KEY idx_team (team_id),
  CONSTRAINT fk_comms_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── International Delegation ──────────────────────────────────
CREATE TABLE delegation (
  id                    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  delegation_code       VARCHAR(60)   NOT NULL,               -- e.g. DEL_001
  team_id               INT UNSIGNED  DEFAULT NULL,           -- FK → teams.id
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
  KEY idx_team (team_id),
  CONSTRAINT fk_delegation_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Audit Logs ────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  log_code    VARCHAR(80)   NOT NULL,                     -- e.g. LOG_<timestamp>_XXXX
  action      ENUM('INSERT','UPDATE','DELETE','LOGIN','LOGOUT') NOT NULL,
  table_name  VARCHAR(100)  NOT NULL,
  record_id   INT UNSIGNED  DEFAULT NULL,                 -- surrogate PK of the affected row
  user_id     INT UNSIGNED  DEFAULT NULL,                 -- FK → users.id (best-effort, no hard FK)
  user_name   VARCHAR(200)  DEFAULT NULL,
  timestamp   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_log_code (log_code),
  KEY idx_action    (action),
  KEY idx_table     (table_name),
  KEY idx_timestamp (timestamp),
  KEY idx_user      (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
