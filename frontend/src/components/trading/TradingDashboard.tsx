'use client';

import { useState, useEffect } from 'react';
import { useTradingStore } from '@/lib/stores/trading-store';
import { RealTimeChart } from '@/components/charts/RealTimeChart';
import { OrderPanel } from '@/components/trading/OrderPanel';
import { PortfolioOverview } from '@/components/trading/PortfolioOverview';
import { AISuggestions } from '@/components/ai/AISuggestions';

export default function TradingDashboard() {
  const { marketData, portfolio, connect, disconnect } = useTradingStore();
  const [selectedAsset, setSelectedAsset] = useState('AAPL');

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  return (
    <div className="grid grid-cols-12 gap-6 h-screen p-6">
      {/* Market Chart */}
      <div className="col-span-8 bg-white rounded-lg shadow-lg p-4">
        <RealTimeChart 
          data={marketData[selectedAsset] || []}
          symbol={selectedAsset}
        />
      </div>

      {/* Sidebar */}
      <div className="col-span-4 space-y-6">
        <PortfolioOverview portfolio={portfolio} />
        <OrderPanel symbol={selectedAsset} />
        <AISuggestions symbol={selectedAsset} />
      </div>
    </div>
  );
}