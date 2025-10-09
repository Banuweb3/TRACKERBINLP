import React, { useState } from 'react';
import type { EnhancedAnalysisResult, BulkAnalysisProgress } from '../services/enhancedAnalysisService';
import { CheckCircleIcon, XMarkIcon, LoadingSpinner, AnalyticsIcon, EditIcon } from './icons';
import BulkAnalysisSummary from './BulkAnalysisSummary';
import BulkAnalysisExportMenu from './BulkAnalysisExportMenu';

interface BulkResultsDashboardProps {
  results: EnhancedAnalysisResult[];
  progress: BulkAnalysisProgress[];
  sessionId?: number;
  sessionName?: string;
  onUpdateResult?: (index: number, updatedResult: EnhancedAnalysisResult) => void;
  onExportResults?: () => void;
}

interface EditableField {
  resultIndex: number;
  field: string;
  value: string;
}

const BulkResultsDashboard: React.FC<BulkResultsDashboardProps> = ({
  results,
  progress,
  sessionId,
  sessionName,
  onUpdateResult,
  onExportResults
}) => {
  const [selectedResult, setSelectedResult] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'processing': 
      case 'transcribing':
      case 'translating':
      case 'analyzing': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'error': return <XMarkIcon className="h-5 w-5 text-red-400" />;
      case 'processing':
      case 'transcribing':
      case 'translating':
      case 'analyzing': return <LoadingSpinner className="h-5 w-5 text-blue-400" />;
      default: return <div className="h-5 w-5 bg-gray-400 rounded-full" />;
    }
  };

  // Helper function to get overall agent sentiment from the 4 aspects
  const getOverallAgentSentiment = (agentSentiment: any): string => {
    if (!agentSentiment) return 'NEUTRAL';
    
    // If it's the old format (single sentiment object), return it directly
    if (agentSentiment.sentiment) {
      return agentSentiment.sentiment;
    }
    
    // For new format (4 aspects), calculate overall sentiment
    const aspects = [
      agentSentiment.positive?.sentiment,
      agentSentiment.callOpening?.sentiment,
      agentSentiment.callQuality?.sentiment,
      agentSentiment.callClosing?.sentiment
    ].filter(Boolean);
    
    if (aspects.length === 0) return 'NEUTRAL';
    
    const positiveCount = aspects.filter(s => s === 'POSITIVE').length;
    const negativeCount = aspects.filter(s => s === 'NEGATIVE').length;
    
    if (positiveCount > negativeCount) return 'POSITIVE';
    if (negativeCount > positiveCount) return 'NEGATIVE';
    return 'NEUTRAL';
  };

  const handleFieldEdit = (resultIndex: number, field: string, currentValue: string) => {
    setEditingField({ resultIndex, field, value: currentValue });
  };

  const saveFieldEdit = () => {
    if (!editingField || !onUpdateResult) return;

    const result = results[editingField.resultIndex];
    if (!result) return;

    const updatedResult = { ...result };
    
    // Handle nested field updates
    const fieldParts = editingField.field.split('.');
    let target: any = updatedResult;
    
    for (let i = 0; i < fieldParts.length - 1; i++) {
      target = target[fieldParts[i]];
    }
    
    target[fieldParts[fieldParts.length - 1]] = editingField.value;
    
    onUpdateResult(editingField.resultIndex, updatedResult);
    setEditingField(null);
  };

  const cancelFieldEdit = () => {
    setEditingField(null);
  };

  const toggleResultSelection = (index: number) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedResults(newSelected);
  };

  const selectAllResults = () => {
    setSelectedResults(new Set(results.map((_, index) => index)));
  };

  const clearSelection = () => {
    setSelectedResults(new Set());
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const renderEditableField = (resultIndex: number, field: string, value: string, label: string) => {
    const isEditing = editingField?.resultIndex === resultIndex && editingField?.field === field;
    
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-light/80">{label}:</span>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editingField.value}
                onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                className="px-2 py-1 bg-black/30 border border-white/30 rounded text-sm text-text-light"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveFieldEdit();
                  if (e.key === 'Escape') cancelFieldEdit();
                }}
                autoFocus
              />
              <button
                onClick={saveFieldEdit}
                className="p-1 text-green-400 hover:bg-green-400/20 rounded"
              >
                <CheckCircleIcon className="h-4 w-4" />
              </button>
              <button
                onClick={cancelFieldEdit}
                className="p-1 text-red-400 hover:bg-red-400/20 rounded"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-text-light">{value}</span>
              {onUpdateResult && (
                <button
                  onClick={() => handleFieldEdit(resultIndex, field, value)}
                  className="p-1 text-text-light/60 hover:text-text-light hover:bg-white/20 rounded"
                >
                  <EditIcon className="h-3 w-3" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      {results.length > 0 && (
        <BulkAnalysisSummary 
          results={results} 
          totalFiles={progress.length} 
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-light">Individual File Results</h2>
          <p className="text-text-light/70">
            {results.length} files processed • {progress.filter(p => p.status === 'completed').length} completed
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {results.length > 0 && (
            <>
              <button
                onClick={() => setBulkEditMode(!bulkEditMode)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  bulkEditMode 
                    ? 'bg-primary text-text-light' 
                    : 'bg-white/10 text-text-light hover:bg-white/20'
                }`}
              >
                Bulk Edit
              </button>
              {sessionId && sessionName && (
                <BulkAnalysisExportMenu
                  sessionId={sessionId}
                  sessionName={sessionName}
                  onExportStart={() => console.log('Export started')}
                  onExportComplete={() => console.log('Export completed')}
                  onExportError={(error) => console.error('Export error:', error)}
                />
              )}
              {onExportResults && (
                <button
                  onClick={onExportResults}
                  className="px-4 py-2 bg-white/10 text-text-light rounded-lg hover:bg-white/20 transition-colors"
                >
                  Legacy Export
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bulk Edit Controls */}
      {bulkEditMode && (
        <div className="glass-dark p-4 rounded-xl border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-light">Bulk Edit Mode</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={selectAllResults}
                className="px-3 py-1 text-sm bg-white/10 text-text-light rounded hover:bg-white/20"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm bg-white/10 text-text-light rounded hover:bg-white/20"
              >
                Clear
              </button>
            </div>
          </div>
          <p className="text-sm text-text-light/70">
            Selected: {selectedResults.size} files
          </p>
        </div>
      )}

      {/* Progress List */}
      <div className="grid gap-4">
        {progress.map((item, index) => {
          const result = results[index];
          const isSelected = selectedResults.has(index);
          
          return (
            <div
              key={item.fileId}
              className={`glass-dark p-6 rounded-xl border transition-all cursor-pointer ${
                isSelected 
                  ? 'border-primary bg-primary/10' 
                  : selectedResult === index
                  ? 'border-white/40'
                  : 'border-white/20 hover:border-white/30'
              }`}
              onClick={() => {
                if (bulkEditMode) {
                  toggleResultSelection(index);
                } else {
                  setSelectedResult(selectedResult === index ? null : index);
                }
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {bulkEditMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleResultSelection(index)}
                      className="rounded border-white/30"
                    />
                  )}
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      !item?.status ? 'bg-gray-400' :
                      item.status === 'completed' ? 'bg-green-400' :
                      item.status === 'error' ? 'bg-red-400' :
                      ['processing', 'transcribing', 'translating', 'analyzing'].includes(item.status) ? 'bg-blue-400 animate-pulse' :
                      'bg-gray-400'
                    }`} />
                    <div>
                      <h3 className="text-lg font-semibold text-text-light truncate">
                        {item.fileName} {index > 0 && `(${index + 1})`}
                      </h3>
                      {item.status === 'error' && item.error && (
                        <span className="text-xs text-red-400">• {item.error}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {result && (
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-text-light/70">Overall Score</div>
                      <div className={`text-lg font-bold ${getScoreColor(result.overallCoachingScore)}`}>
                        {result.overallCoachingScore}/10
                      </div>
                    </div>
                    <AnalyticsIcon className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-black/30 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>

                  {/* Detailed Results - Show Full Summary Text */}
              {selectedResult === index && result && (
                <div className="mt-6 space-y-6 border-t border-white/20 pt-6">
                  {/* Audio Summary Text */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-text-light flex items-center">
                      📝 Audio Summary
                    </h4>
                    <div className="bg-gradient-to-r from-white/5 to-white/10 p-6 rounded-xl border border-white/10">
                      <div className="prose prose-invert max-w-none">
                        <p className="text-text-light leading-relaxed text-base whitespace-pre-wrap">
                          {result.summary || 'No summary available for this audio file.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Transcription (if available) */}
                  {result.transcription && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-text-light flex items-center">
                        🎤 Transcription
                      </h4>
                      <div className="bg-white/5 p-6 rounded-xl border border-white/10 max-h-64 overflow-y-auto">
                        <p className="text-text-light/90 leading-relaxed text-sm whitespace-pre-wrap">
                          {result.transcription}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Translation (if different from transcription) */}
                  {result.translation && result.translation !== result.transcription && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-text-light flex items-center">
                        🌐 Translation
                      </h4>
                      <div className="bg-white/5 p-6 rounded-xl border border-white/10 max-h-64 overflow-y-auto">
                        <p className="text-text-light/90 leading-relaxed text-sm whitespace-pre-wrap">
                          {result.translation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Key Metrics */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <h5 className="font-semibold text-text-light mb-3">📊 Quality Scores</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-text-light/80">Overall Score:</span>
                          <span className={`font-bold ${
                            result.overallCoachingScore >= 8 ? 'text-green-400' :
                            result.overallCoachingScore >= 6 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {result.overallCoachingScore}/10
                          </span>
                        </div>
                        {result.callOpening && (
                          <div className="flex justify-between items-center">
                            <span className="text-text-light/80">Call Opening:</span>
                            <span className="font-medium text-text-light">
                              {result.callOpening.overallScore}/10
                            </span>
                          </div>
                        )}
                        {result.callClosing && (
                          <div className="flex justify-between items-center">
                            <span className="text-text-light/80">Call Closing:</span>
                            <span className="font-medium text-text-light">
                              {result.callClosing.overallScore}/10
                            </span>
                          </div>
                        )}
                        {result.speakingQuality && (
                          <div className="flex justify-between items-center">
                            <span className="text-text-light/80">Speaking Quality:</span>
                            <span className="font-medium text-text-light">
                              {result.speakingQuality.overallScore}/10
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <h5 className="font-semibold text-text-light mb-3">😊 Sentiment Analysis</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-text-light/80">Customer:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result.customerSentiment?.sentiment === 'POSITIVE' ? 'bg-green-500/20 text-green-400' :
                            result.customerSentiment?.sentiment === 'NEGATIVE' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {result.customerSentiment?.sentiment || 'N/A'}
                          </span>
                        </div>
                        {result.agentSentiment && (
                          <div className="flex justify-between items-center">
                            <span className="text-text-light/80">Agent:</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              getOverallAgentSentiment(result.agentSentiment) === 'POSITIVE' ? 'bg-green-500/20 text-green-400' :
                              getOverallAgentSentiment(result.agentSentiment) === 'NEGATIVE' ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {getOverallAgentSentiment(result.agentSentiment)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coaching Feedback */}
                  {result.agentCoaching && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-text-light flex items-center">
                        🎯 Coaching Feedback
                      </h4>
                      <div className="bg-gradient-to-r from-accent/10 to-accent/5 p-6 rounded-xl border border-accent/20">
                        <p className="text-text-light leading-relaxed whitespace-pre-wrap">
                          {result.agentCoaching}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Keywords */}
                  {result.keywords && result.keywords.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-text-light flex items-center">
                        🔑 Key Topics
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.keywords.map((keyword, keywordIndex) => (
                          <span
                            key={keywordIndex}
                            className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full border border-primary/30 hover:bg-primary/30 transition-colors"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance Rating */}
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-xl border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-semibold text-text-light">Overall Performance</h5>
                        <p className="text-text-light/70 text-sm">Based on comprehensive analysis</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          result.overallCoachingScore >= 8 ? 'text-green-400' :
                          result.overallCoachingScore >= 6 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {result.overallCoachingScore >= 8 ? '🌟 Excellent' : 
                           result.overallCoachingScore >= 6 ? '👍 Good' : 
                           '⚠️ Needs Improvement'}
                        </div>
                        <div className="text-text-light/80 text-sm">
                          Score: {result.overallCoachingScore}/10
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {progress.length === 0 && (
        <div className="text-center py-12">
          <AnalyticsIcon className="h-16 w-16 text-text-light/40 mx-auto mb-4" />
          <p className="text-text-light/60">No analysis results yet. Upload audio files to get started.</p>
        </div>
      )}
    </div>
  );
};

export default BulkResultsDashboard;
