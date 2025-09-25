-- Fix UTF-8 encoding for multilingual content support
USE bpo_analytics;

-- Update analysis_results table to support UTF-8 characters
ALTER TABLE analysis_results 
MODIFY transcription LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY translation LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY summary TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY agent_coaching TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY customer_sentiment_justification TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY agent_sentiment_justification TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Update analysis_sessions table
ALTER TABLE analysis_sessions 
MODIFY session_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY audio_file_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Update users table
ALTER TABLE users 
MODIFY username VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY first_name VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY last_name VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
