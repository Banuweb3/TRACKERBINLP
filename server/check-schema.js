import dotenv from 'dotenv';
import { pool } from './config/database.js';

dotenv.config();

async function checkSchema() {
  try {
    console.log('🔍 Checking analysis_results table schema...');
    
    const [columns] = await pool.execute('DESCRIBE analysis_results');
    console.log('\nTable columns:');
    columns.forEach(col => {
      if (col.Field.includes('sentiment') || col.Field === 'keywords') {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      }
    });
    
    // Check what values are allowed for agent_sentiment
    const agentSentimentCol = columns.find(col => col.Field === 'agent_sentiment');
    if (agentSentimentCol) {
      console.log('\nAgent sentiment column details:');
      console.log('  Type:', agentSentimentCol.Type);
      console.log('  Null:', agentSentimentCol.Null);
      console.log('  Default:', agentSentimentCol.Default);
    }
    
  } catch (error) {
    console.error('Error checking schema:', error.message);
  }
}

checkSchema();
