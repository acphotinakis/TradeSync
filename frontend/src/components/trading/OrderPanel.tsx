import { useState } from 'react';
import { DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTradingStore } from '@/stores/trading-store';
import { OrderRequest } from '@/types/trading';

interface OrderPanelProps {
  symbol: string;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({ symbol }) => {
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const { placeOrder, isLoading, portfolio } = useTradingStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderRequest: OrderRequest = {
      symbol,
      type: orderType,
      side,
      quantity: parseInt(quantity),
      price: orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : undefined,
    };

    await placeOrder(orderRequest);
    
    // Reset form
    setQuantity('');
    setLimitPrice('');
  };

  const maxQuantity = side === 'buy' 
    ? Math.floor(portfolio.cash / (parseFloat(limitPrice) || 1))
    : portfolio.positions[symbol] || 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4">Place Order</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Order Type</label>
          <div className="flex space-x-2">
            <button
              type="button"
              className={`flex-1 py-2 px-3 rounded text-sm font-medium ${
                orderType === 'market' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setOrderType('market')}
            >
              Market
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 rounded text-sm font-medium ${
                orderType === 'limit' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setOrderType('limit')}
            >
              Limit
            </button>
          </div>
        </div>

        {/* Side Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Side</label>
          <div className="flex space-x-2">
            <button
              type="button"
              className={`flex-1 py-2 px-3 rounded text-sm font-medium flex items-center justify-center space-x-2 ${
                side === 'buy' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSide('buy')}
            >
              <ArrowUp className="h-4 w-4" />
              <span>Buy</span>
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 rounded text-sm font-medium flex items-center justify-center space-x-2 ${
                side === 'sell' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSide('sell')}
            >
              <ArrowDown className="h-4 w-4" />
              <span>Sell</span>
            </button>
          </div>
        </div>

        {/* Limit Price (conditionally rendered) */}
        {orderType === 'limit' && (
          <div>
            <label htmlFor="limitPrice" className="block text-sm font-medium text-gray-400 mb-2">
              Limit Price
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                id="limitPrice"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-400 mb-2">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            min="1"
            max={maxQuantity}
            required
          />
          <div className="text-xs text-gray-500 mt-1">
            Max: {maxQuantity} shares
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant={side === 'buy' ? 'primary' : 'danger'}
          isLoading={isLoading}
          className="w-full"
        >
          {side === 'buy' ? 'Buy' : 'Sell'} {symbol}
        </Button>
      </form>
    </div>
  );
};