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
console.log('🔗 Analysis API Base URL:', API_BASE_URL);

export interface AnalysisSession {
  id: number;
  userId: number;
  sessionName: string;
  sourceLanguage: string;
  audioFileName?: string;
  audioFileSize?: number;
  createdAt: string;
  updatedAt: string;
  analysisResults?: AnalysisResult;
}

export interface AnalysisResult {
  id: number;
  sessionId: number;
  transcription: string;
  translation: string;
  analysis: {
    summary: string;
    agentCoaching: string;
    customerSentiment: {
      sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
      score: number;
      justification: string;
    };
    agentSentiment: {
      sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
      score: number;
      justification: string;
    };
  };
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionData {
  sessionName?: string;
  sourceLanguage: string;
  audioFileName?: string;
  audioFileSize?: number;
  parentSessionId?: number;
}

export interface StoreResultsData {
  transcription: string;
  translation: string;
  analysis: {
    summary: string;
    agentCoaching: string;
    customerSentiment: {
      sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
      score: number;
      justification: string;
    };
    agentSentiment: {
      sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
      score: number;
      justification: string;
    };
  };
  keywords: string[];
  enhancedAnalysis?: any;
  bulkSummary?: any;
}

export class AnalysisService {
  private baseUrl = API_BASE_URL;

  // Check if analysis exists for similar audio file
  async checkExistingAnalysis(audioFileName: string, fileSize: number): Promise<AnalysisSession | null> {
    try {
      const response = await fetch(`${this.baseUrl}/analysis/sessions/check?fileName=${encodeURIComponent(audioFileName)}&fileSize=${fileSize}`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        return null; // No existing analysis found
      }

      const result = await response.json();
      return result.session || null;
    } catch (error) {
      console.error('Check existing analysis error:', error);
      return null;
    }
  }

  // Create new analysis session
  async createSession(data: CreateSessionData): Promise<AnalysisSession> {
    try {
      const headers = await authService.getValidAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/analysis/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();

        // Handle token expiration specifically
        if (response.status === 401 && error.error === 'Token expired') {
          throw new Error('Token expired');
        }

        throw new Error(error.error || 'Failed to create session');
      }

      const result = await response.json();
      return result; // Backend sends session data directly, not wrapped in 'session' property
    } catch (error) {
      console.error('Create session error:', error);

      // If token expired, throw specific error
      if (error instanceof Error && error.message === 'Token expired') {
        throw error;
      }

      throw error;
    }
  }

  // Store analysis results
  async storeResults(sessionId: number, data: StoreResultsData): Promise<AnalysisResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/sessions/${sessionId}/results`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to store results');
      }

      const result = await response.json();
      return result.result;
    } catch (error) {
      console.error('Store results error:', error);
      throw error;
    }
  }

  // Get user's analysis sessions
  async getSessions(limit = 50, offset = 0): Promise<AnalysisSession[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/sessions?limit=${limit}&offset=${offset}`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch sessions');
      }

      const result = await response.json();
      return result.sessions;
    } catch (error) {
      console.error('Get sessions error:', error);
      throw error;
    }
  }

  // Get specific session with results
  async getSession(sessionId: number): Promise<AnalysisSession> {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/sessions/${sessionId}`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch session');
      }

      const result = await response.json();
      return result.session;
    } catch (error) {
      console.error('Get session error:', error);
      throw error;
    }
  }

  // Update session name
  async updateSessionName(sessionId: number, sessionName: string): Promise<AnalysisSession> {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/sessions/${sessionId}`, {
        method: 'PUT',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({ sessionName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update session');
      }

      const result = await response.json();
      return result.session;
    } catch (error) {
      console.error('Update session error:', error);
      throw error;
    }
  }

  // Delete session
  async deleteSession(sessionId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Delete session error:', error);
      throw error;
    }
  }

  // Get recent analysis results
  async getRecentResults(limit = 10): Promise<AnalysisResult[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/results/recent?limit=${limit}`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch recent results');
      }

      const result = await response.json();
      return result.results;
    } catch (error) {
      console.error('Get recent results error:', error);
      throw error;
    }
  }

  // Search analysis results
  async searchResults(searchTerm: string, limit = 20): Promise<AnalysisResult[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/results/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search results');
      }

      const result = await response.json();
      return result.results;
    } catch (error) {
      console.error('Search results error:', error);
      throw error;
    }
  }

  // Get user statistics
  async getStats(days = 30): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/stats?days=${days}`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch statistics');
      }

      const result = await response.json();
      return result.stats;
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  }
}

export const analysisService = new AnalysisService();

