-- ============================================================
-- WRO Philippines DBMS – Payment Logs Migration
-- Run once in phpMyAdmin or MySQL CLI before starting the server
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_logs (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id      INT UNSIGNED NOT NULL,
  team_id         INT UNSIGNED,
  action          VARCHAR(64) NOT NULL,        -- 'created' | 'updated' | 'status_changed'
  prev_status     VARCHAR(32),
  new_status      VARCHAR(32),
  prev_amount     DECIMAL(12,2),
  new_amount      DECIMAL(12,2),
  prev_balance    DECIMAL(12,2),
  new_balance     DECIMAL(12,2),
  payment_date    DATE,
  or_number       VARCHAR(128),
  payment_method  VARCHAR(64),
  notes           TEXT,
  performed_by    VARCHAR(128) NOT NULL DEFAULT 'System',
  created_at      DATETIME NOT NULL DEFAULT NOW()
);
