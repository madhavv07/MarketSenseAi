import { useEffect, useState, useRef } from 'react';
import type { ArticleWithAnalysis } from '@/lib/supabase';
import { SENTIMENT_CONFIG, CATEGORY_CONFIG } from '@/lib/constants';
import { Radio } from 'lucide-react';

type Props = {
  articles: ArticleWithAnalysis[];
  onArticleClick: (article: ArticleWithAnalysis) => void;
};

export function BreakingNewsTicker({ articles, onArticleClick }: Props) {
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tickerArticles = articles.slice(0, 15);

  useEffect(() => {
    if (paused) return;
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    let animationId: number;
    let offset = 0;

    const animate = () => {
      offset += 0.7;
      if (offset >= scrollEl.scrollWidth / 2) {
        offset = 0;
      }
      scrollEl.scrollLeft = offset;
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [paused, tickerArticles.length]);

  if (tickerArticles.length === 0) return null;

  const items = [...tickerArticles, ...tickerArticles];

  return (
    <div
      className="flex items-center gap-3 border-b border-red-500/20 bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 px-4 py-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white"></span>
        </span>
        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
          <Radio className="h-3.5 w-3.5" />
          Breaking
        </span>
      </div>
      <div className="h-4 w-px bg-white/30 flex-shrink-0" />
      <div
        ref={scrollRef}
        className="flex-1 overflow-hidden whitespace-nowrap"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="inline-flex gap-6">
          {items.map((article, i) => {
            const analysis = article.market_analysis?.[0];
            const sentimentCfg = analysis ? SENTIMENT_CONFIG[analysis.sentiment] : null;
            const categoryCfg = CATEGORY_CONFIG[article.category] || CATEGORY_CONFIG.corporate;
            return (
              <button
                key={`${article.id}-${i}`}
                onClick={() => onArticleClick(article)}
                className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors"
              >
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${categoryCfg.bg} ${categoryCfg.color}`}>
                  {categoryCfg.label}
                </span>
                {sentimentCfg && (
                  <sentimentCfg.icon className={`h-3.5 w-3.5 ${sentimentCfg.color}`} />
                )}
                <span className="font-medium">{article.title}</span>
                <span className="text-white/40">|</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
