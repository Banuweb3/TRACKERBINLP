-- Bulk Analysis Tables for BPO Analytics Platform

-- Main bulk analysis sessions table
CREATE TABLE IF NOT EXISTS bulk_analysis_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_name VARCHAR(255) NOT NULL,
    source_language VARCHAR(10) NOT NULL,
    total_files INT NOT NULL DEFAULT 0,
    completed_files INT NOT NULL DEFAULT 0,
    failed_files INT NOT NULL DEFAULT 0,
    status ENUM('processing', 'completed', 'failed', 'cancelled') DEFAULT 'processing',
    
    -- Overall statistics
    avg_overall_score DECIMAL(3,2) DEFAULT NULL,
    avg_call_opening_score DECIMAL(3,2) DEFAULT NULL,
    avg_call_closing_score DECIMAL(3,2) DEFAULT NULL,
    avg_speaking_quality_score DECIMAL(3,2) DEFAULT NULL,
    
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
    total_processing_time INT DEFAULT NULL, -- in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Individual file results within bulk analysis
CREATE TABLE IF NOT EXISTS bulk_file_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bulk_session_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT DEFAULT NULL,
    processing_order INT NOT NULL,
    status ENUM('pending', 'transcribing', 'translating', 'analyzing', 'completed', 'failed') DEFAULT 'pending',
    
    -- Analysis results
    transcription TEXT,
    translation TEXT,
    
    -- Sentiment analysis
    customer_sentiment ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE'),
    customer_sentiment_score DECIMAL(3,2),
    customer_sentiment_justification TEXT,
    agent_sentiment ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE'),
    agent_sentiment_score DECIMAL(3,2),
    agent_sentiment_justification TEXT,
    
    -- Call summary and coaching
    call_summary TEXT,
    agent_coaching TEXT,
    
    -- Coaching scores
    overall_coaching_score DECIMAL(3,2),
    call_opening_score DECIMAL(3,2),
    call_closing_score DECIMAL(3,2),
    speaking_quality_score DECIMAL(3,2),
    
    -- Detailed coaching analysis (JSON format)
    call_opening_analysis JSON,
    call_closing_analysis JSON,
    speaking_quality_analysis JSON,
    
    -- Keywords and metadata
    keywords JSON,
    processing_time INT DEFAULT NULL, -- in seconds
    error_message TEXT,
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (bulk_session_id) REFERENCES bulk_analysis_sessions(id) ON DELETE CASCADE,
    INDEX idx_bulk_session (bulk_session_id),
    INDEX idx_status (status),
    INDEX idx_processing_order (bulk_session_id, processing_order),
    INDEX idx_scores (overall_coaching_score, call_opening_score, call_closing_score)
);

-- Bulk analysis performance metrics (for reporting and analytics)
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

-- Bulk analysis tags (for categorization and filtering)
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

-- Views for easy querying

-- View for bulk analysis summary
CREATE OR REPLACE VIEW bulk_analysis_summary AS
SELECT 
    bas.id,
    bas.session_name,
    bas.user_id,
    u.username,
    bas.total_files,
    bas.completed_files,
    bas.failed_files,
    bas.status,
    bas.avg_overall_score,
    bas.positive_sentiment_percentage,
    bas.batch_summary,
    bas.created_at,
    bas.updated_at,
    CASE 
        WHEN bas.avg_overall_score >= 8 THEN 'Excellent'
        WHEN bas.avg_overall_score >= 6 THEN 'Good'
        WHEN bas.avg_overall_score >= 4 THEN 'Fair'
        ELSE 'Needs Improvement'
    END as performance_rating
FROM bulk_analysis_sessions bas
JOIN users u ON bas.user_id = u.id;

-- View for file results with summary
CREATE OR REPLACE VIEW bulk_file_summary AS
SELECT 
    bfr.id,
    bfr.bulk_session_id,
    bas.session_name as bulk_session_name,
    bfr.file_name,
    bfr.status,
    bfr.overall_score,
    bfr.customer_sentiment,
    bfr.call_summary,
    bfr.processing_time,
    bfr.completed_at,
    CASE 
        WHEN bfr.overall_score >= 8 THEN 'Excellent'
        WHEN bfr.overall_score >= 6 THEN 'Good'
        WHEN bfr.overall_score >= 4 THEN 'Fair'
        ELSE 'Needs Improvement'
    END as performance_rating
FROM bulk_file_results bfr
JOIN bulk_analysis_sessions bas ON bfr.bulk_session_id = bas.id;

-- Indexes for performance optimization
CREATE INDEX idx_bulk_sessions_user_status ON bulk_analysis_sessions(user_id, status);
CREATE INDEX idx_bulk_files_session_status ON bulk_file_results(bulk_session_id, status);
CREATE INDEX idx_bulk_files_scores ON bulk_file_results(overall_score, customer_sentiment);
CREATE INDEX idx_bulk_sessions_scores ON bulk_analysis_sessions(avg_overall_score, positive_sentiment_percentage);
