import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, type ArticleWithAnalysis, type MarketIndex } from '@/lib/supabase';
import { AuthPage } from '@/components/AuthPage';
import { MarketTicker } from '@/components/MarketTicker';
import { BreakingNewsTicker } from '@/components/BreakingNewsTicker';
import { LiveClock } from '@/components/LiveClock';
import { ArticleCard } from '@/components/ArticleCard';
import { ArticleDetail } from '@/components/ArticleDetail';
import { AnalyzeNewsForm } from '@/components/AnalyzeNewsForm';
import { SectorHeatMap } from '@/components/SectorHeatMap';
import { AIHelp } from '@/components/AIHelp';
import { Logo } from '@/components/Logo';
import {
  TrendingUp, TrendingDown, Activity, Sparkles, Search,
  Newspaper, Loader2, AlertCircle, Zap, RefreshCw, Radar,
  Flame, Bot, LogOut, LayoutGrid,
} from 'lucide-react';

type FilterCategory = 'all' | 'corporate' | 'political' | 'economic' | 'global' | 'commodity';
type FilterSentiment = 'all' | 'bullish' | 'bearish' | 'neutral';
type Tab = 'news' | 'heatmap' | 'aihelp';

const REFRESH_INTERVAL = 3000;
const GENERATE_INTERVAL = 6000;

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('news');
  const [articles, setArticles] = useState<ArticleWithAnalysis[]>([]);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArticleWithAnalysis | null>(null);
  const [showAnalyzeForm, setShowAnalyzeForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterSentiment, setFilterSentiment] = useState<FilterSentiment>('all');
  const [isLive, setIsLive] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [polling, setPolling] = useState(false);
  const [statsFlash, setStatsFlash] = useState(false);
  const knownIdsRef = useRef<Set<string>>(new Set());

  const fetchData = useCallback(async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    setError(null);
    if (silent) setPolling(true);
    try {
      const [articlesRes, indicesRes] = await Promise.all([
        supabase
          .from('news_articles')
          .select('*, market_analysis(*)')
          .order('published_at', { ascending: false })
          .limit(50),
        supabase
          .from('market_indices')
          .select('*')
          .order('updated_at', { ascending: false }),
      ]);

      if (articlesRes.error) throw articlesRes.error;
      if (indicesRes.error) throw indicesRes.error;

      const newArticles = articlesRes.data || [];
      setIndices(indicesRes.data || []);

      if (knownIdsRef.current.size > 0) {
        const freshCount = newArticles.filter(
          (a) => !knownIdsRef.current.has(a.id)
        ).length;
        if (freshCount > 0) {
          setNewCount((c) => c + freshCount);
          setStatsFlash(true);
          setTimeout(() => setStatsFlash(false), 600);
        }
      }
      newArticles.forEach((a) => knownIdsRef.current.add(a.id));

      setArticles(newArticles);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      if (!silent) setLoading(false);
      setPolling(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => fetchData(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [isLive, fetchData]);

  useEffect(() => {
    if (!isLive) return;
    const generate = async () => {
      setGenerating(true);
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-news`;
        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });
      } catch {
        // Silent fail
      } finally {
        setGenerating(false);
      }
    };

    const timeout = setTimeout(generate, GENERATE_INTERVAL);
    const interval = setInterval(generate, GENERATE_INTERVAL);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isLive]);

  useEffect(() => {
    if (newCount > 0) {
      const timer = setTimeout(() => setNewCount(0), 5000);
      return () => clearTimeout(timer);
    }
  }, [newCount]);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (filterCategory !== 'all' && article.category !== filterCategory) return false;
      if (filterSentiment !== 'all') {
        const analysis = article.market_analysis?.[0];
        if (!analysis || analysis.sentiment !== filterSentiment) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(q);
        const matchesSummary = article.summary.toLowerCase().includes(q);
        const matchesSource = article.source.toLowerCase().includes(q);
        const matchesEntities = article.entities?.some((e) => e.toLowerCase().includes(q));
        const matchesSector = article.sector?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSummary && !matchesSource && !matchesEntities && !matchesSector) return false;
      }
      return true;
    });
  }, [articles, filterCategory, filterSentiment, searchQuery]);

  const stats = useMemo(() => {
    const analyzed = articles.filter(a => a.market_analysis?.[0]);
    const bullish = analyzed.filter(a => a.market_analysis[0].sentiment === 'bullish').length;
    const bearish = analyzed.filter(a => a.market_analysis[0].sentiment === 'bearish').length;
    const neutral = analyzed.filter(a => a.market_analysis[0].sentiment === 'neutral').length;
    const verified = analyzed.filter(a => a.market_analysis[0].is_verified).length;
    const avgConfidence = analyzed.length > 0
      ? Math.round(analyzed.reduce((sum, a) => sum + a.market_analysis[0].confidence, 0) / analyzed.length)
      : 0;
    return { total: articles.length, bullish, bearish, neutral, verified, avgConfidence };
  }, [articles]);

  const marketSentiment = stats.bullish > stats.bearish ? 'bullish' : stats.bearish > stats.bullish ? 'bearish' : 'neutral';
  const SentimentIcon = marketSentiment === 'bullish' ? TrendingUp : marketSentiment === 'bearish' ? TrendingDown : Activity;

  // Show auth page if not logged in
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const tabs: { id: Tab; label: string; icon: typeof Newspaper }[] = [
    { id: 'news', label: 'News Feed', icon: Newspaper },
    { id: 'heatmap', label: 'Sector Heat', icon: Flame },
    { id: 'aihelp', label: 'AI Help', icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-black text-slate-200">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <Logo size={36} />
              <div>
                <h1 className="text-base font-bold text-white leading-tight">MarketSense AI</h1>
                <p className="text-[10px] text-slate-500 leading-tight">India Market Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LiveClock />
              {/* Live / Pause toggle */}
              <button
                onClick={() => setIsLive(!isLive)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isLive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {isLive ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    LIVE
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-slate-500" />
                    Paused
                  </>
                )}
              </button>
              {/* Analyze button */}
              <button
                onClick={() => setShowAnalyzeForm(true)}
                className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-white text-sm font-bold transition-all animate-glow-pulse"
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 40%, #f97316 100%)',
                }}
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Analyze Now</span>
              </button>
              {/* User menu */}
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-xs text-slate-500 max-w-[120px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-all"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Market Ticker */}
      {indices.length > 0 && <MarketTicker indices={indices} />}

      {/* Breaking News Ticker */}
      {articles.length > 0 && (
        <BreakingNewsTicker articles={articles} onArticleClick={setSelectedArticle} />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* NEWS TAB */}
        {activeTab === 'news' && (
          <>
            {/* Hero / Dashboard Summary */}
            <div className="mb-6">
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 sm:p-8 shadow-2xl overflow-hidden relative border border-slate-800">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-600/5 rounded-full blur-3xl -ml-24 -mb-24" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                      <Radar className="h-3 w-3 animate-radar" />
                      Live Market Intelligence
                    </span>
                    {generating && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                        <Zap className="h-3 w-3 animate-pulse" />
                        AI generating news...
                      </span>
                    )}
                    {polling && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-700/30 text-slate-400 border border-slate-700">
                        <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '1s' }} />
                        Syncing...
                      </span>
                    )}
                    {newCount > 0 && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 animate-pulse">
                        <Sparkles className="h-3 w-3" />
                        {newCount} new article{newCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
                    AI-Powered Market News Analysis
                  </h2>
                  <p className="text-sm text-slate-500 max-w-2xl mb-6">
                    Real-time, second-by-second analysis of Indian and global market news with ML-based sentiment scoring,
                    stock movement predictions, commodity impact forecasting, and news verification.
                  </p>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className={`rounded-xl bg-white/5 backdrop-blur-sm border border-slate-800 p-3 transition-all ${statsFlash ? 'animate-flash-green' : ''}`}>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <Newspaper className="h-3 w-3" />
                        Articles
                      </div>
                      <div className={`text-xl font-bold text-white tabular-nums ${statsFlash ? 'animate-count-up' : ''}`}>{stats.total}</div>
                    </div>
                    <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-slate-800 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <TrendingUp className="h-3 w-3" />
                        Bullish
                      </div>
                      <div className="text-xl font-bold text-emerald-400 tabular-nums">{stats.bullish}</div>
                    </div>
                    <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-slate-800 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <TrendingDown className="h-3 w-3" />
                        Bearish
                      </div>
                      <div className="text-xl font-bold text-red-400 tabular-nums">{stats.bearish}</div>
                    </div>
                    <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-slate-800 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <Activity className="h-3 w-3" />
                        Neutral
                      </div>
                      <div className="text-xl font-bold text-amber-400 tabular-nums">{stats.neutral}</div>
                    </div>
                    <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-slate-800 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <Sparkles className="h-3 w-3" />
                        Verified
                      </div>
                      <div className="text-xl font-bold text-white tabular-nums">{stats.verified}/{stats.total}</div>
                    </div>
                    <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-slate-800 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <SentimentIcon className="h-3 w-3" />
                        Avg Confidence
                      </div>
                      <div className="text-xl font-bold tabular-nums text-white">{stats.avgConfidence}%</div>
                    </div>
                  </div>

                  {/* Last updated indicator */}
                  <div className="flex items-center gap-2 mt-4 text-xs text-slate-600">
                    <RefreshCw className={`h-3 w-3 ${isLive ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                    {lastUpdated ? (
                      <span>Last updated: {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                    ) : (
                      <span>Loading...</span>
                    )}
                    {isLive && <span className="text-emerald-500">· Polling every 3s · AI generating every 6s</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search news by title, company, sector, or entity..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Category:</span>
                  {(['all', 'corporate', 'political', 'economic', 'global', 'commodity'] as FilterCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                        filterCategory === cat
                          ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="h-4 w-px bg-slate-800 mx-1" />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Sentiment:</span>
                  {(['all', 'bullish', 'bearish', 'neutral'] as FilterSentiment[]).map((sent) => (
                    <button
                      key={sent}
                      onClick={() => setFilterSentiment(sent)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                        filterSentiment === sent
                          ? sent === 'bullish' ? 'bg-emerald-600 text-white'
                            : sent === 'bearish' ? 'bg-red-600 text-white'
                            : sent === 'neutral' ? 'bg-amber-500 text-white'
                            : 'bg-slate-700 text-white'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {sent === 'all' ? 'All' : sent.charAt(0).toUpperCase() + sent.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* News Feed */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 text-cyan-500 animate-spin mb-3" />
                <p className="text-sm text-slate-500">Loading market intelligence...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
                <p className="text-sm text-red-400 mb-2">{error}</p>
                <button onClick={() => fetchData()} className="text-sm text-cyan-400 font-semibold hover:underline">
                  Try again
                </button>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Newspaper className="h-10 w-10 text-slate-700 mb-3" />
                <p className="text-sm text-slate-500">No articles match your filters.</p>
                <button
                  onClick={() => { setSearchQuery(''); setFilterCategory('all'); setFilterSentiment('all'); }}
                  className="mt-2 text-sm text-cyan-400 font-semibold hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={() => setSelectedArticle(article)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* HEAT MAP TAB */}
        {activeTab === 'heatmap' && (
          <SectorHeatMap articles={articles} />
        )}

        {/* AI HELP TAB */}
        {activeTab === 'aihelp' && (
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-2xl">
              <AIHelp articles={articles} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-black py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs text-slate-600 text-center">
            MarketSense AI — AI-powered market news analysis for Indian markets. Predictions are model estimates, not investment advice.
          </p>
        </div>
      </footer>

      {/* Modals */}
      {selectedArticle && (
        <ArticleDetail article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
      {showAnalyzeForm && (
        <AnalyzeNewsForm
          onClose={() => setShowAnalyzeForm(false)}
          onAnalyzed={() => fetchData(true)}
        />
      )}
    </div>
  );
}
