-- =====================================================
-- BPO Analytics Platform - Complete Database Setup
-- Modified for DigitalOcean Managed Database (defaultdb)
-- =====================================================

-- Use existing database (defaultdb for DigitalOcean)
USE defaultdb;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  role ENUM('admin', 'analyst', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_role (role)
);

-- Create user_sessions table for JWT token management
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token_hash (token_hash),
  INDEX idx_expires_at (expires_at)
);

-- Create analysis_sessions table
CREATE TABLE IF NOT EXISTS analysis_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_name VARCHAR(255),
  source_language VARCHAR(10) NOT NULL,
  audio_file_name VARCHAR(255),
  audio_file_size INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Create analysis_results table
CREATE TABLE IF NOT EXISTS analysis_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  transcription TEXT,
  translation TEXT,
  summary TEXT,
  agent_coaching TEXT,
  customer_sentiment ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE'),
  customer_sentiment_score DECIMAL(3,2),
  customer_sentiment_justification TEXT,
  agent_sentiment ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE'),
  agent_sentiment_score DECIMAL(3,2),
  agent_sentiment_justification TEXT,
  overall_score DECIMAL(3,2),
  call_opening_score DECIMAL(3,2),
  call_closing_score DECIMAL(3,2),
  speaking_quality_score DECIMAL(3,2),
  keywords JSON,
  processing_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  INDEX idx_session_id (session_id),
  INDEX idx_overall_score (overall_score),
  INDEX idx_customer_sentiment (customer_sentiment),
  INDEX idx_agent_sentiment (agent_sentiment)
);

-- =====================================================
-- BULK ANALYSIS TABLES
-- =====================================================

-- Create bulk_analysis_sessions table (matches your original structure)
CREATE TABLE IF NOT EXISTS bulk_analysis_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_name VARCHAR(255) NOT NULL,
  source_language VARCHAR(10) NOT NULL DEFAULT 'en',
  total_files INT NOT NULL DEFAULT 0,
  completed_files INT NOT NULL DEFAULT 0,
  failed_files INT NOT NULL DEFAULT 0,
  status ENUM('processing', 'completed', 'failed', 'cancelled') DEFAULT 'processing',
  
  -- Overall statistics (from your original)
  avg_overall_score DECIMAL(3,2) DEFAULT NULL,
  avg_call_opening_score DECIMAL(3,2) DEFAULT NULL,
  avg_call_closing_score DECIMAL(3,2) DEFAULT NULL,
  avg_speaking_quality_score DECIMAL(3,2) DEFAULT NULL,
  avg_politeness_score DECIMAL(3,2) DEFAULT NULL,
  avg_problem_identification_score DECIMAL(3,2) DEFAULT NULL,
  avg_solution_effectiveness_score DECIMAL(3,2) DEFAULT NULL,
  avg_customer_satisfaction_score DECIMAL(3,2) DEFAULT NULL,
  
  -- Sentiment distribution
  positive_sentiment_count INT DEFAULT 0,
  neutral_sentiment_count INT DEFAULT 0,
  negative_sentiment_count INT DEFAULT 0,
  positive_sentiment_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Summary and insights
  batch_summary TEXT,
  key_insights JSON,
  top_keywords JSON,
  recommendations TEXT,
  
  -- Metadata
  total_processing_time INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Create bulk_file_results table with all necessary columns (matches your original structure)
CREATE TABLE IF NOT EXISTS bulk_file_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bulk_session_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT DEFAULT NULL,
  processing_order INT NOT NULL DEFAULT 0,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  
  -- Core analysis data (from original bpo_analytics.sql)
  call_summary TEXT,
  
  -- Additional columns from add_columns_safe.sql and complete_bulk_schema_fix.sql
  transcription TEXT,
  translation TEXT,
  agent_coaching TEXT,
  
  -- Scoring (from original + additions)
  overall_score DECIMAL(3,2),
  call_opening_score DECIMAL(3,2),
  call_closing_score DECIMAL(3,2),
  speaking_quality_score DECIMAL(3,2),
  
  -- Sentiment analysis (original + extended)
  customer_sentiment ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE'),
  customer_sentiment_score DECIMAL(3,2),
  customer_sentiment_justification TEXT,
  agent_sentiment ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE'),
  agent_sentiment_score DECIMAL(3,2),
  agent_sentiment_justification TEXT,
  
  -- Additional analysis data
  keywords JSON,
  call_opening_analysis JSON,
  call_closing_analysis JSON,
  speaking_quality_analysis JSON,
  
  -- Processing metadata
  processing_time INT DEFAULT NULL,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (bulk_session_id) REFERENCES bulk_analysis_sessions(id) ON DELETE CASCADE,
  INDEX idx_bulk_session (bulk_session_id),
  INDEX idx_status (status),
  INDEX idx_processing_order (bulk_session_id, processing_order),
  INDEX idx_file_name (file_name),
  INDEX idx_overall_score (overall_score),
  INDEX idx_sentiment (customer_sentiment, agent_sentiment),
  INDEX idx_detailed_scores (call_opening_score, call_closing_score, speaking_quality_score)
);

