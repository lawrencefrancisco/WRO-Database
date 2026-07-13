-- ============================================================
-- WRO Philippines DBMS – Judge Assignments Migration
-- Creates a pivot table for many-to-many season/category
-- assignments per judge.
--
-- Run once:
--   mysql -u root wro_philippines < server/migrate_judge_assignments.sql
-- ============================================================

USE wro_philippines;

CREATE TABLE IF NOT EXISTS judge_assignments (
  id          INT           NOT NULL AUTO_INCREMENT,
  judge_id    VARCHAR(60)   NOT NULL,
  season      VARCHAR(50)   NOT NULL,
  category    VARCHAR(200)  NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_judge_season_cat (judge_id, season, category(100)),
  KEY idx_judge_id (judge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Migration complete: judge_assignments table is ready.' AS result;
