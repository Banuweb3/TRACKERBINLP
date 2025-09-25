-- Fix bulk analysis database schema issues
-- This script ensures the bulk_file_results table has all required columns

USE bpo_analytics;

-- Check if table exists and create/update it
DROP TABLE IF EXISTS bulk_file_results;

-- Recreate the table with correct structure
CREATE TABLE bulk_file_results (
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
    processing_time INT DEFAULT NULL,
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

-- Verify table structure
DESCRIBE bulk_file_results;

-- Show any existing data
SELECT COUNT(*) as total_records FROM bulk_file_results;
