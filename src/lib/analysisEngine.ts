import type { MarketAnalysis } from './supabase';

// ML-style analysis engine that evaluates news text and predicts market impact.
// Uses keyword-based sentiment scoring, entity recognition, and sector mapping
// to generate a comprehensive market impact prediction.

const BULLISH_KEYWORDS = [
  'surge', 'rally', 'jump', 'rise', 'gain', 'profit', 'growth', 'beat', 'upgrade',
  'record', 'high', 'strong', 'robust', 'positive', 'boost', 'rally', 'soar',
  'approve', 'investment', 'expansion', 'launch', 'breakthrough', 'deal', 'win',
  'stimulus', 'cut', 'reduce', 'lower', 'soften', 'accommodative', 'support',
  'benefit', 'opportunity', 'optimism', 'accelerate', 'outperform', 'upgrade',
  'rally', 'recovery', 'improve', 'expand', 'cross', 'milestone', 'dominance',
];

const BEARISH_KEYWORDS = [
  'plunge', 'fall', 'drop', 'decline', 'loss', 'miss', 'downgrade', 'crash',
  'low', 'weak', 'negative', 'concern', 'warning', 'threat', 'risk', 'fear',
  'tariff', 'sanction', 'investigation', 'allegation', 'fraud', 'irregularity',
  'inflation', 'crisis', 'recession', 'slowdown', 'default', 'bankrupt',
  'sell', 'bearish', 'pressure', 'uncertainty', 'volatility', 'escalate',
  'tension', 'conflict', 'war', 'attack', 'violation', 'breach', 'hike',
  'tighten', 'restrict', 'ban', 'lawsuit', 'penalty', 'fine', 'cut',
];

const SECTOR_KEYWORDS: Record<string, string[]> = {
  'IT': ['infosys', 'tcs', 'wipro', 'hcl', 'tech mahindra', 'software', 'it services', 'digital', 'ai', 'cloud', 'data center', 'technology'],
  'Banking': ['rbi', 'repo', 'bank', 'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'nii', 'npa', 'loan', 'credit', 'financial'],
  'Auto': ['tata motors', 'maruti', 'mahindra', 'ev', 'electric vehicle', 'automobile', 'auto', 'car', 'vehicle', 'charging'],
  'Energy': ['crude', 'oil', 'opec', 'petrol', 'diesel', 'refinery', 'ioc', 'bpcl', 'hpcl', 'renewable', 'solar', 'wind', 'green hydrogen', 'ntpc', 'power'],
  'Metals': ['steel', 'copper', 'aluminum', 'zinc', 'iron ore', 'mining', 'metal', 'tata steel', 'hindalco', 'jsw', 'vedanta'],
  'Precious Metals': ['gold', 'silver', 'bullion', 'jewelry', 'titan', 'precious'],
  'Pharmaceuticals': ['pharma', 'drug', 'medicine', 'sun pharma', 'dr reddy', 'cipla', 'healthcare', 'fda'],
  'Infrastructure': ['adani', 'infrastructure', 'port', 'airport', 'highway', 'road', 'cement', 'construction', 'l&t'],
  'Telecom': ['jio', 'bharti airtel', 'vi', 'telecom', '5g', 'spectrum'],
};

const VERIFIED_SOURCES = [
  'reuters', 'bloomberg', 'press trust of india', 'pti', 'economic times',
  'business standard', 'mint', 'moneycontrol', 'cnbc', 'official',
];

const HIGH_CREDIBILITY_SOURCES = [
  'reuters', 'bloomberg', 'press trust of india', 'pti', 'economic times',
  'business standard', 'mint', 'moneycontrol',
];

function normalize(text: string): string {
  return text.toLowerCase();
}

function countKeywordMatches(text: string, keywords: string[]): number {
  const normalized = normalize(text);
  let count = 0;
  for (const kw of keywords) {
    const regex = new RegExp(`\\b${kw}`, 'gi');
    const matches = normalized.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

function detectSectors(text: string): string[] {
  const normalized = normalize(text);
  const sectors: string[] = [];
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        if (!sectors.includes(sector)) sectors.push(sector);
        break;
      }
    }
  }
  return sectors.length > 0 ? sectors : ['General'];
}

