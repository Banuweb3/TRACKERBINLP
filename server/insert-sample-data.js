import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const insertSampleData = async () => {
  console.log('📊 Inserting sample data for dashboard testing...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'bpo_analytics'
    });

    console.log('✅ Connected to database');

    // Check if we have any users
    const [userRows] = await connection.execute('SELECT * FROM users LIMIT 1');
    
    let userId;
    if (userRows.length === 0) {
      // Create a test user
      const [userResult] = await connection.execute(
        'INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
        ['testuser', 'test@example.com', 'hashed_password', 'Test', 'User']
      );
      userId = userResult.insertId;
      console.log('👤 Created test user with ID:', userId);
    } else {
      userId = userRows[0].id;
      console.log('👤 Using existing user with ID:', userId);
    }

    // Insert sample analysis sessions
    const sampleSessions = [
      {
        sessionName: 'Analysis - customer_support_call.wav',
        sourceLanguage: 'kn',
        audioFileName: 'customer_support_call.wav',
        audioFileSize: 1024000
      },
      {
        sessionName: 'Analysis - feedback_call.mp3',
        sourceLanguage: 'hi',
        audioFileName: 'feedback_call.mp3',
        audioFileSize: 2048000
      },
      {
        sessionName: 'Analysis - complaint_call.wav',
        sourceLanguage: 'en',
        audioFileName: 'complaint_call.wav',
        audioFileSize: 1536000
      }
    ];

    for (const session of sampleSessions) {
      // Check if session already exists
      const [existing] = await connection.execute(
        'SELECT id FROM analysis_sessions WHERE user_id = ? AND audio_file_name = ?',
        [userId, session.audioFileName]
      );

      if (existing.length === 0) {
        // Insert session
        const [sessionResult] = await connection.execute(
          'INSERT INTO analysis_sessions (user_id, session_name, source_language, audio_file_name, audio_file_size) VALUES (?, ?, ?, ?, ?)',
          [userId, session.sessionName, session.sourceLanguage, session.audioFileName, session.audioFileSize]
        );

        const sessionId = sessionResult.insertId;
        console.log(`📊 Created session: ${session.sessionName} (ID: ${sessionId})`);

        // Insert sample analysis results
        const sampleAnalysis = {
          transcription: `Speaker 1: Hello, I need help with my application.\nSpeaker 2: Sure, I can help you with that. What seems to be the issue?`,
          translation: `Speaker 1: Hello, I need help with my application.\nSpeaker 2: Sure, I can help you with that. What seems to be the issue?`,
          summary: 'Customer called requesting help with their application. Agent provided assistance.',
          agentCoaching: 'Good response time and polite tone. Could improve by asking more specific questions.',
          customerSentiment: 'NEUTRAL',
          customerSentimentScore: 0.1,
          customerSentimentJustification: 'Customer was neutral, seeking help without strong emotions.',
          agentSentiment: 'POSITIVE',
          agentSentimentScore: 0.8,
          agentSentimentJustification: 'Agent was helpful and professional.',
          keywords: JSON.stringify(['application', 'help', 'support', 'assistance'])
        };

        await connection.execute(
          `INSERT INTO analysis_results (
            session_id, transcription, translation, summary, agent_coaching,
            customer_sentiment, customer_sentiment_score, customer_sentiment_justification,
            agent_sentiment, agent_sentiment_score, agent_sentiment_justification, keywords
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sessionId,
            sampleAnalysis.transcription,
            sampleAnalysis.translation,
            sampleAnalysis.summary,
            sampleAnalysis.agentCoaching,
            sampleAnalysis.customerSentiment,
            sampleAnalysis.customerSentimentScore,
            sampleAnalysis.customerSentimentJustification,
            sampleAnalysis.agentSentiment,
            sampleAnalysis.agentSentimentScore,
            sampleAnalysis.agentSentimentJustification,
            sampleAnalysis.keywords
          ]
        );

        console.log(`✅ Added analysis results for session ${sessionId}`);
      } else {
        console.log(`⏭️ Session ${session.sessionName} already exists, skipping`);
      }
    }

    await connection.end();
    console.log('🎉 Sample data insertion completed!');
    console.log('📊 You can now test the dashboard with existing data');
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
  }
};

insertSampleData();
