import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import tradingRoutes from './routes/trading';
import { TradingEngine } from './services/trading-engine';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' }
});

app.use(cors());
app.use(express.json());
app.use('/api/trading', tradingRoutes);

const tradingEngine = new TradingEngine();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe', (symbol: string) => {
    tradingEngine.subscribe(socket, symbol);
  });

  socket.on('placeOrder', (order) => {
    tradingEngine.processOrder(order, socket);
  });

  socket.on('disconnect', () => {
    tradingEngine.unsubscribe(socket);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});