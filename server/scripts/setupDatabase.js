import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const setupDatabase = async () => {
  let connection;
  
  try {
    console.log('🔍 Starting database setup...');
    console.log('Database config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      hasPassword: !!process.env.DB_PASSWORD
    });

    // Connect to MySQL server
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'bpo_analytics';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database ${dbName} created or already exists`);

    // Use the database
    await connection.execute(`USE \`${dbName}\``);

    // Read and execute the main SQL schema file
    const sqlFilePath = path.join(__dirname, '..', 'sql', 'bpo_analytics.sql');
    
    if (fs.existsSync(sqlFilePath)) {
      console.log('📄 Reading SQL schema file...');
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Split SQL content by statements and execute them
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      console.log(`🔧 Executing ${statements.length} SQL statements...`);
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.execute(statement);
          } catch (error) {
            // Ignore errors for CREATE DATABASE and USE statements that might already exist
            if (!error.message.includes('already exists') && 
                !error.message.includes('Unknown database') &&
                !statement.includes('CREATE DATABASE') &&
                !statement.includes('USE ')) {
              console.warn(`⚠️  Warning executing statement: ${error.message}`);
            }
          }
        }
      }
      
      console.log('✅ Database schema created successfully');
    } else {
      console.error('❌ SQL schema file not found:', sqlFilePath);
      throw new Error('Schema file not found');
    }

    // Create a default admin user if none exists
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      console.log('👤 Creating default admin user...');
      
      // Simple password hash for demo (in production, use proper bcrypt)
      const defaultPassword = 'admin123'; // You should change this
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      await connection.execute(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['admin', 'admin@bpo-analytics.com', hashedPassword, 'Admin', 'User', 'admin']);
      
      console.log('✅ Default admin user created');
      console.log('📧 Email: admin@bpo-analytics.com');
      console.log('🔑 Password: admin123 (CHANGE THIS IN PRODUCTION!)');
    }

    // Test the database connection
    const [result] = await connection.execute('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?', [dbName]);
    console.log(`✅ Database setup complete! Created ${result[0].table_count} tables`);

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then(() => {
      console.log('🎉 Database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

export default setupDatabase;
