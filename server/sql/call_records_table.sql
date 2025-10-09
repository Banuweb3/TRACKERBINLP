-- =====================================================
-- Call Records Table for Calling Dashboard
-- =====================================================

USE bpo_analytics;

-- Create call_records table for storing call data
CREATE TABLE IF NOT EXISTS call_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  call_type ENUM('INCOMING', 'OUTGOING') NOT NULL,
  status ENUM('CONNECTED', 'NO ANSWER', 'BUSY', 'ABANDONED', 'FAILED') NOT NULL,
  dialer_status ENUM('ANSWERED', 'MISSED', 'ABANDONED', 'BUSY', 'FAILED') NOT NULL,
  agent_id VARCHAR(100) NOT NULL,
  disposition ENUM('SALE', 'CALLBACK', 'INTERESTED', 'NOT_INTERESTED', 'CANCEL', 'BUSY', 'NO_ANSWER') DEFAULT NULL,
  call_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  call_end_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  call_duration INT DEFAULT 0, -- in seconds
  call_timer_json JSON DEFAULT NULL, -- stores bill_sec and other timing data
  process_name VARCHAR(255) DEFAULT NULL,
  campaign_id VARCHAR(100) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_phone_number (phone_number),
  INDEX idx_agent_id (agent_id),
  INDEX idx_call_type (call_type),
  INDEX idx_status (status),
  INDEX idx_disposition (disposition),
  INDEX idx_call_end_date (call_end_date),
  INDEX idx_process_name (process_name),
  INDEX idx_created_at (created_at)
);

-- Insert sample call data for testing
INSERT INTO call_records (
  phone_number, call_type, status, dialer_status, agent_id, disposition, 
  call_end_date, process_name, call_timer_json
) VALUES 
('+1234567890', 'INCOMING', 'CONNECTED', 'ANSWERED', 'john_smith', 'SALE', 
 NOW(), 'Sales Campaign', JSON_OBJECT('bill_sec', '323')),
 
('+1987654321', 'OUTGOING', 'NO ANSWER', 'MISSED', 'sarah_johnson', 'CANCEL', 
 DATE_SUB(NOW(), INTERVAL 5 MINUTE), 'Lead Follow-up', JSON_OBJECT('bill_sec', '0')),
 
('+1555123456', 'INCOMING', 'CONNECTED', 'ANSWERED', 'mike_wilson', 'CALLBACK', 
 DATE_SUB(NOW(), INTERVAL 10 MINUTE), 'Customer Service', JSON_OBJECT('bill_sec', '525')),
 
('+1777888999', 'OUTGOING', 'CONNECTED', 'ANSWERED', 'emily_davis', 'INTERESTED', 
 DATE_SUB(NOW(), INTERVAL 15 MINUTE), 'Cold Calling', JSON_OBJECT('bill_sec', '192')),
 
('+1444555666', 'INCOMING', 'ABANDONED', 'ABANDONED', 'david_brown', 'CANCEL', 
 DATE_SUB(NOW(), INTERVAL 20 MINUTE), 'Support Line', JSON_OBJECT('bill_sec', '15')),
 
('+1333444555', 'OUTGOING', 'CONNECTED', 'ANSWERED', 'alice_cooper', 'SALE', 
 DATE_SUB(NOW(), INTERVAL 25 MINUTE), 'Sales Campaign', JSON_OBJECT('bill_sec', '412')),
 
('+1666777888', 'INCOMING', 'CONNECTED', 'ANSWERED', 'bob_marley', 'CALLBACK', 
 DATE_SUB(NOW(), INTERVAL 30 MINUTE), 'Lead Follow-up', JSON_OBJECT('bill_sec', '267')),
 
('+1999000111', 'OUTGOING', 'NO ANSWER', 'MISSED', 'charlie_brown', 'CANCEL', 
 DATE_SUB(NOW(), INTERVAL 35 MINUTE), 'Cold Calling', JSON_OBJECT('bill_sec', '0')),
 
('+1222333444', 'INCOMING', 'CONNECTED', 'ANSWERED', 'diana_prince', 'INTERESTED', 
 DATE_SUB(NOW(), INTERVAL 40 MINUTE), 'Customer Service', JSON_OBJECT('bill_sec', '298')),
 
('+1555666777', 'OUTGOING', 'BUSY', 'BUSY', 'frank_castle', 'BUSY', 
 DATE_SUB(NOW(), INTERVAL 45 MINUTE), 'Sales Campaign', JSON_OBJECT('bill_sec', '0'));

-- Create view for call analytics
CREATE OR REPLACE VIEW call_analytics AS
SELECT 
    DATE(call_end_date) as call_date,
    COUNT(*) as total_calls,
    COUNT(CASE WHEN call_type = 'INCOMING' THEN 1 END) as incoming_calls,
    COUNT(CASE WHEN call_type = 'OUTGOING' THEN 1 END) as outgoing_calls,
    COUNT(CASE WHEN status = 'CONNECTED' THEN 1 END) as connected_calls,
    COUNT(CASE WHEN dialer_status = 'MISSED' THEN 1 END) as missed_calls,
    COUNT(CASE WHEN status = 'ABANDONED' THEN 1 END) as abandoned_calls,
    COUNT(DISTINCT agent_id) as active_agents,
    AVG(call_duration) as avg_call_duration,
    COUNT(CASE WHEN disposition IN ('SALE', 'INTERESTED', 'CALLBACK') THEN 1 END) as follow_up_calls
FROM call_records 
GROUP BY DATE(call_end_date)
ORDER BY call_date DESC;

-- Create agent performance view
CREATE OR REPLACE VIEW agent_performance AS
SELECT 
    agent_id,
    COUNT(*) as total_calls,
    COUNT(CASE WHEN status = 'CONNECTED' THEN 1 END) as connected_calls,
    COUNT(CASE WHEN dialer_status = 'MISSED' THEN 1 END) as missed_calls,
    COUNT(CASE WHEN disposition = 'SALE' THEN 1 END) as sales,
    COUNT(CASE WHEN disposition IN ('INTERESTED', 'CALLBACK') THEN 1 END) as follow_ups,
    AVG(call_duration) as avg_call_duration,
    SUM(call_duration) as total_call_time,
    ROUND((COUNT(CASE WHEN status = 'CONNECTED' THEN 1 END) / COUNT(*)) * 100, 2) as success_rate
FROM call_records 
WHERE call_end_date >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY agent_id
ORDER BY success_rate DESC, total_calls DESC;

SELECT 'Call records table created successfully!' as status;