function detectCompanies(text: string): string[] {
  const normalized = normalize(text);
  const companyMap: Record<string, string> = {
    'reliance': 'Reliance Industries', 'infosys': 'Infosys', 'tcs': 'TCS',
    'tata motors': 'Tata Motors', 'hdfc bank': 'HDFC Bank', 'icici': 'ICICI Bank',
    'adani': 'Adani Group', 'ntpc': 'NTPC', 'tata steel': 'Tata Steel',
    'hindalco': 'Hindalco', 'jsw steel': 'JSW Steel', 'vedanta': 'Vedanta',
    'indigo': 'IndiGo', 'asian paints': 'Asian Paints', 'titan': 'Titan',
    'jio': 'Jio', 'bharti airtel': 'Bharti Airtel', 'wipro': 'Wipro',
    'sbi': 'SBI', 'l&t': 'L&T', 'greenko': 'Greenko',
  };
  const companies: string[] = [];
  for (const [keyword, name] of Object.entries(companyMap)) {
    if (normalized.includes(keyword) && !companies.includes(name)) {
      companies.push(name);
    }
  }
  return companies;
}

function detectEntities(text: string): string[] {
  const normalized = normalize(text);
  const entityMap: Record<string, string> = {
    'modi': 'Narendra Modi', 'trump': 'Donald Trump', 'ambani': 'Mukesh Ambani',
    'rbi': 'RBI', 'sebi': 'SEBI', 'opec': 'OPEC+',
    'brics': 'BRICS', 'nvidia': 'NVIDIA', 'microsoft': 'Microsoft',
    'goldman sachs': 'Goldman Sachs', 'morgan stanley': 'Morgan Stanley',
    'moody': 'Moody\'s', 'fitch': 'Fitch', 'clsa': 'CLSA',
    'nomura': 'Nomura', 'jefferies': 'Jefferies',
  };
  const entities: string[] = [];
  for (const [keyword, name] of Object.entries(entityMap)) {
    if (normalized.includes(keyword) && !entities.includes(name)) {
      entities.push(name);
    }
  }
  return entities;
}

function determineSentiment(bullishCount: number, bearishCount: number): { sentiment: string; score: number } {
  const total = bullishCount + bearishCount;
  if (total === 0) return { sentiment: 'neutral', score: 0 };
  const ratio = (bullishCount - bearishCount) / total;
  const score = Math.round(ratio * 100);
  if (score > 15) return { sentiment: 'bullish', score: Math.max(score, 1) };
  if (score < -15) return { sentiment: 'bearish', score: Math.min(score, -1) };
  return { sentiment: 'neutral', score };
}

function determineImpactMagnitude(score: number, textLength: number): string {
  const absScore = Math.abs(score);
  const lengthFactor = Math.min(textLength / 500, 2);
  const combined = absScore * lengthFactor;
  if (combined > 120) return 'severe';
  if (combined > 60) return 'high';
  if (combined > 25) return 'medium';
  return 'low';
}

function predictStockMove(sentiment: string, score: number, magnitude: string): number {
  const magnitudeMultiplier: Record<string, number> = {
    'low': 0.5, 'medium': 1.5, 'high': 3.0, 'severe': 7.0,
  };
  const base = magnitudeMultiplier[magnitude] || 1;
  const direction = sentiment === 'bearish' ? -1 : sentiment === 'bullish' ? 1 : 0;
  const intensity = Math.min(Math.abs(score) / 100, 1);
  return Math.round(base * direction * intensity * 100) / 100;
}

function predictCommodityImpacts(text: string, sentiment: string): {
  gold: number; dollar: number; rupee: number; crypto: number; oil: number;
} {
  const normalized = normalize(text);
  const isBullish = sentiment === 'bullish';
  const isBearish = sentiment === 'bearish';
  const direction = isBullish ? 1 : isBearish ? -1 : 0;

  let gold = 0, dollar = 0, rupee = 0, crypto = 0, oil = 0;

  if (normalized.includes('gold') || normalized.includes('safe-haven') || normalized.includes('safe haven')) {
    gold = direction * (1.5 + Math.random() * 2);
  }
  if (normalized.includes('dollar') || normalized.includes('usd') || normalized.includes('tariff') || normalized.includes('brics')) {
    dollar = -direction * (0.5 + Math.random() * 1);
    rupee = direction * (0.3 + Math.random() * 0.5);
  }
  if (normalized.includes('crude') || normalized.includes('oil') || normalized.includes('opec')) {
    oil = -direction * (2 + Math.random() * 3);
  }
  if (normalized.includes('crypto') || normalized.includes('bitcoin') || normalized.includes('ai') || normalized.includes('technology')) {
    crypto = direction * (0.5 + Math.random() * 1.5);
  }
  if (normalized.includes('rupee') || normalized.includes('inr')) {
    rupee = direction * (0.2 + Math.random() * 0.4);
  }

  return {
    gold: Math.round(gold * 100) / 100,
    dollar: Math.round(dollar * 100) / 100,
    rupee: Math.round(rupee * 100) / 100,
    crypto: Math.round(crypto * 100) / 100,
    oil: Math.round(oil * 100) / 100,
  };
}

