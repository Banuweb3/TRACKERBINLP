import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createDatabase = async () => {
  try {
    // Connect without specifying database to create it
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log('Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'bpo_analytics'}`);
    console.log(`Database ${process.env.DB_NAME || 'bpo_analytics'} created or already exists`);

    // Use the database
    await connection.execute(`USE ${process.env.DB_NAME || 'bpo_analytics'}`);

    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        role ENUM('admin', 'analyst', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      )
    `;

    await connection.execute(createUsersTable);
    console.log('Users table created successfully');

    // Create analysis_sessions table
    const createAnalysisSessionsTable = `
      CREATE TABLE IF NOT EXISTS analysis_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_name VARCHAR(255),
        source_language VARCHAR(10) NOT NULL,
        audio_file_name VARCHAR(255),
        audio_file_size INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      )
    `;

    await connection.execute(createAnalysisSessionsTable);
    console.log('Analysis sessions table created successfully');

    // Create analysis_results table
    const createAnalysisResultsTable = `
      CREATE TABLE IF NOT EXISTS analysis_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        transcription TEXT,
        translation TEXT,
        summary TEXT,
        agent_coaching TEXT,
        customer_sentiment ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE'),
        customer_sentiment_score DECIMAL(3,2),
        customer_sentiment_justification TEXT,
        agent_sentiment ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE'),
        agent_sentiment_score DECIMAL(3,2),
        agent_sentiment_justification TEXT,
        keywords JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE,
        INDEX idx_session_id (session_id)
      )
    `;

    await connection.execute(createAnalysisResultsTable);
    console.log('Analysis results table created successfully');

    // Create user_sessions table for JWT token management
    const createUserSessionsTable = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_token_hash (token_hash),
        INDEX idx_expires_at (expires_at)
      )
    `;

    await connection.execute(createUserSessionsTable);
    console.log('User sessions table created successfully');

    await connection.end();
    console.log('Database initialization completed successfully!');

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

createDatabase();
