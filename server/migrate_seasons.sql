-- ============================================================
-- WRO Philippines DBMS – Seasons Migration (v2)
-- Creates a first-class seasons table with INT AUTO_INCREMENT PK.
-- season_code VARCHAR(20) UNIQUE carries the business code.
-- Removes manually-entered stat columns from competitions
-- (stats are now computed live from teams table).
--
-- Run once:
--   Get-Content "migrate_seasons.sql" | & "C:\xampp\mysql\bin\mysql.exe" -u root wro_philippines
-- ============================================================

USE wro_philippines;

-- ── 1. Seasons master table (v2 – surrogate key) ─────────────
CREATE TABLE IF NOT EXISTS seasons (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  season_code VARCHAR(20)   NOT NULL,                -- e.g. WRO_2026
  name        VARCHAR(30)   NOT NULL,                -- e.g. WRO 2026
  year        YEAR          NOT NULL,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_season_code (season_code),
  UNIQUE KEY uq_name        (name),
  UNIQUE KEY uq_year        (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. Seed existing seasons ──────────────────────────────────
INSERT IGNORE INTO seasons (season_code, name, year) VALUES
  ('WRO_2022', 'WRO 2022', 2022),
  ('WRO_2023', 'WRO 2023', 2023),
  ('WRO_2024', 'WRO 2024', 2024),
  ('WRO_2025', 'WRO 2025', 2025);

-- ── 3. Remove manually-entered stat columns from competitions ─
--    (Stats are always computed live from the teams table)
ALTER TABLE competitions
  DROP COLUMN IF EXISTS number_of_teams,
  DROP COLUMN IF EXISTS number_of_schools,
  DROP COLUMN IF EXISTS number_of_coaches,
  DROP COLUMN IF EXISTS number_of_students;

SELECT 'Migration complete: seasons table (v2) ready, manual stat columns removed.' AS result;
