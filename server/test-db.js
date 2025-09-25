import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const testDatabaseConnection = async () => {
  console.log('🔍 Testing database connection...');
  console.log('📋 Database config:');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Port: ${process.env.DB_PORT || 3306}`);
  console.log(`   User: ${process.env.DB_USER}`);
  console.log(`   Database: ${process.env.DB_NAME || 'bpo_analytics'}`);
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'bpo_analytics'
    });

    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Users in database: ${rows[0].count}`);
    
    const [sessionRows] = await connection.execute('SELECT COUNT(*) as count FROM analysis_sessions');
    console.log(`📊 Analysis sessions in database: ${sessionRows[0].count}`);
    
    await connection.end();
    console.log('🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔐 Access denied - check username/password');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🚫 Connection refused - is MySQL running?');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('🗄️ Database does not exist - create bpo_analytics database');
    }
  }
};

testDatabaseConnection();
