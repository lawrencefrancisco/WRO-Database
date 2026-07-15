-- ============================================================
-- WRO Philippines DBMS – Judge Assignments Migration (v2)
-- Creates a pivot table for many-to-many season/category
-- assignments per judge. judge_id is now INT UNSIGNED FK
-- referencing judges.id (the surrogate PK).
--
-- Run once:
--   mysql -u root wro_philippines < server/migrate_judge_assignments.sql
-- ============================================================

USE wro_philippines;

CREATE TABLE IF NOT EXISTS judge_assignments (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  judge_id    INT UNSIGNED  NOT NULL,             -- FK → judges.id (surrogate PK)
  season      VARCHAR(50)   NOT NULL,
  category    VARCHAR(200)  NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_judge_season_cat (judge_id, season, category(100)),
  KEY idx_judge_id (judge_id),
  CONSTRAINT fk_ja_judge FOREIGN KEY (judge_id) REFERENCES judges (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Migration complete: judge_assignments table (v2 INT FK) is ready.' AS result;
