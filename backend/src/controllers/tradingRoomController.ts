import { Request, Response, NextFunction } from 'express';
import { tradingRoomService } from '../services/tradingRoomService';
import { asyncHandler } from '../middleware/errorHandler';

export const getRooms = asyncHandler(async (req: Request, res: Response) => {
  const rooms = tradingRoomService.getRooms();
  res.json(rooms);
});

export const getRoom = asyncHandler(async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = tradingRoomService.getRoom(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json(room);
});

export const joinRoom = asyncHandler(async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const userId = (req as any).user.id;
  
  tradingRoomService.joinRoom(roomId, userId);
  res.json({ success: true, message: 'Joined room' });
});

export const leaveRoom = asyncHandler(async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const userId = (req as any).user.id;
  
  tradingRoomService.leaveRoom(roomId, userId);
  res.json({ success: true, message: 'Left room' });
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { limit = '50' } = req.query;
  
  const messages = tradingRoomService.getMessages(roomId, parseInt(limit as string));
  res.json(messages);
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { text } = req.body;
  const user = (req as any).user.username;
  
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Message text is required' });
  }
  
  const message = tradingRoomService.sendMessage(roomId, user, text);
  res.status(201).json(message);
});