import { Order, Portfolio, OrderRequest, MarketData } from '../types/trading';
import { marketDataService } from './marketDataService';
import { v4 as uuidv4 } from 'uuid';

export class TradingService {
  private portfolios: Map<string, Portfolio> = new Map();
  private orders: Map<string, Order> = new Map();
  private orderSubscribers: Set<Function> = new Set();

  constructor() {
    // Initialize demo portfolio
    this.portfolios.set('user-123', {
      cash: 100000,
      positions: { AAPL: 10, MSFT: 5 },
      totalValue: 125000,
      unrealizedPnl: 25000,
      timestamp: Date.now(),
    });
  }

  public async placeOrder(userId: string, orderRequest: OrderRequest): Promise<Order> {
    const portfolio = this.portfolios.get(userId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const currentPrice = marketDataService.getCurrentPrice(orderRequest.symbol);
    const order: Order = {
      id: uuidv4(),
      ...orderRequest,
      status: 'pending',
      timestamp: Date.now(),
    };

    // Validate order
    if (orderRequest.side === 'buy') {
      const cost = orderRequest.quantity * (orderRequest.price || currentPrice);
      if (cost > portfolio.cash) {
        order.status = 'rejected';
        throw new Error('Insufficient funds');
      }
    } else {
      const currentPosition = portfolio.positions[orderRequest.symbol] || 0;
      if (orderRequest.quantity > currentPosition) {
        order.status = 'rejected';
        throw new Error('Insufficient position');
      }
    }

    // Simulate order execution
    setTimeout(() => this.executeOrder(userId, order, currentPrice), 100);

    this.orders.set(order.id, order);
    this.notifyOrderSubscribers(order);
    
    return order;
  }

  public async getPortfolio(userId: string): Promise<Portfolio> {
    const portfolio = this.portfolios.get(userId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Update portfolio value with current prices
    let totalValue = portfolio.cash;
    let unrealizedPnl = 0;

    Object.entries(portfolio.positions).forEach(([symbol, quantity]) => {
      const currentPrice = marketDataService.getCurrentPrice(symbol);
      const positionValue = quantity * currentPrice;
      totalValue += positionValue;
      // Simplified PnL calculation
      unrealizedPnl += positionValue * 0.1; // Assume 10% gain for demo
    });

    const updatedPortfolio: Portfolio = {
      ...portfolio,
      totalValue,
      unrealizedPnl,
      timestamp: Date.now(),
    };

    this.portfolios.set(userId, updatedPortfolio);
    return updatedPortfolio;
  }

  public async getOrders(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => this.isUserOrder(order.id, userId))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  public subscribeToOrders(callback: (order: Order) => void): void {
    this.orderSubscribers.add(callback);
  }

  private executeOrder(userId: string, order: Order, currentPrice: number): void {
    const portfolio = this.portfolios.get(userId);
    if (!portfolio) return;

    const executionPrice = order.price && order.type === 'limit' 
      ? order.price 
      : currentPrice;

    if (order.side === 'buy') {
      const cost = order.quantity * executionPrice;
      portfolio.cash -= cost;
      portfolio.positions[order.symbol] = (portfolio.positions[order.symbol] || 0) + order.quantity;
    } else {
      const revenue = order.quantity * executionPrice;
      portfolio.cash += revenue;
      portfolio.positions[order.symbol] = (portfolio.positions[order.symbol] || 0) - order.quantity;
      
      if (portfolio.positions[order.symbol] <= 0) {
        delete portfolio.positions[order.symbol];
      }
    }

    const executedOrder: Order = {
      ...order,
      status: 'filled',
      price: executionPrice, // Update with actual execution price
    };

    this.orders.set(order.id, executedOrder);
    this.notifyOrderSubscribers(executedOrder);
  }

  private isUserOrder(orderId: string, userId: string): boolean {
    // Simplified user-order association
    // In production, store userId with order
    return true; // Demo implementation
  }

  private notifyOrderSubscribers(order: Order): void {
    this.orderSubscribers.forEach(callback => {
      try {
        callback(order);
      } catch (error) {
        console.error('Error in order subscriber:', error);
      }
    });
  }
}

export const tradingService = new TradingService();