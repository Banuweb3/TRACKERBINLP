import React from 'react';

interface PerformanceData {
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

interface SimplePerformanceReportProps {
  data: PerformanceData;
}

const SimplePerformanceReport: React.FC<SimplePerformanceReportProps> = ({ data }) => {
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

  const overallScore = calculateOverallScore();

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Agent Performance Report</h1>
        <p className="text-gray-600">Professional evaluation with 1-10 scoring system</p>
      </div>

      {/* Overall Performance */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 text-center">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">Overall Assessment</h2>
        <div className="text-3xl font-bold text-blue-600 mb-2">{overallScore}/10</div>
        <div className="text-lg text-green-600 font-semibold">✅ GOOD</div>
        <p className="text-gray-700 mt-2">Based on comprehensive evaluation across all call aspects</p>
      </div>

      {/* Performance Categories */}
      <div className="space-y-4">
        {/* Positive Attitude */}
        <div className="border-l-4 border-green-500 pl-4 py-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">Positive Attitude</h3>
            <span className="text-xl font-bold text-green-600">{convertScore(data.positive.score)}/10</span>
          </div>
          <p className="text-gray-700 text-sm">{data.positive.justification}</p>
        </div>

        {/* Call Opening */}
        <div className="border-l-4 border-blue-500 pl-4 py-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">Call Opening</h3>
            <span className="text-xl font-bold text-blue-600">{convertScore(data.callOpening.score)}/10</span>
          </div>
          <p className="text-gray-700 text-sm">{data.callOpening.justification}</p>
        </div>

        {/* Call Quality */}
        <div className="border-l-4 border-purple-500 pl-4 py-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">Call Quality</h3>
            <span className="text-xl font-bold text-purple-600">{convertScore(data.callQuality.score)}/10</span>
          </div>
          <p className="text-gray-700 text-sm">{data.callQuality.justification}</p>
        </div>

        {/* Call Closing */}
        <div className="border-l-4 border-orange-500 pl-4 py-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">Call Closing</h3>
            <span className="text-xl font-bold text-orange-600">{convertScore(data.callClosing.score)}/10</span>
          </div>
          <p className="text-gray-700 text-sm">{data.callClosing.justification}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Performance Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">{convertScore(data.positive.score)}</div>
            <div className="text-xs text-gray-600">Attitude</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{convertScore(data.callOpening.score)}</div>
            <div className="text-xs text-gray-600">Opening</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">{convertScore(data.callQuality.score)}</div>
            <div className="text-xs text-gray-600">Quality</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">{convertScore(data.callClosing.score)}</div>
            <div className="text-xs text-gray-600">Closing</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplePerformanceReport;
