/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: announcements
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `announcement_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` longtext COLLATE utf8mb4_unicode_ci,
  `image_url` mediumtext COLLATE utf8mb4_unicode_ci,
  `category` enum(
  'general',
  'payment',
  'qualification',
  'delegation',
  'competition'
  ) COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `recipients` enum(
  'all',
  'schools',
  'coaches',
  'teams',
  'judges',
  'volunteers',
  'delegates'
  ) COLLATE utf8mb4_unicode_ci DEFAULT 'all',
  `status` enum('draft', 'published', 'archived') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `publish_at` datetime DEFAULT NULL,
  `created_by` int unsigned DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_announcement_code` (`announcement_code`)
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: audit_logs
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `log_code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` enum('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` int unsigned DEFAULT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `user_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_log_code` (`log_code`),
  KEY `idx_action` (`action`),
  KEY `idx_table` (`table_name`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_user` (`user_id`)
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: awards
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `awards` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `award_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_id` int unsigned DEFAULT NULL,
  `school_id` int unsigned DEFAULT NULL,
  `coach_id` int unsigned DEFAULT NULL,
  `category` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `award` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` year DEFAULT NULL,
  `event` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `has_trophy` tinyint(1) DEFAULT '0',
  `has_medal` tinyint(1) DEFAULT '0',
  `has_certificate` tinyint(1) DEFAULT '1',
  `status` enum('confirmed', 'pending', 'revoked') COLLATE utf8mb4_unicode_ci DEFAULT 'confirmed',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_award_code` (`award_code`),
  KEY `idx_team` (`team_id`),
  KEY `idx_school` (`school_id`),
  KEY `idx_year` (`year`)
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: coaches
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `coaches` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `coach_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `birthday` date DEFAULT NULL,
  `gender` enum('Male', 'Female', 'Other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_id` int unsigned DEFAULT NULL,
  `position` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shirt_size` enum('XS', 'S', 'M', 'L', 'XL', 'XXL') COLLATE utf8mb4_unicode_ci DEFAULT 'M',
  `emergency_contact` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active', 'inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_coach_code` (`coach_code`),
  KEY `idx_school_id` (`school_id`),
  KEY `idx_full_name` (`full_name`(100))
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: communications
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `communications` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `comm_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_id` int unsigned DEFAULT NULL,
  `registration_confirmation` tinyint(1) DEFAULT '0',
  `payment_confirmation` tinyint(1) DEFAULT '0',
  `certificate_sent` tinyint(1) DEFAULT '0',
  `email_history` json DEFAULT NULL,
  `sms_history` json DEFAULT NULL,
  `announcement_received` tinyint(1) DEFAULT '0',
  `feedback_submitted` tinyint(1) DEFAULT '0',
  `status` enum('active', 'inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_comm_code` (`comm_code`),
  KEY `idx_team` (`team_id`)
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: competitions
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `competitions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `competition_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `season` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `theme` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `venue` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `organizer` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registration_deadline` date DEFAULT NULL,
  `categories` json DEFAULT NULL,
  `status` enum('upcoming', 'ongoing', 'completed', 'cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'upcoming',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_competition_code` (`competition_code`),
  KEY `idx_season` (`season`),
  KEY `idx_status` (`status`)
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: delegation
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `delegation` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `delegation_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_id` int unsigned DEFAULT NULL,
  `destination_country` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wro_year` year DEFAULT NULL,
  `passport_status` enum('submitted', 'processing', 'approved', 'expired') COLLATE utf8mb4_unicode_ci DEFAULT 'submitted',
  `passport_expiry` date DEFAULT NULL,
  `visa_status` enum('not required', 'applied', 'approved', 'denied') COLLATE utf8mb4_unicode_ci DEFAULT 'not required',
  `parent_consent` tinyint(1) DEFAULT '0',
  `flight` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hotel` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dietary_restrictions` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT 'None',
  `shirt_size` enum('XS', 'S', 'M', 'L', 'XL', 'XXL') COLLATE utf8mb4_unicode_ci DEFAULT 'M',
  `emergency_contact` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('confirmed', 'pending', 'cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_delegation_code` (`delegation_code`),
  KEY `idx_team` (`team_id`)
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: judge_assignments
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `judge_assignments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `judge_id` int unsigned NOT NULL,
  `season` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_judge_season_cat` (`judge_id`, `season`, `category`(100)),
  KEY `idx_judge_id` (`judge_id`)
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: judges
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `judges` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `judge_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('Male', 'Female', 'Other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `season` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `judging_category` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active', 'inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_judge_code` (`judge_code`),
  KEY `idx_season` (`season`),
  KEY `idx_status` (`status`)
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: judging
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `judging` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `judging_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_id` int unsigned DEFAULT NULL,
  `competition_id` int unsigned DEFAULT NULL,
  `robot_design` decimal(5, 2) DEFAULT '0.00',
  `project_score` decimal(5, 2) DEFAULT '0.00',
  `programming_score` decimal(5, 2) DEFAULT '0.00',
  `performance_score` decimal(5, 2) DEFAULT '0.00',
  `total_score` decimal(5, 2) DEFAULT '0.00',
  `rank` int unsigned DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending', 'scored', 'finalized') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_judging_code` (`judging_code`),
  KEY `idx_team` (`team_id`),
  KEY `idx_competition` (`competition_id`)
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: notification_log
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `notification_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `event_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` longtext COLLATE utf8mb4_unicode_ci,
  `team_id` int unsigned DEFAULT NULL,
  `school_id` int unsigned DEFAULT NULL,
  `triggered_by` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: payments
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `payments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `payment_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_id` int unsigned DEFAULT NULL,
  `school_id` int unsigned DEFAULT NULL,
  `registration_fee` decimal(10, 2) DEFAULT '0.00',
  `amount_paid` decimal(10, 2) DEFAULT '0.00',
  `balance` decimal(10, 2) DEFAULT '0.00',
  `payment_date` date DEFAULT NULL,
  `payment_method` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `or_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sponsorship` decimal(10, 2) DEFAULT '0.00',
  `scholarship` enum('None', 'Partial', 'Full') COLLATE utf8mb4_unicode_ci DEFAULT 'None',
  `status` enum('paid', 'unpaid', 'partial', 'waived') COLLATE utf8mb4_unicode_ci DEFAULT 'unpaid',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_code` (`payment_code`),
  KEY `idx_team` (`team_id`),
  KEY `idx_school` (`school_id`)
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: schools
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `schools` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `school_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `school_name` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `school_type` enum('Private', 'Public', 'Sectarian') COLLATE utf8mb4_unicode_ci DEFAULT 'Private',
  `school_level` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `region` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_head` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `robotics_coordinator` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `years_joined` year DEFAULT NULL,
  `status` enum('active', 'inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_school_code` (`school_code`),
  KEY `idx_region` (`region`(100)),
  KEY `idx_status` (`status`),
  KEY `idx_school_name` (`school_name`(100))
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: seasons
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `seasons` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `season_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` year NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_season_code` (`season_code`),
  UNIQUE KEY `uq_name` (`name`)
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: students
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `students` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `student_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `birthday` date DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` enum('Male', 'Female', 'Other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grade_level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_id` int unsigned DEFAULT NULL,
  `parent_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_contact` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_email` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `medical_conditions` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT 'None',
  `allergies` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT 'None',
  `shirt_size` enum('XS', 'S', 'M', 'L', 'XL') COLLATE utf8mb4_unicode_ci DEFAULT 'M',
  `previous_participation` int DEFAULT '0',
  `consent_signed` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('active', 'inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_student_code` (`student_code`),
  KEY `idx_school_id` (`school_id`),
  KEY `idx_full_name` (`full_name`(100)),
  KEY `idx_gender` (`gender`)
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: team_members
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `team_members` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `team_id` int unsigned NOT NULL,
  `student_id` int unsigned NOT NULL,
  `role` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Member',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_team_member` (`team_id`, `student_id`),
  KEY `idx_student` (`student_id`)
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: teams
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `teams` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `team_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `season` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `competition_id` int unsigned DEFAULT NULL,
  `team_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age_group` enum('Elementary', 'Junior', 'Senior', 'Open') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_id` int unsigned DEFAULT NULL,
  `coach_id` int unsigned DEFAULT NULL,
  `robot_platform` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `programming_language` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registration_status` enum(
  'registered',
  'confirmed',
  'waitlisted',
  'withdrawn'
  ) COLLATE utf8mb4_unicode_ci DEFAULT 'registered',
  `payment_status` enum('unpaid', 'partial', 'paid') COLLATE utf8mb4_unicode_ci DEFAULT 'unpaid',
  `qualification_status` enum('pending', 'qualified', 'disqualified') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `status` enum('active', 'inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_team_code` (`team_code`),
  KEY `idx_competition` (`competition_id`),
  KEY `idx_school` (`school_id`),
  KEY `idx_coach` (`coach_id`),
  KEY `idx_season` (`season`),
  KEY `idx_category` (`category`(100))
);

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: users
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('SUPER_ADMIN', 'EVENT_ADMIN', 'STANDARD_USER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STANDARD_USER',
  `email` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_id` int unsigned DEFAULT NULL,
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_code` (`user_code`),
  UNIQUE KEY `uq_username` (`username`),
  KEY `idx_role` (`role`),
  KEY `idx_is_active` (`is_active`)
);

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: announcements
# ------------------------------------------------------------

INSERT INTO
  `announcements` (
    `id`,
    `announcement_code`,
    `title`,
    `body`,
    `image_url`,
    `category`,
    `recipients`,
    `status`,
    `publish_at`,
    `created_by`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    1,
    'ANN_1784280060990',
    'Dating Lulong ngayon tutulong',
    'Bryan dagul',
    'data:image/jpeg;base64,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',
    'general',
    'all',
    'published',
    '2026-07-17 17:20:00',
    NULL,
    0,
    NULL,
    '2026-07-17 09:21:02',
    '2026-07-17 09:21:02'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: audit_logs
# ------------------------------------------------------------

INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    1,
    'LOG_1784278277483_IMF5',
    'INSERT',
    'schools',
    1,
    1,
    'System Administrator',
    '2026-07-17 08:51:17'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    2,
    'LOG_1784279084837_CLML',
    'INSERT',
    'coaches',
    1,
    1,
    'System Administrator',
    '2026-07-17 09:04:45'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    3,
    'LOG_1784279097997_TEGU',
    'UPDATE',
    'coaches',
    1,
    1,
    'System Administrator',
    '2026-07-17 09:04:58'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    4,
    'LOG_1784279105504_CYXH',
    'UPDATE',
    'coaches',
    1,
    1,
    'System Administrator',
    '2026-07-17 09:05:05'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    5,
    'LOG_1784279157190_4ISW',
    'INSERT',
    'students',
    1,
    1,
    'System Administrator',
    '2026-07-17 09:05:57'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    6,
    'LOG_1784279170984_8Q2Z',
    'UPDATE',
    'students',
    1,
    1,
    'System Administrator',
    '2026-07-17 09:06:11'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    7,
    'LOG_1784279248747_QMU8',
    'INSERT',
    'teams',
    1,
    1,
    'System Administrator',
    '2026-07-17 09:07:28'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    8,
    'LOG_1784279356326_CS33',
    'UPDATE',
    'users',
    2,
    1,
    'System Administrator',
    '2026-07-17 09:09:16'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    9,
    'LOG_1784280063999_EHTA',
    'INSERT',
    'announcements',
    1,
    1,
    'System Administrator',
    '2026-07-17 09:21:04'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    10,
    'LOG_1784317724393_CLY9',
    'INSERT',
    'students',
    2,
    1,
    'System Administrator',
    '2026-07-17 19:48:44'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    11,
    'LOG_1784317829048_SHD5',
    'INSERT',
    'schools',
    2,
    1,
    'System Administrator',
    '2026-07-17 19:50:29'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    12,
    'LOG_1784317911879_DUUT',
    'UPDATE',
    'students',
    2,
    1,
    'System Administrator',
    '2026-07-17 19:51:52'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    13,
    'LOG_1784318031318_6T27',
    'INSERT',
    'teams',
    2,
    1,
    'System Administrator',
    '2026-07-17 19:53:51'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    14,
    'LOG_1784318093741_U78S',
    'INSERT',
    'coaches',
    2,
    1,
    'System Administrator',
    '2026-07-17 19:54:53'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    15,
    'LOG_1784318124403_V2I1',
    'UPDATE',
    'teams',
    2,
    1,
    'System Administrator',
    '2026-07-17 19:55:24'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    16,
    'LOG_1784318234282_NG5Z',
    'INSERT',
    'students',
    3,
    1,
    'System Administrator',
    '2026-07-17 19:57:14'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    17,
    'LOG_1784318287963_KI3I',
    'INSERT',
    'schools',
    3,
    1,
    'System Administrator',
    '2026-07-17 19:58:08'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    18,
    'LOG_1784318383332_F35E',
    'INSERT',
    'students',
    4,
    1,
    'System Administrator',
    '2026-07-17 19:59:43'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    19,
    'LOG_1784318390061_1AHA',
    'UPDATE',
    'students',
    3,
    1,
    'System Administrator',
    '2026-07-17 19:59:50'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    20,
    'LOG_1784318505794_VR0N',
    'INSERT',
    'teams',
    3,
    1,
    'System Administrator',
    '2026-07-17 20:01:46'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    21,
    'LOG_1784318542210_8W31',
    'INSERT',
    'coaches',
    3,
    1,
    'System Administrator',
    '2026-07-17 20:02:22'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    22,
    'LOG_1784318562500_96LH',
    'UPDATE',
    'teams',
    3,
    1,
    'System Administrator',
    '2026-07-17 20:02:42'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    23,
    'LOG_1784318653916_PJC3',
    'INSERT',
    'payments',
    1,
    1,
    'System Administrator',
    '2026-07-17 20:04:14'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    24,
    'LOG_1784318762324_GDI2',
    'INSERT',
    'payments',
    2,
    1,
    'System Administrator',
    '2026-07-17 20:06:02'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    25,
    'LOG_1784318855234_66C4',
    'UPDATE',
    'teams',
    3,
    1,
    'System Administrator',
    '2026-07-17 20:07:35'
  );
INSERT INTO
  `audit_logs` (
    `id`,
    `log_code`,
    `action`,
    `table_name`,
    `record_id`,
    `user_id`,
    `user_name`,
    `timestamp`
  )
VALUES
  (
    26,
    'LOG_1784318869274_FWP3',
    'UPDATE',
    'teams',
    2,
    1,
    'System Administrator',
    '2026-07-17 20:07:49'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: awards
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: coaches
# ------------------------------------------------------------

INSERT INTO
  `coaches` (
    `id`,
    `coach_code`,
    `full_name`,
    `birthday`,
    `gender`,
    `email`,
    `mobile`,
    `school_id`,
    `position`,
    `shirt_size`,
    `emergency_contact`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    1,
    'COA_1784279083641',
    'Kots Mavs',
    '2002-02-06',
    'Male',
    'kotsunbelievablebasketbol@gmail.com',
    '09255467832',
    1,
    'Point Guard',
    'M',
    '',
    'active',
    0,
    NULL,
    '2026-07-17 09:04:44',
    '2026-07-17 09:05:04'
  );
INSERT INTO
  `coaches` (
    `id`,
    `coach_code`,
    `full_name`,
    `birthday`,
    `gender`,
    `email`,
    `mobile`,
    `school_id`,
    `position`,
    `shirt_size`,
    `emergency_contact`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    2,
    'COA_1784318092545',
    'Kots Chot',
    '1996-02-05',
    'Male',
    'chot@gmail.com',
    '09692941370',
    2,
    'Math Teacher',
    'L',
    '',
    'active',
    0,
    NULL,
    '2026-07-17 19:54:52',
    '2026-07-17 19:54:52'
  );
INSERT INTO
  `coaches` (
    `id`,
    `coach_code`,
    `full_name`,
    `birthday`,
    `gender`,
    `email`,
    `mobile`,
    `school_id`,
    `position`,
    `shirt_size`,
    `emergency_contact`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    3,
    'COA_1784318540599',
    'Kots Steve',
    '2024-02-18',
    'Male',
    '',
    '',
    3,
    '',
    'XS',
    '',
    'active',
    0,
    NULL,
    '2026-07-17 20:02:20',
    '2026-07-17 20:02:20'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: communications
# ------------------------------------------------------------

INSERT INTO
  `communications` (
    `id`,
    `comm_code`,
    `team_id`,
    `registration_confirmation`,
    `payment_confirmation`,
    `certificate_sent`,
    `email_history`,
    `sms_history`,
    `announcement_received`,
    `feedback_submitted`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    1,
    'COM_1784318854552',
    3,
    0,
    0,
    0,
    NULL,
    NULL,
    0,
    0,
    'active',
    0,
    NULL,
    '2026-07-17 20:07:34',
    '2026-07-17 20:07:34'
  );
INSERT INTO
  `communications` (
    `id`,
    `comm_code`,
    `team_id`,
    `registration_confirmation`,
    `payment_confirmation`,
    `certificate_sent`,
    `email_history`,
    `sms_history`,
    `announcement_received`,
    `feedback_submitted`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    2,
    'COM_1784318868582',
    2,
    0,
    0,
    0,
    NULL,
    NULL,
    0,
    0,
    'active',
    0,
    NULL,
    '2026-07-17 20:07:48',
    '2026-07-17 20:07:48'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: competitions
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: delegation
# ------------------------------------------------------------

INSERT INTO
  `delegation` (
    `id`,
    `delegation_code`,
    `team_id`,
    `destination_country`,
    `wro_year`,
    `passport_status`,
    `passport_expiry`,
    `visa_status`,
    `parent_consent`,
    `flight`,
    `hotel`,
    `dietary_restrictions`,
    `shirt_size`,
    `emergency_contact`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    1,
    'DEL_1784318853585',
    3,
    'TBD',
    '2026',
    'submitted',
    NULL,
    'not required',
    0,
    NULL,
    NULL,
    'None',
    'M',
    NULL,
    'pending',
    0,
    NULL,
    '2026-07-17 20:07:33',
    '2026-07-17 20:07:33'
  );
INSERT INTO
  `delegation` (
    `id`,
    `delegation_code`,
    `team_id`,
    `destination_country`,
    `wro_year`,
    `passport_status`,
    `passport_expiry`,
    `visa_status`,
    `parent_consent`,
    `flight`,
    `hotel`,
    `dietary_restrictions`,
    `shirt_size`,
    `emergency_contact`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    2,
    'DEL_1784318867605',
    2,
    'TBD',
    '2026',
    'submitted',
    NULL,
    'not required',
    0,
    NULL,
    NULL,
    'None',
    'M',
    NULL,
    'pending',
    0,
    NULL,
    '2026-07-17 20:07:47',
    '2026-07-17 20:07:47'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: judge_assignments
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: judges
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: judging
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: notification_log
# ------------------------------------------------------------

INSERT INTO
  `notification_log` (
    `id`,
    `event_type`,
    `title`,
    `message`,
    `team_id`,
    `school_id`,
    `triggered_by`,
    `is_read`,
    `read_at`,
    `created_at`
  )
VALUES
  (
    1,
    'payment',
    'Payment paid – Zumbots',
    'Payment of ₱5000 recorded for Zumbots. Status: paid.',
    2,
    2,
    'Payments Module',
    0,
    NULL,
    '2026-07-17 20:04:13'
  );
INSERT INTO
  `notification_log` (
    `id`,
    `event_type`,
    `title`,
    `message`,
    `team_id`,
    `school_id`,
    `triggered_by`,
    `is_read`,
    `read_at`,
    `created_at`
  )
VALUES
  (
    2,
    'payment',
    'Payment partial – CVMC ACE Team',
    'Payment of ₱2000 recorded for CVMC ACE Team. Status: partial.',
    3,
    3,
    'Payments Module',
    1,
    '2026-07-18 11:45:24',
    '2026-07-17 20:06:01'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: payments
# ------------------------------------------------------------

INSERT INTO
  `payments` (
    `id`,
    `payment_code`,
    `team_id`,
    `school_id`,
    `registration_fee`,
    `amount_paid`,
    `balance`,
    `payment_date`,
    `payment_method`,
    `or_number`,
    `sponsorship`,
    `scholarship`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    1,
    'PAY_1784318651087',
    2,
    2,
    5000.00,
    5000.00,
    0.00,
    '2014-02-18',
    'Bank Transfer',
    NULL,
    0.00,
    'None',
    'paid',
    0,
    NULL,
    '2026-07-17 20:04:11',
    '2026-07-17 20:04:11'
  );
INSERT INTO
  `payments` (
    `id`,
    `payment_code`,
    `team_id`,
    `school_id`,
    `registration_fee`,
    `amount_paid`,
    `balance`,
    `payment_date`,
    `payment_method`,
    `or_number`,
    `sponsorship`,
    `scholarship`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    2,
    'PAY_1784318759299',
    3,
    3,
    5000.00,
    2000.00,
    3000.00,
    '2003-01-18',
    'Bank Transfer',
    NULL,
    0.00,
    'None',
    'partial',
    0,
    NULL,
    '2026-07-17 20:05:59',
    '2026-07-17 20:05:59'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: schools
# ------------------------------------------------------------

INSERT INTO
  `schools` (
    `id`,
    `school_code`,
    `school_name`,
    `school_type`,
    `school_level`,
    `region`,
    `province`,
    `city`,
    `address`,
    `contact_number`,
    `email`,
    `school_head`,
    `robotics_coordinator`,
    `website`,
    `years_joined`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    1,
    'SCH_1784278276355',
    'Pamantasan ng Lungsod ng Valenzuela',
    'Public',
    'College',
    'NCR – National Capital Region',
    '',
    'Valenzuela',
    '232 Tonco ST. Maysan',
    '0934885762',
    'plv@gmail.com',
    'Kenmar Bernard',
    'Ruffa monis',
    'plvworld.edu',
    '2026',
    'active',
    0,
    NULL,
    '2026-07-17 08:51:16',
    '2026-07-17 08:51:16'
  );
INSERT INTO
  `schools` (
    `id`,
    `school_code`,
    `school_name`,
    `school_type`,
    `school_level`,
    `region`,
    `province`,
    `city`,
    `address`,
    `contact_number`,
    `email`,
    `school_head`,
    `robotics_coordinator`,
    `website`,
    `years_joined`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    2,
    'SCH_1784317827826',
    'University of Davao',
    'Private',
    'College',
    'Region XI – Davao Region',
    '',
    'Davao',
    '545 Davao',
    '',
    'uod.22gmail.com',
    'Rodrigo Duretards',
    'Sara Duretards',
    'Davao.edu',
    '2026',
    'active',
    0,
    NULL,
    '2026-07-17 19:50:28',
    '2026-07-17 19:50:28'
  );
INSERT INTO
  `schools` (
    `id`,
    `school_code`,
    `school_name`,
    `school_type`,
    `school_level`,
    `region`,
    `province`,
    `city`,
    `address`,
    `contact_number`,
    `email`,
    `school_head`,
    `robotics_coordinator`,
    `website`,
    `years_joined`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    3,
    'SCH_1784318286787',
    'Cagayan Valley Main Campus',
    'Private',
    'Elementary',
    'Region II – Cagayan Valley',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    NULL,
    '2026',
    'active',
    0,
    NULL,
    '2026-07-17 19:58:07',
    '2026-07-17 19:58:07'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: seasons
# ------------------------------------------------------------

INSERT INTO
  `seasons` (
    `id`,
    `season_code`,
    `name`,
    `year`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    1,
    'WRO_2026',
    'WRO 2026',
    '2026',
    1,
    '2026-07-17 09:06:43'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: students
# ------------------------------------------------------------

INSERT INTO
  `students` (
    `id`,
    `student_code`,
    `full_name`,
    `birthday`,
    `age`,
    `gender`,
    `grade_level`,
    `school_id`,
    `parent_name`,
    `parent_contact`,
    `parent_email`,
    `medical_conditions`,
    `allergies`,
    `shirt_size`,
    `previous_participation`,
    `consent_signed`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    1,
    'STU_1784279156007',
    'Bryan Dagul',
    '2005-01-27',
    21,
    'Female',
    'Grade 12',
    1,
    'Mama Bryan',
    '09463247124',
    'mamabryan@gmail.com',
    'None',
    'None',
    'M',
    0,
    1,
    'active',
    0,
    NULL,
    '2026-07-17 09:05:56',
    '2026-07-17 09:06:10'
  );
INSERT INTO
  `students` (
    `id`,
    `student_code`,
    `full_name`,
    `birthday`,
    `age`,
    `gender`,
    `grade_level`,
    `school_id`,
    `parent_name`,
    `parent_contact`,
    `parent_email`,
    `medical_conditions`,
    `allergies`,
    `shirt_size`,
    `previous_participation`,
    `consent_signed`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    2,
    'STU_1784317722808',
    'Monica Santos',
    '2009-06-16',
    17,
    'Female',
    'Grade 12',
    2,
    'Yelena Santos',
    '',
    'ylna@gmail.com',
    'None',
    'None',
    'M',
    0,
    1,
    'active',
    0,
    NULL,
    '2026-07-17 19:48:43',
    '2026-07-17 19:51:50'
  );
INSERT INTO
  `students` (
    `id`,
    `student_code`,
    `full_name`,
    `birthday`,
    `age`,
    `gender`,
    `grade_level`,
    `school_id`,
    `parent_name`,
    `parent_contact`,
    `parent_email`,
    `medical_conditions`,
    `allergies`,
    `shirt_size`,
    `previous_participation`,
    `consent_signed`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    3,
    'STU_1784318233176',
    'Jyron Drei Ching',
    '2006-06-21',
    20,
    'Male',
    'Grade 12',
    3,
    'Mama Ching',
    '0988888888',
    'MamaChing@gmail.com',
    'Baliw',
    'None',
    'XS',
    0,
    1,
    'active',
    0,
    NULL,
    '2026-07-17 19:57:13',
    '2026-07-17 19:59:49'
  );
INSERT INTO
  `students` (
    `id`,
    `student_code`,
    `full_name`,
    `birthday`,
    `age`,
    `gender`,
    `grade_level`,
    `school_id`,
    `parent_name`,
    `parent_contact`,
    `parent_email`,
    `medical_conditions`,
    `allergies`,
    `shirt_size`,
    `previous_participation`,
    `consent_signed`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    4,
    'STU_1784318382630',
    'Ian Ignacio',
    '2004-09-22',
    21,
    'Male',
    'Grade 12',
    3,
    'Emporio Ivankov',
    '',
    'okama@gmail.com',
    'None',
    'None',
    'S',
    0,
    1,
    'active',
    0,
    NULL,
    '2026-07-17 19:59:42',
    '2026-07-17 19:59:42'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: team_members
# ------------------------------------------------------------

INSERT INTO
  `team_members` (`id`, `team_id`, `student_id`, `role`, `created_at`)
VALUES
  (1, 1, 1, 'Member', '2026-07-17 09:07:27');
INSERT INTO
  `team_members` (`id`, `team_id`, `student_id`, `role`, `created_at`)
VALUES
  (8, 3, 4, 'Member', '2026-07-17 20:07:32');
INSERT INTO
  `team_members` (`id`, `team_id`, `student_id`, `role`, `created_at`)
VALUES
  (9, 3, 3, 'Member', '2026-07-17 20:07:32');
INSERT INTO
  `team_members` (`id`, `team_id`, `student_id`, `role`, `created_at`)
VALUES
  (10, 2, 2, 'Member', '2026-07-17 20:07:46');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: teams
# ------------------------------------------------------------

INSERT INTO
  `teams` (
    `id`,
    `team_code`,
    `season`,
    `competition_id`,
    `team_name`,
    `category`,
    `age_group`,
    `school_id`,
    `coach_id`,
    `robot_platform`,
    `programming_language`,
    `registration_status`,
    `payment_status`,
    `qualification_status`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    1,
    'TEAM_1784279246360',
    'WRO 2026',
    NULL,
    'OHH OHH AHH AHH',
    'RoboMission – Senior',
    'Senior',
    1,
    1,
    'LEGO Mindstorms EV3',
    'LEGO Mindstorms Software',
    'registered',
    'unpaid',
    'pending',
    'active',
    0,
    NULL,
    '2026-07-17 09:07:26',
    '2026-07-17 09:07:26'
  );
INSERT INTO
  `teams` (
    `id`,
    `team_code`,
    `season`,
    `competition_id`,
    `team_name`,
    `category`,
    `age_group`,
    `school_id`,
    `coach_id`,
    `robot_platform`,
    `programming_language`,
    `registration_status`,
    `payment_status`,
    `qualification_status`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    2,
    'TEAM_1784318028548',
    'WRO 2026',
    NULL,
    'Zumbots',
    'WeDo',
    'Senior',
    2,
    2,
    'LEGO Mindstorms EV3',
    'LEGO Mindstorms Software',
    'registered',
    'paid',
    'qualified',
    'active',
    0,
    NULL,
    '2026-07-17 19:53:48',
    '2026-07-17 20:07:45'
  );
INSERT INTO
  `teams` (
    `id`,
    `team_code`,
    `season`,
    `competition_id`,
    `team_name`,
    `category`,
    `age_group`,
    `school_id`,
    `coach_id`,
    `robot_platform`,
    `programming_language`,
    `registration_status`,
    `payment_status`,
    `qualification_status`,
    `status`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    3,
    'TEAM_1784318503113',
    'WRO 2026',
    NULL,
    'CVMC ACE Team',
    'RoboMission – Elementary',
    'Senior',
    3,
    3,
    'LEGO Mindstorms EV3',
    'LEGO Mindstorms Software',
    'registered',
    'partial',
    'qualified',
    'active',
    0,
    NULL,
    '2026-07-17 20:01:43',
    '2026-07-17 20:07:31'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: users
# ------------------------------------------------------------

INSERT INTO
  `users` (
    `id`,
    `user_code`,
    `username`,
    `password_hash`,
    `name`,
    `role`,
    `email`,
    `school_id`,
    `avatar`,
    `is_active`,
    `last_login`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    1,
    'USER_SUPERADMIN',
    'admin',
    '$2a$10$3RMKvMz5iNxWfRvENM7PLePqtUA49TR9y53HaKHQBzglvuJeYLw1y',
    'System Administrator',
    'SUPER_ADMIN',
    'admin@wroph.org',
    NULL,
    NULL,
    1,
    '2026-07-18 19:15:14',
    0,
    NULL,
    '2026-07-17 08:48:08',
    '2026-07-18 19:15:14'
  );
INSERT INTO
  `users` (
    `id`,
    `user_code`,
    `username`,
    `password_hash`,
    `name`,
    `role`,
    `email`,
    `school_id`,
    `avatar`,
    `is_active`,
    `last_login`,
    `is_deleted`,
    `deleted_at`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    2,
    'USER_STANDARD',
    'user',
    '$2a$10$QBX8SgNTo2RR/ZF9MJALfOlgtlm7yJ1oehuKQmZuuctXxeN.dBfwe',
    'PLV Team',
    'STANDARD_USER',
    'user@wroph.org',
    1,
    NULL,
    1,
    '2026-07-18 19:39:26',
    0,
    NULL,
    '2026-07-17 08:48:08',
    '2026-07-18 19:39:26'
  );

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
