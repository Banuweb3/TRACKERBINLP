import React from 'react';
import type { AnalysisData } from '../types';
import AnalysisCard from './AnalysisCard';
import SentimentVisualizer from './SentimentVisualizer';
import KeywordList from './KeywordList';
import { InfoIcon, LoadingSpinner, CheckCircleIcon } from './icons';
import TranscriptionCard from './TranscriptionCard';

interface DashboardProps {
  data: AnalysisData | null;
  isLoading: boolean;
  error: string | null;
  analysisStarted: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ data, isLoading, error, analysisStarted }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] glass-dark rounded-2xl shadow-xl border border-white/20">
        <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent opacity-20 animate-ping"></div>
              <LoadingSpinner className="h-16 w-16 mx-auto text-text-light relative z-10" />
            </div>
            <p className="mt-6 text-xl font-semibold text-text-light drop-shadow-lg">Performing analysis...</p>
            <p className="text-sm text-text-light/90 mt-2 drop-shadow">This may take a few moments.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center justify-center h-full min-h-[400px] glass-dark rounded-2xl shadow-xl border border-red-400/20 p-6">
            <div className="text-center">
                <div className="p-4 bg-red-500/20 rounded-full inline-block mb-4 border border-red-400/30">
                  <svg className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-red-400 drop-shadow-lg">Analysis Failed</p>
                <p className="mt-3 text-sm text-text-light/90 bg-red-500/10 p-3 rounded-lg border border-red-400/20 drop-shadow">{error}</p>
            </div>
      </div>
    );
  }

  if (!analysisStarted) {
    return (
        <div className="flex items-center justify-center h-full min-h-[400px] glass-dark rounded-2xl shadow-xl border-2 border-dashed border-white/30 p-6">
            <div className="text-center">
                <div className="floating-animation">
                  <div className="p-6 bg-white/15 rounded-full inline-block border border-white/20">
                    <InfoIcon className="h-16 w-16 mx-auto text-text-light/80"/>
                  </div>
                </div>
                <p className="mt-6 text-xl font-semibold text-text-light drop-shadow-lg">Ready for Analysis</p>
                <p className="mt-2 text-sm text-text-light/90 drop-shadow">Record or upload an audio file to begin.</p>
            </div>
        </div>
    );
  }
  
  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Transcription and Translation - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TranscriptionCard title="📝 Full Transcription (Source Language)" text={data.transcription} />
        <TranscriptionCard 
          title="🌐 Translation (English)" 
          text={data.translation || 'Translation not available'} 
        />
      </div>

      {/* Analysis Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <AnalysisCard title="Sentiment Analysis">
              <SentimentVisualizer analysis={data.analysis} />
          </AnalysisCard>
          
          <AnalysisCard title="Detected Keywords & Phrases">
              <KeywordList keywords={data.keywords} />
          </AnalysisCard>

          <AnalysisCard title="Agent Coaching">
              <div className="space-y-3">
                  <p className="text-sm font-medium text-text-light flex items-center drop-shadow">
                      <CheckCircleIcon className="h-5 w-5 mr-2 text-green-400" />
                      Actionable Feedback
                  </p>
                  <p className="text-sm p-4 rounded-xl bg-black/20 backdrop-blur-sm text-text-light/95 whitespace-pre-wrap border border-white/20 drop-shadow">
                      {data.analysis.agentCoaching}
                  </p>
              </div>
          </AnalysisCard>
        </div>
        
        {/* Sidebar with summary */}
        <div className="lg:col-span-1 space-y-6">
          <AnalysisCard title="Call Summary">
            <p className="text-sm text-text-light/95 whitespace-pre-wrap leading-relaxed drop-shadow">{data.analysis.summary}</p>
          </AnalysisCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// Add a simple fade-in animation
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
`;
document.head.appendChild(style);