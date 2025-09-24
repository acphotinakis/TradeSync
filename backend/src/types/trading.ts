export interface MarketData {
  symbol: string;
  price: number;
  timestamp: number;
  volume: number;
  change?: number;
  changePercent?: number;
}

export interface Portfolio {
  cash: number;
  positions: Record<string, number>;
  totalValue: number;
  unrealizedPnl: number;
  timestamp: number;
}

export interface Order {
  id: string;
  symbol: string;
  type: 'market' | 'limit';
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  status: 'pending' | 'filled' | 'rejected' | 'cancelled';
  timestamp: number;
}

export interface OrderRequest {
  symbol: string;
  type: 'market' | 'limit';
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
}

export interface AISignal {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  timestamp: number;
}

export interface TradingRoom {
  id: string;
  name: string;
  participants: string[];
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  user: string;
  text: string;
  timestamp: number;
}