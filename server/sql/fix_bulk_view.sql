-- Fix the bulk_file_summary view to use correct column names

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
