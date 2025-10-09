import { authService } from './authService';

// Automatically detect API base URL
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // For local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }

    // For production
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '/api/analysis';
    }
  }

  // Fallback for SSR or other environments
  return ((import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api');
};

const API_BASE_URL = getApiBaseUrl();
console.log('🔗 Bulk Analysis API Base URL:', API_BASE_URL);

export interface BulkAnalysisSession {
  id: number;
  userId: number;
  sessionName: string;
  sourceLanguage: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  avgOverallScore?: number;
  avgCallOpeningScore?: number;
  avgCallClosingScore?: number;
  avgSpeakingQualityScore?: number;
  positiveSentimentCount?: number;
  neutralSentimentCount?: number;
  negativeSentimentCount?: number;
  positiveSentimentPercentage?: number;
  batchSummary?: string;
  keyInsights?: any;
  topKeywords?: string[];
  recommendations?: string;
  totalProcessingTime?: number;
  createdAt: string;
  updatedAt: string;
  fileResults?: BulkFileResult[];
}

export interface BulkFileResult {
  id: number;
  bulkSessionId: number;
  fileName: string;
  fileSize?: number;
  processingOrder: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transcription?: string;
  translation?: string;
  callSummary?: string;
  overallScore?: number;
  callOpeningScore?: number;
  callClosingScore?: number;
  speakingQualityScore?: number;
  customerSentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  customerSentimentScore?: number;
  customerSentimentJustification?: string;
  agentSentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  agentSentimentScore?: number;
  agentSentimentJustification?: string;
  agentCoaching?: string;
  callOpeningAnalysis?: any;
  callClosingAnalysis?: any;
  speakingQualityAnalysis?: any;
  keywords?: string[];
  processingTime?: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBulkSessionData {
  sessionName: string;
  sourceLanguage: string;
  totalFiles: number;
}

export interface StoreFileResultData {
  fileName: string;
  fileSize?: number;
  processingOrder: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  transcription?: string;
  translation?: string;
  callSummary?: string;
  overallScore?: number;
  callOpeningScore?: number;
  callClosingScore?: number;
  speakingQualityScore?: number;
  customerSentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  customerSentimentScore?: number;
  customerSentimentJustification?: string;
  agentSentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  agentSentimentScore?: number;
  agentSentimentJustification?: string;
  agentCoaching?: string;
  callOpeningAnalysis?: any;
  callClosingAnalysis?: any;
  speakingQualityAnalysis?: any;
  keywords?: string[];
  processingTime?: number;
  errorMessage?: string;
}

export interface UpdateSessionSummaryData {
  batchSummary?: string;
  keyInsights?: any;
  topKeywords?: string[];
  recommendations?: string;
  avgOverallScore?: number;
  avgCallOpeningScore?: number;
  avgCallClosingScore?: number;
  avgSpeakingQualityScore?: number;
  positiveSentimentCount?: number;
  neutralSentimentCount?: number;
  negativeSentimentCount?: number;
  positiveSentimentPercentage?: number;
}

class BulkAnalysisAPIService {
  // Create new bulk analysis session
  async createSession(data: CreateBulkSessionData): Promise<BulkAnalysisSession> {
    try {
      const response = await fetch(`${API_BASE_URL}/bulk-analysis/sessions`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create bulk session');
      }

      const result = await response.json();
      return result.session;
    } catch (error) {
      console.error('Create bulk session error:', error);
      throw error;
    }
  }

  // Store individual file result
  async storeFileResult(sessionId: number, data: StoreFileResultData): Promise<BulkFileResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/bulk-analysis/sessions/${sessionId}/files`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to store file result');
      }

      const result = await response.json();
      return result.fileResult;
    } catch (error) {
      console.error('Store file result error:', error);
      throw error;
    }
  }

  // Update bulk session summary
  async updateSessionSummary(sessionId: number, data: UpdateSessionSummaryData): Promise<BulkAnalysisSession> {
    try {
      const response = await fetch(`${API_BASE_URL}/bulk-analysis/sessions/${sessionId}/summary`, {
        method: 'PUT',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update session summary');
      }

      const result = await response.json();
      return result.session;
    } catch (error) {
      console.error('Update session summary error:', error);
      throw error;
    }
  }

  // Get user's bulk analysis sessions
  async getSessions(limit = 50, offset = 0): Promise<BulkAnalysisSession[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/bulk-analysis/sessions?limit=${limit}&offset=${offset}`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch bulk sessions');
      }

      const result = await response.json();
      return result.sessions;
    } catch (error) {
      console.error('Get bulk sessions error:', error);
      throw error;
    }
  }

  // Get specific bulk session with file results
  async getSession(sessionId: number): Promise<BulkAnalysisSession> {
    try {
      const response = await fetch(`${API_BASE_URL}/bulk-analysis/sessions/${sessionId}`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch bulk session');
      }

      const result = await response.json();
      return result.session;
    } catch (error) {
      console.error('Get bulk session error:', error);
      throw error;
    }
  }

  // Get file results for a bulk session
  async getFileResults(sessionId: number, limit = 100, offset = 0): Promise<BulkFileResult[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/bulk-analysis/sessions/${sessionId}/files?limit=${limit}&offset=${offset}`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch file results');
      }

      const result = await response.json();
      return result.fileResults;
    } catch (error) {
      console.error('Get file results error:', error);
      throw error;
    }
  }

  // Delete bulk session
  async deleteSession(sessionId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/bulk-analysis/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete bulk session');
      }
    } catch (error) {
      console.error('Delete bulk session error:', error);
      throw error;
    }
  }

  // Get bulk analysis statistics
  async getStats(days = 30): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/bulk-analysis/stats?days=${days}`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch bulk statistics');
      }

      const result = await response.json();
      return result.stats;
    } catch (error) {
      console.error('Get bulk stats error:', error);
      throw error;
    }
  }

  // Export session as Excel
  async exportExcel(sessionId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/bulk-analysis/sessions/${sessionId}/export/excel`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export Excel report');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk_analysis_${sessionId}_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export Excel error:', error);
      throw error;
    }
  }

  // Export session as PDF
  async exportPDF(sessionId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/bulk-analysis/sessions/${sessionId}/export/pdf`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export PDF report');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk_analysis_${sessionId}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export PDF error:', error);
      throw error;
    }
  }

  // Export session as ZIP
  async exportZip(sessionId: number, formats: string[] = ['excel', 'pdf']): Promise<void> {
    try {
      const formatsParam = formats.join(',');
      const response = await fetch(`${API_BASE_URL}/bulk-analysis/sessions/${sessionId}/export/zip?formats=${formatsParam}`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export ZIP archive');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk_analysis_${sessionId}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export ZIP error:', error);
      throw error;
    }
  }

  // Download text summary
  async downloadSummary(sessionId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/bulk-analysis/sessions/${sessionId}/summary/download`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download summary');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk_analysis_${sessionId}_summary.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download summary error:', error);
      throw error;
    }
  }

  // Export training data as JSON
  async exportTrainingJSON(sessionId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/bulk-analysis/sessions/${sessionId}/export/training-json`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export training data JSON');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `training_data_${sessionId}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export training JSON error:', error);
      throw error;
    }
  }

  // Export training data as CSV
  async exportTrainingCSV(sessionId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/bulk-analysis/sessions/${sessionId}/export/training-csv`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export training data CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `training_data_${sessionId}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export training CSV error:', error);
      throw error;
    }
  }

  // Export complete training package
  async exportTrainingPackage(sessionId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/bulk-analysis/sessions/${sessionId}/export/training-package`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export training package');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `training_package_${sessionId}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export training package error:', error);
      throw error;
    }
  }
}

export const bulkAnalysisService = new BulkAnalysisAPIService();
