import React, { useState, useTransition } from 'react';
import type { ComprehensiveAnalysisResult } from './types';

const GeminiChat = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<ComprehensiveAnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt) return;

    startTransition(async () => {
      setError('');
      setResponse(null);

      try {
        // Call your own backend API endpoint
        const apiResponse = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: prompt }),
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.error || `API Error: ${apiResponse.statusText}`);
        }

        const result: ComprehensiveAnalysisResult = await apiResponse.json();
        setResponse(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        // The service layer now provides the user-friendly error message.
        setError(errorMessage);
      }
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h2>Trackerbi AI Assistant</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Analyze the sentiment of this call transcript..."
          style={{ width: '100%', minHeight: '80px', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', opacity: isPending ? 0.7 : 1 }}
          disabled={isPending}
        />
        <button type="submit" disabled={isPending || !prompt} style={{ padding: '10px 15px', marginTop: '10px', cursor: 'pointer' }}>
          {isPending ? 'Analyzing...' : 'Submit for Analysis'}
        </button>
      </form>

      {error && <div style={{ color: 'red', marginTop: '15px', border: '1px solid red', padding: '10px' }}>{error}</div>}
      {response && (
        <div style={{ marginTop: '20px', whiteSpace: 'pre-wrap', border: '1px solid #eee', padding: '15px', background: '#f9f9f9' }}>
          <h3>Analysis Results</h3>
          <h4>Summary</h4>
          <p>{response.summary}</p>
          <h4>Agent Coaching</h4>
          <p>{response.agentCoaching}</p>
          {/* You can add more detailed display for sentiment scores here */}
        </div>
      )}
    </div>
  );
};

export default GeminiChat;