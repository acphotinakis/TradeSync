import { Request, Response, NextFunction } from 'express';
import { tradingService } from '../services/tradingService';
import { marketDataService } from '../services/marketDataService';
import { aiService } from '../services/aiService';
import { asyncHandler } from '../middleware/errorHandler';
import { OrderRequest } from '../types/trading';

export const getPortfolio = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const portfolio = await tradingService.getPortfolio(userId);
  res.json(portfolio);
});

export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const orderRequest: OrderRequest = req.body;
  
  const order = await tradingService.placeOrder(userId, orderRequest);
  res.status(201).json(order);
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const orders = await tradingService.getOrders(userId);
  res.json(orders);
});

export const getMarketData = asyncHandler(async (req: Request, res: Response) => {
  const { symbol, hours = '24' } = req.query;
  
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const historicalData = marketDataService.getHistoricalData(symbol, parseInt(hours as string));
  res.json(historicalData);
});

export const getAISignal = asyncHandler(async (req: Request, res: Response) => {
  const { symbol } = req.query;
  
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const historicalData = marketDataService.getHistoricalData(symbol, 24);
  const signal = await aiService.getTradingSignal(symbol, historicalData);
  res.json(signal);
});