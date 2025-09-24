import { ChatMessage, TradingRoom } from '../types/trading';
import { v4 as uuidv4 } from 'uuid';

export class TradingRoomService {
  private rooms: Map<string, TradingRoom> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();
  private roomSubscribers: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    // Create demo trading room
    const demoRoom: TradingRoom = {
      id: 'room-1',
      name: 'General Trading',
      participants: ['user-123', 'trader-2', 'trader-3'],
      createdAt: Date.now(),
    };
    this.rooms.set(demoRoom.id, demoRoom);
    this.messages.set(demoRoom.id, []);
  }

  public getRooms(): TradingRoom[] {
    return Array.from(this.rooms.values());
  }

  public getRoom(roomId: string): TradingRoom | undefined {
    return this.rooms.get(roomId);
  }

  public joinRoom(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (room && !room.participants.includes(userId)) {
      room.participants.push(userId);
      this.notifyRoomSubscribers(roomId, room);
    }
  }

  public leaveRoom(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.participants = room.participants.filter(p => p !== userId);
      this.notifyRoomSubscribers(roomId, room);
    }
  }

  public sendMessage(roomId: string, user: string, text: string): ChatMessage {
    const message: ChatMessage = {
      id: uuidv4(),
      roomId,
      user,
      text,
      timestamp: Date.now(),
    };

    const roomMessages = this.messages.get(roomId) || [];
    roomMessages.push(message);
    this.messages.set(roomId, roomMessages);

    this.notifyMessageSubscribers(roomId, message);
    return message;
  }

  public getMessages(roomId: string, limit: number = 50): ChatMessage[] {
    const messages = this.messages.get(roomId) || [];
    return messages.slice(-limit);
  }

  public subscribeToRoom(roomId: string, callback: (data: any) => void): void {
    if (!this.roomSubscribers.has(roomId)) {
      this.roomSubscribers.set(roomId, new Set());
    }
    this.roomSubscribers.get(roomId)!.add(callback);
  }

  public unsubscribeFromRoom(roomId: string, callback: (data: any) => void): void {
    this.roomSubscribers.get(roomId)?.delete(callback);
  }

  private notifyRoomSubscribers(roomId: string, room: TradingRoom): void {
    this.roomSubscribers.get(roomId)?.forEach(callback => {
      try {
        callback({ type: 'room_update', room });
      } catch (error) {
        console.error('Error in room subscriber:', error);
      }
    });
  }

  private notifyMessageSubscribers(roomId: string, message: ChatMessage): void {
    this.roomSubscribers.get(roomId)?.forEach(callback => {
      try {
        callback({ type: 'new_message', message });
      } catch (error) {
        console.error('Error in message subscriber:', error);
      }
    });
  }
}

export const tradingRoomService = new TradingRoomService();