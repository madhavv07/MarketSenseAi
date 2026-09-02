import {
  TrendingUp, TrendingDown, Minus, ShieldCheck, ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

export const SENTIMENT_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; text: string; icon: LucideIcon;
}> = {
  bullish: {
    label: 'Bullish',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    icon: TrendingUp,
  },
  bearish: {
    label: 'Bearish',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: TrendingDown,
  },
  neutral: {
    label: 'Neutral',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: Minus,
  },
};

export const IMPACT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: 'Low Impact', color: 'text-sky-400', bg: 'bg-sky-500/10' },
  medium: { label: 'Medium Impact', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  high: { label: 'High Impact', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  severe: { label: 'Severe Impact', color: 'text-red-400', bg: 'bg-red-500/10' },
};

export const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  corporate: { label: 'Corporate', color: 'text-blue-300', bg: 'bg-blue-500/15' },
  political: { label: 'Political', color: 'text-purple-300', bg: 'bg-purple-500/15' },
  economic: { label: 'Economic', color: 'text-teal-300', bg: 'bg-teal-500/15' },
  global: { label: 'Global', color: 'text-cyan-300', bg: 'bg-cyan-500/15' },
  commodity: { label: 'Commodity', color: 'text-orange-300', bg: 'bg-orange-500/15' },
};

export const HORIZON_CONFIG: Record<string, { label: string; color: string }> = {
  intraday: { label: 'Intraday', color: 'text-rose-400' },
  'short-term': { label: 'Short Term', color: 'text-amber-400' },
  'medium-term': { label: 'Medium Term', color: 'text-blue-400' },
  'long-term': { label: 'Long Term', color: 'text-emerald-400' },
};

export function getVerificationIcon(verified: boolean): LucideIcon {
  return verified ? ShieldCheck : ShieldAlert;
}
