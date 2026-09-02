import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type NewsArticle = {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  source_url: string | null;
  category: string;
  sector: string | null;
  entities: string[];
  region: string;
  published_at: string;
  created_at: string;
  image_url: string | null;
};

export type MarketAnalysis = {
  id: string;
  article_id: string;
  sentiment: string;
  sentiment_score: number;
  confidence: number;
  impact_magnitude: string;
  predicted_stock_move: number;
  affected_sectors: string[];
  affected_companies: string[];
  market_prediction: string;
  gold_impact: number;
  dollar_impact: number;
  rupee_impact: number;
  crypto_impact: number;
  oil_impact: number;
  is_verified: boolean;
  verification_notes: string;
  credibility_score: number;
  key_factors: string[];
  time_horizon: string;
  created_at: string;
};

export type MarketIndex = {
  id: string;
  name: string;
  symbol: string;
  value: number;
  change: number;
  change_percent: number;
  updated_at: string;
};

export type ArticleWithAnalysis = NewsArticle & {
  market_analysis: MarketAnalysis[];
};
