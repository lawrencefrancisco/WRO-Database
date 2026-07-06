-- ============================================================
-- WRO Philippines DBMS – Database Schema
-- MySQL 8.0+ compatible
-- Run: mysql -u root wro_philippines < server/database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS wro_philippines
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE wro_philippines;

SET FOREIGN_KEY_CHECKS = 0;

-- ── Users ─────────────────────────────────────────────────────
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id              VARCHAR(60)   NOT NULL,
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
  UNIQUE KEY uq_username (username),
  KEY idx_role (role),
  KEY idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Schools ───────────────────────────────────────────────────
DROP TABLE IF EXISTS schools;
CREATE TABLE schools (
  id                      VARCHAR(60)   NOT NULL,
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
  KEY idx_region (region(100)),
  KEY idx_status (status),
  KEY idx_school_name (school_name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Coaches ───────────────────────────────────────────────────
DROP TABLE IF EXISTS coaches;
CREATE TABLE coaches (
  id                  VARCHAR(60)   NOT NULL,
  full_name           VARCHAR(200)  NOT NULL,
  birthday            DATE          DEFAULT NULL,
  gender              ENUM('Male','Female','Other') DEFAULT NULL,
  email               VARCHAR(200)  DEFAULT NULL,
  mobile              VARCHAR(20)   DEFAULT NULL,
  school_id           VARCHAR(60)   DEFAULT NULL,
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
  KEY idx_school_id (school_id),
  KEY idx_full_name (full_name(100)),
  CONSTRAINT fk_coaches_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Students ──────────────────────────────────────────────────
DROP TABLE IF EXISTS students;
CREATE TABLE students (
  id                      VARCHAR(60)   NOT NULL,
  full_name               VARCHAR(200)  NOT NULL,
  birthday                DATE          DEFAULT NULL,
  age                     INT           DEFAULT NULL,
  gender                  ENUM('Male','Female','Other') DEFAULT NULL,
  grade_level             VARCHAR(50)   DEFAULT NULL,
  school_id               VARCHAR(60)   DEFAULT NULL,
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
  KEY idx_school_id (school_id),
  KEY idx_full_name (full_name(100)),
  KEY idx_gender (gender),
  CONSTRAINT fk_students_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Competitions ──────────────────────────────────────────────
DROP TABLE IF EXISTS competitions;
CREATE TABLE competitions (
  id                      VARCHAR(60)   NOT NULL,
  name                    VARCHAR(300)  NOT NULL,
  season                  VARCHAR(50)   DEFAULT NULL,
  theme                   VARCHAR(200)  DEFAULT NULL,
  date                    DATE          DEFAULT NULL,
  venue                   VARCHAR(300)  DEFAULT NULL,
  organizer               VARCHAR(200)  DEFAULT NULL,
  registration_deadline   DATE          DEFAULT NULL,
  categories              JSON          DEFAULT NULL,
  number_of_teams         INT           DEFAULT 0,
  number_of_schools       INT           DEFAULT 0,
  number_of_coaches       INT           DEFAULT 0,
  number_of_students      INT           DEFAULT 0,
  status                  ENUM('upcoming','ongoing','completed','cancelled') NOT NULL DEFAULT 'upcoming',
  is_deleted              TINYINT(1)    NOT NULL DEFAULT 0,
  deleted_at              DATETIME      DEFAULT NULL,
  created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_season (season),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Teams ─────────────────────────────────────────────────────
DROP TABLE IF EXISTS teams;
CREATE TABLE teams (
  id                      VARCHAR(60)   NOT NULL,
  season                  VARCHAR(50)   DEFAULT NULL,
  competition_id          VARCHAR(60)   DEFAULT NULL,
  team_name               VARCHAR(200)  NOT NULL,
  category                VARCHAR(200)  DEFAULT NULL,
  age_group               ENUM('Elementary','Junior','Senior','Open') DEFAULT NULL,
  school_id               VARCHAR(60)   DEFAULT NULL,
  coach_id                VARCHAR(60)   DEFAULT NULL,
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
  KEY idx_competition (competition_id),
  KEY idx_school (school_id),
  KEY idx_coach (coach_id),
  KEY idx_season (season),
  KEY idx_category (category(100)),
  CONSTRAINT fk_teams_competition FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE SET NULL,
  CONSTRAINT fk_teams_school      FOREIGN KEY (school_id)      REFERENCES schools (id)      ON DELETE SET NULL,
  CONSTRAINT fk_teams_coach       FOREIGN KEY (coach_id)       REFERENCES coaches (id)      ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Team Members (junction table) ─────────────────────────────
DROP TABLE IF EXISTS team_members;
CREATE TABLE team_members (
  team_id     VARCHAR(60) NOT NULL,
  student_id  VARCHAR(60) NOT NULL,
  PRIMARY KEY (team_id, student_id),
  CONSTRAINT fk_tm_team    FOREIGN KEY (team_id)    REFERENCES teams    (id) ON DELETE CASCADE,
  CONSTRAINT fk_tm_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Judging ───────────────────────────────────────────────────
DROP TABLE IF EXISTS judging;
CREATE TABLE judging (
  id          VARCHAR(60)   NOT NULL,
  team_id     VARCHAR(60)   DEFAULT NULL,
  judge_name  VARCHAR(200)  DEFAULT NULL,
  category    VARCHAR(200)  DEFAULT NULL,
  criteria    JSON          DEFAULT NULL COMMENT '{"robotDesign":0,"programming":0,"missionPoints":0}',
  score       INT           DEFAULT 0,
  comments    TEXT          DEFAULT NULL,
  violations  VARCHAR(200)  DEFAULT 'None',
  final_score INT           DEFAULT 0,
  ranking     INT           DEFAULT NULL,
  status      ENUM('draft','submitted','finalized') DEFAULT 'draft',
  is_deleted  TINYINT(1)    NOT NULL DEFAULT 0,
  deleted_at  DATETIME      DEFAULT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_team (team_id),
  KEY idx_final_score (final_score),
  CONSTRAINT fk_judging_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Awards ────────────────────────────────────────────────────
DROP TABLE IF EXISTS awards;
CREATE TABLE awards (
  id              VARCHAR(60)   NOT NULL,
  team_id         VARCHAR(60)   DEFAULT NULL,
  school_id       VARCHAR(60)   DEFAULT NULL,
  coach_id        VARCHAR(60)   DEFAULT NULL,
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
  KEY idx_team    (team_id),
  KEY idx_school  (school_id),
  KEY idx_year    (year),
  CONSTRAINT fk_awards_team   FOREIGN KEY (team_id)   REFERENCES teams   (id) ON DELETE SET NULL,
  CONSTRAINT fk_awards_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE SET NULL,
  CONSTRAINT fk_awards_coach  FOREIGN KEY (coach_id)  REFERENCES coaches (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Payments ──────────────────────────────────────────────────
DROP TABLE IF EXISTS payments;
CREATE TABLE payments (
  id                  VARCHAR(60)   NOT NULL,
  team_id             VARCHAR(60)   DEFAULT NULL,
  school_id           VARCHAR(60)   DEFAULT NULL,
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
  KEY idx_team   (team_id),
  KEY idx_school (school_id),
  KEY idx_status (status),
  CONSTRAINT fk_payments_team   FOREIGN KEY (team_id)   REFERENCES teams   (id) ON DELETE SET NULL,
  CONSTRAINT fk_payments_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Communications ────────────────────────────────────────────
DROP TABLE IF EXISTS communications;
CREATE TABLE communications (
  id                          VARCHAR(60)   NOT NULL,
  team_id                     VARCHAR(60)   DEFAULT NULL,
  registration_confirmation   TINYINT(1)    DEFAULT 0,
  payment_confirmation        TINYINT(1)    DEFAULT 0,
  certificate_sent            TINYINT(1)    DEFAULT 0,
  email_history               JSON          DEFAULT NULL,
  sms_history                 JSON          DEFAULT NULL,
  announcement_received       TINYINT(1)    DEFAULT 0,
  feedback_submitted          TINYINT(1)    DEFAULT 0,
  status                      ENUM('active','inactive') DEFAULT 'active',
  is_deleted                  TINYINT(1)    NOT NULL DEFAULT 0,
  deleted_at                  DATETIME      DEFAULT NULL,
  created_at                  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_team (team_id),
  CONSTRAINT fk_comms_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── International Delegation ──────────────────────────────────
DROP TABLE IF EXISTS delegation;
CREATE TABLE delegation (
  id                    VARCHAR(60)   NOT NULL,
  team_id               VARCHAR(60)   DEFAULT NULL,
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
  is_deleted            TINYINT(1)    NOT NULL DEFAULT 0,
  deleted_at            DATETIME      DEFAULT NULL,
  created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_team (team_id),
  CONSTRAINT fk_delegation_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Audit Logs ────────────────────────────────────────────────
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
  id          VARCHAR(80)   NOT NULL,
  action      ENUM('INSERT','UPDATE','DELETE','LOGIN','LOGOUT') NOT NULL,
  table_name  VARCHAR(100)  NOT NULL,
  record_id   VARCHAR(80)   DEFAULT NULL,
  user_id     VARCHAR(60)   DEFAULT NULL,
  user_name   VARCHAR(200)  DEFAULT NULL,
  timestamp   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_action     (action),
  KEY idx_table      (table_name),
  KEY idx_timestamp  (timestamp),
  KEY idx_user       (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
