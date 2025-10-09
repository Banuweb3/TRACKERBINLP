import React, { useState, useEffect } from 'react';
import { analysisService, type AnalysisSession } from '../services/analysisService';
import { safeGet, safeArray, validateSession } from '../utils/safeAccess';
import { guardApiResponse, safeProp, safeNested } from '../utils/productionSafety';

interface DatabaseDashboardProps {
  onSelectSession?: (session: AnalysisSession) => void;
}

interface DashboardStats {
  totalSessions: number;
  todaySessions: number;
  totalLanguages: number;
  avgSentimentScore: number;
  topKeywords: string[];
}

const DatabaseDashboard: React.FC<DatabaseDashboardProps> = ({ onSelectSession }) => {
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('7'); // days
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    todaySessions: 0,
    totalLanguages: 0,
    avgSentimentScore: 0,
    topKeywords: []
  });

  useEffect(() => {
    loadDashboardData();
  }, [selectedDateRange]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await analysisService.getSessions();
      console.log('Fetched sessions:', response);
      
      // Guard API response to prevent H.id errors
      const guardedResponse = guardApiResponse(response);
      
      // Use safe array access and validate sessions
      const safeSessions = safeArray(guardedResponse).filter(validateSession) as AnalysisSession[];
      console.log('Validated sessions:', safeSessions.length, 'out of', safeArray(guardedResponse).length);
      
      setSessions(safeSessions);
      calculateStats(safeSessions);
    } catch (error) {
      console.error('🛡️ Dashboard data loading error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };
  const calculateStats = (sessionData: AnalysisSession[]) => {
    const today = new Date().toDateString();
    const todaySessions = sessionData.filter(s => new Date(s.createdAt).toDateString() === today);
    
    const languages = new Set(sessionData.map(s => s.sourceLanguage));
    
    const sessionsWithResults = sessionData.filter(s => s.analysisResults?.analysis);
    const avgScore = sessionsWithResults.length > 0 
      ? sessionsWithResults.reduce((sum, s) => sum + (s.analysisResults?.analysis?.customerSentiment?.score || 0), 0) / sessionsWithResults.length
      : 0;

    const allKeywords = sessionData
      .filter(s => s.analysisResults?.keywords)
      .flatMap(s => s.analysisResults!.keywords);
    
    const keywordCounts = allKeywords.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topKeywords = Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([keyword]) => keyword);

    setStats({
      totalSessions: sessionData.length,
      todaySessions: todaySessions.length,
      totalLanguages: languages.size,
      avgSentimentScore: avgScore,
      topKeywords
    });
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.sessionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.sourceLanguage.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedDateRange === 'all') {
      return matchesSearch;
    }
    
    const sessionDate = new Date(session.createdAt);
    const daysAgo = parseInt(selectedDateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    return matchesSearch && sessionDate >= cutoffDate;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateGroup = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Group sessions by date
  const groupedSessions = filteredSessions.reduce((groups, session) => {
    const dateGroup = formatDateGroup(session.createdAt);
    if (!groups[dateGroup]) {
      groups[dateGroup] = [];
    }
    groups[dateGroup].push(session);
    return groups;
  }, {} as Record<string, AnalysisSession[]>);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'text-green-400 bg-green-500/20';
      case 'NEGATIVE': return 'text-red-400 bg-red-500/20';
      default: return 'text-yellow-400 bg-yellow-500/20';
    }
  };

  // Helper function to get overall agent sentiment from the 4 aspects
  const getOverallAgentSentiment = (agentSentiment: any): string => {
    try {
      if (!agentSentiment) return 'NEUTRAL';
      
      // Debug: Check what we're getting
      console.log('Agent Sentiment Data:', typeof agentSentiment, agentSentiment);
      
      // If it's a string, return it directly
      if (typeof agentSentiment === 'string') {
        return agentSentiment;
      }
      
      // If it's the old format (single sentiment object), return it directly
      if (agentSentiment.sentiment && typeof agentSentiment.sentiment === 'string') {
        return agentSentiment.sentiment;
      }
      
      // For new format (4 aspects), calculate overall sentiment
      if (agentSentiment.positive || agentSentiment.callOpening || agentSentiment.callQuality || agentSentiment.callClosing) {
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
      }
      
      // Fallback - if we get here, something is wrong
      console.warn('Unexpected agent sentiment format:', agentSentiment);
      return 'NEUTRAL';
    } catch (error) {
      console.error('Error in getOverallAgentSentiment:', error);
      return 'NEUTRAL';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-dark p-6 rounded-2xl border border-white/20 animate-pulse">
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-8 bg-white/20 rounded"></div>
            </div>
          ))}
        </div>
        <div className="glass-dark p-6 rounded-2xl border border-white/20 animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-dark p-6 rounded-2xl border border-white/20">
        <div className="text-center">
          <div className="text-red-400 mb-2">⚠️</div>
          <p className="text-text-light mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-primary hover:bg-primary-focus text-text-light rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-full mx-auto space-y-6">
        {/* Full Screen Header */}
        <div className="flex items-center justify-between bg-black/40 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div>
            <h1 className="text-4xl font-bold text-text-light bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              📊 Analysis Dashboard
            </h1>
            <p className="text-text-light/70 mt-2 text-lg">Complete view of your stored session data and analytics</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="bg-black/50 border border-white/30 rounded-xl px-6 py-3 text-text-light text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={loadDashboardData}
              className="p-3 hover:bg-white/10 rounded-xl transition-colors border border-white/20"
              title="Refresh"
            >
              <svg className="h-6 w-6 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Full Screen Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-dark p-8 rounded-2xl border border-white/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-light/70 text-lg">📊 Total Sessions</p>
                <p className="text-4xl font-bold text-text-light">{stats.totalSessions}</p>
              </div>
              <div className="p-4 bg-primary/20 rounded-full">
                <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="glass-dark p-8 rounded-2xl border border-white/20 bg-gradient-to-br from-green-500/10 to-blue-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-light/70 text-lg">⏰ Today's Sessions</p>
                <p className="text-4xl font-bold text-text-light">{stats.todaySessions}</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-full">
                <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="glass-dark p-8 rounded-2xl border border-white/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-light/70 text-lg">🌐 Languages</p>
                <p className="text-4xl font-bold text-text-light">{stats.totalLanguages}</p>
              </div>
              <div className="p-4 bg-blue-500/20 rounded-full">
                <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
            </div>
          </div>

          <div className="glass-dark p-8 rounded-2xl border border-white/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-light/70 text-lg">💝 Avg Sentiment</p>
                <p className="text-4xl font-bold text-text-light">{stats.avgSentimentScore.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-yellow-500/20 rounded-full">
                <svg className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-dark p-6 rounded-2xl border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light/70 text-sm">Today's Sessions</p>
              <p className="text-2xl font-bold text-text-light">{stats.todaySessions}</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-full">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="glass-dark p-6 rounded-2xl border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light/70 text-sm">Languages</p>
              <p className="text-2xl font-bold text-text-light">{stats.totalLanguages}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-full">
              <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
          </div>
        </div>

        <div className="glass-dark p-6 rounded-2xl border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light/70 text-sm">Avg Sentiment</p>
              <p className="text-2xl font-bold text-text-light">{stats.avgSentimentScore.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-full">
              <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Analysis Sessions */}
      <div className="w-full bg-black/40 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-text-light bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              📊 Analysis Sessions by Date
            </h2>
            <p className="text-text-light/70 mt-2">Complete analysis results from your database</p>
          </div>
          <div className="text-lg text-text-light/60 bg-black/30 px-4 py-2 rounded-xl">
            Showing {filteredSessions.length} of {sessions.length} sessions
          </div>
        </div>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 bg-black/30 backdrop-blur-sm border border-white/30 rounded-xl text-text-light text-lg placeholder-text-light/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/70 transition-all duration-200"
          />
        </div>

        {/* Full Screen Sessions by Date */}
        <div className="space-y-6 max-h-screen overflow-y-auto pr-4">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-text-light/70">
                {searchTerm ? 'No sessions match your search' : 'No analysis sessions in selected date range'}
              </p>
            </div>
          ) : (
            Object.entries(groupedSessions).map(([dateGroup, sessions]) => (
              <div key={dateGroup} className="space-y-3">
                <div className="flex items-center space-x-4 mb-4">
                  <h3 className="text-xl font-bold text-primary drop-shadow-lg">
                    {dateGroup}
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
                  <span className="text-sm text-text-light/80 bg-primary/20 px-4 py-2 rounded-full border border-primary/30">
                    {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {sessions.map((session) => {
                  // Production safety: Guard against undefined session
                  if (!session || !safeProp(session, 'id', null)) {
                    console.warn('🛡️ Skipping invalid session:', session);
                    return null;
                  }
                  
                  const sessionId = safeProp(session, 'id', 0);
                  const sessionName = safeProp(session, 'sessionName', 'Unnamed Session');
                  const sourceLanguage = safeProp(session, 'sourceLanguage', 'en');
                  const createdAt = safeProp(session, 'createdAt', new Date().toISOString());
                  const audioFileName = safeProp(session, 'audioFileName', null);
                  
                  return (
                    <div
                    key={sessionId}
                    onClick={() => onSelectSession?.(session)}
                    className="p-6 bg-black/30 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/10 hover:border-primary/30 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-text-light group-hover:text-primary transition-colors">
                          {sessionName}
                        </h4>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-text-light/70">
                          <span className="flex items-center space-x-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                            <span>{sourceLanguage.toUpperCase()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatDate(createdAt)}</span>
                          </span>
                          {audioFileName && (
                            <span className="flex items-center space-x-1">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                              <span className="truncate max-w-32">{audioFileName}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {safeProp(session, 'analysisResults', null) && (
                      <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                        {/* Status and Tags */}
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                            ✓ Analysis Complete
                          </span>
                          {safeNested(session, 'analysisResults.keywords', []).length > 0 && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                              {safeNested(session, 'analysisResults.keywords', []).length} Keywords
                            </span>
                          )}
                          {safeNested(session, 'analysisResults.analysis.customerSentiment', null) && (
                            <span className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(safeNested(session, 'analysisResults.analysis.customerSentiment.sentiment', 'NEUTRAL'))}`}>
                              Customer: {safeNested(session, 'analysisResults.analysis.customerSentiment.sentiment', 'NEUTRAL')}
                            </span>
                          )}
                          {safeNested(session, 'analysisResults.analysis.agentSentiment', null) && (
                            <span className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(getOverallAgentSentiment(safeNested(session, 'analysisResults.analysis.agentSentiment', {})))}`}>
Agent: {(() => {
                                try {
                                  const agentData = safeNested(session, 'analysisResults.analysis.agentSentiment', {}) as any;
                                  
                                  // Safety check - ensure agentData exists
                                  if (!agentData) {
                                    return 'NEUTRAL';
                                  }
                                  
                                  // Check if it has the new 4-aspect format
                                  if (agentData.positive || agentData.callOpening || agentData.callQuality || agentData.callClosing) {
                                    const scores = [];
                                    if (agentData.positive?.score !== undefined) scores.push(Math.round(((agentData.positive.score + 1) * 5)));
                                    if (agentData.callOpening?.score !== undefined) scores.push(Math.round(((agentData.callOpening.score + 1) * 5)));
                                    if (agentData.callQuality?.score !== undefined) scores.push(Math.round(((agentData.callQuality.score + 1) * 5)));
                                    if (agentData.callClosing?.score !== undefined) scores.push(Math.round(((agentData.callClosing.score + 1) * 5)));
                                    
                                    if (scores.length > 0) {
                                      const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
                                      const sentiment = getOverallAgentSentiment(agentData);
                                      return `${avgScore}/10 ${sentiment}`;
                                    }
                                  }
                                  
                                  // Check if it has the old single sentiment format
                                  if (agentData.sentiment) {
                                    return agentData.sentiment;
                                  }
                                  
                                  // If we get here, log what we actually received
                                  console.warn('Unexpected agent sentiment format:', agentData);
                                  return 'NEUTRAL';
                                } catch (error) {
                                  console.error('Error rendering agent sentiment:', error);
                                  return 'NEUTRAL';
                                }
                              })()}
                            </span>
                          )}
                        </div>

                        {/* Full Transcription */}
                        {session.analysisResults.transcription && (
                          <div className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 backdrop-blur-sm p-3 rounded-lg border border-gray-400/20">
                            <h5 className="text-xs font-semibold text-gray-400 mb-2 flex items-center">
                              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                              📝 Full Transcription (Source Language)
                            </h5>
                            <p className="text-xs text-text-light/95 whitespace-pre-wrap leading-relaxed">
                              {session.analysisResults.transcription}
                            </p>
                          </div>
                        )}

                        {/* Translation */}
                        {session.analysisResults.translation && session.analysisResults.translation !== session.analysisResults.transcription && (
                          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm p-3 rounded-lg border border-blue-400/20">
                            <h5 className="text-xs font-semibold text-cyan-400 mb-2 flex items-center">
                              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                              </svg>
                              🌐 Translation (English)
                            </h5>
                            <p className="text-xs text-text-light/95 whitespace-pre-wrap leading-relaxed">
                              {session.analysisResults.translation}
                            </p>
                          </div>
                        )}

                        {/* Analysis Summary */}
                        {session.analysisResults.analysis?.summary && (
                          <div className="bg-black/30 p-3 rounded-lg">
                            <h5 className="text-xs font-semibold text-yellow-400 mb-2 flex items-center">
                              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              📊 Analysis Summary
                            </h5>
                            <p className="text-xs text-text-light/80 whitespace-pre-wrap leading-relaxed">
                              {session.analysisResults.analysis.summary}
                            </p>
                          </div>
                        )}

                        {/* Agent Coaching */}
                        {session.analysisResults.analysis?.agentCoaching && (
                          <div className="bg-black/30 p-3 rounded-lg">
                            <h5 className="text-xs font-semibold text-purple-400 mb-2 flex items-center">
                              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              🎯 Agent Coaching
                            </h5>
                            <p className="text-xs text-text-light/80 whitespace-pre-wrap leading-relaxed">
                              {session.analysisResults.analysis.agentCoaching}
                            </p>
                          </div>
                        )}

                        {/* Sentiment Analysis Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {session.analysisResults.analysis?.customerSentiment && (
                            <div className="bg-black/30 p-3 rounded-lg">
                              <h5 className="text-xs font-semibold text-pink-400 mb-2 flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                👤 Customer Sentiment
                              </h5>
                              <div className="space-y-1">
                                <p className={`text-xs font-medium ${getSentimentColor(session.analysisResults.analysis.customerSentiment.sentiment)}`}>
                                  {session.analysisResults.analysis.customerSentiment.sentiment} 
                                  {session.analysisResults.analysis.customerSentiment.score && typeof session.analysisResults.analysis.customerSentiment.score === 'number' && (
                                    <span className="ml-2">({session.analysisResults.analysis.customerSentiment.score.toFixed(2)})</span>
                                  )}
                                </p>
                                {session.analysisResults.analysis.customerSentiment.justification && (
                                  <p className="text-xs text-text-light/70 leading-relaxed">
                                    {session.analysisResults.analysis.customerSentiment.justification}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                        {/* Enhanced Agent Sentiment Analysis - FORCED READABLE FORMAT */}
                        {session.analysisResults.analysis?.agentSentiment && (
                          <div className="bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 backdrop-blur-sm p-4 rounded-xl border border-cyan-400/20">
                            {/* Professional Header with Better Design */}
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-500/20 rounded-xl">
                                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                                <div>
                                  <h5 className="text-lg font-bold text-blue-300">📊 Agent Performance Report</h5>
                                  <p className="text-sm text-text-light/70">Professional evaluation with 1-10 scoring system</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getSentimentColor(getOverallAgentSentiment(session.analysisResults.analysis.agentSentiment))}`}>
                                  {getOverallAgentSentiment(session.analysisResults.analysis.agentSentiment) === 'POSITIVE' ? '🌟 EXCELLENT' : 
                                   getOverallAgentSentiment(session.analysisResults.analysis.agentSentiment) === 'NEGATIVE' ? '⚠️ NEEDS WORK' : '✅ GOOD'}
                                </div>
                                <p className="text-xs text-text-light/60 mt-1">Overall Assessment</p>
                              </div>
                            </div>

                            {/* FORCE READABLE FORMAT - ALWAYS PARSE JSON */}
                            {(() => {
                              const agentData = session.analysisResults.analysis.agentSentiment as any;
                              
                              // Try to extract data from any format
                              let data = agentData;
                              
                              // If it's a string, try to parse it
                              if (typeof agentData === 'string') {
                                try {
                                  data = JSON.parse(agentData);
                                } catch (e) {
                                  console.log('Could not parse agent sentiment string');
                                  return false;
                                }
                              }
                              
                              // Check if we have the 4-aspect format
                              return data && (data.positive || data.callOpening || data.callQuality || data.callClosing);
                            })() ? (
                              <div className="space-y-3">
                                {/* Calculate Overall Score */}
                                {(() => {
                                  const scores = [];
                                  if (session.analysisResults.analysis.agentSentiment.positive?.score !== undefined) {
                                    scores.push(session.analysisResults.analysis.agentSentiment.positive.score);
                                  }
                                  if (session.analysisResults.analysis.agentSentiment.callOpening?.score !== undefined) {
                                    scores.push(session.analysisResults.analysis.agentSentiment.callOpening.score);
                                  }
                                  if (session.analysisResults.analysis.agentSentiment.callQuality?.score !== undefined) {
                                    scores.push(session.analysisResults.analysis.agentSentiment.callQuality.score);
                                  }
                                  if (session.analysisResults.analysis.agentSentiment.callClosing?.score !== undefined) {
                                    scores.push(session.analysisResults.analysis.agentSentiment.callClosing.score);
                                  }
                                  
                                  const overallScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
                                  const overallScore10 = Math.round((overallScore + 1) * 5);
                                  
                                  return (
                                    <div className="mb-4 p-3 bg-indigo-500/10 rounded-lg border border-indigo-400/30">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-indigo-300">Overall Assessment</span>
                                        <span className="text-xl font-bold text-indigo-400">{overallScore10}/10</span>
                                      </div>
                                      <p className="text-xs text-text-light/70">
                                        {overallScore10 >= 8 && "✅ EXCELLENT - Outstanding performance across all areas"}
                                        {overallScore10 === 7 && "✅ GOOD - Strong performance with minor improvements needed"}
                                        {overallScore10 >= 5 && overallScore10 <= 6 && "⚠️ SATISFACTORY - Meets basic requirements"}
                                        {overallScore10 < 5 && "❌ NEEDS IMPROVEMENT - Significant development required"}
                                      </p>
                                    </div>
                                  );
                                })()}

                                {/* Performance Categories - Heading-wise Display */}
                                <div className="space-y-4">
                                  <h6 className="text-base font-bold text-cyan-300 mb-3 pb-2 border-b border-cyan-400/30">
                                    📊 Performance Breakdown
                                  </h6>

                                  {/* 1. Positive Attitude */}
                                  {session.analysisResults.analysis.agentSentiment.positive && (
                                    <div className="bg-gradient-to-r from-green-500/15 to-emerald-500/10 p-4 rounded-xl border border-green-400/30">
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="text-lg font-bold text-green-300 flex items-center">
                                          <span className="text-2xl mr-2">😊</span>
                                          1. Positive Attitude
                                        </h5>
                                        <div className="text-right">
                                          <div className="text-2xl font-bold text-green-400">
                                            {Math.round(((session.analysisResults.analysis.agentSentiment.positive.score || 0) + 1) * 5)}/10
                                          </div>
                                          <div className="text-xs text-green-300 uppercase tracking-wide">
                                            {session.analysisResults.analysis.agentSentiment.positive.sentiment}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="bg-black/20 p-3 rounded-lg">
                                        <p className="text-sm text-text-light/90 leading-relaxed">
                                          <span className="font-semibold text-green-400">Assessment:</span> {session.analysisResults.analysis.agentSentiment.positive.justification}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* 2. Call Opening */}
                                  {session.analysisResults.analysis.agentSentiment.callOpening && (
                                    <div className="bg-gradient-to-r from-blue-500/15 to-indigo-500/10 p-4 rounded-xl border border-blue-400/30">
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="text-lg font-bold text-blue-300 flex items-center">
                                          <span className="text-2xl mr-2">🚀</span>
                                          2. Call Opening
                                        </h5>
                                        <div className="text-right">
                                          <div className="text-2xl font-bold text-blue-400">
                                            {Math.round(((session.analysisResults.analysis.agentSentiment.callOpening.score || 0) + 1) * 5)}/10
                                          </div>
                                          <div className="text-xs text-blue-300 uppercase tracking-wide">
                                            {session.analysisResults.analysis.agentSentiment.callOpening.sentiment}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="bg-black/20 p-3 rounded-lg">
                                        <p className="text-sm text-text-light/90 leading-relaxed">
                                          <span className="font-semibold text-blue-400">Assessment:</span> {session.analysisResults.analysis.agentSentiment.callOpening.justification}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* 3. Call Quality */}
                                  {session.analysisResults.analysis.agentSentiment.callQuality && (
                                    <div className="bg-gradient-to-r from-purple-500/15 to-violet-500/10 p-4 rounded-xl border border-purple-400/30">
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="text-lg font-bold text-purple-300 flex items-center">
                                          <span className="text-2xl mr-2">⭐</span>
                                          3. Call Quality
                                        </h5>
                                        <div className="text-right">
                                          <div className="text-2xl font-bold text-purple-400">
                                            {Math.round(((session.analysisResults.analysis.agentSentiment.callQuality.score || 0) + 1) * 5)}/10
                                          </div>
                                          <div className="text-xs text-purple-300 uppercase tracking-wide">
                                            {session.analysisResults.analysis.agentSentiment.callQuality.sentiment}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="bg-black/20 p-3 rounded-lg">
                                        <p className="text-sm text-text-light/90 leading-relaxed">
                                          <span className="font-semibold text-purple-400">Assessment:</span> {session.analysisResults.analysis.agentSentiment.callQuality.justification}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* 4. Call Closing */}
                                  {session.analysisResults.analysis.agentSentiment.callClosing && (
                                    <div className="bg-gradient-to-r from-orange-500/15 to-amber-500/10 p-4 rounded-xl border border-orange-400/30">
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="text-lg font-bold text-orange-300 flex items-center">
                                          <span className="text-2xl mr-2">🎯</span>
                                          4. Call Closing
                                        </h5>
                                        <div className="text-right">
                                          <div className="text-2xl font-bold text-orange-400">
                                            {Math.round(((session.analysisResults.analysis.agentSentiment.callClosing.score || 0) + 1) * 5)}/10
                                          </div>
                                          <div className="text-xs text-orange-300 uppercase tracking-wide">
                                            {session.analysisResults.analysis.agentSentiment.callClosing.sentiment}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="bg-black/20 p-3 rounded-lg">
                                        <p className="text-sm text-text-light/90 leading-relaxed">
                                          <span className="font-semibold text-orange-400">Assessment:</span> {session.analysisResults.analysis.agentSentiment.callClosing.justification}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              // Handle the JSON object format you mentioned
                              (() => {
                                const agentData = session.analysisResults.analysis.agentSentiment as any;
                                
                                // Check if this is actually a JSON string that needs parsing
                                let parsedData = agentData;
                                if (typeof agentData === 'string') {
                                  try {
                                    parsedData = JSON.parse(agentData);
                                  } catch (e) {
                                    parsedData = agentData;
                                  }
                                }
                                
                                // If we have the 4-aspect data (your JSON format), display it properly
                                if (parsedData && (parsedData.positive || parsedData.callOpening || parsedData.callQuality || parsedData.callClosing)) {
                                  return (
                                    <div className="space-y-4">
                                      <h6 className="text-base font-bold text-cyan-300 mb-3 pb-2 border-b border-cyan-400/30">
                                        📊 Performance Analysis
                                      </h6>

                                      {/* Positive Attitude */}
                                      {parsedData.positive && (
                                        <div className="bg-gradient-to-r from-green-500/15 to-emerald-500/10 p-4 rounded-xl border border-green-400/30">
                                          <div className="flex items-center justify-between mb-3">
                                            <h5 className="text-lg font-bold text-green-300 flex items-center">
                                              <span className="text-2xl mr-2">😊</span>
                                              Positive Attitude
                                            </h5>
                                            <div className="text-right">
                                              <div className="text-2xl font-bold text-green-400">
                                                {Math.round(((parsedData.positive.score + 1) * 5))}/10
                                              </div>
                                              <div className="text-xs text-green-300 uppercase tracking-wide">
                                                {parsedData.positive.sentiment}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="bg-black/20 p-3 rounded-lg">
                                            <p className="text-sm text-text-light/90 leading-relaxed">
                                              <span className="font-semibold text-green-400">Assessment:</span> {parsedData.positive.justification}
                                            </p>
                                          </div>
                                        </div>
                                      )}

                                      {/* Call Opening */}
                                      {parsedData.callOpening && (
                                        <div className="bg-gradient-to-r from-blue-500/15 to-indigo-500/10 p-4 rounded-xl border border-blue-400/30">
                                          <div className="flex items-center justify-between mb-3">
                                            <h5 className="text-lg font-bold text-blue-300 flex items-center">
                                              <span className="text-2xl mr-2">🚀</span>
                                              Call Opening
                                            </h5>
                                            <div className="text-right">
                                              <div className="text-2xl font-bold text-blue-400">
                                                {Math.round(((parsedData.callOpening.score + 1) * 5))}/10
                                              </div>
                                              <div className="text-xs text-blue-300 uppercase tracking-wide">
                                                {parsedData.callOpening.sentiment}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="bg-black/20 p-3 rounded-lg">
                                            <p className="text-sm text-text-light/90 leading-relaxed">
                                              <span className="font-semibold text-blue-400">Assessment:</span> {parsedData.callOpening.justification}
                                            </p>
                                          </div>
                                        </div>
                                      )}

                                      {/* Call Quality */}
                                      {parsedData.callQuality && (
                                        <div className="bg-gradient-to-r from-purple-500/15 to-violet-500/10 p-4 rounded-xl border border-purple-400/30">
                                          <div className="flex items-center justify-between mb-3">
                                            <h5 className="text-lg font-bold text-purple-300 flex items-center">
                                              <span className="text-2xl mr-2">⭐</span>
                                              Call Quality
                                            </h5>
                                            <div className="text-right">
                                              <div className="text-2xl font-bold text-purple-400">
                                                {Math.round(((parsedData.callQuality.score + 1) * 5))}/10
                                              </div>
                                              <div className="text-xs text-purple-300 uppercase tracking-wide">
                                                {parsedData.callQuality.sentiment}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="bg-black/20 p-3 rounded-lg">
                                            <p className="text-sm text-text-light/90 leading-relaxed">
                                              <span className="font-semibold text-purple-400">Assessment:</span> {parsedData.callQuality.justification}
                                            </p>
                                          </div>
                                        </div>
                                      )}

                                      {/* Call Closing */}
                                      {parsedData.callClosing && (
                                        <div className="bg-gradient-to-r from-orange-500/15 to-amber-500/10 p-4 rounded-xl border border-orange-400/30">
                                          <div className="flex items-center justify-between mb-3">
                                            <h5 className="text-lg font-bold text-orange-300 flex items-center">
                                              <span className="text-2xl mr-2">🎯</span>
                                              Call Closing
                                            </h5>
                                            <div className="text-right">
                                              <div className="text-2xl font-bold text-orange-400">
                                                {Math.round(((parsedData.callClosing.score + 1) * 5))}/10
                                              </div>
                                              <div className="text-xs text-orange-300 uppercase tracking-wide">
                                                {parsedData.callClosing.sentiment}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="bg-black/20 p-3 rounded-lg">
                                            <p className="text-sm text-text-light/90 leading-relaxed">
                                              <span className="font-semibold text-orange-400">Assessment:</span> {parsedData.callClosing.justification}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                                
                                // Fallback for old format
                                return (
                                  <div className="mb-4 p-3 bg-black/30 rounded-lg border border-cyan-400/30">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-cyan-300">Overall Performance</span>
                                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getSentimentColor(getOverallAgentSentiment(session.analysisResults.analysis.agentSentiment))}`}>
                                        {getOverallAgentSentiment(session.analysisResults.analysis.agentSentiment)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-text-light/70">
                                      Based on comprehensive evaluation across all call aspects
                                    </p>
                                  </div>
                                );
                              })()
                            )}

                          </div>
                        )}
                        </div>

                        {/* Keywords */}
                        {session.analysisResults.keywords && session.analysisResults.keywords.length > 0 && (
                          <div className="bg-black/30 p-3 rounded-lg">
                            <h5 className="text-xs font-semibold text-orange-400 mb-2 flex items-center">
                              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              🔑 Keywords ({session.analysisResults.keywords.length})
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {session.analysisResults.keywords.map((keyword, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs border border-primary/30"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Keywords */}
      {stats.topKeywords.length > 0 && (
        <div className="glass-dark p-6 rounded-2xl border border-white/20">
          <h3 className="text-lg font-semibold text-text-light mb-4">🔑 Top Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {stats.topKeywords.map((keyword, index) => (
              <span
                key={keyword}
                className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm border border-primary/30"
              >
                #{index + 1} {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseDashboard;
