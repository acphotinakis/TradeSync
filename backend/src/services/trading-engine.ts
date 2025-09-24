import { Socket } from 'socket.io';

interface Order {
  id: string;
  symbol: string;
  type: 'market' | 'limit';
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
}

export class TradingEngine {
  private subscriptions: Map<string, Set<Socket>> = new Map();
  private marketData: Map<string, number> = new Map();

  constructor() {
    this.startMarketDataSimulation();
  }

  subscribe(socket: Socket, symbol: string) {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
    }
    this.subscriptions.get(symbol)!.add(socket);
  }

  unsubscribe(socket: Socket) {
    this.subscriptions.forEach((sockets, symbol) => {
      sockets.delete(socket);
    });
  }

  async processOrder(order: Order, socket: Socket) {
    // Simulate order processing
    const executionPrice = this.marketData.get(order.symbol) || 0;
    
    // Validate order
    if (order.type === 'limit' && order.price && order.side === 'buy' && order.price < executionPrice) {
      socket.emit('orderRejected', { orderId: order.id, reason: 'Price not acceptable' });
      return;
    }

    // Simulate execution delay
    setTimeout(() => {
      const executedOrder = {
        ...order,
        executedPrice: executionPrice,
        timestamp: Date.now(),
        status: 'filled'
      };
      
      socket.emit('orderExecuted', executedOrder);
      this.broadcastPortfolioUpdate(socket, executedOrder);
    }, 50); // 50ms simulation delay
  }

  private startMarketDataSimulation() {
    // Simulate real-time market data
    setInterval(() => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];
      symbols.forEach(symbol => {
        const currentPrice = this.marketData.get(symbol) || 150;
        const newPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
        this.marketData.set(symbol, newPrice);

        this.broadcastMarketData(symbol, {
          symbol,
          price: newPrice,
          timestamp: Date.now(),
          volume: Math.floor(Math.random() * 10000)
        });
      });
    }, 100); // Update every 100ms
  }

  private broadcastMarketData(symbol: string, data: any) {
    const sockets = this.subscriptions.get(symbol);
    if (sockets) {
      sockets.forEach(socket => {
        socket.emit('marketData', data);
      });
    }
  }

  private broadcastPortfolioUpdate(socket: Socket, order: any) {
    // Calculate new portfolio and broadcast
    socket.emit('portfolioUpdate', this.calculatePortfolio(order));
  }

  private calculatePortfolio(order: any) {
    // Simplified portfolio calculation
    return {
      cash: 100000 - order.quantity * order.executedPrice,
      positions: { [order.symbol]: order.quantity },
      totalValue: 100000,
      timestamp: Date.now()
    };
  }
}