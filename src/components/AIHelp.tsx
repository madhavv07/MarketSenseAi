import { useState, useRef, useEffect } from 'react';
import type { ArticleWithAnalysis } from '@/lib/supabase';
import { analyzeNews } from '@/lib/analysisEngine';
import { Bot, Send, User, Loader2, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

type Props = {
  articles: ArticleWithAnalysis[];
};

type Message = {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
};

function generateAIResponse(query: string, articles: ArticleWithAnalysis[]): string {
  const q = query.toLowerCase();

  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return "Hello! I'm your MarketSense AI assistant. I can help you with:\n\n- Market sentiment analysis\n- Sector performance questions\n- Stock movement predictions\n- Investment recommendations\n- News impact questions\n\nAsk me anything about the current market!";
  }

  if (q.includes('bullish') || q.includes('positive')) {
    const bullish = articles.filter(a => a.market_analysis?.[0]?.sentiment === 'bullish');
    if (bullish.length === 0) return 'No bullish articles detected yet. Check back as more news comes in.';
    const topBullish = bullish.slice(0, 3);
    let response = `There are ${bullish.length} bullish articles right now. Here are the top ones:\n\n`;
    for (const a of topBullish) {
      const an = a.market_analysis[0];
      response += `- "${a.title}" — Predicted stock move: +${an.predicted_stock_move}%, Confidence: ${an.confidence}%\n`;
    }
    return response;
  }

  if (q.includes('bearish') || q.includes('negative') || q.includes('crash') || q.includes('fall')) {
    const bearish = articles.filter(a => a.market_analysis?.[0]?.sentiment === 'bearish');
    if (bearish.length === 0) return 'No bearish articles detected. Market sentiment appears stable.';
    const topBearish = bearish.slice(0, 3);
    let response = `There are ${bearish.length} bearish articles right now. Here are the most significant:\n\n`;
    for (const a of topBearish) {
      const an = a.market_analysis[0];
      response += `- "${a.title}" — Predicted stock move: ${an.predicted_stock_move}%, Impact: ${an.impact_magnitude}\n`;
    }
    return response;
  }

  if (q.includes('sector') || q.includes('which sector')) {
    const sectorMap = new Map<string, { count: number; score: number }>();
    for (const a of articles) {
      const an = a.market_analysis?.[0];
      if (!an) continue;
      for (const s of an.affected_sectors) {
        if (!sectorMap.has(s)) sectorMap.set(s, { count: 0, score: 0 });
        const d = sectorMap.get(s)!;
        d.count++;
        d.score += an.sentiment_score;
      }
    }
    if (sectorMap.size === 0) return 'No sector data available yet.';
    const sorted = [...sectorMap.entries()].sort((a, b) => b[1].score / b[1].count - a[1].score / a[1].count);
    let response = 'Here\'s the current sector sentiment ranking:\n\n';
    for (const [name, data] of sorted.slice(0, 5)) {
      const avg = Math.round(data.score / data.count);
      response += `- ${name}: ${avg > 0 ? '+' : ''}${avg} (from ${data.count} articles) ${avg > 15 ? '— Bullish' : avg < -15 ? '— Bearish' : '— Neutral'}\n`;
    }
    return response;
  }

  if (q.includes('invest') || q.includes('buy') || q.includes('should i')) {
    const analyzed = articles.filter(a => a.market_analysis?.[0]);
    if (analyzed.length === 0) return 'Not enough analyzed data to make investment recommendations yet.';
    const bullish = analyzed.filter(a => a.market_analysis[0].sentiment === 'bullish').length;
    const bearish = analyzed.filter(a => a.market_analysis[0].sentiment === 'bearish').length;
    if (bullish > bearish * 1.5) {
      return `Market sentiment is currently bullish (${bullish} bullish vs ${bearish} bearish articles). This suggests a favorable environment for investing. However, always do your own research and consider your risk tolerance. Focus on sectors with the strongest positive news flow.`;
    } else if (bearish > bullish * 1.5) {
      return `Market sentiment is currently bearish (${bearish} bearish vs ${bullish} bullish articles). Caution is advised. Consider waiting for sentiment to improve or focus on defensive sectors. If investing, look for quality stocks at discounted valuations.`;
    }
    return `Market sentiment is mixed (${bullish} bullish, ${bearish} bearish). This is a stock-picker's market. Focus on individual companies with strong fundamentals rather than broad market bets. Check the Sector Heat Map for specific sector recommendations.`;
  }

  if (q.includes('gold') || q.includes('oil') || q.includes('commodity')) {
    const commodityArticles = articles.filter(a => {
      const an = a.market_analysis?.[0];
      return an && (Math.abs(an.gold_impact) > 0.1 || Math.abs(an.oil_impact) > 0.1);
    });
    if (commodityArticles.length === 0) return 'No commodity-related articles found in the current feed.';
    let response = 'Here are the latest commodity impacts:\n\n';
    for (const a of commodityArticles.slice(0, 4)) {
      const an = a.market_analysis[0];
      response += `- "${a.title}"\n  Gold: ${an.gold_impact > 0 ? '+' : ''}${an.gold_impact}%, Oil: ${an.oil_impact > 0 ? '+' : ''}${an.oil_impact}%\n`;
    }
    return response;
  }

  if (q.includes('analyze') || q.includes('prediction for')) {
    return 'You can analyze any news article by clicking the "Analyze Now" button at the top right. Paste your news text and the AI will predict stock movements, commodity impacts, and investment recommendations instantly.';
  }

  if (q.includes('help') || q.includes('what can you do')) {
    return "I can help you with:\n\n1. Market sentiment — Ask 'What's the bullish news?'\n2. Sector analysis — Ask 'Which sectors are performing well?'\n3. Investment advice — Ask 'Should I invest now?'\n4. Commodity impacts — Ask 'What's happening with gold and oil?'\n5. General questions about the market\n\nJust type your question and I'll analyze the latest news for you!";
  }

  // Default: search articles for the query
  const matching = articles.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.summary.toLowerCase().includes(q) ||
    a.entities?.some((e: string) => e.toLowerCase().includes(q))
  );

  if (matching.length > 0) {
    let response = `I found ${matching.length} article(s) related to "${query}":\n\n`;
    for (const a of matching.slice(0, 3)) {
      const an = a.market_analysis?.[0];
      if (an) {
        response += `"${a.title}"\n`;
        response += `Sentiment: ${an.sentiment} (${an.sentiment_score > 0 ? '+' : ''}${an.sentiment_score}), Stock Move: ${an.predicted_stock_move > 0 ? '+' : ''}${an.predicted_stock_move}%\n`;
        response += `Prediction: ${an.market_prediction.slice(0, 120)}...\n\n`;
      }
    }
    return response;
  }

  return "I couldn't find specific information about that. Try asking about:\n- Current market sentiment\n- Best performing sectors\n- Whether to invest now\n- Gold or oil price impacts\n\nOr use the 'Analyze Now' button to analyze any news article.";
}

