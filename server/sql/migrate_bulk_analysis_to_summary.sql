-- Migration script to update bulk analysis tables to summary-only structure
-- This script will backup existing data and restructure the bulk_file_results table

-- Step 1: Create backup table for existing bulk_file_results
CREATE TABLE IF NOT EXISTS bulk_file_results_backup AS 
SELECT * FROM bulk_file_results;

-- Step 2: Drop the existing bulk_file_results table
DROP TABLE IF EXISTS bulk_file_results;

-- Step 3: Recreate bulk_file_results table with simplified structure
CREATE TABLE bulk_file_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bulk_session_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT DEFAULT NULL,
    processing_order INT NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    
    -- Only store call summary and basic metadata
    call_summary TEXT,
    overall_score DECIMAL(3,2),
    customer_sentiment ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE'),
    
    -- Keywords for search and categorization
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
    INDEX idx_overall_score (overall_score),
    INDEX idx_sentiment (customer_sentiment)
);

-- Step 4: Migrate essential data from backup to new structure
INSERT INTO bulk_file_results (
    bulk_session_id,
    file_name,
    file_size,
    processing_order,
    status,
    call_summary,
    overall_score,
    customer_sentiment,
    keywords,
    processing_time,
    error_message,
    started_at,
    completed_at,
    created_at,
    updated_at
)
SELECT 
    bulk_session_id,
    file_name,
    file_size,
    processing_order,
    CASE 
        WHEN status IN ('transcribing', 'translating', 'analyzing') THEN 'processing'
        ELSE status
    END as status,
    call_summary,
    overall_coaching_score as overall_score,
    customer_sentiment,
    keywords,
    processing_time,
    error_message,
    started_at,
    completed_at,
    created_at,
    updated_at
FROM bulk_file_results_backup;

-- Step 5: Update the view to work with new structure
DROP VIEW IF EXISTS bulk_file_summary;

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

-- Step 6: Update indexes for performance optimization
DROP INDEX IF EXISTS idx_bulk_files_scores ON bulk_file_results;
CREATE INDEX idx_bulk_files_scores ON bulk_file_results(overall_score, customer_sentiment);

-- Step 7: Verification query to check migration success
SELECT 
    'Migration Summary' as info,
    (SELECT COUNT(*) FROM bulk_file_results_backup) as original_records,
    (SELECT COUNT(*) FROM bulk_file_results) as migrated_records,
    (SELECT COUNT(*) FROM bulk_file_results WHERE call_summary IS NOT NULL) as records_with_summary;

-- Optional: Clean up backup table after verification
-- DROP TABLE bulk_file_results_backup;

COMMIT;
