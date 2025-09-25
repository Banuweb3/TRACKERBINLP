import React, { useState, useRef, useEffect } from 'react';
import type { Language, LanguageOption } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { LanguageIcon, LoadingSpinner, MicIcon, StopIcon, UploadIcon, FileIcon, AnalyticsIcon, XMarkIcon } from './icons';

interface InputControlProps {
  selectedLanguage: Language;
  setSelectedLanguage: (language: Language) => void;
  onAnalyze: (audioBlob: Blob, fileName?: string) => void;
  isLoading: boolean;
  requireAuth?: boolean;
}

type InputType = 'record' | 'upload';

const InputControl: React.FC<InputControlProps> = ({
  selectedLanguage,
  setSelectedLanguage,
  onAnalyze,
  isLoading,
  requireAuth = false,
}) => {
  const [inputType, setInputType] = useState<InputType>('record');
  
  // Recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  // Uploader state
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup timer on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onAnalyze(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access was denied. Please allow microphone access in your browser settings to use this feature.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleClearFile = () => {
    setFile(null);
  }

  const handleAnalyzeFile = () => {
    if (file) {
      onAnalyze(file, file.name);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  
  return (
    <div className="glass-dark p-6 rounded-2xl shadow-xl border border-white/20 space-y-6 h-full flex flex-col justify-between card-hover">
      <div>
        <h2 className="text-xl font-bold text-text-light mb-2 drop-shadow-lg">Analysis Setup</h2>
        <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
        
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
              className="block w-full pl-10 pr-3 py-3 text-base bg-black/20 backdrop-blur-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/70 sm:text-sm rounded-xl text-text-light transition-all duration-200 shadow-lg"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as Language)}
              disabled={isRecording || isLoading}
            >
              {SUPPORTED_LANGUAGES.map((lang: LanguageOption) => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <div className="p-1 bg-black/20 backdrop-blur-sm rounded-xl flex space-x-1 border border-white/20">
            <button
              onClick={() => setInputType('record')}
              disabled={isLoading}
              className={`w-full py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${inputType === 'record' ? 'bg-white/25 text-text-light shadow-lg backdrop-blur-sm border border-white/30' : 'text-text-light/80 hover:text-text-light hover:bg-white/15'} disabled:text-text-light/40 disabled:cursor-not-allowed`}
            >
              Record Audio
            </button>
            <button
              onClick={() => setInputType('upload')}
              disabled={isLoading}
              className={`w-full py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${inputType === 'upload' ? 'bg-white/25 text-text-light shadow-lg backdrop-blur-sm border border-white/30' : 'text-text-light/80 hover:text-text-light hover:bg-white/15'} disabled:text-text-light/40 disabled:cursor-not-allowed`}
            >
              Upload File
            </button>
          </div>
          <div className="mt-4 p-6 bg-black/10 backdrop-blur-sm border border-white/20 rounded-xl min-h-[170px] flex flex-col justify-center items-center">
            {inputType === 'record' && (
              <div className="w-full text-center">
                {isRecording ? (
                  <>  
                    <div className="relative inline-flex items-center justify-center">
                      <span className="absolute h-20 w-20 bg-red-400/30 rounded-full animate-ping"></span>
                      <div className="relative z-10 p-4 bg-red-500/20 rounded-full backdrop-blur-sm">
                        <MicIcon className="h-10 w-10 text-red-400" />
                      </div>
                    </div>
                    <p className="mt-4 text-2xl font-mono text-text-light font-bold drop-shadow-lg">{formatTime(recordingTime)}</p>
                    <p className="text-sm text-text-light/90 drop-shadow">Recording...</p>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-white/15 rounded-full backdrop-blur-sm border border-white/20">
                      <MicIcon className="h-10 w-10 text-text-light/80" />
                    </div>
                    <p className="mt-4 text-sm text-text-light/90 drop-shadow">Click the button below to start recording.</p>
                  </>
                )}
              </div>
            )}
            {inputType === 'upload' && !file && (
              <label htmlFor="file-upload" className="relative cursor-pointer w-full flex flex-col items-center justify-center p-6 border-2 border-white/30 border-dashed rounded-xl hover:bg-white/10 transition-all duration-200">
                <div className="p-4 bg-white/15 rounded-full backdrop-blur-sm border border-white/20">
                  <UploadIcon className="h-10 w-10 text-text-light/80" />
                </div>
                <span className="mt-4 text-sm text-text-light/90 text-center drop-shadow">
                  Drag & drop or <span className="font-semibold text-text-light">browse files</span>
                </span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="audio/*" disabled={isLoading} />
              </label>
            )}
            {inputType === 'upload' && file && (
              <div className="w-full text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="p-3 bg-primary/30 rounded-full inline-block border border-primary/40">
                  <FileIcon className="h-10 w-10 text-primary mx-auto" />
                </div>
                <div className="mt-3 flex items-center text-sm text-text-light">
                  <span className="truncate flex-grow text-left drop-shadow" title={file.name}>{file.name}</span>
                  <button onClick={handleClearFile} className="ml-2 p-1.5 rounded-full hover:bg-white/15 transition-colors border border-white/20" disabled={isLoading}>
                    <XMarkIcon className="h-4 w-4 text-text-light/80"/>
                  </button>
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
        
        {inputType === 'record' && (
            isRecording ? (
              <button
                onClick={stopRecording}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-4 px-6 rounded-xl shadow-lg text-sm font-semibold text-text-light bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/50 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 border border-red-400/30"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="h-5 w-5 mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <StopIcon className="h-5 w-5 mr-2" />
                    Stop & Analyze
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-4 px-6 rounded-xl shadow-lg text-sm font-semibold text-text-light bg-gradient-to-r from-primary to-accent hover:from-primary-focus hover:to-accent focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 border border-primary/30"
              >
                <MicIcon className="h-5 w-5 mr-2" />
                Start Recording
              </button>
            )
        )}
        {inputType === 'upload' && (
          <button
            onClick={handleAnalyzeFile}
            disabled={!file || isLoading}
            className="w-full flex justify-center items-center py-4 px-6 rounded-xl shadow-lg text-sm font-semibold text-text-light bg-gradient-to-r from-primary to-accent hover:from-primary-focus hover:to-accent focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 border border-primary/30"
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="h-5 w-5 mr-2" />
                Analyzing File...
              </>
            ) : (
              <>
                <AnalyticsIcon className="h-5 w-5 mr-2" />
                Analyze File
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default InputControl;