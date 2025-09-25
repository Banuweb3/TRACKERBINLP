-- Add missing columns to bulk_file_results table to store full analysis data

-- Add transcription and translation columns
ALTER TABLE bulk_file_results 
ADD COLUMN transcription TEXT AFTER status,
ADD COLUMN translation TEXT AFTER transcription;

-- Add detailed scoring columns
ALTER TABLE bulk_file_results 
ADD COLUMN call_opening_score DECIMAL(3,2) AFTER customer_sentiment,
ADD COLUMN call_closing_score DECIMAL(3,2) AFTER call_opening_score,
ADD COLUMN speaking_quality_score DECIMAL(3,2) AFTER call_closing_score;

-- Add agent sentiment analysis
ALTER TABLE bulk_file_results 
ADD COLUMN agent_sentiment ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE') AFTER customer_sentiment,
ADD COLUMN agent_sentiment_score DECIMAL(3,2) AFTER agent_sentiment,
ADD COLUMN agent_sentiment_justification TEXT AFTER agent_sentiment_score;

-- Add coaching feedback
ALTER TABLE bulk_file_results 
ADD COLUMN agent_coaching TEXT AFTER call_summary;

-- Add detailed analysis JSON fields
ALTER TABLE bulk_file_results 
ADD COLUMN call_opening_analysis JSON AFTER speaking_quality_score,
ADD COLUMN call_closing_analysis JSON AFTER call_opening_analysis,
ADD COLUMN speaking_quality_analysis JSON AFTER call_closing_analysis;

-- Update indexes for better performance
CREATE INDEX idx_bulk_files_transcription ON bulk_file_results(bulk_session_id) USING BTREE;
CREATE INDEX idx_bulk_files_sentiment ON bulk_file_results(customer_sentiment, agent_sentiment);
CREATE INDEX idx_bulk_files_detailed_scores ON bulk_file_results(call_opening_score, call_closing_score, speaking_quality_score);

-- Verify the table structure
DESCRIBE bulk_file_results;
