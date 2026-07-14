-- ============================================================
-- WRO Philippines DBMS – Seed Data Purge Script
-- Removes ALL demo / seed records inserted by seed.js and
-- database_seed.sql.  Keeps USER_SUPERADMIN so admin login works.
--
-- Run:  mysql -u root wro_philippines < server/purge_seed_data.sql
-- ============================================================

USE wro_philippines;

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. Judge Assignments (junction — no is_deleted, just DELETE) ─
DELETE FROM judge_assignments
WHERE judge_id LIKE 'JDG_%';

-- ── 2. Team Members (junction — cascade-safe after teams gone) ───
DELETE FROM team_members
WHERE team_id LIKE 'TEAM_%';

-- ── 3. Communications ──────────────────────────────────────────
DELETE FROM communications
WHERE id LIKE 'COM_%';

-- ── 4. Delegation ──────────────────────────────────────────────
DELETE FROM delegation
WHERE id LIKE 'DEL_%';

-- ── 5. Payments ────────────────────────────────────────────────
DELETE FROM payments
WHERE id LIKE 'PAY_%';

-- ── 6. Awards ──────────────────────────────────────────────────
DELETE FROM awards
WHERE id LIKE 'AWD_%';

-- ── 7. Teams ───────────────────────────────────────────────────
DELETE FROM teams
WHERE id LIKE 'TEAM_%';

-- ── 8. Judges ──────────────────────────────────────────────────
DELETE FROM judges
WHERE id LIKE 'JDG_%';

-- ── 9. Competitions ────────────────────────────────────────────
DELETE FROM competitions
WHERE id LIKE 'COMP_%';

-- ── 10. Seasons ────────────────────────────────────────────────
DELETE FROM seasons
WHERE id LIKE 'WRO_%';

-- ── 11. Coaches ────────────────────────────────────────────────
DELETE FROM coaches
WHERE id LIKE 'COA_%';

-- ── 12. Students ───────────────────────────────────────────────
DELETE FROM students
WHERE id LIKE 'STU_%';

-- ── 13. Schools ────────────────────────────────────────────────
DELETE FROM schools
WHERE id LIKE 'SCH_%';

-- ── 14. Users — delete demo accounts, keep SUPERADMIN ──────────
DELETE FROM users
WHERE id IN ('USER_EVENTADMIN','USER_JUDGE1','USER_COACH1','USER_VOLUNTEER1');
-- USER_SUPERADMIN (admin / admin123) is intentionally kept for login.

-- ── 15. Audit Logs — clear seed-era entries ────────────────────
DELETE FROM audit_logs
WHERE record_id LIKE 'SCH_%'
   OR record_id LIKE 'COA_%'
   OR record_id LIKE 'STU_%'
   OR record_id LIKE 'TEAM_%'
   OR record_id LIKE 'COMP_%'
   OR record_id LIKE 'WRO_%'
   OR record_id LIKE 'JDG_%'
   OR record_id LIKE 'AWD_%'
   OR record_id LIKE 'PAY_%'
   OR record_id LIKE 'COM_%'
   OR record_id LIKE 'DEL_%'
   OR record_id IN ('USER_EVENTADMIN','USER_JUDGE1','USER_COACH1','USER_VOLUNTEER1');

SET FOREIGN_KEY_CHECKS = 1;

-- ── Verification counts (should all be 0) ──────────────────────
SELECT 'schools'        AS tbl, COUNT(*) AS remaining FROM schools        WHERE id LIKE 'SCH_%'
UNION ALL
SELECT 'coaches',                COUNT(*)              FROM coaches        WHERE id LIKE 'COA_%'
UNION ALL
SELECT 'students',               COUNT(*)              FROM students       WHERE id LIKE 'STU_%'
UNION ALL
SELECT 'teams',                  COUNT(*)              FROM teams          WHERE id LIKE 'TEAM_%'
UNION ALL
SELECT 'competitions',           COUNT(*)              FROM competitions   WHERE id LIKE 'COMP_%'
UNION ALL
SELECT 'seasons',                COUNT(*)              FROM seasons        WHERE id LIKE 'WRO_%'
UNION ALL
SELECT 'judges',                 COUNT(*)              FROM judges         WHERE id LIKE 'JDG_%'
UNION ALL
SELECT 'awards',                 COUNT(*)              FROM awards         WHERE id LIKE 'AWD_%'
UNION ALL
SELECT 'payments',               COUNT(*)              FROM payments       WHERE id LIKE 'PAY_%'
UNION ALL
SELECT 'communications',         COUNT(*)              FROM communications WHERE id LIKE 'COM_%'
UNION ALL
SELECT 'delegation',             COUNT(*)              FROM delegation     WHERE id LIKE 'DEL_%'
UNION ALL
SELECT 'demo_users',             COUNT(*)              FROM users
  WHERE id IN ('USER_EVENTADMIN','USER_JUDGE1','USER_COACH1','USER_VOLUNTEER1');