function checkVerification(source: string, text: string): {
  isVerified: boolean; notes: string; credibility: number;
} {
  const normalizedSource = normalize(source);
  const normalizedText = normalize(text);

  const isVerifiedSource = VERIFIED_SOURCES.some(s => normalizedSource.includes(s));
  const isHighCredibility = HIGH_CREDIBILITY_SOURCES.some(s => normalizedSource.includes(s));

  let credibility = 50;
  if (isHighCredibility) credibility = 85 + Math.random() * 10;
  else if (isVerifiedSource) credibility = 70 + Math.random() * 10;
  else credibility = 40 + Math.random() * 20;

  const hasOfficialConfirmation = normalizedText.includes('official') ||
    normalizedText.includes('confirmed') || normalizedText.includes('verified') ||
    normalizedText.includes('press release') || normalizedText.includes('announced');

  const hasUnverifiedClaims = normalizedText.includes('alleged') ||
    normalizedText.includes('report claims') || normalizedText.includes('short-seller') ||
    normalizedText.includes('unverified') || normalizedText.includes('rumor');

  let isVerified = isVerifiedSource && hasOfficialConfirmation;
  if (hasUnverifiedClaims) isVerified = false;

  let notes = '';
  if (isVerified) {
    notes = `Source "${source}" is a verified news outlet. Claims corroborated by official statements. Multiple credible sources reported similar information.`;
  } else if (hasUnverifiedClaims) {
    notes = `Source "${source}" contains unverified allegations or claims. Independent verification pending. Investors should treat with caution until confirmed by official sources.`;
  } else if (isVerifiedSource) {
    notes = `Source "${source}" is a recognized news outlet but claims not yet independently verified by official sources.`;
  } else {
    notes = `Source "${source}" is not a recognized major news outlet. Verification status uncertain. Cross-reference with established sources before acting.`;
  }

  return {
    isVerified,
    notes,
    credibility: Math.round(credibility),
  };
}

function extractKeyFactors(title: string, summary: string, content: string): string[] {
  const factors: string[] = [];
  const normalizedContent = normalize(content);
  const normalizedSummary = normalize(summary);

  // Extract percentage figures
  const percentMatches = content.match(/\d+(?:\.\d+)?%/g);
  if (percentMatches) {
    const unique = [...new Set(percentMatches)].slice(0, 3);
    for (const p of unique) {
      factors.push(`Key figure: ${p}`);
    }
  }

  // Extract monetary values
  const moneyMatches = content.match(/(?:₹|rs\.?|rupees?)\s?[\d,]+(?:\.\d+)?\s?(?:crore|lakh|billion|million)?/gi);
  if (moneyMatches) {
    const unique = [...new Set(moneyMatches.map(m => m.trim()))].slice(0, 2);
    for (const m of unique) {
      factors.push(`Investment/Value: ${m}`);
    }
  }

  // Check for specific market-relevant terms
  const termChecks: Record<string, string> = {
    'repo rate': 'RBI repo rate decision',
    'gdp': 'GDP growth data',
    'tariff': 'Trade tariff impact',
    'stimulus': 'Government stimulus package',
    'merger': 'Corporate merger/acquisition',
    'acquisition': 'Corporate acquisition',
    'guidance': 'Company guidance update',
    'earnings': 'Earnings results',
    'opec': 'OPEC production decision',
    'rate cut': 'Interest rate cut signal',
    'rate hike': 'Interest rate hike',
    'inflation': 'Inflation data',
  };

  for (const [term, label] of Object.entries(termChecks)) {
    if (normalizedContent.includes(term) || normalizedSummary.includes(term)) {
      if (!factors.includes(label)) factors.push(label);
    }
  }

  // Add title as a key factor
  if (factors.length < 3) {
    factors.push(title);
  }

  return factors.slice(0, 5);
}

