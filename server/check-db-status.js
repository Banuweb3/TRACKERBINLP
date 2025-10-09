import { testConnection, pool } from './config/database.js';

async function checkDatabase() {
  console.log('🔍 Testing database connection...');

  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Database connection failed!');
    return;
  }

  console.log('✅ Database connected successfully!');

  try {
    // Check existing tables
    console.log('\n📋 Checking existing tables...');
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('Existing tables:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

    // Check if users table exists
    const usersTableExists = tables.some(table => Object.values(table)[0] === 'users');
    if (usersTableExists) {
      console.log('\n✅ Users table exists!');

      // Check users table structure
      console.log('\n📊 Users table structure:');
      const [columns] = await pool.execute('DESCRIBE users');
      columns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
      });

      // Check if any users exist
      const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
      console.log(`\n👥 Number of existing users: ${users[0].count}`);

    } else {
      console.log('\n❌ Users table does not exist!');
      console.log('💡 You need to create the users table for registration to work.');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    process.exit(0);
  }
}

checkDatabase();
