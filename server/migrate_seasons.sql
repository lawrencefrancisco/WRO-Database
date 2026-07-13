-- ============================================================
-- WRO Philippines DBMS – Seasons Migration
-- Creates a first-class seasons table and removes the manually-
-- entered stat columns from competitions (stats are now live).
--
-- Run once:
--   Get-Content "migrate_seasons.sql" | & "C:\xampp\mysql\bin\mysql.exe" -u root wro_philippines
-- ============================================================

USE wro_philippines;

-- ── 1. Seasons master table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS seasons (
  id         VARCHAR(20)   NOT NULL,      -- e.g. WRO_2026
  name       VARCHAR(30)   NOT NULL,      -- e.g. WRO 2026
  year       YEAR          NOT NULL,
  is_active  TINYINT(1)    NOT NULL DEFAULT 1,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_name (name),
  UNIQUE KEY uq_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. Seed existing seasons from Seeder.SEASONS constants ────
INSERT IGNORE INTO seasons (id, name, year) VALUES
  ('WRO_2022', 'WRO 2022', 2022),
  ('WRO_2023', 'WRO 2023', 2023),
  ('WRO_2024', 'WRO 2024', 2024),
  ('WRO_2025', 'WRO 2025', 2025);

-- ── 3. Remove manually-entered stat columns from competitions ─
--    (Stats are now always computed live from the teams table)
ALTER TABLE competitions
  DROP COLUMN IF EXISTS number_of_teams,
  DROP COLUMN IF EXISTS number_of_schools,
  DROP COLUMN IF EXISTS number_of_coaches,
  DROP COLUMN IF EXISTS number_of_students;

SELECT 'Migration complete: seasons table ready, manual stat columns removed.' AS result;
