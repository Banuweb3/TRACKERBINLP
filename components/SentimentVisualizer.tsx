import React from 'react';
import type { ComprehensiveAnalysisResult, SentimentDetails, AgentSentimentDetails } from '../types';
import { SentimentPositiveIcon, SentimentNeutralIcon, SentimentNegativeIcon } from './icons';

interface SentimentVisualizerProps {
  analysis: ComprehensiveAnalysisResult;
}

interface SentimentDisplayProps {
  title: string;
  details: SentimentDetails;
}

const SentimentDisplayUnit: React.FC<SentimentDisplayProps> = ({ title, details }) => {
  const { sentiment: sentimentLabel, score, justification } = details;
  const uniqueId = title.toLowerCase().replace(/\s+/g, '-');

  const sentimentConfig = {
    POSITIVE: {
      bg: 'bg-green-500/10 backdrop-blur-sm border border-green-400/20',
      text: 'text-green-400',
      icon: SentimentPositiveIcon,
      gaugeColor: '#48bb78',
    },
    NEUTRAL: {
      bg: 'bg-slate-500/10 backdrop-blur-sm border border-slate-400/20',
      text: 'text-slate-300',
      icon: SentimentNeutralIcon,
      gaugeColor: '#718096',
    },
    NEGATIVE: {
      bg: 'bg-red-500/10 backdrop-blur-sm border border-red-400/20',
      text: 'text-red-400',
      icon: SentimentNegativeIcon,
      gaugeColor: '#f56565',
    },
  };

  const config = sentimentConfig[sentimentLabel];
  const IconComponent = config.icon;
  const rotation = (score + 1) * 90; // Map score from [-1, 1] to angle [0, 180]

  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div className="flex flex-col items-center space-y-4">
        {/* Header: Icon + Label */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/15 rounded-full border border-white/20">
            <IconComponent className={`h-8 w-8 ${config.text}`} />
          </div>
          <p className={`text-xl font-bold ${config.text} drop-shadow`}>{sentimentLabel}</p>
        </div>

        {/* Gauge Visualizer */}
        <div className="relative w-44 h-24 sm:w-52 sm:h-28">
          <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-lg">
            <defs>
              <linearGradient id={`gaugeGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f56565" />
                <stop offset="50%" stopColor="#ecc94b" />
                <stop offset="100%" stopColor="#48bb78" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/> 
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              stroke={`url(#gaugeGradient-${uniqueId})`}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Needle */}
            <g style={{ transformOrigin: '50px 50px', transform: `rotate(${rotation}deg)`, transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="18"
                  stroke={config.gaugeColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
                <circle cx="50" cy="50" r="5" fill={config.gaugeColor} filter="url(#glow)" />
            </g>
          </svg>
          <div className="absolute bottom-0 w-full text-center">
            <span className={`text-2xl font-bold ${config.text} drop-shadow-lg`}>{score.toFixed(2)}</span>
            <p className="text-xs text-text-light/80 drop-shadow">Score</p>
          </div>
        </div>
      </div>
      
      {/* Justification */}
      <div className="w-full">
        <p className="text-sm font-medium text-text-light mb-2 drop-shadow">Analysis:</p>
        <p className={`text-sm p-4 rounded-xl mt-1 text-left text-text-light/95 ${config.bg} drop-shadow`}>
          {justification}
        </p>
      </div>
    </div>
  );
};


const SentimentVisualizer: React.FC<SentimentVisualizerProps> = ({ analysis }) => {
  return (
    <div className="space-y-8 p-6">
      {/* Customer Sentiment Section */}
      <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm rounded-2xl border border-blue-400/20 p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="p-3 bg-blue-500/20 rounded-full mr-3">
            <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-blue-400">Customer Sentiment</h3>
        </div>
        <div className="flex justify-center">
          <SentimentDisplayUnit title="Customer Experience" details={analysis.customerSentiment} />
        </div>
      </div>

      {/* Agent Sentiment Section */}
      <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm rounded-2xl border border-green-400/20 p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="p-3 bg-green-500/20 rounded-full mr-3">
            <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-green-400">Agent Performance Analysis</h3>
        </div>

        {/* Overall Performance Summary */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-500/10 rounded-full border border-green-400/30">
            <span className="text-sm font-medium text-green-300 mr-2">Overall Performance:</span>
            <span className="text-lg font-bold text-green-400">
              {(() => {
                const aspects = [
                  analysis.agentSentiment.positive?.sentiment,
                  analysis.agentSentiment.callOpening?.sentiment,
                  analysis.agentSentiment.callQuality?.sentiment,
                  analysis.agentSentiment.callClosing?.sentiment
                ].filter(Boolean);

                const positiveCount = aspects.filter(s => s === 'POSITIVE').length;
                const negativeCount = aspects.filter(s => s === 'NEGATIVE').length;

                if (positiveCount > negativeCount) return 'Excellent';
                if (negativeCount > positiveCount) return 'Needs Improvement';
                return 'Good';
              })()}
            </span>
          </div>
        </div>

        {/* Detailed Aspect Analysis */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-xl border border-pink-400/20 p-4">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-pink-500/20 rounded-lg mr-3">
                <svg className="h-5 w-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-pink-400">Positive Attitude</h4>
            </div>
            <SentimentDisplayUnit title="" details={analysis.agentSentiment.positive} />
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl border border-orange-400/20 p-4">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-orange-500/20 rounded-lg mr-3">
                <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-orange-400">Call Opening</h4>
            </div>
            <SentimentDisplayUnit title="" details={analysis.agentSentiment.callOpening} />
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-xl border border-purple-400/20 p-4">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-purple-400">Call Quality</h4>
            </div>
            <SentimentDisplayUnit title="" details={analysis.agentSentiment.callQuality} />
          </div>

          <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl border border-teal-400/20 p-4">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-teal-500/20 rounded-lg mr-3">
                <svg className="h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-teal-400">Call Closing</h4>
            </div>
            <SentimentDisplayUnit title="" details={analysis.agentSentiment.callClosing} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentVisualizer;