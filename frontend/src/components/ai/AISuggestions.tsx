import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AISignal } from '@/types/trading';
import { aiClient } from '@/lib/ai-client';

interface AISuggestionsProps {
  symbol: string;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({ symbol }) => {
  const [signal, setSignal] = useState<AISignal | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAISignal();
  }, [symbol]);

  const fetchAISignal = async () => {
    setIsLoading(true);
    try {
      const aiSignal = await aiClient.getSignal(symbol);
      setSignal(aiSignal);
    } catch (error) {
      console.error('Failed to fetch AI signal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'BUY': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'SELL': return <TrendingDown className="h-5 w-5 text-red-500" />;
      default: return <Minus className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case 'BUY': return 'text-green-500';
      case 'SELL': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center space-x-2 text-white">
          <Brain className="h-5 w-5" />
          <span className="font-semibold">AI Analysis</span>
        </div>
        <div className="mt-2 text-gray-400">Analyzing market data...</div>
      </div>
    );
  }

  if (!signal) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-blue-500" />
          <span className="font-semibold text-white">AI Analysis</span>
        </div>
        <button 
          onClick={fetchAISignal}
          className="text-sm text-blue-500 hover:text-blue-400"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Signal</span>
          <div className="flex items-center space-x-2">
            {getSignalIcon(signal.signal)}
            <span className={`font-semibold ${getSignalColor(signal.signal)}`}>
              {signal.signal}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Confidence</span>
          <div className="w-24 bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${signal.confidence * 100}%` }}
            ></div>
          </div>
          <span className="text-white text-sm w-12 text-right">
            {(signal.confidence * 100).toFixed(0)}%
          </span>
        </div>

        <div>
          <span className="text-gray-400 text-sm">Reasoning</span>
          <p className="text-white text-sm mt-1">{signal.reasoning}</p>
        </div>

        <div className="text-xs text-gray-500">
          Updated: {new Date(signal.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};