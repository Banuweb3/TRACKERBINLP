import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function checkDatabase() {
  console.log('🔍 Checking current database configuration...');
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'defaultdb',
    ssl: process.env.DB_NAME ? {
      rejectUnauthorized: false
    } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  try {
    const pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();

    console.log('✅ Connected to database:', dbConfig.database);

    // Check what tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📋 Tables in database:');
    if (tables.length === 0) {
      console.log('  ❌ No tables found!');
    } else {
      tables.forEach(table => {
        console.log('  ✅', Object.values(table)[0]);
      });
    }

    // Check if users table exists and has data
    if (tables.some(t => Object.values(t)[0] === 'users')) {
      const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`👥 Users in database: ${users[0].count}`);
    }

    connection.release();
    await pool.end();

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('This suggests the database name or credentials are wrong');
  }
}

checkDatabase();
