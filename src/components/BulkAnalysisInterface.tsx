import React, { useState, useCallback } from 'react';
import { bulkAnalysisService } from '../services/bulkAnalysisService';
import { bulkAnalysisService as bulkAnalysisAPI } from '../services/bulkAnalysisAPI';
import type { Language } from '../types';
import type { EnhancedAnalysisResult, BulkAnalysisProgress } from '../services/enhancedAnalysisService';
import BulkResultsDashboard from './BulkResultsDashboard';
import { UploadIcon, LoadingSpinner, AnalyticsIcon, FileIcon } from './icons';

interface BulkAnalysisInterfaceProps {
  onAnalysisComplete?: (results: EnhancedAnalysisResult[]) => void;
}

const BulkAnalysisInterface: React.FC<BulkAnalysisInterfaceProps> = ({
  onAnalysisComplete
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState<Language>('en');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<BulkAnalysisProgress[]>([]);
  const [results, setResults] = useState<EnhancedAnalysisResult[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [sessionName, setSessionName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' }
  ];

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || 
      file.name.toLowerCase().match(/\.(mp3|wav|m4a|ogg|flac|aac)$/)
    );
    
    setSelectedFiles(prev => [...prev, ...audioFiles]);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startBulkAnalysis = async () => {
    if (selectedFiles.length === 0) return;

    setIsAnalyzing(true);
    setProgress([]);
    setResults([]);
    
    const sessionId = `bulk_${Date.now()}`;
    const defaultSessionName = `Bulk Analysis - ${new Date().toLocaleString()}`;
    setSessionName(sessionName || defaultSessionName);

    try {
      const analysisResults = await bulkAnalysisService.processBulkFiles(
        selectedFiles,
        sourceLanguage,
        sessionId,
        (progressUpdate) => {
          setProgress([...progressUpdate]);
        },
        true // Save to database
      );

      setResults(analysisResults);
      onAnalysisComplete?.(analysisResults);
      
      // Get the session ID from the database after creation
      const sessions = await bulkAnalysisAPI.getSessions(1, 0);
      if (sessions.length > 0) {
        setCurrentSessionId(sessions[0].id);
      }
      
    } catch (error) {
      console.error('Bulk analysis failed:', error);
      // Handle error appropriately
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedFiles([]);
    setProgress([]);
    setResults([]);
    setCurrentSessionId(null);
    setSessionName('');
    setIsAnalyzing(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalDuration = () => {
    // Estimate based on file sizes (rough approximation)
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const estimatedMinutes = Math.round(totalSize / (1024 * 1024) * 2); // Rough estimate
    return estimatedMinutes;
  };

  if (results.length > 0 && !isAnalyzing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-light">Bulk Analysis Complete</h2>
            <p className="text-text-light/70">
              {results.length} files processed successfully
            </p>
          </div>
          <button
            onClick={resetAnalysis}
            className="px-4 py-2 bg-primary text-text-light rounded-lg hover:bg-primary/80 transition-colors"
          >
            New Analysis
          </button>
        </div>
        
        <BulkResultsDashboard
          results={results}
          progress={progress}
          sessionId={currentSessionId}
          sessionName={sessionName}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-text-light mb-2">Bulk Audio Analysis</h2>
        <p className="text-text-light/70 max-w-2xl mx-auto">
          Upload multiple audio files to analyze call quality, sentiment, and generate comprehensive reports. 
          All results will be saved and available for download in various formats.
        </p>
      </div>

      {/* File Upload Area */}
      <div className="glass-dark p-8 rounded-xl border border-white/20">
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive 
              ? 'border-primary bg-primary/10' 
              : 'border-white/30 hover:border-white/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <UploadIcon className="h-16 w-16 text-text-light/60 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-light mb-2">
            Drop audio files here or click to browse
          </h3>
          <p className="text-text-light/60 mb-4">
            Supports MP3, WAV, M4A, OGG, FLAC, AAC formats
          </p>
          <input
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="bulk-file-input"
            disabled={isAnalyzing}
          />
          <label
            htmlFor="bulk-file-input"
            className="inline-block px-6 py-3 bg-primary text-text-light rounded-lg hover:bg-primary/80 transition-colors cursor-pointer"
          >
            Select Audio Files
          </label>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="glass-dark p-6 rounded-xl border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-light">
              Selected Files ({selectedFiles.length})
            </h3>
            <div className="text-sm text-text-light/70">
              Total size: {formatFileSize(selectedFiles.reduce((sum, file) => sum + file.size, 0))}
              {getTotalDuration() > 0 && ` • Est. ${getTotalDuration()} min`}
            </div>
          </div>
          
          <div className="grid gap-3 max-h-64 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center space-x-3">
                  <FileIcon className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium text-text-light">{file.name}</div>
                    <div className="text-xs text-text-light/60">
                      {formatFileSize(file.size)} • {file.type || 'Audio file'}
                    </div>
                  </div>
                </div>
                {!isAnalyzing && (
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language Selection */}
      {selectedFiles.length > 0 && (
        <div className="glass-dark p-6 rounded-xl border border-white/20">
          <h3 className="text-lg font-semibold text-text-light mb-4">Analysis Settings</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-light mb-2">
                Source Language
              </label>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value as Language)}
                disabled={isAnalyzing}
                className="w-full px-4 py-2 bg-black/30 border border-white/30 rounded-lg text-text-light focus:border-primary focus:outline-none"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-light mb-2">
                Session Name (Optional)
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                disabled={isAnalyzing}
                placeholder="Auto-generated if empty"
                className="w-full px-4 py-2 bg-black/30 border border-white/30 rounded-lg text-text-light focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Analysis Controls */}
      {selectedFiles.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={startBulkAnalysis}
            disabled={isAnalyzing}
            className="flex items-center space-x-3 px-8 py-4 bg-accent text-text-light rounded-xl hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
          >
            {isAnalyzing ? (
              <>
                <LoadingSpinner className="h-6 w-6" />
                <span>Analyzing {selectedFiles.length} files...</span>
              </>
            ) : (
              <>
                <AnalyticsIcon className="h-6 w-6" />
                <span>Start Bulk Analysis</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress Display */}
      {isAnalyzing && progress.length > 0 && (
        <BulkResultsDashboard
          results={results}
          progress={progress}
          sessionId={currentSessionId}
          sessionName={sessionName}
        />
      )}

      {/* Info Section */}
      {selectedFiles.length === 0 && (
        <div className="glass-dark p-6 rounded-xl border border-white/20">
          <h3 className="text-lg font-semibold text-text-light mb-4">What you'll get:</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <AnalyticsIcon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-text-light mb-2">Comprehensive Analysis</h4>
              <p className="text-sm text-text-light/70">
                Transcription, translation, sentiment analysis, and quality scoring for each file
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileIcon className="h-6 w-6 text-accent" />
              </div>
              <h4 className="font-semibold text-text-light mb-2">Detailed Reports</h4>
              <p className="text-sm text-text-light/70">
                Excel spreadsheets, PDF reports, and summary documents ready for download
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-green-400 font-bold">📊</span>
              </div>
              <h4 className="font-semibold text-text-light mb-2">Batch Insights</h4>
              <p className="text-sm text-text-light/70">
                Aggregated statistics, trends, and recommendations across all files
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkAnalysisInterface;
