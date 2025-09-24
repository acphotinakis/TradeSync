import { create } from 'zustand';
import { tradingWebSocket } from '@/lib/websocket';

interface MarketData {
  symbol: string;
  price: number;
  timestamp: number;
  volume: number;
}

interface Portfolio {
  cash: number;
  positions: Record<string, number>;
  totalValue: number;
}

interface TradingState {
  marketData: Record<string, MarketData[]>;
  portfolio: Portfolio;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  placeOrder: (order: OrderRequest) => void;
}

export const useTradingStore = create<TradingState>((set, get) => ({
  marketData: {},
  portfolio: { cash: 100000, positions: {}, totalValue: 100000 },
  isConnected: false,

  connect: () => {
    tradingWebSocket.connect({
      onMarketData: (data: MarketData) => {
        set((state) => ({
          marketData: {
            ...state.marketData,
            [data.symbol]: [...(state.marketData[data.symbol] || []).slice(-100), data]
          }
        }));
      },
      onPortfolioUpdate: (portfolio: Portfolio) => {
        set({ portfolio });
      }
    });
    set({ isConnected: true });
  },

  disconnect: () => {
    tradingWebSocket.disconnect();
    set({ isConnected: false });
  },

  placeOrder: async (order: OrderRequest) => {
    const response = await fetch('/api/trading/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    
    if (response.ok) {
      tradingWebSocket.placeOrder(order);
    }
  }
}));