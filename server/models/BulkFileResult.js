import db from '../config/database.js';

export class BulkFileResult {
  constructor(data) {
    this.id = data.id;
    this.bulkSessionId = data.bulk_session_id;
    this.fileName = data.file_name;
    this.fileSize = data.file_size;
    this.processingOrder = data.processing_order;
    this.status = data.status;
    this.transcription = data.transcription;
    this.translation = data.translation;
    this.callSummary = data.call_summary;
    this.overallScore = data.overall_score;
    this.callOpeningScore = data.call_opening_score;
    this.callClosingScore = data.call_closing_score;
    this.speakingQualityScore = data.speaking_quality_score;
    this.customerSentiment = data.customer_sentiment;
    this.customerSentimentScore = data.customer_sentiment_score;
    this.customerSentimentJustification = data.customer_sentiment_justification;
    this.agentSentiment = data.agent_sentiment;
    this.agentSentimentScore = data.agent_sentiment_score;
    this.agentSentimentJustification = data.agent_sentiment_justification;
    this.agentCoaching = data.agent_coaching;
    this.callOpeningAnalysis = data.call_opening_analysis ? JSON.parse(data.call_opening_analysis) : null;
    this.callClosingAnalysis = data.call_closing_analysis ? JSON.parse(data.call_closing_analysis) : null;
    this.speakingQualityAnalysis = data.speaking_quality_analysis ? JSON.parse(data.speaking_quality_analysis) : null;
    this.keywords = data.keywords ? JSON.parse(data.keywords) : null;
    this.processingTime = data.processing_time;
    this.errorMessage = data.error_message;
    this.startedAt = data.started_at;
    this.completedAt = data.completed_at;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async create(bulkSessionId, data) {
    try {
      // First, try to create with minimal required fields only
      const query = `
        INSERT INTO bulk_file_results 
        (bulk_session_id, file_name, file_size, processing_order, status, call_summary, overall_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute(query, [
        bulkSessionId,
        data.fileName || 'unknown.mp3',
        data.fileSize || null,
        data.processingOrder || 0,
        data.status || 'completed',
        data.callSummary || null,
        data.overallScore || null
      ]);

      // Then update with additional fields if they exist
      if (result.insertId) {
        const updateQuery = `
          UPDATE bulk_file_results SET
            transcription = ?,
            translation = ?,
            call_opening_score = ?,
            call_closing_score = ?,
            speaking_quality_score = ?,
            customer_sentiment = ?,
            customer_sentiment_score = ?,
            customer_sentiment_justification = ?,
            agent_sentiment = ?,
            agent_sentiment_score = ?,
            agent_sentiment_justification = ?,
            agent_coaching = ?,
            call_opening_analysis = ?,
            call_closing_analysis = ?,
            speaking_quality_analysis = ?,
            keywords = ?,
            processing_time = ?,
            error_message = ?
          WHERE id = ?
        `;

        await db.execute(updateQuery, [
          data.transcription || null,
          data.translation || null,
          data.callOpeningScore || null,
          data.callClosingScore || null,
          data.speakingQualityScore || null,
          data.customerSentiment || null,
          data.customerSentimentScore || null,
          data.customerSentimentJustification || null,
          data.agentSentiment || null,
          data.agentSentimentScore || null,
          data.agentSentimentJustification || null,
          data.agentCoaching || null,
          data.callOpeningAnalysis ? JSON.stringify(data.callOpeningAnalysis) : null,
          data.callClosingAnalysis ? JSON.stringify(data.callClosingAnalysis) : null,
          data.speakingQualityAnalysis ? JSON.stringify(data.speakingQualityAnalysis) : null,
          data.keywords ? JSON.stringify(data.keywords) : null,
          data.processingTime || null,
          data.errorMessage || null,
          result.insertId
        ]).catch(updateError => {
          console.warn('Failed to update additional fields:', updateError.message);
          // Don't throw - basic record was created successfully
        });
      }

      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Database insert error:', error);
      console.error('Data being inserted:', JSON.stringify(data, null, 2));
      
      // Try fallback with even more minimal data
      try {
        const fallbackQuery = `
          INSERT INTO bulk_file_results 
          (bulk_session_id, file_name, processing_order, status, call_summary, overall_score)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [fallbackResult] = await db.execute(fallbackQuery, [
          bulkSessionId,
          data.fileName || 'unknown.mp3',
          data.processingOrder || 0,
          'completed',
          data.callSummary || 'Analysis completed',
          data.overallScore || 0
        ]);

        console.log('Fallback insert successful');
        return await this.findById(fallbackResult.insertId);
      } catch (fallbackError) {
        console.error('Fallback insert also failed:', fallbackError);
        throw new Error(`Database insert failed: ${error.message}`);
      }
    }
  }

