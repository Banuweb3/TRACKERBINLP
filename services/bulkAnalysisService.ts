import { performCompleteAnalysis } from './geminiService';
import { performEnhancedAnalysis, type EnhancedAnalysisResult, type BulkAnalysisProgress } from './enhancedAnalysisService';
import { bulkAnalysisService as bulkAnalysisAPI } from './bulkAnalysisAPI';
import type { Language } from '../types';

export class BulkAnalysisService {
  private progressCallbacks: Map<string, (progress: BulkAnalysisProgress[]) => void> = new Map();
  private activeAnalyses: Map<string, BulkAnalysisProgress[]> = new Map();

  async processBulkFiles(
    files: File[],
    sourceLanguage: Language,
    sessionId: string,
    onProgress?: (progress: BulkAnalysisProgress[]) => void,
    saveToDatabase: boolean = true
  ): Promise<EnhancedAnalysisResult[]> {
    const progressList: BulkAnalysisProgress[] = files.map((file, index) => ({
      fileId: `${sessionId}_${index}`,
      fileName: file.name,
      status: 'pending',
      progress: 0
    }));

    this.activeAnalyses.set(sessionId, progressList);
    if (onProgress) {
      this.progressCallbacks.set(sessionId, onProgress);
    }

    const results: EnhancedAnalysisResult[] = [];
    let bulkSessionId: number | null = null;

    try {
      // Create bulk session if saving to database
      if (saveToDatabase) {
        const bulkSession = await bulkAnalysisAPI.createSession({
          sessionName: `Bulk Analysis - ${new Date().toLocaleString()}`,
          sourceLanguage: sourceLanguage,
          totalFiles: files.length
        });
        bulkSessionId = bulkSession.id;
      }

      // Process files in parallel with concurrency limit
      const concurrencyLimit = 2;
      const chunks = this.chunkArray(files, concurrencyLimit);
      
      // Process files sequentially to avoid race conditions
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileProgress = progressList[i];
        const API_BASE_URL = 'http://localhost:3002/api';
        
        try {
          console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
          
          const result = await this.processFile(file, sourceLanguage, fileProgress, () => {
            this.notifyProgress(sessionId);
          });

          // Save individual file result to database if enabled
          if (saveToDatabase && bulkSessionId) {
            console.log(`Saving file result ${i + 1} to database...`);
            await this.saveFileResultToDatabase(file, result, bulkSessionId, i);
            console.log(`File result ${i + 1} saved successfully`);
          }

          results.push(result);
          
          // Add small delay between files to prevent API rate limiting
          if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.error(`Error processing file ${i + 1} (${file.name}):`, error);
          fileProgress.status = 'error';
          fileProgress.error = error instanceof Error ? error.message : 'Unknown error';
          this.notifyProgress(sessionId);
          
          // Continue with next file instead of stopping entire process
          results.push({
            fileName: file.name,
            error: error.message,
            summary: 'Processing failed',
            overallCoachingScore: 0
          } as any);
        }
      }

      // Save bulk summary to database
      if (saveToDatabase && bulkSessionId && results.length > 0) {
        await this.saveBulkSummaryToDatabase(results, bulkSessionId);
      }

      return results;
    } finally {
      this.cleanup(sessionId);
    }
  }

  private async processFile(
    file: File,
    sourceLanguage: Language,
    progress: BulkAnalysisProgress,
    onUpdate: () => void
  ): Promise<EnhancedAnalysisResult> {
    // Step 1: Complete Analysis (transcribe + translate + analyze + keywords)
    progress.status = 'transcribing';
    progress.progress = 10;
    onUpdate();

    const analysisResult = await performCompleteAnalysis(file, sourceLanguage);
    progress.progress = 70;
    onUpdate();

    // Step 2: Enhanced Analysis
    progress.status = 'analyzing';
    progress.progress = 80;
    onUpdate();

    const enhancedResult = await performEnhancedAnalysis(analysisResult.translation);
    progress.progress = 90;
    onUpdate();

    const result: EnhancedAnalysisResult = {
      ...enhancedResult,
      keywords: analysisResult.keywords,
      transcription: analysisResult.transcription,
      translation: analysisResult.translation
    };

    progress.status = 'completed';
    progress.progress = 100;
    progress.result = result;
    onUpdate();

    return result;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private notifyProgress(sessionId: string) {
    const progress = this.activeAnalyses.get(sessionId);
    const callback = this.progressCallbacks.get(sessionId);
    
    if (progress && callback) {
      callback([...progress]);
    }
  }

  private cleanup(sessionId: string) {
    this.activeAnalyses.delete(sessionId);
    this.progressCallbacks.delete(sessionId);
  }

  getProgress(sessionId: string): BulkAnalysisProgress[] | null {
    return this.activeAnalyses.get(sessionId) || null;
  }

  cancelAnalysis(sessionId: string) {
    this.cleanup(sessionId);
  }

  private async saveFileResultToDatabase(
    file: File,
    result: EnhancedAnalysisResult,
    bulkSessionId: number,
    processingOrder: number
  ): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        console.log(`Attempt ${attempt + 1}/${maxRetries} - Saving file result for ${file.name}`);
        
        // Store comprehensive data in bulk_file_results table
        await bulkAnalysisAPI.storeFileResult(bulkSessionId, {
          fileName: file.name,
          fileSize: file.size,
          processingOrder,
          status: 'completed',
          transcription: result.transcription || '',
          translation: result.translation || '',
          callSummary: result.summary,
          overallScore: result.overallCoachingScore,
          callOpeningScore: result.callOpening?.overallScore,
          callClosingScore: result.callClosing?.overallScore,
          speakingQualityScore: result.speakingQuality?.overallScore,
          customerSentiment: result.customerSentiment?.sentiment,
          customerSentimentScore: result.customerSentiment?.score,
          customerSentimentJustification: result.customerSentiment?.justification,
          agentSentiment: result.agentSentiment?.sentiment,
          agentSentimentScore: result.agentSentiment?.score,
          agentSentimentJustification: result.agentSentiment?.justification,
          agentCoaching: result.agentCoaching,
          callOpeningAnalysis: result.callOpening,
          callClosingAnalysis: result.callClosing,
          speakingQualityAnalysis: result.speakingQuality,
          keywords: result.keywords || []
        });
        
        console.log(`✅ Successfully saved file result for ${file.name} (order: ${processingOrder})`);
        return; // Success - exit retry loop
        
      } catch (error) {
        attempt++;
        console.error(`❌ Attempt ${attempt} failed to save file result for ${file.name}:`, error);
        
        if (attempt >= maxRetries) {
          console.error(`🚨 All ${maxRetries} attempts failed for ${file.name}. Continuing with next file.`);
          // Don't throw - let the process continue with other files
          return;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private async saveBulkSummaryToDatabase(
    results: EnhancedAnalysisResult[],
    bulkSessionId: number
  ): Promise<void> {
    try {
      // Calculate bulk summary statistics
      const totalFiles = results.length;
      const avgOverallScore = results.reduce((sum, r) => sum + r.overallCoachingScore, 0) / totalFiles;
      const avgCallOpeningScore = results.reduce((sum, r) => sum + r.callOpening.overallScore, 0) / totalFiles;
      const avgCallClosingScore = results.reduce((sum, r) => sum + r.callClosing.overallScore, 0) / totalFiles;
      const avgSpeakingQualityScore = results.reduce((sum, r) => sum + r.speakingQuality.overallScore, 0) / totalFiles;

      // Count sentiment distribution
      const sentimentCounts = results.reduce((acc, r) => {
        acc[r.customerSentiment.sentiment] = (acc[r.customerSentiment.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Collect all keywords
      const allKeywords = results.flatMap(r => r.keywords || []);
      const keywordFrequency = allKeywords.reduce((acc, keyword) => {
        acc[keyword] = (acc[keyword] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topKeywords = Object.entries(keywordFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([keyword]) => keyword);

      const positiveSentimentPercentage = (sentimentCounts['POSITIVE'] || 0) / totalFiles * 100;

      // Generate comprehensive batch summary
      const batchSummary = this.generateBatchSummary(results, {
        avgOverallScore,
        avgCallOpeningScore,
        avgCallClosingScore,
        avgSpeakingQualityScore,
        sentimentCounts,
        topKeywords
      });

      // Store bulk summary in bulk_analysis_sessions table
      await bulkAnalysisAPI.updateSessionSummary(bulkSessionId, {
        batchSummary,
        keyInsights: {
          strongestAreas: this.getStrongestAreas(results),
          improvementAreas: this.getImprovementAreas(results),
          commonIssues: this.getCommonIssues(results)
        },
        topKeywords,
        recommendations: this.generateRecommendations(results),
        avgOverallScore: Math.round(avgOverallScore * 100) / 100,
        avgCallOpeningScore: Math.round(avgCallOpeningScore * 100) / 100,
        avgCallClosingScore: Math.round(avgCallClosingScore * 100) / 100,
        avgSpeakingQualityScore: Math.round(avgSpeakingQualityScore * 100) / 100,
        positiveSentimentCount: sentimentCounts['POSITIVE'] || 0,
        neutralSentimentCount: sentimentCounts['NEUTRAL'] || 0,
        negativeSentimentCount: sentimentCounts['NEGATIVE'] || 0,
        positiveSentimentPercentage: Math.round(positiveSentimentPercentage * 100) / 100
      });
    } catch (error) {
      console.error('Failed to save bulk summary:', error);
    }
  }

  private generateBatchSummary(results: EnhancedAnalysisResult[], stats: any): string {
    const totalFiles = results.length;
    const performanceRating = stats.avgOverallScore >= 8 ? 'Excellent' : 
                             stats.avgOverallScore >= 6 ? 'Good' : 
                             stats.avgOverallScore >= 4 ? 'Fair' : 'Needs Improvement';
    
    return `📊 **Bulk Analysis Summary - ${totalFiles} Files Processed**\n\n` +
           `🎯 **Overall Performance**: ${performanceRating} (${stats.avgOverallScore.toFixed(1)}/10)\n\n` +
           `📈 **Performance Breakdown**:\n` +
           `• Call Opening: ${stats.avgCallOpeningScore.toFixed(1)}/10\n` +
           `• Speaking Quality: ${stats.avgSpeakingQualityScore.toFixed(1)}/10\n` +
           `• Call Closing: ${stats.avgCallClosingScore.toFixed(1)}/10\n\n` +
           `😊 **Customer Satisfaction**: ${((stats.sentimentCounts['POSITIVE'] || 0) / totalFiles * 100).toFixed(1)}% Positive\n\n` +
           `🔑 **Top Discussion Topics**: ${stats.topKeywords.slice(0, 5).join(', ')}`;
  }

  private getStrongestAreas(results: EnhancedAnalysisResult[]): string[] {
    const avgScores = {
      callOpening: results.reduce((sum, r) => sum + r.callOpening.overallScore, 0) / results.length,
      callClosing: results.reduce((sum, r) => sum + r.callClosing.overallScore, 0) / results.length,
      speakingQuality: results.reduce((sum, r) => sum + r.speakingQuality.overallScore, 0) / results.length
    };
    
    return Object.entries(avgScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([area]) => area);
  }

  private getImprovementAreas(results: EnhancedAnalysisResult[]): string[] {
    const avgScores = {
      callOpening: results.reduce((sum, r) => sum + r.callOpening.overallScore, 0) / results.length,
      callClosing: results.reduce((sum, r) => sum + r.callClosing.overallScore, 0) / results.length,
      speakingQuality: results.reduce((sum, r) => sum + r.speakingQuality.overallScore, 0) / results.length
    };
    
    return Object.entries(avgScores)
      .filter(([,score]) => score < 6)
      .map(([area]) => area);
  }

  private getCommonIssues(results: EnhancedAnalysisResult[]): string[] {
    const issues: string[] = [];
    const negativeCount = results.filter(r => r.customerSentiment.sentiment === 'NEGATIVE').length;
    const lowScoreCount = results.filter(r => r.overallCoachingScore < 6).length;
    
    if (negativeCount > results.length * 0.3) {
      issues.push('High customer dissatisfaction rate');
    }
    if (lowScoreCount > results.length * 0.4) {
      issues.push('Inconsistent call quality');
    }
    
    return issues;
  }

  private generateRecommendations(results: EnhancedAnalysisResult[]): string {
    const recommendations: string[] = [];
    const avgOverallScore = results.reduce((sum, r) => sum + r.overallCoachingScore, 0) / results.length;
    const negativeRate = results.filter(r => r.customerSentiment.sentiment === 'NEGATIVE').length / results.length;
    
    if (avgOverallScore < 6) {
      recommendations.push('📞 Focus on comprehensive agent training programs');
    }
    if (negativeRate > 0.2) {
      recommendations.push('😊 Implement customer satisfaction improvement initiatives');
    }
    
    recommendations.push('📊 Regular performance monitoring and feedback sessions');
    recommendations.push('🎯 Set specific improvement targets for underperforming areas');
    
    return recommendations.join('\n');
  }
}

export const bulkAnalysisService = new BulkAnalysisService();
