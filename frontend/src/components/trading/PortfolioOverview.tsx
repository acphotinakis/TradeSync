import { Portfolio } from '@/types/trading';

interface PortfolioOverviewProps {
  portfolio: Portfolio;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ portfolio }) => {
  const { cash, positions, totalValue, unrealizedPnl } = portfolio;
  const isProfit = unrealizedPnl >= 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Portfolio Overview</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-400 text-sm">Cash Balance</p>
          <p className="text-white text-2xl font-bold">${cash.toLocaleString()}</p>
        </div>
        
        <div>
          <p className="text-gray-400 text-sm">Total Value</p>
          <p className="text-white text-2xl font-bold">${totalValue.toLocaleString()}</p>
        </div>
        
        <div>
          <p className="text-gray-400 text-sm">Unrealized P&L</p>
          <p className={`text-2xl font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
            {isProfit ? '+' : ''}${unrealizedPnl.toLocaleString()}
          </p>
        </div>
        
        <div>
          <p className="text-gray-400 text-sm">Positions</p>
          <p className="text-white text-2xl font-bold">{Object.keys(positions).length}</p>
        </div>
      </div>

      {Object.keys(positions).length > 0 && (
        <div className="mt-4">
          <p className="text-gray-400 text-sm mb-2">Current Positions</p>
          <div className="space-y-2">
            {Object.entries(positions).map(([symbol, quantity]) => (
              <div key={symbol} className="flex justify-between text-white">
                <span>{symbol}</span>
                <span>{quantity} shares</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};