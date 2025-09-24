import { MarketData } from '../types/trading';

export class MarketDataService {
  private prices: Record<string, number> = {
    AAPL: 150.25,
    MSFT: 330.45,
    GOOGL: 2800.75,
    TSLA: 250.60,
    NVDA: 490.30,
    AMZN: 3400.20,
  };

  private subscribers: Set<(data: MarketData) => void> = new Set();

  constructor() {
    this.startPriceUpdates();
  }

  public getCurrentPrice(symbol: string): number {
    return this.prices[symbol] || 0;
  }

  public getHistoricalData(symbol: string, hours: number = 24): MarketData[] {
    const data: MarketData[] = [];
    const basePrice = this.prices[symbol];
    const now = Date.now();
    const interval = (hours * 60 * 60 * 1000) / 100; // 100 data points

    for (let i = 100; i >= 0; i--) {
      const timestamp = now - i * interval;
      const volatility = 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * 2 * volatility * basePrice;
      const price = i === 100 ? basePrice : data[data.length - 1].price + change;

      data.push({
        symbol,
        price: Math.max(price, basePrice * 0.5), // Prevent negative prices
        timestamp,
        volume: Math.floor(Math.random() * 10000) + 1000,
        change: i > 0 ? price - data[data.length - 1].price : 0,
        changePercent:
          i > 0
            ? ((price - data[data.length - 1].price) /
                data[data.length - 1].price) *
              100
            : 0,
      });
    }

    return data;
  }

  public subscribe(callback: (data: MarketData) => void): void {
    this.subscribers.add(callback);
  }

  public unsubscribe(callback: (data: MarketData) => void): void {
    this.subscribers.delete(callback);
  }

  private startPriceUpdates(): void {
    setInterval(() => {
      Object.keys(this.prices).forEach((symbol) => {
        const currentPrice = this.prices[symbol];
        const change = (Math.random() - 0.5) * 2 * currentPrice * 0.002; // 0.2% change
        const newPrice = Math.max(1, currentPrice + change);

        this.prices[symbol] = newPrice;

        const marketData: MarketData = {
          symbol,
          price: newPrice,
          timestamp: Date.now(),
          volume: Math.floor(Math.random() * 10000) + 1000,
          change: newPrice - currentPrice,
          changePercent: ((newPrice - currentPrice) / currentPrice) * 100,
        };

        this.notifySubscribers(marketData);
      });
    }, 1000); // Update every second
  }

  private notifySubscribers(data: MarketData): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in market data subscriber:', error);
      }
    });
  }
}

export const marketDataService = new MarketDataService();
