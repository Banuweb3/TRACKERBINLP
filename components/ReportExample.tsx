import React from 'react';
import AgentPerformanceReport from './AgentPerformanceReport';

const ReportExample: React.FC = () => {
  // Your JSON data example
  const sampleData = {
    "positive": {
      "sentiment": "POSITIVE",
      "score": 0.8,
      "justification": "The agent maintains a polite and helpful tone throughout the call, repeatedly using phrases like \"sir\" and \"no worries.\" They show patience in explaining the app and addressing the customer's questions."
    },
    "callOpening": {
      "sentiment": "POSITIVE", 
      "score": 0.7,
      "justification": "The agent's opening is clear and polite, identifying themselves and the purpose of the call. However, the initial confusion about names could have been handled more smoothly."
    },
    "callQuality": {
      "sentiment": "NEUTRAL",
      "score": 0.5,
      "justification": "The agent demonstrates product knowledge but struggles with accurately recording the customer's address. The problem-solving regarding the address is adequate but not exceptional."
    },
    "callClosing": {
      "sentiment": "POSITIVE",
      "score": 0.6,
      "justification": "The agent confirms the updated information and outlines the next steps, ending the call politely. However, ensuring the customer fully understands what they will receive could be clearer."
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Agent Performance Report Example
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This shows how your JSON data gets converted into a professional, 
            easy-to-read report with 1-10 scoring system.
          </p>
        </div>
        
        <AgentPerformanceReport data={sampleData} />
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📋 How It Works
          </h2>
          <div className="space-y-3 text-gray-700">
            <p><strong>Input:</strong> JSON data with scores from -1 to +1</p>
            <p><strong>Output:</strong> Professional report with 1-10 scoring</p>
            <p><strong>Features:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Converts technical scores to business-friendly 1-10 scale</li>
              <li>Provides clear performance levels (Excellent, Good, Satisfactory, Needs Improvement)</li>
              <li>Uses ✅ for good performance and ⚠️ for areas needing improvement</li>
              <li>Includes detailed justifications and coaching recommendations</li>
              <li>Professional formatting with clear sections and visual hierarchy</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportExample;
