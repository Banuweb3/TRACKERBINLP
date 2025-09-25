-- Safe fix for bulk_file_results table - add missing columns with error handling
-- Run this to fix the bulk analysis errors

-- Add translation column (skip if exists)
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='bpo_analytics' AND TABLE_NAME='bulk_file_results' AND COLUMN_NAME='translation') = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN translation TEXT',
    'SELECT "translation column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add scoring columns
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='bpo_analytics' AND TABLE_NAME='bulk_file_results' AND COLUMN_NAME='call_opening_score') = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN call_opening_score DECIMAL(3,2)',
    'SELECT "call_opening_score column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='bpo_analytics' AND TABLE_NAME='bulk_file_results' AND COLUMN_NAME='call_closing_score') = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN call_closing_score DECIMAL(3,2)',
    'SELECT "call_closing_score column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='bpo_analytics' AND TABLE_NAME='bulk_file_results' AND COLUMN_NAME='speaking_quality_score') = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN speaking_quality_score DECIMAL(3,2)',
    'SELECT "speaking_quality_score column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add agent sentiment columns
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='bpo_analytics' AND TABLE_NAME='bulk_file_results' AND COLUMN_NAME='agent_sentiment') = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN agent_sentiment ENUM(''POSITIVE'', ''NEUTRAL'', ''NEGATIVE'')',
    'SELECT "agent_sentiment column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='bpo_analytics' AND TABLE_NAME='bulk_file_results' AND COLUMN_NAME='agent_sentiment_score') = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN agent_sentiment_score DECIMAL(3,2)',
    'SELECT "agent_sentiment_score column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='bpo_analytics' AND TABLE_NAME='bulk_file_results' AND COLUMN_NAME='agent_sentiment_justification') = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN agent_sentiment_justification TEXT',
    'SELECT "agent_sentiment_justification column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add customer sentiment columns
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='bpo_analytics' AND TABLE_NAME='bulk_file_results' AND COLUMN_NAME='customer_sentiment_score') = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN customer_sentiment_score DECIMAL(3,2)',
    'SELECT "customer_sentiment_score column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='bpo_analytics' AND TABLE_NAME='bulk_file_results' AND COLUMN_NAME='customer_sentiment_justification') = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN customer_sentiment_justification TEXT',
    'SELECT "customer_sentiment_justification column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add coaching column
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='bpo_analytics' AND TABLE_NAME='bulk_file_results' AND COLUMN_NAME='agent_coaching') = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN agent_coaching TEXT',
    'SELECT "agent_coaching column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add analysis JSON columns
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='bpo_analytics' AND TABLE_NAME='bulk_file_results' AND COLUMN_NAME='call_opening_analysis') = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN call_opening_analysis JSON',
    'SELECT "call_opening_analysis column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='bpo_analytics' AND TABLE_NAME='bulk_file_results' AND COLUMN_NAME='call_closing_analysis') = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN call_closing_analysis JSON',
    'SELECT "call_closing_analysis column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='bpo_analytics' AND TABLE_NAME='bulk_file_results' AND COLUMN_NAME='speaking_quality_analysis') = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN speaking_quality_analysis JSON',
    'SELECT "speaking_quality_analysis column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Show final table structure
DESCRIBE bulk_file_results;
