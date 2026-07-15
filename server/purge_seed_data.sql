-- ============================================================
-- WRO Philippines DBMS – Seed Data Purge Script  (v2)
-- Removes ALL demo/seed records inserted by database_seed.sql.
-- With surrogate INT PKs, purges now match on the *_code columns
-- instead of the old VARCHAR id column.
-- Keeps the SUPER_ADMIN user so admin login still works.
--
-- Run: mysql -u root wro_philippines < server/purge_seed_data.sql
-- ============================================================

USE wro_philippines;

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. Judge Assignments (no is_deleted – hard delete via FK cascade) ─
--    judge_id is INT; cascade DELETE from judges covers this, but
--    explicit delete here handles the case where judges remain.
DELETE ja FROM judge_assignments ja
JOIN judges j ON j.id = ja.judge_id
WHERE j.judge_code LIKE 'JDG_%';

-- ── 2. Team Members (cascade-safe junction table) ─────────────
DELETE tm FROM team_members tm
JOIN teams t ON t.id = tm.team_id
WHERE t.team_code LIKE 'TEAM_%';

-- ── 3. Communications ──────────────────────────────────────────
DELETE FROM communications WHERE comm_code LIKE 'COM_%';

-- ── 4. Delegation ──────────────────────────────────────────────
DELETE FROM delegation WHERE delegation_code LIKE 'DEL_%';

-- ── 5. Payments ────────────────────────────────────────────────
DELETE FROM payments WHERE payment_code LIKE 'PAY_%';

-- ── 6. Awards ──────────────────────────────────────────────────
DELETE FROM awards WHERE award_code LIKE 'AWD_%';

-- ── 7. Teams ───────────────────────────────────────────────────
DELETE FROM teams WHERE team_code LIKE 'TEAM_%';

-- ── 8. Judges ──────────────────────────────────────────────────
DELETE FROM judges WHERE judge_code LIKE 'JDG_%';

-- ── 9. Competitions ────────────────────────────────────────────
DELETE FROM competitions WHERE competition_code LIKE 'COMP_%';

-- ── 10. Seasons ────────────────────────────────────────────────
DELETE FROM seasons WHERE season_code LIKE 'WRO_%';

-- ── 11. Coaches ────────────────────────────────────────────────
DELETE FROM coaches WHERE coach_code LIKE 'COA_%';

-- ── 12. Students ───────────────────────────────────────────────
DELETE FROM students WHERE student_code LIKE 'STU_%';

-- ── 13. Schools ────────────────────────────────────────────────
DELETE FROM schools WHERE school_code LIKE 'SCH_%';

-- ── 14. Users — delete demo accounts, keep SUPERADMIN ──────────
DELETE FROM users
WHERE user_code IN ('USER_EVENTADMIN','USER_JUDGE1','USER_COACH1','USER_VOLUNTEER1');
-- USER_SUPERADMIN (admin / admin123) is intentionally kept for login.

-- ── 15. Audit Logs — clear seed-era entries ────────────────────
DELETE FROM audit_logs
WHERE log_code LIKE 'LOG_%';

SET FOREIGN_KEY_CHECKS = 1;

-- ── Verification counts (all should be 0 after purge) ──────────
SELECT 'schools'        AS tbl, COUNT(*) AS remaining FROM schools        WHERE school_code        LIKE 'SCH_%'
UNION ALL
SELECT 'coaches',                COUNT(*)              FROM coaches        WHERE coach_code         LIKE 'COA_%'
UNION ALL
SELECT 'students',               COUNT(*)              FROM students       WHERE student_code       LIKE 'STU_%'
UNION ALL
SELECT 'teams',                  COUNT(*)              FROM teams          WHERE team_code          LIKE 'TEAM_%'
UNION ALL
SELECT 'competitions',           COUNT(*)              FROM competitions   WHERE competition_code   LIKE 'COMP_%'
UNION ALL
SELECT 'seasons',                COUNT(*)              FROM seasons        WHERE season_code        LIKE 'WRO_%'
UNION ALL
SELECT 'judges',                 COUNT(*)              FROM judges         WHERE judge_code         LIKE 'JDG_%'
UNION ALL
SELECT 'awards',                 COUNT(*)              FROM awards         WHERE award_code         LIKE 'AWD_%'
UNION ALL
SELECT 'payments',               COUNT(*)              FROM payments       WHERE payment_code       LIKE 'PAY_%'
UNION ALL
SELECT 'communications',         COUNT(*)              FROM communications WHERE comm_code          LIKE 'COM_%'
UNION ALL
SELECT 'delegation',             COUNT(*)              FROM delegation     WHERE delegation_code    LIKE 'DEL_%'
UNION ALL
SELECT 'demo_users',             COUNT(*)              FROM users
  WHERE user_code IN ('USER_EVENTADMIN','USER_JUDGE1','USER_COACH1','USER_VOLUNTEER1');