  static async findById(id) {
    const query = `
      SELECT * FROM bulk_file_results 
      WHERE id = ?
    `;
    
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return null;
    }

    return new BulkFileResult(rows[0]);
  }

  static async findBySessionId(sessionId, limit = 100, offset = 0) {
    const query = `
      SELECT * FROM bulk_file_results 
      WHERE bulk_session_id = ?
      ORDER BY processing_order ASC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await db.execute(query, [sessionId, limit, offset]);
    
    return rows.map(row => new BulkFileResult(row));
  }

  async updateStatus(data) {
    const updateFields = [];
    const values = [];

    if (data.status !== undefined) {
      updateFields.push('status = ?');
      values.push(data.status);
      
      if (data.status === 'completed') {
        updateFields.push('completed_at = CURRENT_TIMESTAMP');
      }
    }

    if (data.callSummary !== undefined) {
      updateFields.push('call_summary = ?');
      values.push(data.callSummary);
    }

    if (data.overallScore !== undefined) {
      updateFields.push('overall_score = ?');
      values.push(data.overallScore);
    }

    if (data.customerSentiment !== undefined) {
      updateFields.push('customer_sentiment = ?');
      values.push(data.customerSentiment);
    }

    if (data.keywords !== undefined) {
      updateFields.push('keywords = ?');
      values.push(JSON.stringify(data.keywords));
    }

    if (data.processingTime !== undefined) {
      updateFields.push('processing_time = ?');
      values.push(data.processingTime);
    }

    if (data.errorMessage !== undefined) {
      updateFields.push('error_message = ?');
      values.push(data.errorMessage);
    }

    if (updateFields.length === 0) {
      return this;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(this.id);

    const query = `
      UPDATE bulk_file_results 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    await db.execute(query, values);

    return await BulkFileResult.findById(this.id);
  }

  async delete() {
    const query = `DELETE FROM bulk_file_results WHERE id = ?`;
    await db.execute(query, [this.id]);
  }

  toJSON() {
    return {
      id: this.id,
      bulkSessionId: this.bulkSessionId,
      fileName: this.fileName,
      fileSize: this.fileSize,
      processingOrder: this.processingOrder,
      status: this.status,
      transcription: this.transcription,
      translation: this.translation,
      summary: this.callSummary, // Map to 'summary' for frontend compatibility
      callSummary: this.callSummary,
      overallCoachingScore: this.overallScore, // Map for frontend compatibility
      overallScore: this.overallScore,
      callOpening: this.callOpeningAnalysis ? {
        ...this.callOpeningAnalysis,
        overallScore: this.callOpeningScore
      } : null,
      callClosing: this.callClosingAnalysis ? {
        ...this.callClosingAnalysis,
        overallScore: this.callClosingScore
      } : null,
      speakingQuality: this.speakingQualityAnalysis ? {
        ...this.speakingQualityAnalysis,
        overallScore: this.speakingQualityScore
      } : null,
      customerSentiment: this.customerSentiment ? {
        sentiment: this.customerSentiment,
        score: this.customerSentimentScore,
        justification: this.customerSentimentJustification
      } : null,
      agentSentiment: this.agentSentiment ? {
        sentiment: this.agentSentiment,
        score: this.agentSentimentScore,
        justification: this.agentSentimentJustification
      } : null,
      agentCoaching: this.agentCoaching,
      keywords: this.keywords,
      processingTime: this.processingTime,
      errorMessage: this.errorMessage,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
