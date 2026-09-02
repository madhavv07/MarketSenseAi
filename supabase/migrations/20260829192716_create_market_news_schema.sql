/*
# Market News Analysis Platform - Database Schema

## Overview
Creates the complete schema for an Indian market news analysis platform that tracks
news articles, runs ML-based sentiment and market impact analysis, monitors market
indices (Nifty, Sensex, Gold, USD/INR), and stores analysis predictions.

## New Tables

1. `news_articles`
   - Stores news articles from across India and global markets
   - `id` (uuid PK), `title`, `summary`, `content`, `source`, `source_url`
   - `category` (text) - e.g. 'corporate', 'political', 'economic', 'global', 'commodity'
   - `sector` (text) - e.g. 'IT', 'Banking', 'Energy', 'Auto', 'Pharma'
   - `entities` (text[]) - tagged entities like company names, political figures
   - `region` (text) - 'india', 'global', 'us', 'china' etc.
   - `published_at` (timestamptz), `created_at` (timestamptz)
   - `image_url` (text, nullable)

2. `market_analysis`
   - ML analysis results for each news article
   - `id` (uuid PK), `article_id` (FK -> news_articles)
   - `sentiment` (text) - 'bullish', 'bearish', 'neutral'
   - `sentiment_score` (numeric, -100 to 100)
   - `confidence` (numeric, 0 to 100)
   - `impact_magnitude` (text) - 'low', 'medium', 'high', 'severe'
   - `predicted_stock_move` (numeric) - estimated % move for affected stocks
   - `affected_sectors` (text[]) - sectors predicted to be impacted
   - `affected_companies` (text[]) - specific companies predicted to be impacted
   - `market_prediction` (text) - narrative description of predicted market effect
   - `gold_impact` (numeric) - predicted gold price move %
   - `dollar_impact` (numeric) - predicted USD/INR move %
   - `rupee_impact` (numeric) - predicted INR move %
   - `crypto_impact` (numeric) - predicted crypto move %
   - `oil_impact` (numeric) - predicted crude oil move %
   - `is_verified` (boolean) - whether the news source/claim is verified
   - `verification_notes` (text) - explanation of verification status
   - `credibility_score` (numeric, 0-100) - source credibility rating
   - `key_factors` (text[]) - bullet-point factors driving the analysis
   - `time_horizon` (text) - 'intraday', 'short-term', 'medium-term', 'long-term'
   - `created_at` (timestamptz)

3. `market_indices`
   - Current state of major market indicators
   - `id` (uuid PK), `name`, `symbol`, `value` (numeric), `change` (numeric),
     `change_percent` (numeric), `updated_at` (timestamptz)

## Security
- All tables have RLS enabled.
- This is a single-tenant app with no sign-in, so all policies use `TO anon, authenticated`
  with `USING (true)` / `WITH CHECK (true)` since all data is intentionally public/shared.
*/

-- News articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  content text NOT NULL,
  source text NOT NULL,
  source_url text,
  category text NOT NULL DEFAULT 'corporate',
  sector text,
  entities text[] DEFAULT '{}',
  region text NOT NULL DEFAULT 'india',
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  image_url text
);

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_news" ON news_articles;
CREATE POLICY "anon_select_news" ON news_articles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_news" ON news_articles;
CREATE POLICY "anon_insert_news" ON news_articles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_news" ON news_articles;
CREATE POLICY "anon_update_news" ON news_articles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_news" ON news_articles;
CREATE POLICY "anon_delete_news" ON news_articles FOR DELETE
  TO anon, authenticated USING (true);

-- Market analysis table
CREATE TABLE IF NOT EXISTS market_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  sentiment text NOT NULL DEFAULT 'neutral',
  sentiment_score numeric NOT NULL DEFAULT 0,
  confidence numeric NOT NULL DEFAULT 0,
  impact_magnitude text NOT NULL DEFAULT 'low',
  predicted_stock_move numeric NOT NULL DEFAULT 0,
  affected_sectors text[] DEFAULT '{}',
  affected_companies text[] DEFAULT '{}',
  market_prediction text NOT NULL DEFAULT '',
  gold_impact numeric NOT NULL DEFAULT 0,
  dollar_impact numeric NOT NULL DEFAULT 0,
  rupee_impact numeric NOT NULL DEFAULT 0,
  crypto_impact numeric NOT NULL DEFAULT 0,
  oil_impact numeric NOT NULL DEFAULT 0,
  is_verified boolean NOT NULL DEFAULT false,
  verification_notes text NOT NULL DEFAULT '',
  credibility_score numeric NOT NULL DEFAULT 50,
  key_factors text[] DEFAULT '{}',
  time_horizon text NOT NULL DEFAULT 'short-term',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE market_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_analysis" ON market_analysis;
CREATE POLICY "anon_select_analysis" ON market_analysis FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_analysis" ON market_analysis;
CREATE POLICY "anon_insert_analysis" ON market_analysis FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_analysis" ON market_analysis;
CREATE POLICY "anon_update_analysis" ON market_analysis FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_analysis" ON market_analysis;
CREATE POLICY "anon_delete_analysis" ON market_analysis FOR DELETE
  TO anon, authenticated USING (true);

-- Market indices table
CREATE TABLE IF NOT EXISTS market_indices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  symbol text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  change numeric NOT NULL DEFAULT 0,
  change_percent numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE market_indices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_indices" ON market_indices;
CREATE POLICY "anon_select_indices" ON market_indices FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_indices" ON market_indices;
CREATE POLICY "anon_insert_indices" ON market_indices FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_indices" ON market_indices;
CREATE POLICY "anon_update_indices" ON market_indices FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_indices" ON market_indices;
CREATE POLICY "anon_delete_indices" ON market_indices FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_sector ON news_articles(sector);
CREATE INDEX IF NOT EXISTS idx_market_analysis_article_id ON market_analysis(article_id);
CREATE INDEX IF NOT EXISTS idx_market_indices_symbol ON market_indices(symbol);
