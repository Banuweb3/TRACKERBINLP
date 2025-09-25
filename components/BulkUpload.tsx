import React, { useState, useRef, useCallback } from 'react';
import type { Language } from '../types';
import { UploadIcon, XMarkIcon, FileIcon, LoadingSpinner, AnalyticsIcon, TrashIcon } from './icons';

interface BulkUploadProps {
  selectedLanguage: Language;
  onBulkAnalyze: (files: File[]) => void;
  isLoading: boolean;
  requireAuth?: boolean;
}

interface FileWithProgress {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

const BulkUpload: React.FC<BulkUploadProps> = ({
  selectedLanguage,
  onBulkAnalyze,
  isLoading,
  requireAuth = false,
}) => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileWithProgress[] = Array.from(selectedFiles)
      .filter(file => file.type.startsWith('audio/'))
      .map(file => ({
        file,
        id: generateId(),
        progress: 0,
        status: 'pending' as const,
      }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const handleBulkAnalyze = () => {
    if (files.length > 0) {
      const fileList = files.map(f => f.file);
      onBulkAnalyze(fileList);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="glass-dark p-6 rounded-2xl shadow-xl border border-white/20 space-y-6 card-hover">
      <div>
        <h2 className="text-xl font-bold text-text-light mb-2 drop-shadow-lg">Bulk Audio Upload</h2>
        <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
        <p className="text-sm text-text-light/80 mt-2">Upload multiple audio files for batch analysis</p>
      </div>

      {requireAuth && (
        <div className="p-4 bg-amber-500/20 border border-amber-400/30 rounded-xl">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-amber-400 text-sm font-medium">
              Please sign in to save your analysis results
            </p>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
          isDragOver
            ? 'border-primary bg-primary/10'
            : 'border-white/30 hover:border-white/50 hover:bg-white/5'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={isLoading}
        />
        
        <div className="text-center cursor-pointer">
          <div className="p-4 bg-white/15 rounded-full backdrop-blur-sm border border-white/20 inline-block">
            <UploadIcon className="h-12 w-12 text-text-light/80" />
          </div>
          <p className="mt-4 text-lg font-medium text-text-light">
            Drop audio files here or click to browse
          </p>
          <p className="text-sm text-text-light/70 mt-2">
            Supports MP3, WAV, M4A, and other audio formats
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-light">
              Selected Files ({files.length})
            </h3>
            <button
              onClick={clearAllFiles}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="p-2 bg-primary/30 rounded-lg border border-primary/40">
                    <FileIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-light truncate" title={fileItem.file.name}>
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-text-light/70">
                      {formatFileSize(fileItem.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {fileItem.status === 'processing' && (
                    <LoadingSpinner className="h-4 w-4 text-primary" />
                  )}
                  {fileItem.status === 'completed' && (
                    <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {fileItem.status === 'error' && (
                    <div className="h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                      <XMarkIcon className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(fileItem.id)}
                    disabled={isLoading}
                    className="p-1 hover:bg-white/20 rounded transition-colors disabled:opacity-50"
                  >
                    <XMarkIcon className="h-4 w-4 text-text-light/80" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleBulkAnalyze}
            disabled={files.length === 0 || isLoading}
            className="w-full flex justify-center items-center py-4 px-6 rounded-xl shadow-lg text-sm font-semibold text-text-light bg-gradient-to-r from-primary to-accent hover:from-primary-focus hover:to-accent focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 border border-primary/30"
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="h-5 w-5 mr-2" />
                Processing Files...
              </>
            ) : (
              <>
                <AnalyticsIcon className="h-5 w-5 mr-2" />
                Analyze All Files ({files.length})
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
