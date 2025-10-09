export type Language = 'en' | 'ta' | 'kn' | 'ml' | 'hi';

export interface LanguageOption {
  value: Language;
  label: string;
}

export interface SentimentDetails {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;
  justification: string;
}

export interface AgentSentimentDetails {
  positive: SentimentDetails;
  callOpening: SentimentDetails;
  callQuality: SentimentDetails;
  callClosing: SentimentDetails;
}

export interface ComprehensiveAnalysisResult {
  customerSentiment: SentimentDetails;
  agentSentiment: AgentSentimentDetails;
  summary: string;
  agentCoaching: string;
}

export interface KeywordsResult {
  keywords: string[];
}

export interface AnalysisData {
  transcription: string;
  translation: string;
  analysis: ComprehensiveAnalysisResult;
  keywords: string[];
}