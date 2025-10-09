/**********************************************************
 * META DASHBOARD COMPONENT — React TypeScript Version
 * - Facebook Pages Insights
 * - Meta Ads Insights
 * - Modern UI with glass cards, sidebar, interactive controls
 **********************************************************/

import React, { useState, useEffect } from 'react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpl: number;
}

interface Post {
  id: string;
  message: string;
  created_time: string;
  reactions: { summary: { total_count: number } };
  comments: { summary: { total_count: number } };
  shares: { count: number };
}

interface PageData {
  id: string;
  name: string;
  about: string;
  total_followers: number;
  reach: number;
  engaged: number;
  engagement_rate: number;
  page_views: number;
  video_views: number;
  cta_clicks: number;
  organic_reach: number;
  paid_reach: number;
  total_posts: number;
  labels: string[];
  daily_reach: number[];
  daily_engaged: number[];
  fanAdds: number[];
  fanRemoves: number[];
  posts: Post[];
  top_post: Post | null;
}

interface AdsData {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  avgCPC: number;
  avgCPM: number;
  avgCTR: number;
  avgCPL: number;
  campaigns: Campaign[];
}

interface MetaData {
  ads: AdsData;
  pages: PageData[];
}

const MetaDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ads' | 'pages'>('overview');
  const [selectedAccount, setSelectedAccount] = useState<string>('act_837599231811269');
  const [datePreset, setDatePreset] = useState<string>('last_30d');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<MetaData>({
    ads: {
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalLeads: 0,
      avgCPC: 0,
      avgCPM: 0,
      avgCTR: 0,
      avgCPL: 0,
      campaigns: []
    },
    pages: []
  });

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        const params = new URLSearchParams({
          ad_account: selectedAccount === 'act_837599231811269' ? 'instagram' : 'facebook',
          date_preset: datePreset
        });

        const response = await fetch(`/api/meta/dashboard?${params}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          console.error('API Error:', result.error);
          // Fall back to mock data on error
          const mockData: MetaData = {
        ads: {
          totalSpend: 45230.50,
          totalImpressions: 125000,
          totalClicks: 3420,
          totalLeads: 156,
          avgCPC: 13.22,
          avgCPM: 361.84,
          avgCTR: 2.74,
          avgCPL: 290.07,
          campaigns: [
            { id: '1', name: 'Summer Sale Campaign', status: 'ACTIVE', objective: 'LEAD_GENERATION', spend: 15420.30, impressions: 45000, clicks: 1200, ctr: 2.67, cpl: 128.50 },
            { id: '2', name: 'Brand Awareness Drive', status: 'ACTIVE', objective: 'BRAND_AWARENESS', spend: 12800.75, impressions: 38000, clicks: 980, ctr: 2.58, cpl: 0 },
            { id: '3', name: 'Product Launch', status: 'PAUSED', objective: 'CONVERSIONS', spend: 17009.45, impressions: 42000, clicks: 1240, ctr: 2.95, cpl: 425.24 }
          ]
        },
        pages: [
          {
            id: '613327751869662',
            name: 'Harishshoppy',
            about: 'Your trusted shopping destination',
            total_followers: 12450,
            reach: 45230,
            engaged: 3420,
            engagement_rate: 7.56,
            page_views: 8920,
            video_views: 2340,
            cta_clicks: 156,
            organic_reach: 38900,
            paid_reach: 6330,
            total_posts: 24,
            labels: ['Oct 1', 'Oct 2', 'Oct 3', 'Oct 4', 'Oct 5', 'Oct 6', 'Oct 7'],
            daily_reach: [6200, 5800, 7100, 6900, 8200, 7500, 6800],
            daily_engaged: [420, 380, 510, 460, 580, 520, 480],
            fanAdds: [12, 8, 15, 11, 18, 14, 10],
            fanRemoves: [3, 2, 4, 3, 5, 2, 1],
            posts: [
              {
                id: 'post1',
                message: 'Check out our latest collection! Amazing deals await you.',
                created_time: '2024-09-29T10:30:00Z',
                reactions: { summary: { total_count: 45 } },
                comments: { summary: { total_count: 12 } },
                shares: { count: 8 }
              },
              {
                id: 'post2',
                message: 'Thank you for your amazing support! We are grateful.',
                created_time: '2024-09-28T15:20:00Z',
                reactions: { summary: { total_count: 32 } },
                comments: { summary: { total_count: 7 } },
                shares: { count: 3 }
              }
            ],
            top_post: {
              id: 'post1',
              message: 'Check out our latest collection! Amazing deals await you.',
              created_time: '2024-09-29T10:30:00Z',
              reactions: { summary: { total_count: 45 } },
              comments: { summary: { total_count: 12 } },
              shares: { count: 8 }
            }
          },
          {
            id: '665798336609925',
            name: 'Adamandeveinc.in',
            about: 'Premium lifestyle products',
            total_followers: 8920,
            reach: 32100,
            engaged: 2180,
            engagement_rate: 6.79,
            page_views: 5640,
            video_views: 1890,
            cta_clicks: 89,
            organic_reach: 28400,
            paid_reach: 3700,
            total_posts: 18,
            labels: ['Oct 1', 'Oct 2', 'Oct 3', 'Oct 4', 'Oct 5', 'Oct 6', 'Oct 7'],
            daily_reach: [4500, 4200, 5100, 4800, 5600, 5200, 4900],
            daily_engaged: [290, 260, 340, 310, 380, 350, 320],
            fanAdds: [8, 6, 11, 9, 13, 10, 7],
            fanRemoves: [2, 1, 3, 2, 4, 1, 1],
            posts: [
              {
                id: 'post3',
                message: 'Discover luxury redefined with our premium collection.',
                created_time: '2024-09-29T12:15:00Z',
                reactions: { summary: { total_count: 28 } },
                comments: { summary: { total_count: 5 } },
                shares: { count: 2 }
              }
            ],
            top_post: {
              id: 'post3',
              message: 'Discover luxury redefined with our premium collection.',
              created_time: '2024-09-29T12:15:00Z',
              reactions: { summary: { total_count: 28 } },
              comments: { summary: { total_count: 5 } },
              shares: { count: 2 }
            }
          }
        ]
      };
      
          setData(mockData);
        }
      } catch (error) {
        console.error('Failed to fetch Meta data:', error);
        // Use mock data as fallback
        const mockData: MetaData = {
          ads: {
            totalSpend: 45230.50,
            totalImpressions: 125000,
            totalClicks: 3420,
            totalLeads: 156,
            avgCPC: 13.22,
            avgCPM: 361.84,
            avgCTR: 2.74,
            avgCPL: 290.07,
            campaigns: [
              { id: '1', name: 'Summer Sale Campaign', status: 'ACTIVE', objective: 'LEAD_GENERATION', spend: 15420.30, impressions: 45000, clicks: 1200, ctr: 2.67, cpl: 128.50 },
              { id: '2', name: 'Brand Awareness Drive', status: 'ACTIVE', objective: 'BRAND_AWARENESS', spend: 12800.75, impressions: 38000, clicks: 980, ctr: 2.58, cpl: 0 },
              { id: '3', name: 'Product Launch', status: 'PAUSED', objective: 'CONVERSIONS', spend: 17009.45, impressions: 42000, clicks: 1240, ctr: 2.95, cpl: 425.24 }
            ]
          },
          pages: [
            {
              id: '613327751869662',
              name: 'Harishshoppy',
              about: 'Your trusted shopping destination',
              total_followers: 12450,
              reach: 45230,
              engaged: 3420,
              engagement_rate: 7.56,
              page_views: 8920,
              video_views: 2340,
              cta_clicks: 156,
              organic_reach: 38900,
              paid_reach: 6330,
              total_posts: 24,
              labels: ['Oct 1', 'Oct 2', 'Oct 3', 'Oct 4', 'Oct 5', 'Oct 6', 'Oct 7'],
              daily_reach: [6200, 5800, 7100, 6900, 8200, 7500, 6800],
              daily_engaged: [420, 380, 510, 460, 580, 520, 480],
              fanAdds: [12, 8, 15, 11, 18, 14, 10],
              fanRemoves: [3, 2, 4, 3, 5, 2, 1],
              posts: [
                {
                  id: 'post1',
                  message: 'Check out our latest collection! Amazing deals await you.',
                  created_time: '2024-09-29T10:30:00Z',
                  reactions: { summary: { total_count: 45 } },
                  comments: { summary: { total_count: 12 } },
                  shares: { count: 8 }
                }
              ],
              top_post: {
                id: 'post1',
                message: 'Check out our latest collection! Amazing deals await you.',
                created_time: '2024-09-29T10:30:00Z',
                reactions: { summary: { total_count: 45 } },
                comments: { summary: { total_count: 12 } },
                shares: { count: 8 }
              }
            }
          ]
        };
        setData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedAccount, datePreset]);

  const adAccounts: Record<string, string> = {
    'act_837599231811269': 'Instagram',
    'act_782436794463558': 'Facebook'
  };

  const datePresets: Record<string, string> = {
    'last_7d': 'Last 7 Days',
    'last_14d': 'Last 14 Days',
    'last_30d': 'Last 30 Days',
    'this_month': 'This Month',
    'last_month': 'Last Month'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Meta Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 p-6 bg-gradient-to-b from-slate-900 to-slate-800 text-white hidden lg:block z-30">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl font-bold">
            UM
          </div>
          <div>
            <div className="font-bold text-lg">Meta</div>
            <div className="text-xs text-slate-400">Ads + Pages</div>
          </div>
        </div>

        <nav className="space-y-2 text-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-3 p-3 rounded-lg w-full text-left transition ${
              activeTab === 'overview' ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('ads')}
            className={`flex items-center gap-3 p-3 rounded-lg w-full text-left transition ${
              activeTab === 'ads' ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
          >
            📈 Ads Insights
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`flex items-center gap-3 p-3 rounded-lg w-full text-left transition ${
              activeTab === 'pages' ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
          >
            📄 Page Insights
          </button>
          <div className="border-t border-white/10 mt-4 pt-4 text-xs text-slate-400">Tools</div>
          <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition w-full text-left">
            📥 Export CSV
          </button>
          <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition w-full text-left">
            ⚙️ Settings
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur-sm bg-white/70 border-b border-slate-200/50">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800"> Meta Dashboard</h1>
              <p className="text-sm text-slate-600">Ads & Pages — consolidated view</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 rounded-md border bg-white text-sm hover:bg-slate-50 transition"
              >
                Filters
              </button>
              <button className="px-3 py-2 rounded-md border bg-white text-sm hover:bg-slate-50 transition">
                Export
              </button>
            </div>
          </div>
        </header>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-white/70 backdrop-blur-sm border-b border-slate-200/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Ad Account</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  {Object.entries(adAccounts).map(([id, label]) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Date Preset</label>
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  {Object.entries(datePresets).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button className="w-full py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold hover:from-indigo-700 hover:to-cyan-700 transition">
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                  <div className="text-sm text-slate-600">Total Spend</div>
                  <div className="text-2xl font-bold text-blue-600">₹{data.ads.totalSpend.toLocaleString()}</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                  <div className="text-sm text-slate-600">Impressions</div>
                  <div className="text-2xl font-bold text-indigo-600">{data.ads.totalImpressions.toLocaleString()}</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                  <div className="text-sm text-slate-600">Clicks</div>
                  <div className="text-2xl font-bold text-emerald-600">{data.ads.totalClicks.toLocaleString()}</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                  <div className="text-sm text-slate-600">Leads</div>
                  <div className="text-2xl font-bold text-fuchsia-600">{data.ads.totalLeads.toLocaleString()}</div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Campaign Spend</h3>
                  <div className="h-64 flex items-end justify-around bg-slate-50 rounded-lg p-4">
                    {data.ads.campaigns.map((campaign, index) => (
                      <div key={campaign.id} className="flex flex-col items-center">
                        <div 
                          className="bg-indigo-500 rounded-t w-12 mb-2"
                          style={{ height: `${(campaign.spend / Math.max(...data.ads.campaigns.map(c => c.spend))) * 150}px` }}
                        ></div>
                        <div className="text-xs text-center max-w-16 truncate">{campaign.name}</div>
                        <div className="text-xs font-semibold">₹{campaign.spend.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Page Performance</h3>
                  <div className="space-y-4">
                    {data.pages.map((page) => (
                      <div key={page.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium">{page.name}</div>
                          <div className="text-sm text-slate-600">{page.total_followers.toLocaleString()} followers</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{page.engagement_rate}%</div>
                          <div className="text-sm text-slate-600">engagement</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ads Tab */}
          {activeTab === 'ads' && (
            <div className="space-y-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                <h2 className="text-xl font-bold mb-4">Campaign Performance</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left p-3 text-sm font-medium text-slate-600">Campaign</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-600">Status</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-600">Objective</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-600">Spend</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-600">Impressions</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-600">Clicks</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-600">CTR%</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-600">CPL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.ads.campaigns.map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-medium">{campaign.name}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {campaign.status}
                            </span>
                          </td>
                          <td className="p-3 text-sm">{campaign.objective}</td>
                          <td className="p-3 text-right">₹{campaign.spend.toLocaleString()}</td>
                          <td className="p-3 text-right">{campaign.impressions.toLocaleString()}</td>
                          <td className="p-3 text-right">{campaign.clicks.toLocaleString()}</td>
                          <td className="p-3 text-right">{campaign.ctr.toFixed(2)}%</td>
                          <td className="p-3 text-right">₹{campaign.cpl.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Pages Tab */}
          {activeTab === 'pages' && (
            <div className="space-y-6">
              <div className="flex space-x-3 border-b border-slate-200 mb-6">
                {data.pages.map((page) => (
                  <button
                    key={page.id}
                    className="px-4 py-2 border-b-2 border-transparent hover:border-indigo-300 transition font-medium text-sm"
                  >
                    {page.name}
                  </button>
                ))}
              </div>

              {data.pages.map((page) => (
                <div key={page.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold">{page.name}</h3>
                      {page.about && <p className="text-slate-600">{page.about}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Followers</p>
                      <p className="text-3xl font-bold text-indigo-600">{page.total_followers.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                      <div className="text-sm text-slate-600">Reach</div>
                      <div className="text-xl font-bold">{page.reach.toLocaleString()}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl text-center">
                      <div className="text-sm text-slate-600">Engaged</div>
                      <div className="text-xl font-bold">{page.engaged.toLocaleString()}</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-xl text-center">
                      <div className="text-sm text-slate-600">Engagement Rate</div>
                      <div className="text-xl font-bold">{page.engagement_rate}%</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl text-center">
                      <div className="text-sm text-slate-600">Page Views</div>
                      <div className="text-xl font-bold">{page.page_views.toLocaleString()}</div>
                    </div>
                    <div className="bg-pink-50 p-4 rounded-xl text-center">
                      <div className="text-sm text-slate-600">Video Views</div>
                      <div className="text-xl font-bold">{page.video_views.toLocaleString()}</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl text-center">
                      <div className="text-sm text-slate-600">CTA Clicks</div>
                      <div className="text-xl font-bold">{page.cta_clicks.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3">Daily Performance</h4>
                    <div className="h-64 bg-slate-50 rounded-lg p-4">
                      <div className="flex justify-between items-end h-full">
                        {page.labels.map((label, index) => (
                          <div key={index} className="flex flex-col items-center">
                            <div className="flex flex-col items-center mb-2">
                              <div 
                                className="bg-blue-500 rounded-t w-4 mb-1"
                                style={{ height: `${(page.daily_reach[index] / Math.max(...page.daily_reach)) * 120}px` }}
                                title={`Reach: ${page.daily_reach[index]}`}
                              ></div>
                              <div 
                                className="bg-green-500 rounded-t w-4"
                                style={{ height: `${(page.daily_engaged[index] / Math.max(...page.daily_engaged)) * 80}px` }}
                                title={`Engaged: ${page.daily_engaged[index]}`}
                              ></div>
                            </div>
                            <div className="text-xs text-center transform -rotate-45 origin-center">{label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-center mt-4 space-x-4">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                          <span className="text-sm">Reach</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                          <span className="text-sm">Engaged</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Post */}
                  {page.top_post && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
                      <h4 className="text-lg font-semibold mb-2">🏆 Top Performing Post</h4>
                      <p className="text-xs text-slate-500 mb-2">
                        {new Date(page.top_post.created_time).toLocaleDateString()}
                      </p>
                      <p className="mb-3 text-slate-700">{page.top_post.message}</p>
                      <div className="flex gap-6 text-sm text-slate-600">
                        <span>❤️ {page.top_post.reactions.summary.total_count}</span>
                        <span>💬 {page.top_post.comments.summary.total_count}</span>
                        <span>🔄 {page.top_post.shares.count}</span>
                      </div>
                    </div>
                  )}

                  {/* Recent Posts */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4">📝 Recent Posts</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {page.posts.map((post) => (
                        <div key={post.id} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
                          <p className="text-xs text-slate-400 mb-2">
                            {new Date(post.created_time).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-slate-700 mb-3">{post.message}</p>
                          <div className="flex justify-between text-sm text-slate-600">
                            <span>❤️ {post.reactions.summary.total_count}</span>
                            <span>💬 {post.comments.summary.total_count}</span>
                            <span>🔄 {post.shares.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MetaDashboard;
