#!/usr/bin/env node

/**
 * Database Setup Script for DigitalOcean
 * This script creates all necessary tables in the defaultdb database
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'trackerbi-do-user-17425890-0.m.db.ondigitalocean.com',
  port: parseInt(process.env.DB_PORT) || 25060,
  user: process.env.DB_USER || 'doadmin',
  password: process.env.DB_PASSWORD, // Must be set in environment
  database: process.env.DB_NAME || 'defaultdb',
  ssl: {
    rejectUnauthorized: false
  }
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔍 Connecting to DigitalOcean database...');
    console.log('Host:', dbConfig.host);
    console.log('Database:', dbConfig.database);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Read the SQL setup file
    const sqlFile = path.join(__dirname, '..', 'sql', 'complete_database_setup.sql');
    console.log('📄 Reading SQL file:', sqlFile);
    
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL content by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🗄️ Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.toLowerCase().includes('create table')) {
        const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i)?.[1];
        console.log(`📋 Creating table: ${tableName}`);
      }
      
      try {
        await connection.execute(statement);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const [tables] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      ORDER BY table_name
    `, [dbConfig.database]);

    console.log('📊 Tables in database:');
    tables.forEach(table => {
      console.log(`   ✓ ${table.table_name || table.TABLE_NAME}`);
    });

    console.log('🎉 Database setup completed successfully!');
    console.log(`📈 Total tables created: ${tables.length}`);
    return true;

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

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