-- Create bulk_analysis_metrics table (from your original)
CREATE TABLE IF NOT EXISTS bulk_analysis_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bulk_session_id INT NOT NULL,
  
  -- Performance metrics
  total_processing_time INT NOT NULL,
  avg_file_processing_time DECIMAL(8,2),
  files_per_minute DECIMAL(8,2),
  
  -- Quality metrics
  transcription_accuracy_score DECIMAL(3,2),
  analysis_confidence_score DECIMAL(3,2),
  
  -- Resource usage
  api_calls_made INT DEFAULT 0,
  tokens_consumed BIGINT DEFAULT 0,
  
  -- Error tracking
  total_errors INT DEFAULT 0,
  error_rate DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (bulk_session_id) REFERENCES bulk_analysis_sessions(id) ON DELETE CASCADE,
  INDEX idx_bulk_session (bulk_session_id),
  INDEX idx_created_at (created_at)
);

-- Create bulk_analysis_tags table (from your original)
CREATE TABLE IF NOT EXISTS bulk_analysis_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bulk_session_id INT NOT NULL,
  tag_name VARCHAR(100) NOT NULL,
  tag_value VARCHAR(255),
  tag_type ENUM('category', 'department', 'priority', 'custom') DEFAULT 'custom',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (bulk_session_id) REFERENCES bulk_analysis_sessions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_session_tag (bulk_session_id, tag_name),
  INDEX idx_tag_name (tag_name),
  INDEX idx_tag_type (tag_type)
);

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Create comprehensive bulk file summary view
CREATE OR REPLACE VIEW bulk_file_summary AS
SELECT 
    bfr.id,
    bfr.bulk_session_id,
    bas.session_name as bulk_session_name,
    bas.user_id,
    u.username,
    bfr.file_name,
    bfr.status,
    bfr.transcription,
    bfr.translation,
    bfr.call_summary,
    bfr.agent_coaching,
    bfr.overall_score,
    bfr.call_opening_score,
    bfr.call_closing_score,
    bfr.speaking_quality_score,
    bfr.customer_sentiment,
    bfr.customer_sentiment_score,
    bfr.customer_sentiment_justification,
    bfr.agent_sentiment,
    bfr.agent_sentiment_score,
    bfr.agent_sentiment_justification,
    bfr.keywords,
    bfr.processing_time,
    bfr.completed_at,
    bfr.created_at,
    CASE 
        WHEN bfr.overall_score >= 8 THEN 'Excellent'
        WHEN bfr.overall_score >= 6 THEN 'Good'
        WHEN bfr.overall_score >= 4 THEN 'Fair'
        ELSE 'Needs Improvement'
    END as performance_rating
FROM bulk_file_results bfr
JOIN bulk_analysis_sessions bas ON bfr.bulk_session_id = bas.id
JOIN users u ON bas.user_id = u.id;

-- Create session analytics view
CREATE OR REPLACE VIEW session_analytics AS
SELECT 
    bas.id as session_id,
    bas.session_name,
    bas.user_id,
    u.username,
    bas.total_files,
    bas.processed_files,
    bas.failed_files,
    bas.status as session_status,
    AVG(bfr.overall_score) as avg_overall_score,
    AVG(bfr.call_opening_score) as avg_opening_score,
    AVG(bfr.call_closing_score) as avg_closing_score,
    AVG(bfr.speaking_quality_score) as avg_speaking_score,
    AVG(bfr.customer_sentiment_score) as avg_customer_sentiment,
    AVG(bfr.agent_sentiment_score) as avg_agent_sentiment,
    COUNT(CASE WHEN bfr.customer_sentiment = 'POSITIVE' THEN 1 END) as positive_calls,
    COUNT(CASE WHEN bfr.customer_sentiment = 'NEGATIVE' THEN 1 END) as negative_calls,
    COUNT(CASE WHEN bfr.customer_sentiment = 'NEUTRAL' THEN 1 END) as neutral_calls,
    AVG(bfr.processing_time) as avg_processing_time,
    bas.created_at,
    bas.completed_at
