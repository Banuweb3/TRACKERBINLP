import React from 'react';
import SimplePerformanceReport from './SimplePerformanceReport';

const SimpleReportExample: React.FC = () => {
  // Your exact JSON data
  const performanceData = {
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
        <SimplePerformanceReport data={performanceData} />
        
        {/* Show the structure breakdown */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Report Structure</h2>
          
          <div className="space-y-3 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <strong>Overall Assessment: 7/10 ✅ GOOD</strong>
              <p>Based on comprehensive evaluation across all call aspects</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border-l-4 border-green-500 pl-3 py-2 bg-green-50">
                <strong>Positive Attitude: 8/10</strong>
                <p className="text-xs mt-1">Agent maintains polite and helpful tone...</p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50">
                <strong>Call Opening: 7/10</strong>
                <p className="text-xs mt-1">Opening is clear and polite...</p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-3 py-2 bg-purple-50">
                <strong>Call Quality: 5/10</strong>
                <p className="text-xs mt-1">Demonstrates product knowledge but struggles...</p>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-3 py-2 bg-orange-50">
                <strong>Call Closing: 6/10</strong>
                <p className="text-xs mt-1">Confirms information and outlines next steps...</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <strong>Performance Summary</strong>
              <div className="flex justify-between mt-2">
                <span>Attitude: 8</span>
                <span>Opening: 7</span>
                <span>Quality: 5</span>
                <span>Closing: 6</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleReportExample;
