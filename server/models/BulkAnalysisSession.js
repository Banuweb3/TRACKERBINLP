import db from '../config/database.js';

export class BulkAnalysisSession {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.sessionName = data.session_name;
    this.sourceLanguage = data.source_language;
    this.totalFiles = data.total_files;
    this.completedFiles = data.completed_files;
    this.failedFiles = data.failed_files;
    this.status = data.status;
    this.avgOverallScore = data.avg_overall_score;
    this.avgCallOpeningScore = data.avg_call_opening_score;
    this.avgCallClosingScore = data.avg_call_closing_score;
    this.avgSpeakingQualityScore = data.avg_speaking_quality_score;
    this.positiveSentimentCount = data.positive_sentiment_count;
    this.neutralSentimentCount = data.neutral_sentiment_count;
    this.negativeSentimentCount = data.negative_sentiment_count;
    this.positiveSentimentPercentage = data.positive_sentiment_percentage;
    this.batchSummary = data.batch_summary;
    this.keyInsights = data.key_insights ? JSON.parse(data.key_insights) : null;
    this.topKeywords = data.top_keywords ? JSON.parse(data.top_keywords) : null;
    this.recommendations = data.recommendations;
    this.totalProcessingTime = data.total_processing_time;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.fileResults = data.fileResults || [];
  }

  static async create(data) {
    const query = `
      INSERT INTO bulk_analysis_sessions 
      (user_id, session_name, source_language, total_files, status)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [
      data.userId,
      data.sessionName,
      data.sourceLanguage,
      data.totalFiles,
      data.status || 'processing'
    ]);

    return await this.findById(result.insertId);
  }

  static async findById(id) {
    const query = `
      SELECT * FROM bulk_analysis_sessions 
      WHERE id = ?
    `;
    
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return null;
    }

    return new BulkAnalysisSession(rows[0]);
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM bulk_analysis_sessions 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await db.execute(query, [userId, limit, offset]);
    
    return rows.map(row => new BulkAnalysisSession(row));
  }

  async getWithFiles() {
    const query = `
      SELECT bfr.*, bas.session_name as bulk_session_name
      FROM bulk_file_results bfr
      JOIN bulk_analysis_sessions bas ON bfr.bulk_session_id = bas.id
      WHERE bfr.bulk_session_id = ?
      ORDER BY bfr.processing_order ASC
    `;
    
    const [fileRows] = await db.execute(query, [this.id]);
    
    this.fileResults = fileRows.map(row => ({
      id: row.id,
      fileName: row.file_name,
      fileSize: row.file_size,
      processingOrder: row.processing_order,
      status: row.status,
      callSummary: row.call_summary,
      overallScore: row.overall_score,
      customerSentiment: row.customer_sentiment,
      keywords: row.keywords ? JSON.parse(row.keywords) : null,
      processingTime: row.processing_time,
      errorMessage: row.error_message,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return this;
  }

  async updateProgress() {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM bulk_file_results 
      WHERE bulk_session_id = ?
    `;
    
    const [rows] = await db.execute(query, [this.id]);
    const stats = rows[0];

    const updateQuery = `
      UPDATE bulk_analysis_sessions 
      SET completed_files = ?, failed_files = ?, 
          status = CASE 
            WHEN ? = total_files THEN 'completed'
            WHEN ? > 0 AND (? + ?) = total_files THEN 'completed'
            ELSE 'processing'
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await db.execute(updateQuery, [
      stats.completed,
      stats.failed,
      stats.completed,
      stats.failed,
      stats.completed,
      stats.failed,
      this.id
    ]);

    return await BulkAnalysisSession.findById(this.id);
  }

  async updateSummary(data) {
    const updateFields = [];
    const values = [];

    if (data.batchSummary !== undefined) {
      updateFields.push('batch_summary = ?');
      values.push(data.batchSummary);
    }
    if (data.keyInsights !== undefined) {
      updateFields.push('key_insights = ?');
      values.push(JSON.stringify(data.keyInsights));
    }
    if (data.topKeywords !== undefined) {
      updateFields.push('top_keywords = ?');
      values.push(JSON.stringify(data.topKeywords));
    }
    if (data.recommendations !== undefined) {
      updateFields.push('recommendations = ?');
      values.push(data.recommendations);
    }
    if (data.avgOverallScore !== undefined) {
      updateFields.push('avg_overall_score = ?');
      values.push(data.avgOverallScore);
    }
    if (data.avgCallOpeningScore !== undefined) {
      updateFields.push('avg_call_opening_score = ?');
      values.push(data.avgCallOpeningScore);
    }
    if (data.avgCallClosingScore !== undefined) {
      updateFields.push('avg_call_closing_score = ?');
      values.push(data.avgCallClosingScore);
    }
    if (data.avgSpeakingQualityScore !== undefined) {
      updateFields.push('avg_speaking_quality_score = ?');
      values.push(data.avgSpeakingQualityScore);
    }
    if (data.positiveSentimentCount !== undefined) {
      updateFields.push('positive_sentiment_count = ?');
      values.push(data.positiveSentimentCount);
    }
    if (data.neutralSentimentCount !== undefined) {
      updateFields.push('neutral_sentiment_count = ?');
      values.push(data.neutralSentimentCount);
    }
    if (data.negativeSentimentCount !== undefined) {
      updateFields.push('negative_sentiment_count = ?');
      values.push(data.negativeSentimentCount);
    }
    if (data.positiveSentimentPercentage !== undefined) {
      updateFields.push('positive_sentiment_percentage = ?');
      values.push(data.positiveSentimentPercentage);
    }

    if (updateFields.length === 0) {
      return this;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(this.id);

    const query = `
      UPDATE bulk_analysis_sessions 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    await db.execute(query, values);

    return await BulkAnalysisSession.findById(this.id);
  }

  async delete() {
    const query = `DELETE FROM bulk_analysis_sessions WHERE id = ?`;
    await db.execute(query, [this.id]);
  }

  static async getUserStats(userId, days = 30) {
    const query = `
      SELECT 
        COUNT(*) as totalSessions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedSessions,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processingSessions,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedSessions,
        SUM(total_files) as totalFilesProcessed,
        SUM(completed_files) as totalFilesCompleted,
        AVG(avg_overall_score) as avgOverallScore,
        AVG(positive_sentiment_percentage) as avgPositiveSentiment
      FROM bulk_analysis_sessions 
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    const [rows] = await db.execute(query, [userId, days]);
    
    return rows[0];
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      sessionName: this.sessionName,
      sourceLanguage: this.sourceLanguage,
      totalFiles: this.totalFiles,
      completedFiles: this.completedFiles,
      failedFiles: this.failedFiles,
      status: this.status,
      avgOverallScore: this.avgOverallScore,
      avgCallOpeningScore: this.avgCallOpeningScore,
      avgCallClosingScore: this.avgCallClosingScore,
      avgSpeakingQualityScore: this.avgSpeakingQualityScore,
      positiveSentimentCount: this.positiveSentimentCount,
      neutralSentimentCount: this.neutralSentimentCount,
      negativeSentimentCount: this.negativeSentimentCount,
      positiveSentimentPercentage: this.positiveSentimentPercentage,
      batchSummary: this.batchSummary,
      keyInsights: this.keyInsights,
      topKeywords: this.topKeywords,
      recommendations: this.recommendations,
      totalProcessingTime: this.totalProcessingTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      fileResults: this.fileResults
    };
  }
}
