import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'trackerbi-do-user-17425890-0.m.db.ondigitalocean.com',
  port: parseInt(process.env.DB_PORT) || 25060,
  user: process.env.DB_USER || 'doadmin',
  password: process.env.DB_PASSWORD || 'your pass word here',
  database: process.env.DB_NAME || 'defaultdb',
  ssl: {
    rejectUnauthorized: false  // Required for DigitalOcean managed databases
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
export const testConnection = async () => {
  try {
    console.log('🔍 Testing DigitalOcean managed database connection...');
    console.log('Database config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      hasPassword: !!dbConfig.password
    });

    const connection = await pool.getConnection();
    console.log('✅ DigitalOcean MySQL connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
};

// Clean up expired JWT tokens (simplified)
export const cleanupExpiredTokens = async () => {
  try {
    // Skip cleanup if tables don't exist yet
    const [result] = await pool.execute(
      'SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
      [dbConfig.database, 'user_sessions']
    );
    
    if (result.length === 0) {
      console.log('⚠️ user_sessions table not found, skipping cleanup');
      return;
    }
    
    const [deleteResult] = await pool.execute(
      'DELETE FROM user_sessions WHERE expires_at < NOW() OR is_active = FALSE'
    );
    
    if (deleteResult.affectedRows > 0) {
      console.log(`🧹 Cleaned up ${deleteResult.affectedRows} expired tokens`);
    }
  } catch (error) {
    console.warn('Token cleanup warning:', error.message);
  }
};

export { pool };
export default pool;
