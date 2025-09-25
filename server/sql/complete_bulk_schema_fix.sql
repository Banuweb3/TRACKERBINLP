-- Complete fix for bulk_file_results table to store all analysis data
-- This will add all missing columns needed for full call analysis storage

-- Step 1: Add transcription and translation columns
ALTER TABLE bulk_file_results 
ADD COLUMN transcription TEXT AFTER status;

ALTER TABLE bulk_file_results 
ADD COLUMN translation TEXT AFTER transcription;

-- Step 2: Add detailed scoring columns  
ALTER TABLE bulk_file_results 
ADD COLUMN call_opening_score DECIMAL(3,2) AFTER overall_score;

ALTER TABLE bulk_file_results 
ADD COLUMN call_closing_score DECIMAL(3,2) AFTER call_opening_score;

ALTER TABLE bulk_file_results 
ADD COLUMN speaking_quality_score DECIMAL(3,2) AFTER call_closing_score;

-- Step 3: Add customer sentiment justification if missing
ALTER TABLE bulk_file_results 
ADD COLUMN customer_sentiment_score DECIMAL(3,2) AFTER customer_sentiment;

ALTER TABLE bulk_file_results 
ADD COLUMN customer_sentiment_justification TEXT AFTER customer_sentiment_score;

-- Step 4: Add agent sentiment analysis
ALTER TABLE bulk_file_results 
ADD COLUMN agent_sentiment ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE') AFTER customer_sentiment_justification;

ALTER TABLE bulk_file_results 
ADD COLUMN agent_sentiment_score DECIMAL(3,2) AFTER agent_sentiment;

ALTER TABLE bulk_file_results 
ADD COLUMN agent_sentiment_justification TEXT AFTER agent_sentiment_score;

-- Step 5: Add coaching feedback
ALTER TABLE bulk_file_results 
ADD COLUMN agent_coaching TEXT AFTER call_summary;

-- Step 6: Add detailed analysis JSON fields
ALTER TABLE bulk_file_results 
ADD COLUMN call_opening_analysis JSON AFTER speaking_quality_score;

ALTER TABLE bulk_file_results 
ADD COLUMN call_closing_analysis JSON AFTER call_opening_analysis;

ALTER TABLE bulk_file_results 
ADD COLUMN speaking_quality_analysis JSON AFTER call_closing_analysis;

-- Step 7: Update indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bulk_files_sentiment ON bulk_file_results(customer_sentiment, agent_sentiment);
CREATE INDEX IF NOT EXISTS idx_bulk_files_detailed_scores ON bulk_file_results(call_opening_score, call_closing_score, speaking_quality_score);

-- Step 8: Update the view to include all new fields
DROP VIEW IF EXISTS bulk_file_summary;

CREATE OR REPLACE VIEW bulk_file_summary AS
SELECT 
    bfr.id,
    bfr.bulk_session_id,
    bas.session_name as bulk_session_name,
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
    bfr.agent_sentiment,
    bfr.agent_sentiment_score,
    bfr.keywords,
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

-- Step 9: Show final table structure
DESCRIBE bulk_file_results;
