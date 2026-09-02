import { useMemo, useState } from 'react';
import type { ArticleWithAnalysis } from '@/lib/supabase';
import { TrendingUp, TrendingDown, Minus, Flame, Target, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

type Props = {
  articles: ArticleWithAnalysis[];
};

type SectorData = {
  name: string;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  totalCount: number;
  avgScore: number;
  avgConfidence: number;
  avgStockMove: number;
  articles: ArticleWithAnalysis[];
  recommendation: string;
  investScore: number;
  longTermOutlook: string;
};

const SECTOR_INFO: Record<string, { companies: string[]; description: string }> = {
  'IT': { companies: ['TCS', 'Infosys', 'Wipro', 'HCL Tech'], description: 'Information Technology services' },
  'Banking': { companies: ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'], description: 'Banks and financial services' },
  'Auto': { companies: ['Maruti Suzuki', 'Tata Motors', 'Mahindra'], description: 'Automobile manufacturers' },
  'Energy': { companies: ['IOC', 'BPCL', 'NTPC', 'ONGC'], description: 'Oil, gas, and power' },
  'Metals': { companies: ['Tata Steel', 'Hindalco', 'Vedanta'], description: 'Metal and mining' },
  'Precious Metals': { companies: ['Titan', 'Rajesh Exports'], description: 'Gold and silver related' },
  'Pharmaceuticals': { companies: ['Sun Pharma', 'Dr Reddy', 'Cipla'], description: 'Pharma and healthcare' },
  'Infrastructure': { companies: ['L&T', 'Adani Group'], description: 'Construction and infra' },
  'Telecom': { companies: ['Bharti Airtel', 'Jio', 'Vodafone Idea'], description: 'Telecom services' },
  'Technology': { companies: ['Zomato', 'Paytm'], description: 'Tech and new-age companies' },
  'Financial Services': { companies: ['Bajaj Finance', 'Paytm'], description: 'NBFCs and fintech' },
  'Economy': { companies: ['Broad Market'], description: 'Macroeconomic indicators' },
  'Currency': { companies: ['INR', 'USD/INR'], description: 'Currency markets' },
  'Manufacturing': { companies: ['L&T', 'Siemens', 'BHEL'], description: 'Manufacturing and capital goods' },
  'Global Trade': { companies: ['Export-oriented'], description: 'Trade and tariffs' },
  'Cryptocurrency': { companies: ['Bitcoin', 'Ethereum'], description: 'Crypto markets' },
  'General': { companies: ['Broad Market'], description: 'General market news' },
};

function computeRecommendation(avgScore: number, avgStockMove: number, avgConfidence: number): { rec: string; score: number; outlook: string } {
  const investScore = Math.round(
    (avgScore * 0.35 + avgStockMove * 10 * 0.35 + avgConfidence * 0.3)
  );

  let rec = 'Hold';
  let outlook = 'Neutral outlook. Mixed signals in recent news suggest waiting for clearer direction before making large allocations.';

  if (investScore > 35) {
    rec = 'Strong Buy';
    outlook = 'Highly positive news flow with strong bullish sentiment and high confidence. Long-term investors should consider accumulating positions. Expected upside driven by consistent positive catalysts and improving fundamentals.';
  } else if (investScore > 15) {
    rec = 'Buy';
    outlook = 'Positive news sentiment outweighs negatives. Good entry point for long-term investors. Gradual accumulation recommended. Fundamentals strengthening with manageable risks.';
  } else if (investScore > -15) {
    rec = 'Hold';
    outlook = 'Mixed signals in recent news. Wait for clearer direction before making large allocations. Monitor upcoming earnings and policy decisions for confirmation.';
  } else if (investScore > -35) {
    rec = 'Reduce';
    outlook = 'Negative news sentiment building up. Consider reducing exposure or waiting for a better entry point. Risks are elevated but not severe. Long-term investors may hold small positions.';
  } else {
    rec = 'Avoid';
    outlook = 'Strongly negative news flow with bearish sentiment. Avoid new investments. Existing holders should consider exiting or hedging. Significant downside risk in the near to medium term.';
  }

  return { rec, score: investScore, outlook };
}

function getRecColor(rec: string): string {
  switch (rec) {
    case 'Strong Buy': return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    case 'Buy': return 'text-green-400 bg-green-500/10 border-green-500/20';
    case 'Hold': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'Reduce': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case 'Avoid': return 'text-red-400 bg-red-500/15 border-red-500/30';
    default: return 'text-slate-400 bg-slate-700/20 border-slate-700';
  }
}

function getHeatColor(avgScore: number): string {
  if (avgScore > 40) return 'bg-emerald-600/30 border-emerald-500/40';
  if (avgScore > 15) return 'bg-emerald-600/15 border-emerald-500/25';
  if (avgScore > -15) return 'bg-slate-700/20 border-slate-600/40';
  if (avgScore > -40) return 'bg-red-600/15 border-red-500/25';
  return 'bg-red-600/30 border-red-500/40';
}

export function SectorHeatMap({ articles }: Props) {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const sectorData = useMemo(() => {
    const sectorMap = new Map<string, ArticleWithAnalysis[]>();

    for (const article of articles) {
      const analysis = article.market_analysis?.[0];
      if (!analysis) continue;

      const sectors = analysis.affected_sectors.length > 0
        ? analysis.affected_sectors
        : article.sector
          ? [article.sector]
          : ['General'];

      for (const sector of sectors) {
        if (!sectorMap.has(sector)) sectorMap.set(sector, []);
        sectorMap.get(sector)!.push(article);
      }
    }

    const data: SectorData[] = [];
    for (const [name, sectorArticles] of sectorMap) {
      const analyses = sectorArticles.map(a => a.market_analysis[0]);
      const bullishCount = analyses.filter(a => a.sentiment === 'bullish').length;
      const bearishCount = analyses.filter(a => a.sentiment === 'bearish').length;
      const neutralCount = analyses.filter(a => a.sentiment === 'neutral').length;
      const avgScore = Math.round(analyses.reduce((s, a) => s + a.sentiment_score, 0) / analyses.length);
      const avgConfidence = Math.round(analyses.reduce((s, a) => s + a.confidence, 0) / analyses.length);
      const avgStockMove = Math.round(analyses.reduce((s, a) => s + a.predicted_stock_move, 0) / analyses.length * 100) / 100;
      const { rec, score, outlook } = computeRecommendation(avgScore, avgStockMove, avgConfidence);

      data.push({
        name,
        bullishCount,
        bearishCount,
        neutralCount,
        totalCount: sectorArticles.length,
        avgScore,
        avgConfidence,
        avgStockMove,
        articles: sectorArticles,
        recommendation: rec,
        investScore: score,
        longTermOutlook: outlook,
      });
    }

    return data.sort((a, b) => b.investScore - a.investScore);
  }, [articles]);

  if (sectorData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Flame className="h-10 w-10 text-slate-700 mb-3" />
        <p className="text-sm text-slate-500">No sector data available yet. Waiting for analyzed news articles...</p>
      </div>
    );
  }

  const selected = selectedSector ? sectorData.find(s => s.name === selectedSector) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-orange-400" />
        <h2 className="text-lg font-bold text-white">Sector Heat Map</h2>
        <span className="text-xs text-slate-500 ml-2">Click any sector for detailed investment analysis</span>
      </div>

      {/* Heat Map Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sectorData.map((sector) => {
          const info = SECTOR_INFO[sector.name] || SECTOR_INFO['General'];
          const heatClass = getHeatColor(sector.avgScore);
          const recClass = getRecColor(sector.recommendation);
          const isPositive = sector.avgScore > 0;

          return (
            <button
              key={sector.name}
              onClick={() => setSelectedSector(sector.name)}
              className={`text-left rounded-xl border p-4 transition-all hover:scale-[1.02] hover:shadow-xl ${heatClass} ${
                selectedSector === sector.name ? 'ring-2 ring-cyan-500/50' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white">{sector.name}</h3>
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                ) : sector.avgScore < 0 ? (
                  <ArrowDownRight className="h-4 w-4 text-red-400" />
                ) : (
                  <Minus className="h-4 w-4 text-amber-400" />
                )}
              </div>

              <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-2xl font-bold tabular-nums ${isPositive ? 'text-emerald-400' : sector.avgScore < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                  {isPositive ? '+' : ''}{sector.avgScore}
                </span>
                <span className="text-xs text-slate-500">sentiment</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${recClass}`}>
                  {sector.recommendation}
                </span>
                <span className="text-xs text-slate-500 tabular-nums">{sector.totalCount} news</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-400">{sector.bullishCount}B</span>
                <span className="text-red-400">{sector.bearishCount}S</span>
                <span className="text-amber-400">{sector.neutralCount}N</span>
                <span className="text-slate-500 ml-auto">{sector.avgConfidence}% conf</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Sector Analysis */}
      {selected && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">{selected.name} — Investment Analysis</h3>
            </div>
            <button
              onClick={() => setSelectedSector(null)}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Close
            </button>
          </div>

          {/* Key metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="p-3 rounded-xl border border-slate-800 bg-black/30">
              <div className="text-xs text-slate-500 mb-1">Invest Score</div>
              <div className={`text-xl font-bold tabular-nums ${selected.investScore > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {selected.investScore > 0 ? '+' : ''}{selected.investScore}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-800 bg-black/30">
              <div className="text-xs text-slate-500 mb-1">Avg Stock Move</div>
              <div className={`text-xl font-bold tabular-nums ${selected.avgStockMove >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {selected.avgStockMove >= 0 ? '+' : ''}{selected.avgStockMove}%
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-800 bg-black/30">
              <div className="text-xs text-slate-500 mb-1">Confidence</div>
              <div className="text-xl font-bold text-white tabular-nums">{selected.avgConfidence}%</div>
            </div>
            <div className={`p-3 rounded-xl border ${getRecColor(selected.recommendation)}`}>
              <div className="text-xs text-slate-500 mb-1">Recommendation</div>
              <div className={`text-xl font-bold ${getRecColor(selected.recommendation).split(' ')[0]}`}>{selected.recommendation}</div>
            </div>
          </div>

          {/* Long-term outlook */}
          <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 mb-5">
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">Long-Term Investment Outlook</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{selected.longTermOutlook}</p>
          </div>

          {/* Sector info */}
          {SECTOR_INFO[selected.name] && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="p-4 rounded-xl border border-slate-800 bg-black/30">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Key Companies</div>
                <div className="flex flex-wrap gap-1.5">
                  {SECTOR_INFO[selected.name].companies.map(c => (
                    <span key={c} className="text-xs font-medium px-2 py-1 rounded-md bg-slate-800 text-slate-300">{c}</span>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-black/30">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</div>
                <p className="text-sm text-slate-400">{SECTOR_INFO[selected.name].description}</p>
              </div>
            </div>
          )}

          {/* Recent news for this sector */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent News Affecting This Sector</div>
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-dark pr-2">
              {selected.articles.slice(0, 8).map((article) => {
                const analysis = article.market_analysis[0];
                const isBull = analysis.sentiment === 'bullish';
                const isBear = analysis.sentiment === 'bearish';
                return (
                  <div key={article.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-black/30 border border-slate-800">
                    <div className={`flex-shrink-0 mt-0.5 ${isBull ? 'text-emerald-400' : isBear ? 'text-red-400' : 'text-amber-400'}`}>
                      {isBull ? <TrendingUp className="h-4 w-4" /> : isBear ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 font-medium line-clamp-1">{article.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{article.source}</span>
                        <span>·</span>
                        <span className={isBull ? 'text-emerald-400' : isBear ? 'text-red-400' : 'text-amber-400'}>
                          {analysis.sentiment} ({analysis.sentiment_score > 0 ? '+' : ''}{analysis.sentiment_score})
                        </span>
                        <span>·</span>
                        <span>Stock: {analysis.predicted_stock_move > 0 ? '+' : ''}{analysis.predicted_stock_move}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
