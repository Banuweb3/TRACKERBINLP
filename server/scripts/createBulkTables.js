const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function createBulkAnalysisTables() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bpo_analytics',
      multipleStatements: true
    });

    console.log('📦 Connected to MySQL database');

    // Read and execute the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'sql', 'bulk_analysis_tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL content by semicolons and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }

    console.log('✅ Bulk analysis tables created successfully!');
    console.log('📊 Created tables:');
    console.log('   - bulk_analysis_sessions');
    console.log('   - bulk_file_results');
    console.log('   - bulk_analysis_metrics');
    console.log('   - bulk_analysis_tags');
    console.log('📈 Created views:');
    console.log('   - bulk_analysis_summary');
    console.log('   - bulk_file_summary');

  } catch (error) {
    console.error('❌ Error creating bulk analysis tables:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  createBulkAnalysisTables();
}

module.exports = createBulkAnalysisTables;
