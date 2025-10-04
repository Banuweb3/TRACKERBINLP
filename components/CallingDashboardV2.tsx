import React, { useState, useEffect } from 'react';

// Interface definitions
interface CallStats {
  totalCalls: number;
  followUp: number;
  totalAgents: number;
  leadScore: number;
  incomingCalls: number;
  outgoingCalls: number;
  missedCalls: number;
  connectedCalls: number;
  totalConnected: number;
  abandoned: number;
}

interface AgentData {
  id: string;
  name: string;
  status: 'online' | 'busy' | 'offline';
  callTime: string;
  calls: number;
  performance: number;
}

interface LeadData {
  id: string;
  name: string;
  status: 'hot' | 'warm' | 'cold';
  score: number;
  lastContact: string;
  industry: string;
}

// Simple Badge component
const Badge: React.FC<{ variant?: string; className?: string; children: React.ReactNode }> = ({ 
  variant = 'default', 
  className = '', 
  children 
}) => {
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800',
    destructive: 'bg-red-100 text-red-800',
    secondary: 'bg-gray-100 text-gray-800'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.default} ${className}`}>
      {children}
    </span>
  );
};

const CallingDashboardV2: React.FC = () => {
  const [stats, setStats] = useState<CallStats>({
    totalCalls: 0,
    followUp: 0,
    totalAgents: 0,
    leadScore: 0,
    incomingCalls: 0,
    outgoingCalls: 0,
    missedCalls: 0,
    connectedCalls: 0,
    totalConnected: 0,
    abandoned: 0,
  });
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Fetching data from ngrok API...');
      console.log('🌐 Testing network connectivity first...');
      
      // Test basic connectivity first
      try {
        const testResponse = await fetch('https://httpbin.org/status/200', { 
          method: 'GET',
          mode: 'cors'
        });
        console.log('✅ Basic network connectivity OK');
      } catch (netError) {
        console.error('❌ Basic network test failed:', netError);
        throw new Error('Network connectivity issue. Check your internet connection.');
      }
      
      // Direct API call with cache busting
      const cacheBuster = new Date().getTime();
      console.log('🔄 Using backend proxy to avoid CORS:', `/api/calling/dashboard-data?t=${cacheBuster}`);
      
      // Use backend proxy to avoid CORS issues
      const response = await fetch(`/api/calling/dashboard-data?t=${cacheBuster}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-cache'
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response received:', data);
        console.log('📊 Data type:', typeof data);
        console.log('📊 Is array:', Array.isArray(data));
        console.log('📊 Data length:', data?.length);
        
        // Process raw call data from API
        if (Array.isArray(data) && data.length > 0) {
          console.log('🔄 Processing', data.length, 'call records');
          
          // Calculate statistics from raw call data
          const totalCalls = data.length;
          const incomingCalls = data.filter(call => call.call_type === 'INCOMING').length;
          const outgoingCalls = data.filter(call => call.call_type === 'OUTGOING').length;
          const missedCalls = data.filter(call => call.dialer_status === 'MISSED').length;
          const abandonedCalls = data.filter(call => call.status === 'ABANDONED').length;
          const connectedCalls = data.filter(call => call.status === 'CONNECTED' || call.status === 'ANSWERED').length;
          
          // Get unique agents
          const uniqueAgents = [...new Set(data.map(call => call.agent_id))];
          const totalAgents = uniqueAgents.length;
          
          // Calculate follow-ups (calls with disposition)
          const followUp = data.filter(call => call.disposition && call.disposition !== 'CANCEL').length;
          
          // Calculate lead score (average based on call success rate)
          const leadScore = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;

          console.log('📈 Calculated Stats:', {
            totalCalls,
            incomingCalls,
            outgoingCalls,
            missedCalls,
            abandonedCalls,
            connectedCalls,
            totalAgents,
            followUp,
            leadScore
          });

          setStats({
            totalCalls,
            followUp,
            totalAgents,
            leadScore,
            incomingCalls,
            outgoingCalls,
            missedCalls,
            connectedCalls,
            totalConnected: connectedCalls,
            abandoned: abandonedCalls,
          });

          // Create agents data from call records
          const agentsData = uniqueAgents.map(agentId => {
            const agentCalls = data.filter(call => call.agent_id === agentId);
            const agentConnectedCalls = agentCalls.filter(call => call.status === 'CONNECTED' || call.status === 'ANSWERED').length;
            const performance = agentCalls.length > 0 ? Math.round((agentConnectedCalls / agentCalls.length) * 100) : 0;
            
            // Calculate total call time for agent
            const totalSeconds = agentCalls.reduce((total, call) => {
              const timerJson = JSON.parse(call.call_timer_json || '{}');
              return total + (parseInt(timerJson.bill_sec || '0'));
            }, 0);
            
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            const callTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            return {
              id: agentId,
              name: agentId,
              status: 'online' as const,
              callTime,
              calls: agentCalls.length,
              performance
            };
          });

          setAgents(agentsData);

          // Create leads data from call records
          const uniquePhones = [...new Set(data.map(call => call.phone_number))];
          const leadsData = uniquePhones.slice(0, 10).map(phone => {
            const phoneCalls = data.filter(call => call.phone_number === phone);
            const lastCall = phoneCalls[phoneCalls.length - 1];
            const connectedCallsForPhone = phoneCalls.filter(call => call.status === 'CONNECTED' || call.status === 'ANSWERED').length;
            
            let status: 'hot' | 'warm' | 'cold' = 'cold';
            if (connectedCallsForPhone > 0) status = 'hot';
            else if (phoneCalls.length > 1) status = 'warm';
            
            const score = phoneCalls.length > 0 ? Math.round((connectedCallsForPhone / phoneCalls.length) * 100) : 0;
            
            return {
              id: phone,
              name: `Lead ${phone.slice(-4)}`,
              status,
              score,
              lastContact: lastCall?.call_end_date || 'Unknown',
              industry: lastCall?.process_name || 'Unknown'
            };
          });

          setLeads(leadsData);
          
          // Update last updated timestamp
          setLastUpdated(new Date().toLocaleString());
          
          console.log('✅ Dashboard data updated successfully!');
          
        } else {
          console.log('⚠️ Empty or invalid API response');
          setError('API returned empty data');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`API Error: ${errorMessage}`);
      
      // Set empty values on error
      setStats({
        totalCalls: 0,
        followUp: 0,
        totalAgents: 0,
        leadScore: 0,
        incomingCalls: 0,
        outgoingCalls: 0,
        missedCalls: 0,
        connectedCalls: 0,
        totalConnected: 0,
        abandoned: 0,
      });
      setAgents([]);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      case 'hot': return 'bg-red-500';
      case 'warm': return 'bg-orange-500';
      case 'cold': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            BGI Sales Demo Dashboard 
          </h1>
          <p className="text-gray-600">Real-time Call Center Analytics </p>
          {lastUpdated && (
            <p className="text-sm text-green-600">✅ Data updated: {lastUpdated}</p>
          )}
          
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchDashboardData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh Data'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Calls</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalCalls}</p>
              </div>
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Follow Up</p>
                <p className="text-2xl font-bold text-purple-900">{stats.followUp}</p>
              </div>
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Agents</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalAgents}</p>
              </div>
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Lead Score</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.leadScore}%</p>
              </div>
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Call Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Performance Metrics */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
              📊 Performance Metrics
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">Success Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.leadScore}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-blue-800">{stats.leadScore}%</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">Answer Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.totalCalls > 0 ? Math.round(((stats.totalCalls - stats.missedCalls) / stats.totalCalls) * 100) : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-green-700">
                  {stats.totalCalls > 0 ? Math.round(((stats.totalCalls - stats.missedCalls) / stats.totalCalls) * 100) : 0}%
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">Abandonment Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.totalCalls > 0 ? Math.round((stats.abandoned / stats.totalCalls) * 100) : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-red-700">
                  {stats.totalCalls > 0 ? Math.round((stats.abandoned / stats.totalCalls) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Call Volume Trends */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
              📈 Call Volume
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
                <div className="text-2xl font-bold text-purple-700">{stats.incomingCalls}</div>
                <div className="text-xs text-purple-600">Incoming</div>
                <div className="text-xs text-gray-500">
                  {stats.totalCalls > 0 ? Math.round((stats.incomingCalls / stats.totalCalls) * 100) : 0}% of total
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
                <div className="text-2xl font-bold text-blue-700">{stats.outgoingCalls}</div>
                <div className="text-xs text-blue-600">Outgoing</div>
                <div className="text-xs text-gray-500">
                  {stats.totalCalls > 0 ? Math.round((stats.outgoingCalls / stats.totalCalls) * 100) : 0}% of total
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-red-100">
                <div className="text-2xl font-bold text-red-700">{stats.missedCalls}</div>
                <div className="text-xs text-red-600">Missed</div>
                <div className="text-xs text-gray-500">
                  {stats.totalCalls > 0 ? Math.round((stats.missedCalls / stats.totalCalls) * 100) : 0}% of total
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                <div className="text-2xl font-bold text-gray-700">{stats.abandoned}</div>
                <div className="text-xs text-gray-600">Abandoned</div>
                <div className="text-xs text-gray-500">
                  {stats.totalCalls > 0 ? Math.round((stats.abandoned / stats.totalCalls) * 100) : 0}% of total
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Status */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-green-200">
            <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
              🔴 Live Status
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Active Agents</span>
              </div>
              <span className="text-lg font-bold text-green-800">{stats.totalAgents}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700">Total Calls Today</span>
              </div>
              <span className="text-lg font-bold text-blue-800">{stats.totalCalls}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-yellow-700">Follow-ups Needed</span>
              </div>
              <span className="text-lg font-bold text-yellow-800">{stats.followUp}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Agent Performance & Lead Intelligence */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top Performing Agents */}
        <div className="bg-gradient-to-br from-green-50 to-teal-100 border border-green-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-green-200">
            <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
              🏆 Top Agents
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {agents.length > 0 ? agents
                .sort((a, b) => b.performance - a.performance)
                .slice(0, 5)
                .map((agent, index) => (
                <div key={agent.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 text-sm font-bold">
                      #{index + 1}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)} animate-pulse`}></div>
                    <div>
                      <p className="font-medium text-green-900">{agent.name}</p>
                      <p className="text-xs text-green-600">{agent.calls} calls • {agent.callTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-green-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${agent.performance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-green-800">{agent.performance}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {agent.performance >= 80 ? '🔥 Excellent' : 
                       agent.performance >= 60 ? '👍 Good' : 
                       agent.performance >= 40 ? '⚠️ Average' : '📉 Needs Help'}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-4">No agent data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Hot Leads Pipeline */}
        <div className="bg-gradient-to-br from-red-50 to-orange-100 border border-red-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
              🔥 Hot Leads
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {leads.length > 0 ? leads
                .filter(lead => lead.status === 'hot')
                .slice(0, 5)
                .map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium text-red-900">{lead.name}</p>
                      <p className="text-xs text-red-600">{lead.industry}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      🔥 {lead.score}%
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{lead.lastContact}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No hot leads yet</p>
                  <p className="text-xs text-gray-400">Keep calling to generate hot leads!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Call Quality Insights */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-100 border border-purple-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
              💡 Quality Insights
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-3 bg-white rounded-lg border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700">Peak Performance</span>
                <span className="text-xs text-purple-600">
                  {agents.length > 0 ? Math.max(...agents.map(a => a.performance)) : 0}%
                </span>
              </div>
              <div className="text-xs text-gray-600">
                Best agent: {agents.length > 0 ? agents.reduce((prev, current) => (prev.performance > current.performance) ? prev : current).name : 'N/A'}
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Avg Call Duration</span>
                <span className="text-xs text-blue-600">
                  {agents.length > 0 ? 
                    (() => {
                      const totalSeconds = agents.reduce((sum, agent) => {
                        const [hours, minutes, seconds] = agent.callTime.split(':').map(Number);
                        return sum + (hours * 3600 + minutes * 60 + seconds);
                      }, 0);
                      const avgSeconds = Math.round(totalSeconds / agents.length);
                      const avgMinutes = Math.floor(avgSeconds / 60);
                      const remainingSeconds = avgSeconds % 60;
                      return `${avgMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                    })()
                    : '0:00'
                  }
                </span>
              </div>
              <div className="text-xs text-gray-600">
                Total talk time across all agents
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-yellow-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-700">Conversion Rate</span>
                <span className="text-xs text-yellow-600">
                  {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'hot').length / leads.length) * 100) : 0}%
                </span>
              </div>
              <div className="text-xs text-gray-600">
                Leads converted to hot prospects
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">Team Efficiency</span>
                <span className="text-xs text-green-600">
                  {agents.length > 0 ? Math.round(agents.reduce((sum, agent) => sum + agent.performance, 0) / agents.length) : 0}%
                </span>
              </div>
              <div className="text-xs text-gray-600">
                Average team performance score
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call Timeline & Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            ⏰ Recent Call Activity
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="text-2xl mb-2">📞</div>
              <div className="text-lg font-bold text-blue-800">{stats.incomingCalls}</div>
              <div className="text-sm text-blue-600">Incoming Calls</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.totalCalls > 0 ? ((stats.incomingCalls / stats.totalCalls) * 100).toFixed(1) : 0}% of total volume
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-lg font-bold text-green-800">{stats.connectedCalls}</div>
              <div className="text-sm text-green-600">Connected</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.totalCalls > 0 ? ((stats.connectedCalls / stats.totalCalls) * 100).toFixed(1) : 0}% success rate
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
              <div className="text-2xl mb-2">❌</div>
              <div className="text-lg font-bold text-red-800">{stats.missedCalls}</div>
              <div className="text-sm text-red-600">Missed</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.totalCalls > 0 ? ((stats.missedCalls / stats.totalCalls) * 100).toFixed(1) : 0}% miss rate
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
              <div className="text-2xl mb-2">📋</div>
              <div className="text-lg font-bold text-yellow-800">{stats.followUp}</div>
              <div className="text-sm text-yellow-600">Follow-ups</div>
              <div className="text-xs text-gray-500 mt-1">
                Require attention today
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallingDashboardV2;
