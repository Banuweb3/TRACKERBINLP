import type { Language, ComprehensiveAnalysisResult, KeywordsResult } from '../types';
import { authService } from './authService';

// Automatically detect API base URL
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;

    // For local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api/analysis';
    }

    // For production
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '/api/analysis';
    }
  }

  // Fallback for SSR or other environments
  return ((import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api') + '/analysis';
};

const API_BASE_URL = getApiBaseUrl();
console.log('🔗 Gemini API Base URL:', API_BASE_URL);

/**
 * Make authenticated API request
 */
async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  const token = authService.getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function transcribeAudio(audioBlob: Blob, sourceLanguage: Language): Promise<string> {
    try {
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('sourceLanguage', sourceLanguage);

        const result = await makeAuthenticatedRequest(`${API_BASE_URL}/transcribe`, {
            method: 'POST',
            body: formData,
        });

        return result.transcription;
    } catch (error) {
        console.error("Error during audio transcription:", error);
        throw new Error("Failed to transcribe audio.");
    }
}


export async function translateText(text: string, sourceLanguage: Language): Promise<string> {
    try {
        const result = await makeAuthenticatedRequest(`${API_BASE_URL}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                sourceLanguage,
            }),
        });

        return result.translation;
    } catch (error) {
        console.error("Error during translation:", error);
        throw new Error("Failed to translate text.");
    }
}

export async function performComprehensiveAnalysis(text: string): Promise<ComprehensiveAnalysisResult> {
    try {
        const result = await makeAuthenticatedRequest(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
            }),
        });

        return result.analysis;
    } catch (error) {
        console.error("Error during comprehensive analysis:", error);
        throw new Error("Failed to perform comprehensive analysis.");
    }
}


export async function extractKeywords(text: string): Promise<KeywordsResult> {
    try {
        const result = await makeAuthenticatedRequest(`${API_BASE_URL}/keywords`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
            }),
        });

        return result.keywords;
    } catch (error) {
        console.error("Error during keyword extraction:", error);
        throw new Error("Failed to extract keywords.");
    }
}

/**
 * Complete analysis - transcribe, translate, analyze, and extract keywords in one call
 */
export async function performCompleteAnalysis(audioBlob: Blob, sourceLanguage: Language, sessionId: number) {
    try {
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('sourceLanguage', sourceLanguage);
        formData.append('sessionId', sessionId.toString());

        const result = await makeAuthenticatedRequest(`${API_BASE_URL}/complete`, {
            method: 'POST',
            body: formData,
        });

        return {
            transcription: result.transcription,
            translation: result.translation,
            analysis: result.analysis,
            keywords: result.keywords,
            sessionId: result.sessionId,
            resultId: result.resultId,
        };
    } catch (error) {
        console.error("Error during complete analysis:", error);
        throw new Error("Failed to perform complete analysis.");
    }
}