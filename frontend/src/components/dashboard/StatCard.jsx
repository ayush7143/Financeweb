import { FaMoneyBillWave, FaChartLine, FaBalanceScale, FaExchangeAlt } from 'react-icons/fa';
import { useCurrencyFormat } from '../../utils/formUtils';

const StatCard = ({ title, value, icon, isLoading = false }) => {
  const formatCurrency = useCurrencyFormat();
  
  return (
    <div className="stat-card bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="stat-content">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
          {isLoading ? (
            <div className="animate-pulse h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
          ) : (
            <p className="stat-value text-2xl font-semibold text-gray-900 dark:text-white mt-2">
              {formatCurrency(value)}
            </p>
          )}
        </div>
        <div className="stat-icon p-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard; 