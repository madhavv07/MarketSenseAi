import { useState } from 'react';
import { analyzeNews, type AnalysisResult } from '@/lib/analysisEngine';
import { supabase } from '@/lib/supabase';
import { formatSigned } from '@/lib/utils';
import {
  SENTIMENT_CONFIG, IMPACT_CONFIG, HORIZON_CONFIG,
  getVerificationIcon,
} from '@/lib/constants';
import {
  X, Sparkles, Loader2, TrendingUp, TrendingDown, Target,
  Zap, Gauge, Layers, Building2, ShieldCheck, ShieldAlert,
  FileText, Database, CheckCircle2, ArrowRight, Cpu,
  ScanLine, Brain, AlertTriangle,
} from 'lucide-react';

type Props = {
  onClose: () => void;
  onAnalyzed: () => void;
};

type Step = 'input' | 'processing' | 'results';

const PROCESSING_STEPS = [
  { label: 'Tokenizing input text', icon: FileText },
  { label: 'Extracting entities & sectors', icon: ScanLine },
  { label: 'Running sentiment analysis', icon: Brain },
  { label: 'Computing market impact model', icon: Cpu },
  { label: 'Generating predictions', icon: Gauge },
];

export function AnalyzeNewsForm({ onClose, onAnalyzed }: Props) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('corporate');
  const [sector, setSector] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [processingStep, setProcessingStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAnalyze = () => {
    if (!title.trim() || !summary.trim() || !content.trim() || !source.trim()) {
      setError('Please fill in all required fields before running analysis.');
      return;
    }
    setError(null);
    setStep('processing');
    setProcessingStep(0);

    // Animate through processing steps
    const stepInterval = setInterval(() => {
      setProcessingStep((prev) => {
        if (prev >= PROCESSING_STEPS.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 280);

    // After all steps, compute result
    setTimeout(() => {
      const analysis = analyzeNews({
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        source: source.trim(),
        category,
        sector: sector.trim() || undefined,
      });
      setResult(analysis);
      setStep('results');
    }, 280 * PROCESSING_STEPS.length + 200);
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    setError(null);

    try {
      const { data: articleData, error: articleError } = await supabase
        .from('news_articles')
        .insert({
          title: title.trim(),
          summary: summary.trim(),
          content: content.trim(),
          source: source.trim(),
          category,
          sector: sector.trim() || null,
          entities: [],
          region: 'india',
          published_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (articleError) throw articleError;
      if (!articleData) throw new Error('Failed to create article');

      const { error: analysisError } = await supabase
        .from('market_analysis')
        .insert({
          article_id: articleData.id,
          ...result,
        });

      if (analysisError) throw analysisError;

      setSaved(true);
      setSaving(false);
      onAnalyzed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save analysis');
      setSaving(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setResult(null);
    setSaved(false);
    setError(null);
  };

  const sentimentCfg = result ? SENTIMENT_CONFIG[result.sentiment] : null;
  const impactCfg = result ? IMPACT_CONFIG[result.impact_magnitude] : null;
  const horizonCfg = result ? HORIZON_CONFIG[result.time_horizon] : null;
  const VerificationIcon = result ? getVerificationIcon(result.is_verified) : null;

  const impacts = result ? [
    { label: 'Stock Move', value: result.predicted_stock_move },
    { label: 'Gold', value: result.gold_impact },
    { label: 'USD/INR', value: result.dollar_impact },
    { label: 'INR', value: result.rupee_impact },
    { label: 'Crude Oil', value: result.oil_impact },
    { label: 'Crypto', value: result.crypto_impact },
  ].filter(i => Math.abs(i.value) > 0.01) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-6 scrollbar-dark">
      <div className="relative w-full max-w-3xl my-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">AI News Analysis Terminal</h2>
              <p className="text-[10px] text-slate-500 leading-tight">ML-powered market impact prediction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-black/30">
          {(['input', 'processing', 'results'] as Step[]).map((s, i) => {
            const stepLabels = { input: 'Input', processing: 'Analysis', results: 'Results' };
            const isActive = step === s;
            const isPast = ['input', 'processing', 'results'].indexOf(step) > i;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                  isActive ? 'text-blue-400' : isPast ? 'text-emerald-400' : 'text-slate-600'
                }`}>
                  <span className={`flex items-center justify-center h-5 w-5 rounded-full text-[10px] transition-colors ${
                    isActive ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : isPast ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-600 border border-slate-700'
                  }`}>
                    {isPast ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                  </span>
                  {stepLabels[s]}
                </div>
                {i < 2 && <div className={`h-px w-6 ${isPast ? 'bg-emerald-500/30' : 'bg-slate-800'}`} />}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-5">
          {/* INPUT STEP */}
          {step === 'input' && (
            <div className="space-y-4 animate-fade-in-up">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  <FileText className="h-3 w-3" />
                  News Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. RBI cuts repo rate by 50 basis points"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-black/40 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  <FileText className="h-3 w-3" />
                  Summary <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="One-line summary of the news..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-black/40 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  <FileText className="h-3 w-3" />
                  Full Article Content <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste the full news article content here for analysis. The model will extract entities, detect sentiment, identify affected sectors, and predict market impacts..."
                  rows={6}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-black/40 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all resize-y scrollbar-dark"
                />
                <p className="text-[10px] text-slate-600 mt-1">
                  {content.trim().split(/\s+/).filter(Boolean).length} words · {content.length} characters
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Source <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. Reuters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-black/40 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-black/40 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                  >
                    <option value="corporate">Corporate</option>
                    <option value="political">Political</option>
                    <option value="economic">Economic</option>
                    <option value="global">Global</option>
                    <option value="commodity">Commodity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Sector (optional)</label>
                  <input
                    type="text"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="e.g. Banking"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-black/40 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-sm text-red-400">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-600/20"
              >
                <Sparkles className="h-4 w-4" />
                Run AI Market Analysis
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* PROCESSING STEP */}
          {step === 'processing' && (
            <div className="py-8 animate-fade-in-up">
              <div className="flex flex-col items-center mb-6">
                <div className="relative h-16 w-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-2 border-slate-800"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Cpu className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Running AI Analysis</h3>
                <p className="text-xs text-slate-500">Processing news data through ML models...</p>
              </div>

              <div className="space-y-2.5 max-w-md mx-auto">
                {PROCESSING_STEPS.map((ps, i) => {
                  const Icon = ps.icon;
                  const isDone = i < processingStep;
                  const isActive = i === processingStep;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                        isActive
                          ? 'border-blue-500/30 bg-blue-500/5'
                          : isDone
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-slate-800 bg-black/20 opacity-50'
                      }`}
                    >
                      <div className={`flex items-center justify-center h-7 w-7 rounded-lg ${
                        isActive ? 'bg-blue-500/20' : isDone ? 'bg-emerald-500/20' : 'bg-slate-800'
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : isActive ? (
                          <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                        ) : (
                          <Icon className="h-4 w-4 text-slate-600" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        isActive ? 'text-blue-300' : isDone ? 'text-emerald-300' : 'text-slate-600'
                      }`}>
                        {ps.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RESULTS STEP */}
          {step === 'results' && result && sentimentCfg && impactCfg && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Summary header */}
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Gauge className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Analysis Results</h3>
                <button
                  onClick={handleReset}
                  className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-400 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  New Analysis
                </button>
              </div>

              {/* Core metrics row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3 rounded-xl border ${sentimentCfg.border} ${sentimentCfg.bg}`}>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Sentiment</div>
                  <div className={`text-sm font-bold ${sentimentCfg.text} flex items-center gap-1`}>
                    <sentimentCfg.icon className="h-4 w-4" />
                    {sentimentCfg.label}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-black/30">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Score</div>
                  <div className={`text-sm font-bold tabular-nums ${result.sentiment_score >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatSigned(result.sentiment_score)}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-black/30">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Confidence</div>
                  <div className="text-sm font-bold text-white tabular-nums">{result.confidence}%</div>
                </div>
                <div className={`p-3 rounded-xl border border-slate-800 ${impactCfg.bg}`}>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Impact</div>
                  <div className={`text-sm font-bold ${impactCfg.color}`}>{impactCfg.label}</div>
                </div>
              </div>

              {/* Predicted price movements */}
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

              {/* Market prediction narrative */}
              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Gauge className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Market Prediction</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{result.market_prediction}</p>
              </div>

              {/* Sectors & companies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.affected_sectors.length > 0 && (
                  <div className="p-4 rounded-xl border border-slate-800 bg-black/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Layers className="h-4 w-4 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Affected Sectors</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.affected_sectors.map((s) => (
                        <span key={s} className="text-xs font-medium px-2 py-1 rounded-md bg-slate-800 text-slate-300">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {result.affected_companies.length > 0 && (
                  <div className="p-4 rounded-xl border border-slate-800 bg-black/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Companies to Watch</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.affected_companies.map((c) => (
                        <span key={c} className="text-xs font-medium px-2 py-1 rounded-md bg-blue-500/10 text-blue-400">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Key factors */}
              {result.key_factors.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-800 bg-black/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Key Factors</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.key_factors.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Verification & credibility */}
              {VerificationIcon && (
                <div className={`p-4 rounded-xl border ${result.is_verified ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <VerificationIcon className={`h-5 w-5 ${result.is_verified ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span className={`text-sm font-bold ${result.is_verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {result.is_verified ? 'News Verified' : 'Verification Pending'}
                    </span>
                    {horizonCfg && (
                      <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full bg-slate-900 ${horizonCfg.color}`}>
                        {horizonCfg.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed mb-2">{result.verification_notes}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Credibility:</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden max-w-[200px]">
                      <div
                        className={`h-full rounded-full ${result.credibility_score >= 80 ? 'bg-emerald-500' : result.credibility_score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${result.credibility_score}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-300 tabular-nums">{result.credibility_score}/100</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-sm text-red-400">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Save / Saved */}
              {!saved ? (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving to database...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      Publish to Live Feed
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Published successfully — visible in the live feed.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
