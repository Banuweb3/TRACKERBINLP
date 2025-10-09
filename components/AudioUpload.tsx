import React, { useState } from 'react';
import type { Language, LanguageOption } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { LanguageIcon, LoadingSpinner, UploadIcon, FileIcon, AnalyticsIcon, XMarkIcon } from './icons';

interface AudioUploadProps {
  selectedLanguage: Language;
  setSelectedLanguage: (language: Language) => void;
  onAnalyze: (audioBlob: Blob, fileName?: string) => void;
  isLoading: boolean;
  requireAuth?: boolean;
  successMessage?: string;
}

const AudioUpload: React.FC<AudioUploadProps> = ({
  selectedLanguage,
  setSelectedLanguage,
  onAnalyze,
  isLoading,
  requireAuth = false,
  successMessage,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleClearFile = () => {
    setFile(null);
  };

  const handleAnalyzeFile = () => {
    if (file) {
      onAnalyze(file, file.name);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('audio/')) {
        setFile(droppedFile);
      } else {
        alert('Please upload an audio file');
      }
    }
  };
  
  return (
    <div className="glass-dark p-6 rounded-2xl shadow-xl border border-white/20 space-y-6 h-full flex flex-col justify-between card-hover">
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-400/30">
            <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-light drop-shadow-lg">🎵 Audio Upload & Process</h2>
        </div>
        <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
        
        {successMessage && (
          <div className="mt-4 p-4 bg-green-500/20 border border-green-400/30 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-400 text-sm font-medium">
                {successMessage}
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs text-green-300/80">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Click "Dashboard" to view your analysis results</span>
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <label htmlFor="language" className="block text-sm font-medium text-text-light mb-2 drop-shadow">
            Source Language
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LanguageIcon className="h-5 w-5 text-text-light/80" />
            </div>
            <select
              id="language"
              name="language"
              className="block w-full pl-10 pr-3 py-3 text-base bg-black/20 backdrop-blur-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-purple-500/70 sm:text-sm rounded-xl text-text-light transition-all duration-200 shadow-lg"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as Language)}
              disabled={isLoading}
            >
              {SUPPORTED_LANGUAGES.map((lang: LanguageOption) => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-text-light mb-2 drop-shadow">
            Upload Audio File
          </label>
          <div className="p-6 bg-black/10 backdrop-blur-sm border border-white/20 rounded-xl min-h-[200px] flex flex-col justify-center items-center">
            {!file ? (
              <div
                className={`relative cursor-pointer w-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-200 ${
                  dragActive 
                    ? 'border-purple-400/60 bg-purple-500/10' 
                    : 'border-white/30 hover:bg-white/10'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <label htmlFor="audio-upload" className="cursor-pointer w-full flex flex-col items-center">
                  <div className={`p-4 rounded-full backdrop-blur-sm border transition-all duration-200 ${
                    dragActive 
                      ? 'bg-purple-500/25 border-purple-400/40' 
                      : 'bg-white/15 border-white/20'
                  }`}>
                    <UploadIcon className={`h-12 w-12 transition-colors duration-200 ${
                      dragActive ? 'text-purple-400' : 'text-text-light/80'
                    }`} />
                  </div>
                  <span className="mt-4 text-lg text-text-light/90 text-center drop-shadow font-medium">
                    {dragActive ? 'Drop your audio file here' : 'Drag & drop your audio file'}
                  </span>
                  <span className="mt-2 text-sm text-text-light/70 text-center">
                    or <span className="font-semibold text-purple-400">browse files</span>
                  </span>
                  <span className="mt-2 text-xs text-text-light/60 text-center">
                    Supported formats: MP3, WAV, M4A, WEBM, OGG
                  </span>
                </label>
                <input 
                  id="audio-upload" 
                  name="audio-upload" 
                  type="file" 
                  className="sr-only" 
                  onChange={handleFileChange} 
                  accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg" 
                  disabled={isLoading} 
                />
              </div>
            ) : (
              <div className="w-full text-center p-6 bg-gradient-to-r from-purple-500/15 to-pink-500/15 backdrop-blur-sm rounded-xl border border-purple-400/30">
                <div className="p-4 bg-purple-500/30 rounded-full inline-block border border-purple-400/40">
                  <FileIcon className="h-12 w-12 text-purple-400 mx-auto" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-text-light drop-shadow">Ready to Process</h3>
                  <div className="mt-2 flex items-center justify-center text-sm text-text-light/90">
                    <span className="truncate max-w-xs drop-shadow" title={file.name}>{file.name}</span>
                    <button 
                      onClick={handleClearFile} 
                      className="ml-3 p-2 rounded-full hover:bg-white/15 transition-colors border border-white/20" 
                      disabled={isLoading}
                    >
                      <XMarkIcon className="h-4 w-4 text-text-light/80"/>
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-text-light/70">
                    Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        {requireAuth && (
          <div className="mb-4 p-4 bg-amber-500/20 border border-amber-400/30 rounded-xl">
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
        
        <button
          onClick={handleAnalyzeFile}
          disabled={!file || isLoading}
          className="w-full flex justify-center items-center py-4 px-6 rounded-xl shadow-lg text-sm font-semibold text-text-light bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 border border-purple-400/30"
        >
          {isLoading ? (
            <>
              <LoadingSpinner className="h-5 w-5 mr-2" />
              Processing Audio...
            </>
          ) : (
            <>
              <AnalyticsIcon className="h-5 w-5 mr-2" />
              Process Audio File
            </>
          )}
        </button>
        
        {file && !isLoading && (
          <div className="mt-3 p-3 bg-purple-500/10 border border-purple-400/20 rounded-lg">
            <div className="text-xs text-text-light/80 text-center space-y-1">
              <div className="flex items-center justify-center space-x-1">
                <svg className="h-3 w-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Processing includes:</span>
              </div>
              <div className="text-purple-300/80">Transcription → Translation → Analysis → Keywords</div>
              <div className="text-purple-300/80">Results will be saved and viewable in Dashboard</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioUpload;
