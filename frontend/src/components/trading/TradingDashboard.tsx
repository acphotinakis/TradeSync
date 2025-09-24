import { useState, useEffect } from 'react';
import { TradingDashboardProps } from './TradingDashboard.types';

import { PortfolioOverview } from './PortfolioOverview';
import { RealTimeChart } from '../charts/RealTimeChart';
import { OrderPanel } from './OrderPanel';
import { AISuggestions } from '../ai/AISuggestions';
import { useTradingStore } from '@/stores/trading-store';

const SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA'];

export const TradingDashboard: React.FC<TradingDashboardProps> = ({ initialData }) => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const { marketData, portfolio, connect, disconnect, fetchPortfolio, error } = useTradingStore();

  useEffect(() => {
    connect();
    fetchPortfolio();

    return () => {
      disconnect();
    };
  }, []);

  const currentData = marketData[selectedSymbol] || [];

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-600 text-white p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => useTradingStore.getState().clearError()} className="text-sm underline">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Symbol Selector */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {SYMBOLS.map((symbol) => (
          <button
            key={symbol}
            onClick={() => setSelectedSymbol(symbol)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedSymbol === symbol
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {symbol}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-3 space-y-6">
          <PortfolioOverview portfolio={portfolio} />
          <RealTimeChart data={currentData} symbol={selectedSymbol} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <OrderPanel symbol={selectedSymbol} />
          <AISuggestions symbol={selectedSymbol} />
        </div>
      </div>
    </div>
  );
};