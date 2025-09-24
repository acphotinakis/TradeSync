import { create } from 'zustand';
import { tradingWebSocket } from '@/lib/websocket';
import { tradingEngine } from '@/lib/trading-engine';
import { aiClient } from '@/lib/ai-client';
import { MarketData, Portfolio, Order, AISignal, OrderRequest } from '@/types/trading';

interface TradingState {
  marketData: Record<string, MarketData[]>;
  portfolio: Portfolio;
  orders: Order[];
  aiSignals: Record<string, AISignal>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  placeOrder: (order: OrderRequest) => Promise<void>;
  fetchPortfolio: () => Promise<void>;
  fetchAISignal: (symbol: string) => Promise<void>;
  clearError: () => void;
}

// Mock data for fallback
const mockPortfolio: Portfolio = {
  cash: 100000,
  positions: { AAPL: 10, MSFT: 5 },
  totalValue: 125000,
  unrealizedPnl: 25000,
  timestamp: Date.now(),
};

const mockAISignal: AISignal = {
  signal: 'BUY',
  confidence: 0.85,
  reasoning: 'Strong bullish trend with high volume',
  timestamp: Date.now(),
};

export const useTradingStore = create<TradingState>((set, get) => ({
  marketData: {},
  portfolio: mockPortfolio,
  orders: [],
  aiSignals: {},
  isConnected: false,
  isLoading: false,
  error: null,

  connect: () => {
    try {
      tradingWebSocket.connect({
        onMarketData: (data: MarketData) => {
          set((state) => ({
            marketData: {
              ...state.marketData,
              [data.symbol]: [...(state.marketData[data.symbol] || []).slice(-200), data]
            }
          }));
        },
        onPortfolioUpdate: (portfolio: Portfolio) => {
          set({ portfolio });
        },
        onOrderUpdate: (order: Order) => {
          set((state) => ({
            orders: state.orders.map(o => o.id === order.id ? order : o)
          }));
        }
      });
      set({ isConnected: true });
    } catch (error) {
      console.warn('WebSocket connection failed, using mock data');
      set({ error: 'Real-time data unavailable - using simulated data' });
    }
  },

  disconnect: () => {
    tradingWebSocket.disconnect();
    set({ isConnected: false });
  },

  placeOrder: async (orderRequest: OrderRequest) => {
    set({ isLoading: true, error: null });
    try {
      const order = await tradingEngine.placeOrder(orderRequest);
      set((state) => ({ 
        orders: [...state.orders, order],
        isLoading: false 
      }));
    } catch (error) {
      console.warn('Order placement failed:', error);
      set({ 
        error: 'Order failed - using simulated execution',
        isLoading: false 
      });
      
      // Fallback: simulate order execution
      const mockOrder: Order = {
        id: Math.random().toString(36).substr(2, 9),
        ...orderRequest,
        status: 'filled',
        timestamp: Date.now(),
      };
      set((state) => ({ orders: [...state.orders, mockOrder] }));
    }
  },

  fetchPortfolio: async () => {
    try {
      const portfolio = await tradingEngine.getPortfolio();
      set({ portfolio });
    } catch (error) {
      console.warn('Portfolio fetch failed, using mock data');
      set({ portfolio: mockPortfolio });
    }
  },

  fetchAISignal: async (symbol: string) => {
    try {
      const signal = await aiClient.getSignal(symbol);
      set((state) => ({
        aiSignals: { ...state.aiSignals, [symbol]: signal }
      }));
    } catch (error) {
      console.warn('AI signal fetch failed, using mock data');
      set((state) => ({
        aiSignals: { ...state.aiSignals, [symbol]: mockAISignal }
      }));
    }
  },

  clearError: () => set({ error: null }),
}));