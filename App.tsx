import React, { useState, useCallback, useEffect } from 'react';
import type { Language, AnalysisData, ComprehensiveAnalysisResult } from './types';
import { performCompleteAnalysis } from './services/geminiService';
import { authService, type User } from './services/authService';
import { analysisService } from './services/analysisService';
import { bulkAnalysisService } from './services/bulkAnalysisService';
import type { EnhancedAnalysisResult, BulkAnalysisProgress } from './services/enhancedAnalysisService';
import { guardApiResponse, safeProp } from './utils/productionSafety';
import InputControl from './components/InputControl';
import Dashboard from './components/Dashboard';
import BulkUpload from './components/BulkUpload';
import BulkResultsDashboard from './components/BulkResultsDashboard';
import AudioUpload from './components/AudioUpload';
import AuthModal from './components/AuthModal';
import UserMenu from './components/UserMenu';
import DatabaseDashboard from './components/DatabaseDashboard';
import MetaDashboard from './components/MetaDashboard';
import CallingDashboardV2 from './components/CallingDashboardV2';
import ErrorBoundary from './components/ErrorBoundary';
import { Header, Footer } from './components/Layout';

const App: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisStarted, setAnalysisStarted] = useState<boolean>(false);

  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Session management
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // Navigation state
  const [viewMode, setViewMode] = useState<'single' | 'audio' | 'bulk' | 'meta' | 'calling'>('single');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [bulkResults, setBulkResults] = useState<EnhancedAnalysisResult[]>([]);
  const [bulkProgress, setBulkProgress] = useState<BulkAnalysisProgress[]>([]);

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isValid = await authService.verifyToken();
        if (isValid) {
          setUser(authService.getCurrentUser());
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleAnalysis = useCallback(async (audioBlob: Blob, fileName?: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysisStarted(true);
    setAnalysisData(null);

    try {
      // First, check if analysis already exists for this file
      if (fileName) {
        console.log('Checking for existing analysis...');
        const existingSession = await analysisService.checkExistingAnalysis(fileName, audioBlob.size);
        
        if (existingSession && existingSession.analysisResults) {
          console.log('Found existing analysis! Loading from database...');
          setCurrentSessionId(existingSession.id);
          
          // Load existing analysis data
          const analysisData: AnalysisData = {
            transcription: existingSession.analysisResults.transcription || '',
            translation: existingSession.analysisResults.translation || '',
            analysis: (existingSession.analysisResults.analysis as unknown as ComprehensiveAnalysisResult) || {
              customerSentiment: { sentiment: 'NEUTRAL' as const, score: 0, justification: '' },
              agentSentiment: {
                positive: { sentiment: 'NEUTRAL' as const, score: 0, justification: '' },
                callOpening: { sentiment: 'NEUTRAL' as const, score: 0, justification: '' },
                callQuality: { sentiment: 'NEUTRAL' as const, score: 0, justification: '' },
                callClosing: { sentiment: 'NEUTRAL' as const, score: 0, justification: '' }
              },
              summary: '',
              agentCoaching: ''
            },
            keywords: existingSession.analysisResults.keywords || [],
          };
          
          setAnalysisData(analysisData);
          setIsLoading(false);
          return; // Skip new analysis
        }
      }

      console.log('No existing analysis found. Performing new analysis...');
      
      // Create analysis session first
      const session = await analysisService.createSession({
        sessionName: fileName ? `Analysis - ${fileName}` : `Analysis - ${new Date().toLocaleString()}`,
        sourceLanguage: selectedLanguage,
        audioFileName: fileName,
        audioFileSize: audioBlob.size
      });
      
      setCurrentSessionId(session.id);

      // Perform complete analysis (transcribe + translate + analyze + keywords + store)
      const result = await performCompleteAnalysis(audioBlob, selectedLanguage, session.id);

      const analysisData = {
        transcription: result.transcription,
        translation: result.translation,
        analysis: result.analysis,
        keywords: result.keywords,
      };

      setAnalysisData(analysisData);

      // Results are automatically stored by the backend /complete endpoint
      console.log('Analysis completed and stored with result ID:', result.resultId);
      
      // Show success message for audio upload mode
      if (viewMode === 'audio') {
        setSuccessMessage('Analysis completed and saved to your dashboard!');
        setTimeout(() => setSuccessMessage(null), 5000);
      }

    } catch (e) {
      console.error(e);

      // Handle token expiration specifically
      if (e instanceof Error && e.message === 'Token expired') {
        setError('Your session has expired. Please sign in again.');
        setShowAuthModal(true);
        return;
      }

      setError('An error occurred during analysis. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedLanguage, viewMode]);

  const handleBulkAnalysis = useCallback(async (files: File[]) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!files || files.length === 0) {
      setError('No files were provided.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setBulkResults([]);
    setBulkProgress([]);

    try {
      const sessionId = `bulk_${Date.now()}`;
      
      const results = await bulkAnalysisService.processBulkFiles(
        files,
        selectedLanguage,
        sessionId,
        (progress) => {
          setBulkProgress([...progress]);
        },
        true // Save to database
      );

      setBulkResults(results);
    } catch (e) {
      console.error(e);

      // Handle token expiration specifically
      if (e instanceof Error && e.message === 'Token expired') {
        setError('Your session has expired. Please sign in again.');
        setShowAuthModal(true);
        return;
      }

      setError('An error occurred during bulk analysis. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedLanguage, user]);

  const handleUpdateBulkResult = (index: number, updatedResult: EnhancedAnalysisResult) => {
    setBulkResults(prev => {
      const newResults = [...prev];
      newResults[index] = updatedResult;
      return newResults;
    });
  };

  const handleExportResults = () => {
    const dataStr = JSON.stringify(bulkResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk_analysis_results_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAuthSuccess = () => {
    setUser(authService.getCurrentUser());
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    setAnalysisData(null);
    setCurrentSessionId(null);
    setAnalysisStarted(false);
    setBulkResults([]);
    setBulkProgress([]);
    setSuccessMessage(null);
    setViewMode('single');
    setShowHistory(false);
  };

  const handleSelectSession = async (session: any) => {
    try {
      setIsLoading(true);
      const fullSession = await analysisService.getSession(session.id);
      
      if (fullSession.analysisResults) {
        const analysisData: AnalysisData = {
          transcription: fullSession.analysisResults.transcription || '',
          translation: fullSession.analysisResults.translation || '',
          analysis: (fullSession.analysisResults.analysis as unknown as ComprehensiveAnalysisResult) || {
            customerSentiment: { sentiment: 'NEUTRAL' as const, score: 0, justification: '' },
            agentSentiment: {
              positive: { sentiment: 'NEUTRAL' as const, score: 0, justification: '' },
              callOpening: { sentiment: 'NEUTRAL' as const, score: 0, justification: '' },
              callQuality: { sentiment: 'NEUTRAL' as const, score: 0, justification: '' },
              callClosing: { sentiment: 'NEUTRAL' as const, score: 0, justification: '' }
            },
            summary: '',
            agentCoaching: ''
          },
          keywords: fullSession.analysisResults.keywords || []
        };
        setAnalysisData(analysisData);
        setCurrentSessionId(fullSession.id);
        setAnalysisStarted(true);
      }
      setShowHistory(false);
    } catch (error) {
      console.error('Failed to load session:', error);
      setError('Failed to load session data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-dark p-8 rounded-2xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-light text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen font-sans text-text-base">
        <Header>
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <div className="flex items-center bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => {
                    setViewMode('single');
                    setShowHistory(false);
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'single' && !showHistory
                      ? 'bg-primary text-text-light' 
                      : 'text-text-light/80 hover:text-text-light'
                  }`}
                >
                  Single Analysis
                </button>
                <button
                  onClick={() => {
                    setViewMode('audio');
                    setAnalysisData(null);
                    setAnalysisStarted(false);
                    setSuccessMessage(null);
                    setShowHistory(false);
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'audio' && !showHistory
                      ? 'bg-primary text-text-light' 
                      : 'text-text-light/80 hover:text-text-light'
                  }`}
                >
                  Audio Upload
                </button>
                <button
                  onClick={() => {
                    setViewMode('bulk');
                    setShowHistory(false);
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'bulk' && !showHistory
                      ? 'bg-primary text-text-light' 
                      : 'text-text-light/80 hover:text-text-light'
                  }`}
                >
                  Bulk Analysis
                </button>
                <button
                  onClick={() => {
                    setViewMode('meta');
                    setShowHistory(false);
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'meta' && !showHistory
                      ? 'bg-primary text-text-light' 
                      : 'text-text-light/80 hover:text-text-light'
                  }`}
                >
                  Meta Dashboard
                </button>
                <button
                  onClick={() => {
                    setViewMode('calling');
                    setShowHistory(false);
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'calling' && !showHistory
                      ? 'bg-primary text-text-light' 
                      : 'text-text-light/80 hover:text-text-light'
                  }`}
                >
                  Calling Dashboard
                </button>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`px-4 py-2 hover:bg-white/20 text-text-light rounded-lg transition-colors flex items-center space-x-2 ${
                  showHistory ? 'bg-primary' : 'bg-white/10'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Analytics Dashboard</span> 
              </button>
              <UserMenu user={user} onLogout={handleLogout} />
            </>
          )}
          {!user && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:from-primary-focus hover:to-accent text-text-light rounded-lg transition-all duration-200 transform hover:scale-105 border border-primary/30"
            >
              Sign In
            </button>
          )}
        </div>
      </Header>
      
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {showHistory && user ? (
            <div className="lg:col-span-12">
              <DatabaseDashboard onSelectSession={handleSelectSession} />
            </div>
          ) : viewMode === 'audio' ? (
            <div className="lg:col-span-12 flex justify-center">
              <div className="w-full max-w-md">
                <div className="floating-animation">
                  <AudioUpload
                    selectedLanguage={selectedLanguage}
                    setSelectedLanguage={setSelectedLanguage}
                    onAnalyze={handleAnalysis}
                    isLoading={isLoading}
                    requireAuth={!user}
                    successMessage={successMessage || undefined}
                  />
                </div>
              </div>
            </div>
          ) : viewMode === 'bulk' ? (
            <>
              <div className="lg:col-span-4">
                <div className="floating-animation">
                  <BulkUpload
                    selectedLanguage={selectedLanguage}
                    onBulkAnalyze={handleBulkAnalysis}
                    isLoading={isLoading}
                    requireAuth={!user}
                  />
                </div>
              </div>
              <div className="lg:col-span-8">
                <BulkResultsDashboard
                  results={bulkResults}
                  progress={bulkProgress}
                  onUpdateResult={handleUpdateBulkResult}
                  onExportResults={handleExportResults}
                />
              </div>
            </>
          ) : viewMode === 'meta' ? (
            <div className="lg:col-span-12">
              <MetaDashboard />
            </div>
          ) : viewMode === 'calling' ? (
            <div className="lg:col-span-12">
              <CallingDashboardV2 />
            </div>
          ) : (
            <>
              <div className="lg:col-span-4">
                <div className="floating-animation">
                  <InputControl
                    selectedLanguage={selectedLanguage}
                    setSelectedLanguage={setSelectedLanguage}
                    onAnalyze={handleAnalysis}
                    isLoading={isLoading}
                    requireAuth={!user}
                  />
                </div>
              </div>
              <div className="lg:col-span-8">
                <Dashboard
                  data={analysisData}
                  isLoading={isLoading}
                  error={error}
                  analysisStarted={analysisStarted}
                />
              </div>
            </>
          )}
        </div>
      </main>
      
      <Footer />
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
      </div>
    </ErrorBoundary>
  );
};

export default App;
