import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MarketData } from '@/types/trading';

interface RealTimeChartProps {
  data: MarketData[];
  symbol: string;
}

export const RealTimeChart: React.FC<RealTimeChartProps> = ({ data, symbol }) => {
  const chartData = data.map(item => ({
    timestamp: new Date(item.timestamp).toLocaleTimeString(),
    price: item.price,
    volume: item.volume,
  }));

  const latestPrice = data.length > 0 ? data[data.length - 1].price : 0;
  const priceChange = data.length > 1 ? latestPrice - data[0].price : 0;
  const changePercent = data.length > 1 ? (priceChange / data[0].price) * 100 : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg h-96">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">{symbol} Price Chart</h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">${latestPrice.toFixed(2)}</p>
          <p className={`text-sm ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({changePercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="timestamp" 
            stroke="#9CA3AF"
            fontSize={12}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
            labelStyle={{ color: '#F3F4F6' }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#3B82F6" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#3B82F6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};