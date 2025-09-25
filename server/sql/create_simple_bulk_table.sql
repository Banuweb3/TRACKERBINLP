-- Create a simplified bulk_file_results table that definitely works
USE bpo_analytics;

-- Drop existing table if it exists
DROP TABLE IF EXISTS bulk_file_results;

-- Create simple table with only essential fields
CREATE TABLE bulk_file_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bulk_session_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT DEFAULT NULL,
    processing_order INT NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'completed',
    call_summary TEXT,
    overall_coaching_score DECIMAL(4,2) DEFAULT NULL,
    transcription LONGTEXT,
    translation LONGTEXT,
    customer_sentiment VARCHAR(20) DEFAULT NULL,
    agent_coaching TEXT,
    keywords JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_bulk_session (bulk_session_id)
);

-- Verify table was created
SHOW CREATE TABLE bulk_file_results;
SELECT 'Table created successfully' as status;
