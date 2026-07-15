-- ============================================================
-- WRO Philippines DBMS – Full Database Wipe Script
-- WARNING: THIS WILL DELETE ALL DATA IN ALL TABLES AND RESET
-- ALL AUTO_INCREMENT COUNTERS TO 1.
--
-- Run: mysql -u root wro_philippines < server/wipe_database.sql
-- ============================================================

USE wro_philippines;

-- Disable foreign key checks to prevent dependency errors during truncation
SET FOREIGN_KEY_CHECKS = 0;

-- Truncate all tables. 
-- TRUNCATE automatically resets the AUTO_INCREMENT counter to 1.
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE delegation;
TRUNCATE TABLE communications;
TRUNCATE TABLE payments;
TRUNCATE TABLE awards;
TRUNCATE TABLE judge_assignments;
TRUNCATE TABLE team_members;
TRUNCATE TABLE teams;
TRUNCATE TABLE judges;
TRUNCATE TABLE competitions;
TRUNCATE TABLE seasons;
TRUNCATE TABLE coaches;
TRUNCATE TABLE students;
TRUNCATE TABLE schools;
TRUNCATE TABLE users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Database completely wiped. All tables truncated and AUTO_INCREMENT reset.' AS Status;
