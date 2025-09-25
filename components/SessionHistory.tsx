import React, { useState, useEffect } from 'react';
import { analysisService, type AnalysisSession } from '../services/analysisService';

interface SessionHistoryProps {
  onSelectSession?: (session: AnalysisSession) => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ onSelectSession }) => {
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const sessionData = await analysisService.getSessions(50, 0);
      setSessions(sessionData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await analysisService.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Delete session error:', error);
      alert('Failed to delete session');
    }
  };

  
  const filteredSessions = sessions.filter(session =>
    session.sessionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.sourceLanguage.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (isLoading) {
    return (
      <div className="glass-dark p-6 rounded-2xl border border-white/20">
        <div className="animate-pulse">
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
            onClick={loadSessions}
            className="px-4 py-2 bg-primary hover:bg-primary-focus text-text-light rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-dark p-6 rounded-2xl border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-text-light drop-shadow-lg">
          📊 Analysis History
        </h3>
        <button
          onClick={loadSessions}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Refresh"
        >
          <svg className="h-5 w-5 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search sessions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-black/20 backdrop-blur-sm border border-white/30 rounded-xl text-text-light placeholder-text-light/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/70 transition-all duration-200"
        />
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-text-light/70">
              {searchTerm ? 'No sessions match your search' : 'No analysis sessions yet'}
            </p>
            {!searchTerm && (
              <p className="text-text-light/50 text-sm mt-1">
                Start by uploading an audio file to create your first session
              </p>
            )}
          </div>
        ) : (
          Object.entries(groupedSessions).map(([dateGroup, sessions]) => (
            <div key={dateGroup} className="space-y-3">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-semibold text-primary drop-shadow-lg">
                  {dateGroup}
                </h4>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent"></div>
                <span className="text-xs text-text-light/60 bg-primary/10 px-2 py-1 rounded-full">
                  {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession?.(session)}
                  className="p-4 bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer group ml-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-text-light group-hover:text-primary transition-colors">
                        {session.sessionName}
                      </h4>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-text-light/70">
                        <span className="flex items-center space-x-1">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                          <span>{session.sourceLanguage.toUpperCase()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDate(session.createdAt)}</span>
                        </span>
                        {session.audioFileName && (
                          <span className="flex items-center space-x-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            <span className="truncate max-w-32">{session.audioFileName}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        title="Delete session"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {session.analysisResults && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                          ✓ Analysis Complete
                        </span>
                        {session.analysisResults.keywords && session.analysisResults.keywords.length > 0 && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                            {session.analysisResults.keywords.length} Keywords
                          </span>
                        )}
                        {session.analysisResults.analysis?.customerSentiment && (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            session.analysisResults.analysis.customerSentiment.sentiment === 'POSITIVE' 
                              ? 'bg-green-500/20 text-green-400'
                              : session.analysisResults.analysis.customerSentiment.sentiment === 'NEGATIVE'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {session.analysisResults.analysis.customerSentiment.sentiment}
                          </span>
                        )}
                      </div>
                      
                      {session.analysisResults.analysis?.summary && (
                        <p className="text-xs text-text-light/70 line-clamp-2 bg-black/20 p-2 rounded-lg">
                          {session.analysisResults.analysis.summary}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SessionHistory;
