import { Router } from 'express';
import { 
  getPortfolio, 
  placeOrder, 
  getOrders, 
  getMarketData,
  getAISignal 
} from '../controllers/tradingController';
import { 
  getRooms, 
  getRoom, 
  joinRoom, 
  leaveRoom, 
  getMessages, 
  sendMessage 
} from '../controllers/tradingRoomController';
import { requireAuth } from '../middleware/auth';
import { validateRequest, orderSchema } from '../middleware/validation';

const router = Router();

// Trading routes
router.get('/portfolio', requireAuth, getPortfolio);
router.post('/orders', requireAuth, validateRequest(orderSchema), placeOrder);
router.get('/orders', requireAuth, getOrders);
router.get('/market-data', getMarketData);
router.get('/ai-signal', getAISignal);

// Trading room routes
router.get('/rooms', requireAuth, getRooms);
router.get('/rooms/:roomId', requireAuth, getRoom);
router.post('/rooms/:roomId/join', requireAuth, joinRoom);
router.post('/rooms/:roomId/leave', requireAuth, leaveRoom);
router.get('/rooms/:roomId/messages', requireAuth, getMessages);
router.post('/rooms/:roomId/messages', requireAuth, sendMessage);

export default router;