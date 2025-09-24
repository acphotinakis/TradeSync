import { io, Socket } from 'socket.io-client';
import { MarketData, Portfolio, Order } from '@/types/trading';

interface WebSocketCallbacks {
  onMarketData: (data: MarketData) => void;
  onPortfolioUpdate: (portfolio: Portfolio) => void;
  onOrderUpdate: (order: Order) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

class TradingWebSocket {
  private socket: Socket | null = null;
  private callbacks: WebSocketCallbacks | null = null;
  private isConnected = false;

  connect(callbacks: WebSocketCallbacks) {
    try {
      // TODO: Replace with actual backend WebSocket URL
      const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      
      this.socket = io(WS_URL, {
        transports: ['websocket'],
        timeout: 5000,
      });

      this.callbacks = callbacks;

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        callbacks.onConnect?.();
        
        // Subscribe to default symbols
        this.subscribe('AAPL');
        this.subscribe('MSFT');
        this.subscribe('GOOGL');
      });

      this.socket.on('marketData', (data: MarketData) => {
        callbacks.onMarketData(data);
      });

      this.socket.on('portfolioUpdate', (portfolio: Portfolio) => {
        callbacks.onPortfolioUpdate(portfolio);
      });

      this.socket.on('orderUpdate', (order: Order) => {
        callbacks.onOrderUpdate(order);
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        callbacks.onDisconnect?.();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.simulateMarketData(); // Fallback to simulated data
      });

    } catch (error) {
      console.error('WebSocket initialization failed:', error);
      this.simulateMarketData(); // Fallback to simulated data
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  subscribe(symbol: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe', symbol);
    }
  }

  placeOrder(order: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('placeOrder', order);
    }
  }

  private simulateMarketData() {
    console.warn('Using simulated market data');
    
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA'];
    let prices: Record<string, number> = {
      AAPL: 150, MSFT: 330, GOOGL: 2800, TSLA: 250
    };

    setInterval(() => {
      symbols.forEach(symbol => {
        const currentPrice = prices[symbol];
        const change = (Math.random() - 0.5) * 2;
        const newPrice = Math.max(1, currentPrice + change);
        prices[symbol] = newPrice;

        const marketData: MarketData = {
          symbol,
          price: newPrice,
          timestamp: Date.now(),
          volume: Math.floor(Math.random() * 10000),
          change: newPrice - currentPrice,
          changePercent: ((newPrice - currentPrice) / currentPrice) * 100
        };

        this.callbacks?.onMarketData(marketData);
      });
    }, 1000); // Update every second
  }
}

export const tradingWebSocket = new TradingWebSocket();