import type { MarketIndex } from '@/lib/supabase';
import { formatPercent } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function MarketTicker({ indices }: { indices: MarketIndex[] }) {
  return (
    <div className="border-b border-slate-800 bg-slate-950 overflow-hidden">
      <div className="flex gap-6 px-4 py-2.5 overflow-x-auto scrollbar-thin whitespace-nowrap items-center">
        {indices.map((idx) => {
          const isUp = idx.change >= 0;
          return (
            <div key={idx.id} className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-semibold text-slate-500">{idx.name}</span>
              <span className="text-sm font-bold text-white tabular-nums">
                {idx.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-semibold tabular-nums flex items-center ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isUp ? <TrendingUp className="inline h-3 w-3 mr-0.5" /> : <TrendingDown className="inline h-3 w-3 mr-0.5" />}
                {formatPercent(idx.change_percent)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