FROM bulk_analysis_sessions bas
JOIN users u ON bas.user_id = u.id
LEFT JOIN bulk_file_results bfr ON bas.id = bfr.bulk_session_id
GROUP BY bas.id, bas.session_name, bas.user_id, u.username, bas.total_files, 
         bas.processed_files, bas.failed_files, bas.status, bas.created_at, bas.completed_at;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

DELIMITER //

-- Procedure to update bulk session progress
CREATE PROCEDURE IF NOT EXISTS UpdateBulkSessionProgress(
    IN session_id INT
)
BEGIN
    DECLARE total_count INT DEFAULT 0;
    DECLARE completed_count INT DEFAULT 0;
    DECLARE failed_count INT DEFAULT 0;
    DECLARE session_status VARCHAR(20) DEFAULT 'pending';
    
    -- Get counts
    SELECT COUNT(*) INTO total_count 
    FROM bulk_file_results 
    WHERE bulk_session_id = session_id;
    
    SELECT COUNT(*) INTO completed_count 
    FROM bulk_file_results 
    WHERE bulk_session_id = session_id AND status = 'completed';
    
    SELECT COUNT(*) INTO failed_count 
    FROM bulk_file_results 
    WHERE bulk_session_id = session_id AND status = 'failed';
    
    -- Determine session status
    IF completed_count + failed_count = total_count AND total_count > 0 THEN
        SET session_status = 'completed';
    ELSEIF completed_count > 0 OR failed_count > 0 THEN
        SET session_status = 'processing';
    END IF;
    
    -- Update session
    UPDATE bulk_analysis_sessions 
    SET 
        total_files = total_count,
        processed_files = completed_count,
        failed_files = failed_count,
        status = session_status,
        updated_at = CURRENT_TIMESTAMP,
        completed_at = CASE WHEN session_status = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
    WHERE id = session_id;
END //

DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER //

-- Trigger to update session progress when file result changes
CREATE TRIGGER IF NOT EXISTS update_session_progress_after_file_update
    AFTER UPDATE ON bulk_file_results
    FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        CALL UpdateBulkSessionProgress(NEW.bulk_session_id);
    END IF;
END //

-- Trigger to update session progress when file result is inserted
CREATE TRIGGER IF NOT EXISTS update_session_progress_after_file_insert
    AFTER INSERT ON bulk_file_results
    FOR EACH ROW
BEGIN
    CALL UpdateBulkSessionProgress(NEW.bulk_session_id);
END //

DELIMITER ;

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO users (username, email, password_hash, first_name, last_name, role) 
VALUES (
    'admin', 
    'admin@bpoanalytics.com', 
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJgusglfK', 
    'System', 
    'Administrator', 
    'admin'
);

-- Insert demo user (password: demo123)
INSERT IGNORE INTO users (username, email, password_hash, first_name, last_name, role) 
VALUES (
    'demo', 
    'demo@bpoanalytics.com', 
    '$2a$12$8k1p3KRbQGFQFQFQFQFQFQFQFQFQFQFQFQFQFQFQFQFQFQFQFQFQFQ', 
    'Demo', 
    'User', 
    'user'
);

-- =====================================================
-- CLEANUP AND MAINTENANCE
-- =====================================================

-- Create cleanup procedure for old sessions
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS CleanupOldSessions()
BEGIN
    -- Delete sessions older than 90 days with no results
    DELETE bas FROM bulk_analysis_sessions bas
    LEFT JOIN bulk_file_results bfr ON bas.id = bfr.bulk_session_id
    WHERE bas.created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
    AND bfr.id IS NULL;
    
    -- Delete expired user sessions
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR is_active = FALSE;
END //

DELIMITER ;

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

-- Show table structure
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    DATA_LENGTH,
    INDEX_LENGTH
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'bpo_analytics' 
ORDER BY TABLE_NAME;

-- Show all indexes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'bpo_analytics' 
ORDER BY TABLE_NAME, INDEX_NAME;

-- Verify views
SELECT TABLE_NAME, VIEW_DEFINITION 
FROM information_schema.VIEWS 
WHERE TABLE_SCHEMA = 'bpo_analytics';

-- Additional indexes for performance optimization (from your original)
CREATE INDEX IF NOT EXISTS idx_bulk_sessions_user_status ON bulk_analysis_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bulk_files_session_status ON bulk_file_results(bulk_session_id, status);
CREATE INDEX IF NOT EXISTS idx_bulk_files_scores ON bulk_file_results(overall_score, customer_sentiment);
CREATE INDEX IF NOT EXISTS idx_bulk_sessions_scores ON bulk_analysis_sessions(avg_overall_score, positive_sentiment_percentage);

-- Success message
SELECT 'Database setup completed successfully!' as status,
       COUNT(*) as total_tables
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'bpo_analytics';
