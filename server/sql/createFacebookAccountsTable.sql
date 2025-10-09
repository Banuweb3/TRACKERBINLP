-- Facebook Accounts Table
-- Stores user-specific Facebook tokens and account connections

CREATE TABLE IF NOT EXISTS facebook_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  facebook_user_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  token_expiry DATETIME NULL,
  refresh_token TEXT NULL,
  account_type ENUM('page', 'ad_account', 'user') NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  permissions JSON NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_account (user_id, account_type, account_id),
  INDEX idx_user_id (user_id),
  INDEX idx_account_type (account_type),
  INDEX idx_active (is_active)
);

-- Sample data (optional - for testing)
-- INSERT INTO facebook_accounts (
--   user_id, facebook_user_id, access_token, token_expiry, 
--   account_type, account_id, account_name, permissions
-- ) VALUES (
--   1, 'fb_user_123', 'EAAR4Qlwlv10BP...', '2024-12-30 23:59:59',
--   'page', '613327751869662', 'Harishshoppy', 
--   '["pages_read_engagement", "ads_read"]'
-- );
