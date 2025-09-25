import React from 'react';

interface AgentSentimentData {
  positive: {
    sentiment: string;
    score: number;
    justification: string;
  };
  callOpening: {
    sentiment: string;
    score: number;
    justification: string;
  };
  callQuality: {
    sentiment: string;
    score: number;
    justification: string;
  };
  callClosing: {
    sentiment: string;
    score: number;
    justification: string;
  };
}

interface AgentPerformanceReportProps {
  data: AgentSentimentData;
}

const AgentPerformanceReport: React.FC<AgentPerformanceReportProps> = ({ data }) => {
  // Convert -1 to +1 scale to 1-10 scale
  const convertScore = (score: number): number => {
    return Math.round(((score + 1) / 2) * 9 + 1);
  };

  // Calculate overall score
  const calculateOverallScore = (): number => {
    const scores = [
      convertScore(data.positive.score),
      convertScore(data.callOpening.score),
      convertScore(data.callQuality.score),
      convertScore(data.callClosing.score)
    ];
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  const getPerformanceIcon = (score: number): string => {
    return score >= 7 ? "✅" : "⚠️";
  };

  const getPerformanceLevel = (score: number): string => {
    if (score >= 8) return "Excellent";
    if (score >= 7) return "Good";
    if (score >= 5) return "Satisfactory";
    return "Needs Improvement";
  };

  const overallScore = calculateOverallScore();

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="border-b-2 border-blue-500 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          📊 Agent Performance Report
        </h1>
        <p className="text-gray-600">Professional Evaluation & Coaching Assessment</p>
      </div>

      {/* Overall Assessment */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6 border border-blue-200">
        <h2 className="text-xl font-semibold text-blue-800 mb-3">
          🎯 Overall Assessment
        </h2>
        <div className="flex items-center gap-4 mb-3">
          <div className="text-3xl font-bold text-blue-600">
            {overallScore}/10
          </div>
          <div className="text-lg text-gray-700">
            {getPerformanceLevel(overallScore)} {getPerformanceIcon(overallScore)}
          </div>
        </div>
        <p className="text-gray-700">
          The agent demonstrates {getPerformanceLevel(overallScore).toLowerCase()} performance 
          with an overall score of {overallScore} out of 10. This evaluation covers four key 
          areas of call handling performance.
        </p>
      </div>

      {/* Individual Categories */}
      <div className="space-y-6">
        {/* Positive Attitude */}
        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            😊 Positive Attitude
          </h3>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-green-600">
              {convertScore(data.positive.score)}/10
            </span>
            <span className="text-gray-600">
              {getPerformanceLevel(convertScore(data.positive.score))} {getPerformanceIcon(convertScore(data.positive.score))}
            </span>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-700 mb-2">
              <strong>Assessment:</strong> {data.positive.justification}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Focus Area:</strong> Maintaining friendly, enthusiastic, and positive demeanor throughout customer interactions.
            </p>
          </div>
        </div>

        {/* Call Opening */}
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            🚀 Call Opening
          </h3>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-blue-600">
              {convertScore(data.callOpening.score)}/10
            </span>
            <span className="text-gray-600">
              {getPerformanceLevel(convertScore(data.callOpening.score))} {getPerformanceIcon(convertScore(data.callOpening.score))}
            </span>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-700 mb-2">
              <strong>Assessment:</strong> {data.callOpening.justification}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Focus Area:</strong> Professional greeting, clear identification, and effective rapport building at call start.
            </p>
          </div>
        </div>

        {/* Call Quality */}
        <div className="border-l-4 border-purple-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            ⭐ Call Quality
          </h3>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-purple-600">
              {convertScore(data.callQuality.score)}/10
            </span>
            <span className="text-gray-600">
              {getPerformanceLevel(convertScore(data.callQuality.score))} {getPerformanceIcon(convertScore(data.callQuality.score))}
            </span>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-700 mb-2">
              <strong>Assessment:</strong> {data.callQuality.justification}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Focus Area:</strong> Problem-solving effectiveness, product knowledge, and communication clarity during the call.
            </p>
          </div>
        </div>

        {/* Call Closing */}
        <div className="border-l-4 border-orange-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            🎯 Call Closing
          </h3>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-orange-600">
              {convertScore(data.callClosing.score)}/10
            </span>
            <span className="text-gray-600">
              {getPerformanceLevel(convertScore(data.callClosing.score))} {getPerformanceIcon(convertScore(data.callClosing.score))}
            </span>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-700 mb-2">
              <strong>Assessment:</strong> {data.callClosing.justification}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Focus Area:</strong> Resolution confirmation, clear next steps, and professional call closure.
            </p>
          </div>
        </div>
      </div>

      {/* Scoring System Explanation */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          📋 Scoring System
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>8-10:</strong> Excellent Performance ✅</p>
            <p><strong>7:</strong> Good Performance ✅</p>
          </div>
          <div>
            <p><strong>5-6:</strong> Satisfactory Performance ⚠️</p>
            <p><strong>1-4:</strong> Needs Improvement ⚠️</p>
          </div>
        </div>
      </div>

      {/* Coaching Tips */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          💡 Coaching Recommendations
        </h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Focus on areas marked with ⚠️ for immediate improvement</li>
          <li>• Maintain strengths in areas marked with ✅</li>
          <li>• Regular practice sessions for call opening and closing techniques</li>
          <li>• Product knowledge training for better call quality</li>
        </ul>
      </div>
    </div>
  );
};

export default AgentPerformanceReport;
