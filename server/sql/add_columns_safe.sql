-- Safe way to add columns - checks if column exists before adding
-- Run each statement individually to avoid errors if columns already exist

-- Add transcription column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'bulk_file_results' 
     AND column_name = 'transcription' 
     AND table_schema = DATABASE()) = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN transcription TEXT AFTER status',
    'SELECT "Column transcription already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add translation column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'bulk_file_results' 
     AND column_name = 'translation' 
     AND table_schema = DATABASE()) = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN translation TEXT AFTER transcription',
    'SELECT "Column translation already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add call_opening_score column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'bulk_file_results' 
     AND column_name = 'call_opening_score' 
     AND table_schema = DATABASE()) = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN call_opening_score DECIMAL(3,2) AFTER overall_score',
    'SELECT "Column call_opening_score already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add call_closing_score column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'bulk_file_results' 
     AND column_name = 'call_closing_score' 
     AND table_schema = DATABASE()) = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN call_closing_score DECIMAL(3,2) AFTER call_opening_score',
    'SELECT "Column call_closing_score already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add speaking_quality_score column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'bulk_file_results' 
     AND column_name = 'speaking_quality_score' 
     AND table_schema = DATABASE()) = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN speaking_quality_score DECIMAL(3,2) AFTER call_closing_score',
    'SELECT "Column speaking_quality_score already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add agent_coaching column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'bulk_file_results' 
     AND column_name = 'agent_coaching' 
     AND table_schema = DATABASE()) = 0,
    'ALTER TABLE bulk_file_results ADD COLUMN agent_coaching TEXT AFTER call_summary',
    'SELECT "Column agent_coaching already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
