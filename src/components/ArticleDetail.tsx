import type { ArticleWithAnalysis } from '@/lib/supabase';
import { formatTimeAgo, formatSigned } from '@/lib/utils';
import {
  SENTIMENT_CONFIG, IMPACT_CONFIG, CATEGORY_CONFIG,
  HORIZON_CONFIG, getVerificationIcon,
} from '@/lib/constants';
import {
  X, TrendingUp, TrendingDown, ShieldCheck, ShieldAlert,
  Clock, BarChart3, Target, Zap, AlertCircle,
  Building2, Layers, Globe, Gauge,
} from 'lucide-react';

type Props = {
  article: ArticleWithAnalysis;
  onClose: () => void;
};

export function ArticleDetail({ article, onClose }: Props) {
  const analysis = article.market_analysis?.[0];
  const sentimentCfg = analysis ? SENTIMENT_CONFIG[analysis.sentiment] : null;
  const impactCfg = analysis ? IMPACT_CONFIG[analysis.impact_magnitude] : null;
  const categoryCfg = CATEGORY_CONFIG[article.category] || CATEGORY_CONFIG.corporate;
  const horizonCfg = analysis ? HORIZON_CONFIG[analysis.time_horizon] : null;
  const VerificationIcon = analysis ? getVerificationIcon(analysis.is_verified) : null;

  const impacts = analysis ? [
    { label: 'Stock Move', value: analysis.predicted_stock_move, icon: BarChart3 },
    { label: 'Gold', value: analysis.gold_impact, icon: TrendingUp },
    { label: 'USD/INR', value: analysis.dollar_impact, icon: TrendingDown },
    { label: 'INR', value: analysis.rupee_impact, icon: TrendingUp },
    { label: 'Crude Oil', value: analysis.oil_impact, icon: TrendingDown },
    { label: 'Crypto', value: analysis.crypto_impact, icon: Zap },
  ].filter(i => Math.abs(i.value) > 0.01) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-6 scrollbar-dark">
      <div className="relative w-full max-w-3xl my-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 rounded-t-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryCfg.bg} ${categoryCfg.color}`}>
              {categoryCfg.label}
            </span>
            {article.sector && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
                {article.sector}
              </span>
            )}
            {analysis && sentimentCfg && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sentimentCfg.bg} ${sentimentCfg.text} flex items-center gap-1`}>
                <sentimentCfg.icon className="h-3 w-3" />
                {sentimentCfg.label}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5">
          <h1 className="text-xl font-bold text-white leading-snug mb-3">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 mb-5 text-sm text-slate-500">
            <span className="font-medium text-slate-300">{article.source}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTimeAgo(article.published_at)}
            </span>
            {article.region && (
              <span className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                {article.region === 'india' ? 'India' : article.region === 'global' ? 'Global' : article.region.toUpperCase()}
              </span>
            )}
          </div>

          {/* Summary */}
          <div className="mb-5 p-4 rounded-xl bg-black/30 border border-slate-800">
            <p className="text-sm font-semibold text-slate-300 leading-relaxed">
              {article.summary}
            </p>
          </div>

          {/* Full content */}
          <div className="mb-6">
            <p className="text-sm text-slate-400 leading-relaxed">
              {article.content}
            </p>
          </div>

          {/* Entities */}
          {article.entities.length > 0 && (
            <div className="mb-6 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Entities:</span>
              {article.entities.map((entity) => (
                <span key={entity} className="text-xs font-medium px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {entity}
                </span>
              ))}
            </div>
          )}

          {/* Analysis section */}
          {analysis ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <h2 className="text-base font-bold text-white">AI Market Impact Analysis</h2>
              </div>

              {/* Sentiment & confidence */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3 rounded-xl border ${sentimentCfg?.border} ${sentimentCfg?.bg}`}>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Sentiment</div>
                  <div className={`text-sm font-bold ${sentimentCfg?.text} flex items-center gap-1`}>
                    {sentimentCfg && <sentimentCfg.icon className="h-4 w-4" />}
                    {sentimentCfg?.label}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-black/30">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Score</div>
                  <div className={`text-sm font-bold tabular-nums ${analysis.sentiment_score >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatSigned(analysis.sentiment_score)}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-black/30">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Confidence</div>
                  <div className="text-sm font-bold text-white tabular-nums">{analysis.confidence}%</div>
                </div>
                <div className={`p-3 rounded-xl border border-slate-800 ${impactCfg?.bg}`}>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Impact</div>
                  <div className={`text-sm font-bold ${impactCfg?.color}`}>{impactCfg?.label}</div>
                </div>
              </div>

              {/* Predicted impacts */}
              {impacts.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-800 bg-black/30">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Target className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Predicted Price Movements</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {impacts.map((imp) => (
                      <div key={imp.label} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-xs font-medium text-slate-400">{imp.label}</span>
                        <span className={`text-sm font-bold tabular-nums ${imp.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatSigned(imp.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Market prediction text */}
              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Gauge className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Market Prediction</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {analysis.market_prediction}
                </p>
              </div>

              {/* Affected sectors and companies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analysis.affected_sectors.length > 0 && (
                  <div className="p-4 rounded-xl border border-slate-800 bg-black/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Layers className="h-4 w-4 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Affected Sectors</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.affected_sectors.map((sector) => (
                        <span key={sector} className="text-xs font-medium px-2 py-1 rounded-md bg-slate-800 text-slate-300">
                          {sector}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.affected_companies.length > 0 && (
                  <div className="p-4 rounded-xl border border-slate-800 bg-black/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Companies to Watch</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.affected_companies.map((company) => (
                        <span key={company} className="text-xs font-medium px-2 py-1 rounded-md bg-blue-500/10 text-blue-400">
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Key factors */}
              {analysis.key_factors.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-800 bg-black/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Key Factors Driving Analysis</span>
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.key_factors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Verification & credibility */}
              <div className={`p-4 rounded-xl border ${analysis.is_verified ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {VerificationIcon && (
                    <VerificationIcon className={`h-5 w-5 ${analysis.is_verified ? 'text-emerald-400' : 'text-amber-400'}`} />
                  )}
                  <span className={`text-sm font-bold ${analysis.is_verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {analysis.is_verified ? 'News Verified' : 'Verification Pending'}
                  </span>
                  {horizonCfg && (
                    <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full bg-slate-900 ${horizonCfg.color}`}>
                      {horizonCfg.label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 leading-relaxed mb-2">
                  {analysis.verification_notes}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Source Credibility:</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden max-w-[200px]">
                    <div
                      className={`h-full rounded-full ${analysis.credibility_score >= 80 ? 'bg-emerald-500' : analysis.credibility_score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${analysis.credibility_score}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-300 tabular-nums">{analysis.credibility_score}/100</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 mt-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400">No AI analysis available for this article yet.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