export function AIHelp({ articles }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: "Hi! I'm your MarketSense AI assistant. I can answer questions about market sentiment, sector performance, investment recommendations, and news impact. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  const handleSend = () => {
    if (!input.trim() || thinking) return;

    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    setTimeout(() => {
      const response = generateAIResponse(userMsg.content, articles);
      setMessages(prev => [...prev, { role: 'ai', content: response, timestamp: new Date() }]);
      setThinking(false);
    }, 600 + Math.random() * 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    'What sectors are bullish?',
    'Should I invest now?',
    'Latest bearish news',
    'Gold and oil impact',
  ];

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">AI Market Assistant</h2>
          <p className="text-xs text-slate-500">Ask about sentiment, sectors, or investments</p>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-dark space-y-3 pr-2 mb-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center justify-center h-7 w-7 rounded-lg flex-shrink-0 ${
              msg.role === 'ai' ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-slate-700'
            }`}>
              {msg.role === 'ai' ? <Bot className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-slate-300" />}
            </div>
            <div className={`max-w-[80%] rounded-xl p-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'ai'
                ? 'bg-slate-900 border border-slate-800 text-slate-300'
                : 'bg-cyan-600/20 border border-cyan-500/20 text-slate-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex gap-2.5">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="rounded-xl p-3 bg-slate-900 border border-slate-800">
              <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Questions */}
      <div className="flex flex-wrap gap-2 mb-3">
        {quickQuestions.map((qq) => (
          <button
            key={qq}
            onClick={() => setInput(qq)}
            className="text-xs font-medium px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-400 transition-all"
          >
            {qq}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about the market..."
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-800 bg-black/40 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || thinking}
          className="flex items-center justify-center px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-600/20"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