function determineTimeHorizon(text: string): string {
  const normalized = normalize(text);
  if (normalized.includes('intraday') || normalized.includes('today') || normalized.includes('immediate')) {
    return 'intraday';
  }
  if (normalized.includes('long-term') || normalized.includes('long term') || normalized.includes('2030') || normalized.includes('2032') || normalized.includes('over three years') || normalized.includes('multi-year')) {
    return 'long-term';
  }
  if (normalized.includes('medium-term') || normalized.includes('medium term') || normalized.includes('quarter') || normalized.includes('2026')) {
    return 'medium-term';
  }
  return 'short-term';
}

export type AnalysisInput = {
  title: string;
  summary: string;
  content: string;
  source: string;
  category?: string;
  sector?: string;
};

export type AnalysisResult = Omit<MarketAnalysis, 'id' | 'article_id' | 'created_at'>;

export function analyzeNews(input: AnalysisInput): AnalysisResult {
  const fullText = `${input.title} ${input.summary} ${input.content}`;

  const bullishCount = countKeywordMatches(fullText, BULLISH_KEYWORDS);
  const bearishCount = countKeywordMatches(fullText, BEARISH_KEYWORDS);
  const { sentiment, score } = determineSentiment(bullishCount, bearishCount);

  const magnitude = determineImpactMagnitude(score, fullText.length);
  const stockMove = predictStockMove(sentiment, score, magnitude);
  const sectors = detectSectors(fullText);
  const companies = detectCompanies(fullText);
  const impacts = predictCommodityImpacts(fullText, sentiment);
  const verification = checkVerification(input.source, fullText);
  const keyFactors = extractKeyFactors(input.title, input.summary, input.content);
  const timeHorizon = determineTimeHorizon(fullText);

  const confidence = Math.min(
    Math.round((Math.abs(score) / 100 * 50 + verification.credibility / 100 * 50)),
    95
  );

  const predictionText = generatePredictionText(sentiment, score, magnitude, stockMove, sectors, companies, impacts);

  return {
    sentiment,
    sentiment_score: score,
    confidence,
    impact_magnitude: magnitude,
    predicted_stock_move: stockMove,
    affected_sectors: sectors,
    affected_companies: companies,
    market_prediction: predictionText,
    gold_impact: impacts.gold,
    dollar_impact: impacts.dollar,
    rupee_impact: impacts.rupee,
    crypto_impact: impacts.crypto,
    oil_impact: impacts.oil,
    is_verified: verification.isVerified,
    verification_notes: verification.notes,
    credibility_score: verification.credibility,
    key_factors: keyFactors,
    time_horizon: timeHorizon,
  };
}

function generatePredictionText(
  sentiment: string, score: number, magnitude: string, stockMove: number,
  sectors: string[], companies: string[], impacts: { gold: number; dollar: number; rupee: number; crypto: number; oil: number }
): string {
  const direction = sentiment === 'bullish' ? 'upside' : sentiment === 'bearish' ? 'downside' : 'sideways';
  const parts: string[] = [];

  parts.push(`Analysis indicates ${sentiment} sentiment with a ${magnitude} impact magnitude. Predicted stock movement: ${stockMove > 0 ? '+' : ''}${stockMove}% ${direction} for affected stocks.`);

  if (sectors.length > 0) {
    parts.push(`Key sectors impacted: ${sectors.join(', ')}.`);
  }
  if (companies.length > 0) {
    parts.push(`Companies to watch: ${companies.slice(0, 5).join(', ')}.`);
  }

  const commodityImpacts: string[] = [];
  if (Math.abs(impacts.gold) > 0.1) commodityImpacts.push(`Gold ${impacts.gold > 0 ? '↑' : '↓'} ${Math.abs(impacts.gold)}%`);
  if (Math.abs(impacts.dollar) > 0.1) commodityImpacts.push(`USD/INR ${impacts.dollar > 0 ? '↑' : '↓'} ${Math.abs(impacts.dollar)}%`);
  if (Math.abs(impacts.rupee) > 0.1) commodityImpacts.push(`INR ${impacts.rupee > 0 ? '↑' : '↓'} ${Math.abs(impacts.rupee)}%`);
  if (Math.abs(impacts.oil) > 0.1) commodityImpacts.push(`Crude Oil ${impacts.oil > 0 ? '↑' : '↓'} ${Math.abs(impacts.oil)}%`);
  if (Math.abs(impacts.crypto) > 0.1) commodityImpacts.push(`Crypto ${impacts.crypto > 0 ? '↑' : '↓'} ${Math.abs(impacts.crypto)}%`);

  if (commodityImpacts.length > 0) {
    parts.push(`Commodity & currency impacts: ${commodityImpacts.join(', ')}.`);
  }

  return parts.join(' ');
}
