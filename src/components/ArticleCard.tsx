import { useState, useEffect } from 'react';
import type { ArticleWithAnalysis } from '@/lib/supabase';
import { formatTimeAgo, formatSigned, isNewArticle } from '@/lib/utils';
import {
  SENTIMENT_CONFIG, IMPACT_CONFIG, CATEGORY_CONFIG,
  getVerificationIcon,
} from '@/lib/constants';
import {
  TrendingUp, TrendingDown, ShieldCheck, ShieldAlert,
  Clock, BarChart3, ChevronRight, Sparkles,
} from 'lucide-react';

type Props = {
  article: ArticleWithAnalysis;
  onClick: () => void;
};

export function ArticleCard({ article, onClick }: Props) {
  const analysis = article.market_analysis?.[0];
  const sentimentCfg = analysis ? SENTIMENT_CONFIG[analysis.sentiment] : null;
  const impactCfg = analysis ? IMPACT_CONFIG[analysis.impact_magnitude] : null;
  const categoryCfg = CATEGORY_CONFIG[article.category] || CATEGORY_CONFIG.corporate;
  const VerificationIcon = analysis ? getVerificationIcon(analysis.is_verified) : null;

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const isNew = isNewArticle(article.published_at, 30);

  return (
    <article
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl border p-5 transition-all hover:shadow-xl hover:-translate-y-0.5 relative overflow-hidden ${
        isNew
          ? 'border-cyan-500/50 bg-cyan-500/5 animate-pulse-once ring-1 ring-cyan-500/30'
          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
      }`}
    >
      {isNew && (
        <div className="absolute top-0 right-0 px-2 py-0.5 bg-cyan-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-bl-lg flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5" />
          New
        </div>
      )}

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryCfg.bg} ${categoryCfg.color}`}>
          {categoryCfg.label}
        </span>
        {article.sector && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
            {article.sector}
          </span>
        )}
        {analysis && (
          <>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sentimentCfg?.bg} ${sentimentCfg?.text} flex items-center gap-1`}>
              {sentimentCfg && <sentimentCfg.icon className="h-3 w-3" />}
              {sentimentCfg?.label}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${impactCfg?.bg} ${impactCfg?.color}`}>
              {impactCfg?.label}
            </span>
          </>
        )}
      </div>

      <h3 className="text-base font-bold text-white leading-snug mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
        {article.title}
      </h3>

      <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-2">
        {article.summary}
      </p>

      {analysis && (
        <div className="mb-4 p-3 rounded-xl bg-black/30 border border-slate-800">
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ML Prediction</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Stock Move</span>
              <span className={`text-sm font-bold tabular-nums ${analysis.predicted_stock_move >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatSigned(analysis.predicted_stock_move)}
              </span>
            </div>
            {Math.abs(analysis.gold_impact) > 0.1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Gold</span>
                <span className={`text-sm font-bold tabular-nums ${analysis.gold_impact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatSigned(analysis.gold_impact)}
                </span>
              </div>
            )}
            {Math.abs(analysis.dollar_impact) > 0.1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">USD/INR</span>
                <span className={`text-sm font-bold tabular-nums ${analysis.dollar_impact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatSigned(analysis.dollar_impact)}
                </span>
              </div>
            )}
            {Math.abs(analysis.oil_impact) > 0.1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Oil</span>
                <span className={`text-sm font-bold tabular-nums ${analysis.oil_impact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatSigned(analysis.oil_impact)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">{article.source}</span>
          <span className="flex items-center gap-1 text-xs text-slate-600">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(article.published_at)}
          </span>
          {analysis && VerificationIcon && (
            <span className={`flex items-center gap-1 text-xs font-medium ${analysis.is_verified ? 'text-emerald-400' : 'text-amber-400'}`}>
              <VerificationIcon className="h-3.5 w-3.5" />
              {analysis.is_verified ? 'Verified' : 'Unverified'}
            </span>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
      </div>
    </article>
  );
}
