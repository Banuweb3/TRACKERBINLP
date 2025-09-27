import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'bpo_analytics',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
export const testConnection = async () => {
  try {
    console.log('🔍 Testing database connection...');
    console.log('Database config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      hasPassword: !!dbConfig.password
    });
    
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
};

// Clean up expired JWT tokens
export const cleanupExpiredTokens = async () => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM user_sessions WHERE expires_at < NOW() OR is_active = FALSE'
    );
    console.log(`🧹 Cleaned up ${result.affectedRows} expired tokens`);
  } catch (error) {
    console.error('❌ Error cleaning up expired tokens:', error.message);
  }
};

export default pool;
