import pool from '../config/database.js';

export class AnalysisSession {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.sessionName = data.session_name;
    this.sourceLanguage = data.source_language;
    this.audioFileName = data.audio_file_name;
    this.audioFileSize = data.audio_file_size;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Create new analysis session
  static async create({ userId, sessionName, sourceLanguage, audioFileName, audioFileSize }) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO analysis_sessions (user_id, session_name, source_language, audio_file_name, audio_file_size) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, sessionName, sourceLanguage, audioFileName, audioFileSize]
      );

      return await AnalysisSession.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Find session by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM analysis_sessions WHERE id = ?',
        [id]
      );
      
      return rows.length > 0 ? new AnalysisSession(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find sessions by user ID with analysis results
  static async findByUserId(userId, limit = 50, offset = 0) {
    try {
      console.log(`Finding sessions for user ID: ${userId}, limit: ${limit}, offset: ${offset}`);
      
      // Ensure limit and offset are integers and safe
      const safeLimit = Math.max(1, Math.min(parseInt(limit) || 50, 1000));
      const safeOffset = Math.max(0, parseInt(offset) || 0);
      
      // First, try a simple query to test connection
      const [testRows] = await pool.execute('SELECT COUNT(*) as count FROM analysis_sessions WHERE user_id = ?', [userId]);
      console.log(`Found ${testRows[0].count} total sessions for user ${userId}`);
      
      const [rows] = await pool.execute(
        `SELECT 
          s.id,
          s.user_id,
          s.session_name,
          s.source_language,
          s.audio_file_name,
          s.audio_file_size,
          s.created_at,
          s.updated_at,
          r.id as result_id,
          r.transcription,
          r.translation,
          r.summary,
          r.agent_coaching,
          r.customer_sentiment,
          r.customer_sentiment_score,
          r.customer_sentiment_justification,
          r.agent_sentiment,
          r.agent_sentiment_score,
          r.agent_sentiment_justification,
          r.keywords
         FROM analysis_sessions s
         LEFT JOIN analysis_results r ON s.id = r.session_id
         WHERE s.user_id = ? 
         ORDER BY s.created_at DESC 
         LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        [userId]
      );
      
      console.log(`Query returned ${rows.length} rows`);
      
      return rows.map(row => {
        const session = new AnalysisSession({
          id: row.id,
          user_id: row.user_id,
          session_name: row.session_name,
          source_language: row.source_language,
          audio_file_name: row.audio_file_name,
          audio_file_size: row.audio_file_size,
          created_at: row.created_at,
          updated_at: row.updated_at
        });
        
        // Add analysis results if they exist
        if (row.transcription) {
          try {
            let keywords = [];
            if (row.keywords) {
              try {
                if (typeof row.keywords === 'string') {
                  // Clean the string before parsing
                  let cleanKeywords = row.keywords.trim();
                  
                  // If it doesn't start with [ or {, it might be a comma-separated list
                  if (!cleanKeywords.startsWith('[') && !cleanKeywords.startsWith('{')) {
                    // Convert comma-separated string to array
                    keywords = cleanKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
                  } else {
                    keywords = JSON.parse(cleanKeywords);
                  }
                } else if (Array.isArray(row.keywords)) {
                  keywords = row.keywords;
                } else {
                  keywords = [];
                }
              } catch (parseError) {
                console.error('Failed to parse keywords:', row.keywords, parseError.message);
                // Try to extract keywords from the corrupted string
                if (typeof row.keywords === 'string') {
                  keywords = row.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
                } else {
                  keywords = [];
                }
              }
            }
            
            session.analysisResults = {
              id: row.result_id,
              sessionId: session.id,
              transcription: row.transcription,
              translation: row.translation,
              analysis: {
                summary: row.summary,
                agentCoaching: row.agent_coaching,
                customerSentiment: {
                  sentiment: row.customer_sentiment,
                  score: row.customer_sentiment_score,
                  justification: row.customer_sentiment_justification
                },
                agentSentiment: {
                  sentiment: row.agent_sentiment,
                  score: row.agent_sentiment_score,
                  justification: row.agent_sentiment_justification
                }
              },
              keywords: keywords,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            };
          } catch (parseError) {
            console.error('Error parsing keywords:', parseError);
            session.analysisResults = {
              id: row.result_id,
              sessionId: session.id,
              transcription: row.transcription,
              translation: row.translation,
              analysis: {
                summary: row.summary,
                agentCoaching: row.agent_coaching,
                customerSentiment: {
                  sentiment: row.customer_sentiment || 'NEUTRAL',
                  score: row.customer_sentiment_score || 0,
                  justification: row.customer_sentiment_justification || ''
                },
                agentSentiment: {
                  sentiment: row.agent_sentiment || 'NEUTRAL',
                  score: row.agent_sentiment_score || 0,
                  justification: row.agent_sentiment_justification || ''
                }
              },
              keywords: [],
              createdAt: row.created_at,
              updatedAt: row.updated_at
            };
          }
        }
        
        return session;
      });
    } catch (error) {
      console.error('Database error in findByUserId:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        sqlMessage: error.sqlMessage
      });
      throw error;
    }
  }

  // Find session by file details (to check for duplicates)
  static async findByFileDetails(userId, audioFileName, audioFileSize) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM analysis_sessions 
         WHERE user_id = ? AND audio_file_name = ? AND audio_file_size = ?
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId, audioFileName, audioFileSize]
      );
      
      return rows.length > 0 ? new AnalysisSession(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Get session with analysis results
  async getWithResults() {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          s.*,
          r.transcription,
          r.translation,
          r.summary,
          r.agent_coaching,
          r.customer_sentiment,
          r.customer_sentiment_score,
          r.customer_sentiment_justification,
          r.agent_sentiment,
          r.agent_sentiment_score,
          r.agent_sentiment_justification,
          r.keywords
         FROM analysis_sessions s
         LEFT JOIN analysis_results r ON s.id = r.session_id
         WHERE s.id = ?`,
        [this.id]
      );

      if (rows.length === 0) return null;

      const sessionData = rows[0];
      const session = new AnalysisSession(sessionData);

      // Add analysis results if they exist
      if (sessionData.transcription) {
        session.analysisResults = {
          transcription: sessionData.transcription,
          translation: sessionData.translation,
          summary: sessionData.summary,
          agentCoaching: sessionData.agent_coaching,
          customerSentiment: {
            sentiment: sessionData.customer_sentiment,
            score: parseFloat(sessionData.customer_sentiment_score),
            justification: sessionData.customer_sentiment_justification
          },
          agentSentiment: {
            sentiment: sessionData.agent_sentiment,
            score: parseFloat(sessionData.agent_sentiment_score),
            justification: sessionData.agent_sentiment_justification
          },
          keywords: sessionData.keywords ? JSON.parse(sessionData.keywords) : []
        };
      }

      return session;
    } catch (error) {
      throw error;
    }
  }

  // Update session name
  async updateName(newName) {
    try {
      await pool.execute(
        'UPDATE analysis_sessions SET session_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newName, this.id]
      );
      
      this.sessionName = newName;
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Delete session and its results
  async delete() {
    try {
      await pool.execute('DELETE FROM analysis_sessions WHERE id = ?', [this.id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get user's session statistics
  static async getUserStats(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          COUNT(*) as total_sessions,
          COUNT(r.id) as completed_analyses,
          AVG(r.customer_sentiment_score) as avg_customer_sentiment,
          AVG(r.agent_sentiment_score) as avg_agent_sentiment
         FROM analysis_sessions s
         LEFT JOIN analysis_results r ON s.id = r.session_id
         WHERE s.user_id = ?`,
        [userId]
      );

      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      sessionName: this.sessionName,
      sourceLanguage: this.sourceLanguage,
      audioFileName: this.audioFileName,
      audioFileSize: this.audioFileSize,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      analysisResults: this.analysisResults
    };
  }
}
