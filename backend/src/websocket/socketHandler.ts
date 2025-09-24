import { Server as SocketIOServer, Socket } from 'socket.io';
import { marketDataService } from '../services/marketDataService';
import { tradingService } from '../services/tradingService';
import { tradingRoomService } from '../services/tradingRoomService';
import { MarketData } from '../types/trading';

export class SocketHandler {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);

      // Market data subscription
      socket.on('subscribe', (symbol: string) => {
        this.handleMarketDataSubscription(socket, symbol);
      });

      // Order placement
      socket.on('placeOrder', (orderData: any) => {
        this.handleOrderPlacement(socket, orderData);
      });

      // Trading room events
      socket.on('joinRoom', (roomId: string) => {
        this.handleJoinRoom(socket, roomId);
      });

      socket.on('leaveRoom', (roomId: string) => {
        this.handleLeaveRoom(socket, roomId);
      });

      socket.on('sendMessage', (data: { roomId: string; text: string }) => {
        this.handleSendMessage(socket, data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        this.handleDisconnect(socket);
      });
    });
  }

  private handleMarketDataSubscription(socket: Socket, symbol: string): void {
    const marketDataCallback = (data: any) => {
      socket.emit('marketData', data);
    };

    marketDataService.subscribe(marketDataCallback);

    // Send initial historical data
    const historicalData = marketDataService.getHistoricalData(symbol, 24);
    socket.emit('historicalData', { symbol, data: historicalData });

    // Store callback reference for cleanup
    (socket as any).marketDataCallbacks = (socket as any).marketDataCallbacks || new Map();
    (socket as any).marketDataCallbacks.set(symbol, marketDataCallback);
  }

  private handleOrderPlacement(socket: Socket, orderData: any): void {
    // TODO: Implement actual order placement with user authentication
    const mockOrder = {
      id: Math.random().toString(36).substr(2, 9),
      ...orderData,
      status: 'pending' as const,
      timestamp: Date.now(),
    };

    socket.emit('orderUpdate', mockOrder);

    // Simulate order execution
    setTimeout(() => {
      const executedOrder = {
        ...mockOrder,
        status: 'filled' as const,
        executedPrice: orderData.price || 150, // Mock price
      };
      socket.emit('orderUpdate', executedOrder);
    }, 1000);
  }

  private handleJoinRoom(socket: Socket, roomId: string): void {
    socket.join(roomId);
    
    const roomCallback = (data: any) => {
      socket.emit('roomUpdate', data);
    };

    tradingRoomService.subscribeToRoom(roomId, roomCallback);
    (socket as any).roomCallbacks = (socket as any).roomCallbacks || new Map();
    (socket as any).roomCallbacks.set(roomId, roomCallback);

    // Send room state
    const room = tradingRoomService.getRoom(roomId);
    const messages = tradingRoomService.getMessages(roomId);
    socket.emit('roomState', { room, messages });
  }

  private handleLeaveRoom(socket: Socket, roomId: string): void {
    socket.leave(roomId);
    
    const callback = (socket as any).roomCallbacks?.get(roomId);
    if (callback) {
      tradingRoomService.unsubscribeFromRoom(roomId, callback);
    }
  }

  private handleSendMessage(socket: Socket, data: { roomId: string; text: string }): void {
    // TODO: Implement proper user authentication
    const mockUser = 'demo-user';
    const message = tradingRoomService.sendMessage(data.roomId, mockUser, data.text);
    
    this.io.to(data.roomId).emit('newMessage', message);
  }

  private handleDisconnect(socket: Socket): void {
    // Clean up market data subscriptions
    const marketDataCallback = (data: MarketData) => {
    socket.emit('marketData', data);
    };
    marketDataService.subscribe(marketDataCallback);


    // Clean up room subscriptions
    const roomCallbacks = (socket as any).roomCallbacks as Map<string, (data: any) => void>;
    if (roomCallbacks) {
    roomCallbacks.forEach((callback, roomId) => {
        tradingRoomService.unsubscribeFromRoom(roomId, callback);
    });
    }
  }
}