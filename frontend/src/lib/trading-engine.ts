import { Order, Portfolio, OrderRequest } from '@/types/trading';

// TODO: Replace with actual backend API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class TradingEngine {
  private async fetchWithFallback<T>(endpoint: string, mockData: T): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`API call failed for ${endpoint}, using mock data:`, error);
      return mockData;
    }
  }

  async placeOrder(orderRequest: OrderRequest): Promise<Order> {
    const mockOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      ...orderRequest,
      status: 'filled',
      timestamp: Date.now(),
    };

    return this.fetchWithFallback('/trading/orders', mockOrder, {
      method: 'POST',
      body: JSON.stringify(orderRequest),
    });
  }

  async getPortfolio(): Promise<Portfolio> {
    const mockPortfolio: Portfolio = {
      cash: 100000,
      positions: { AAPL: 10, MSFT: 5 },
      totalValue: 125000,
      unrealizedPnl: 25000,
      timestamp: Date.now(),
    };

    return this.fetchWithFallback('/trading/portfolio', mockPortfolio);
  }

  async getOrders(): Promise<Order[]> {
    const mockOrders: Order[] = [];
    return this.fetchWithFallback('/trading/orders', mockOrders);
  }

  private async fetchWithFallback<T>(
    endpoint: string, 
    mockData: T, 
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`API call failed for ${endpoint}, using mock data:`, error);
      return mockData;
    }
  }
}

export const tradingEngine = new TradingEngine();