import pool from '../config/database.js';

export class AnalysisResult {
  constructor(data) {
    this.id = data.id;
    this.sessionId = data.session_id;
    this.transcription = data.transcription;
    this.translation = data.translation;
    this.summary = data.summary;
    this.agentCoaching = data.agent_coaching;
    this.customerSentiment = data.customer_sentiment;
    this.customerSentimentScore = data.customer_sentiment_score;
    this.customerSentimentJustification = data.customer_sentiment_justification;
    this.agentSentiment = data.agent_sentiment;
    this.agentSentimentScore = data.agent_sentiment_score;
    this.agentSentimentJustification = data.agent_sentiment_justification;
    this.keywords = data.keywords;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Create new analysis result
  static async create(sessionId, analysisData) {
    try {
      const {
        transcription,
        translation,
        analysis,
        keywords
      } = analysisData;

      const [result] = await pool.execute(
        `INSERT INTO analysis_results (
          session_id, transcription, translation, summary, agent_coaching,
          customer_sentiment, customer_sentiment_score, customer_sentiment_justification,
          agent_sentiment, agent_sentiment_score, agent_sentiment_justification,
          keywords
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          transcription,
          translation,
          analysis.summary,
          analysis.agentCoaching,
          analysis.customerSentiment.sentiment,
          analysis.customerSentiment.score,
          analysis.customerSentiment.justification,
          'NEUTRAL', // Use a simple sentiment for the legacy column
          0, // Legacy score field
          'Complex agent sentiment stored in keywords field', // Legacy justification field
          JSON.stringify({
            keywords: keywords,
            agentSentiment: analysis.agentSentiment // Store complex agent sentiment here
          })
        ]
      );

      return await AnalysisResult.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Find result by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM analysis_results WHERE id = ?',
        [id]
      );
      
      return rows.length > 0 ? new AnalysisResult(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find result by session ID
  static async findBySessionId(sessionId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM analysis_results WHERE session_id = ?',
        [sessionId]
      );
      
      return rows.length > 0 ? new AnalysisResult(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Get recent analysis results for a user
  static async getRecentByUserId(userId, limit = 10) {
    try {
      const [rows] = await pool.execute(
        `SELECT r.*, s.session_name, s.source_language, s.created_at as session_created
         FROM analysis_results r
         JOIN analysis_sessions s ON r.session_id = s.id
         WHERE s.user_id = ?
         ORDER BY r.created_at DESC
         LIMIT ?`,
        [userId, limit]
      );
      
      return rows.map(row => {
        const result = new AnalysisResult(row);
        result.sessionName = row.session_name;
        result.sourceLanguage = row.source_language;
        result.sessionCreated = row.session_created;
        return result;
      });
    } catch (error) {
      throw error;
    }
  }

  // Search analysis results by keywords or content
  static async search(userId, searchTerm, limit = 20) {
    try {
      const searchPattern = `%${searchTerm}%`;
      const [rows] = await pool.execute(
        `SELECT r.*, s.session_name, s.source_language
         FROM analysis_results r
         JOIN analysis_sessions s ON r.session_id = s.id
         WHERE s.user_id = ? AND (
           r.transcription LIKE ? OR
           r.translation LIKE ? OR
           r.summary LIKE ? OR
           r.agent_coaching LIKE ? OR
           s.session_name LIKE ?
         )
         ORDER BY r.created_at DESC
         LIMIT ?`,
        [userId, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit]
      );
      
      return rows.map(row => {
        const result = new AnalysisResult(row);
        result.sessionName = row.session_name;
        result.sourceLanguage = row.source_language;
        return result;
      });
    } catch (error) {
      throw error;
    }
  }

  // Get sentiment analysis statistics for a user
  static async getSentimentStats(userId, days = 30) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          AVG(customer_sentiment_score) as avg_customer_sentiment,
          AVG(agent_sentiment_score) as avg_agent_sentiment,
          COUNT(CASE WHEN customer_sentiment = 'POSITIVE' THEN 1 END) as positive_customer,
          COUNT(CASE WHEN customer_sentiment = 'NEUTRAL' THEN 1 END) as neutral_customer,
          COUNT(CASE WHEN customer_sentiment = 'NEGATIVE' THEN 1 END) as negative_customer,
          COUNT(CASE WHEN agent_sentiment = 'POSITIVE' THEN 1 END) as positive_agent,
          COUNT(CASE WHEN agent_sentiment = 'NEUTRAL' THEN 1 END) as neutral_agent,
          COUNT(CASE WHEN agent_sentiment = 'NEGATIVE' THEN 1 END) as negative_agent,
          COUNT(*) as total_analyses
         FROM analysis_results r
         JOIN analysis_sessions s ON r.session_id = s.id
         WHERE s.user_id = ? AND r.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [userId, days]
      );

      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update analysis result
  async update(data) {
    try {
      const fields = [];
      const values = [];

      if (data.transcription !== undefined) {
        fields.push('transcription = ?');
        values.push(data.transcription);
      }
      if (data.translation !== undefined) {
        fields.push('translation = ?');
        values.push(data.translation);
      }
      if (data.summary !== undefined) {
        fields.push('summary = ?');
        values.push(data.summary);
      }
      if (data.agentCoaching !== undefined) {
        fields.push('agent_coaching = ?');
        values.push(data.agentCoaching);
      }

      if (fields.length === 0) return this;

      values.push(this.id);

      await pool.execute(
        `UPDATE analysis_results SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );

      return await AnalysisResult.findById(this.id);
    } catch (error) {
      throw error;
    }
  }

  // Helper method to safely parse keywords
  parseKeywords() {
    if (!this.keywords) return [];
    
    try {
      // If it's already an array, return it
      if (Array.isArray(this.keywords)) {
        return this.keywords;
      }
      
      // If it's a string, try to parse it as JSON
      if (typeof this.keywords === 'string') {
        // Check if it looks like JSON (starts with [ or {)
        if (this.keywords.trim().startsWith('[') || this.keywords.trim().startsWith('{')) {
          return JSON.parse(this.keywords);
        } else {
          // If it's just a plain string, split by commas and clean up
          return this.keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword.length > 0);
        }
      }
      
      return [];
    } catch (error) {
      console.warn(`Failed to parse keywords for analysis result ${this.id}:`, error.message);
      console.warn(`Keywords data:`, this.keywords);
      
      // Fallback: if it's a string, try to extract meaningful keywords
      if (typeof this.keywords === 'string') {
        return this.keywords.split(/[,\s]+/).filter(keyword => keyword.length > 2);
      }
      
      return [];
    }
  }

  // Convert to formatted JSON
  toJSON() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      transcription: this.transcription,
      translation: this.translation,
      analysis: {
        summary: this.summary,
        agentCoaching: this.agentCoaching,
        customerSentiment: {
          sentiment: this.customerSentiment,
          score: parseFloat(this.customerSentimentScore),
          justification: this.customerSentimentJustification
        },
        agentSentiment: {
          sentiment: this.agentSentiment,
          score: parseFloat(this.agentSentimentScore),
          justification: this.agentSentimentJustification
        }
      },
      keywords: this.parseKeywords(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      sessionName: this.sessionName,
      sourceLanguage: this.sourceLanguage
    };
  }
}
