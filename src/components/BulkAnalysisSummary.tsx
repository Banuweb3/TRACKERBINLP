import React from 'react';
import type { EnhancedAnalysisResult } from '../services/enhancedAnalysisService';
import { AnalyticsIcon, CheckCircleIcon } from './icons';

interface BulkAnalysisSummaryProps {
  results: EnhancedAnalysisResult[];
  totalFiles: number;
}

const BulkAnalysisSummary: React.FC<BulkAnalysisSummaryProps> = ({
  results,
  totalFiles
}) => {
  if (results.length === 0) {
    return null;
  }

  // Calculate summary statistics
  const completedFiles = results.length;
  const avgOverallScore = results.reduce((sum, r) => sum + r.overallCoachingScore, 0) / completedFiles;
  const avgCallOpeningScore = results.reduce((sum, r) => sum + r.callOpening.overallScore, 0) / completedFiles;
  const avgCallClosingScore = results.reduce((sum, r) => sum + r.callClosing.overallScore, 0) / completedFiles;
  const avgSpeakingQualityScore = results.reduce((sum, r) => sum + r.speakingQuality.overallScore, 0) / completedFiles;

  // Sentiment distribution
  const sentimentCounts = results.reduce((acc, r) => {
    const sentiment = r.customerSentiment.sentiment;
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const positivePercentage = ((sentimentCounts.POSITIVE || 0) / completedFiles) * 100;
  const neutralPercentage = ((sentimentCounts.NEUTRAL || 0) / completedFiles) * 100;
  const negativePercentage = ((sentimentCounts.NEGATIVE || 0) / completedFiles) * 100;

  // Top performing areas
  const scores = [
    { name: 'Call Opening', score: avgCallOpeningScore },
    { name: 'Speaking Quality', score: avgSpeakingQualityScore },
    { name: 'Call Closing', score: avgCallClosingScore }
  ].sort((a, b) => b.score - a.score);

  // Keywords frequency
  const allKeywords = results.flatMap(r => r.keywords || []);
  const keywordFrequency = allKeywords.reduce((acc, keyword) => {
    acc[keyword] = (acc[keyword] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topKeywords = Object.entries(keywordFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 8) return 'from-green-500 to-green-600';
    if (score >= 6) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="glass-dark p-6 rounded-2xl border border-white/20 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary/30 rounded-xl border border-primary/40">
            <AnalyticsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-light">Bulk Analysis Summary</h3>
            <p className="text-text-light/70">
              {completedFiles} of {totalFiles} files processed
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircleIcon className="h-5 w-5 text-green-400" />
          <span className="text-sm text-green-400 font-medium">Analysis Complete</span>
        </div>
      </div>

      {/* Overall Score */}
      <div className="text-center p-6 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl border border-primary/30">
        <div className="text-4xl font-bold text-text-light mb-2">
          {avgOverallScore.toFixed(1)}/10
        </div>
        <div className="text-lg text-text-light/80 mb-4">Average Overall Score</div>
        <div className="w-full bg-black/30 rounded-full h-3">
          <div
            className={`h-3 rounded-full bg-gradient-to-r ${getScoreGradient(avgOverallScore)} transition-all duration-500`}
            style={{ width: `${(avgOverallScore / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scores.map((item, index) => (
          <div key={item.name} className="glass-dark p-4 rounded-xl border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-text-light/80">{item.name}</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${
                index === 0 ? 'bg-green-500/20 text-green-400' :
                index === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                #{index + 1}
              </span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
              {item.score.toFixed(1)}/10
            </div>
            <div className="w-full bg-black/30 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(item.score)}`}
                style={{ width: `${(item.score / 10) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Sentiment Distribution */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-text-light">Customer Sentiment Distribution</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-500/20 rounded-xl border border-green-500/30">
            <div className="text-2xl font-bold text-green-400">{positivePercentage.toFixed(1)}%</div>
            <div className="text-sm text-green-400">Positive</div>
            <div className="text-xs text-text-light/60 mt-1">{sentimentCounts.POSITIVE || 0} calls</div>
          </div>
          <div className="text-center p-4 bg-gray-500/20 rounded-xl border border-gray-500/30">
            <div className="text-2xl font-bold text-gray-400">{neutralPercentage.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Neutral</div>
            <div className="text-xs text-text-light/60 mt-1">{sentimentCounts.NEUTRAL || 0} calls</div>
          </div>
          <div className="text-center p-4 bg-red-500/20 rounded-xl border border-red-500/30">
            <div className="text-2xl font-bold text-red-400">{negativePercentage.toFixed(1)}%</div>
            <div className="text-sm text-red-400">Negative</div>
            <div className="text-xs text-text-light/60 mt-1">{sentimentCounts.NEGATIVE || 0} calls</div>
          </div>
        </div>
      </div>

      {/* Top Keywords */}
      {topKeywords.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-text-light">Most Common Keywords</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {topKeywords.map(([keyword, count], index) => (
              <div
                key={keyword}
                className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20"
              >
                <span className="text-sm text-text-light truncate">{keyword}</span>
                <span className="text-xs bg-primary/30 text-primary px-2 py-1 rounded-full ml-2">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Summary */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-text-light">Overall Call Summary</h4>
        <div className="bg-white/5 p-4 rounded-lg border border-white/20">
          <p className="text-sm text-text-light/90 leading-relaxed">
            <strong>Batch Analysis Summary:</strong> Processed {completedFiles} customer service calls with an average coaching score of {avgOverallScore.toFixed(1)}/10. 
            {positivePercentage > 50 
              ? ` Customer satisfaction is ${positivePercentage > 70 ? 'excellent' : 'good'} with ${positivePercentage.toFixed(0)}% positive sentiment.`
              : ` Customer satisfaction needs attention with only ${positivePercentage.toFixed(0)}% positive sentiment.`
            }
            {' '}The strongest performance area is <strong>{scores[0].name.toLowerCase()}</strong> ({scores[0].score.toFixed(1)}/10), 
            while <strong>{scores[2].name.toLowerCase()}</strong> ({scores[2].score.toFixed(1)}/10) shows room for improvement.
            {topKeywords.length > 0 && ` Common discussion topics include: ${topKeywords.slice(0, 3).map(([keyword]) => keyword).join(', ')}.`}
          </p>
        </div>
      </div>

      {/* Key Insights */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-text-light">Key Insights & Recommendations</h4>
        <div className="space-y-2">
          {avgOverallScore >= 8 && (
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircleIcon className="h-4 w-4" />
              <span className="text-sm">🌟 Excellent overall performance across all calls - maintain current standards</span>
            </div>
          )}
          {positivePercentage > 70 && (
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircleIcon className="h-4 w-4" />
              <span className="text-sm">😊 Strong customer satisfaction with {positivePercentage.toFixed(0)}% positive sentiment</span>
            </div>
          )}
          {scores[0].score - scores[2].score > 2 && (
            <div className="flex items-center space-x-2 text-yellow-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm">⚠️ Focus training on {scores[2].name.toLowerCase()} - significant improvement opportunity</span>
            </div>
          )}
          {negativePercentage > 30 && (
            <div className="flex items-center space-x-2 text-red-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 0v4m0-4h4m-4 0H8" />
              </svg>
              <span className="text-sm">🚨 High negative sentiment ({negativePercentage.toFixed(0)}%) - immediate review of customer service approach needed</span>
            </div>
          )}
          {avgCallOpeningScore < 6 && (
            <div className="flex items-center space-x-2 text-orange-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
              <span className="text-sm">📞 Improve call opening techniques - focus on professional greetings and introductions</span>
            </div>
          )}
          {avgCallClosingScore < 6 && (
            <div className="flex items-center space-x-2 text-orange-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
              <span className="text-sm">🔚 Enhance call closing procedures - ensure proper summaries and follow-up steps</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkAnalysisSummary;
