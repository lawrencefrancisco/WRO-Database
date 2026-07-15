-- ============================================================
-- WRO Philippines DBMS – Judge Module Migration (v2)
-- Replaces the old scoring-based `judging` table with a new
-- `judges` master-data table using INT AUTO_INCREMENT PKs.
-- judge_code VARCHAR(60) UNIQUE carries the business ID.
--
-- Run: mysql -u root wro_philippines < server/migrate_judges.sql
-- ============================================================

USE wro_philippines;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop the old digital scoring table
DROP TABLE IF EXISTS judging;

-- Create the new judges master-data table (v2 – surrogate key)
CREATE TABLE IF NOT EXISTS judges (
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

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration complete: judges table (v2 surrogate key) is ready.' AS result;
