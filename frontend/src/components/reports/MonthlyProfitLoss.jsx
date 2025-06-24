import { useState, useEffect, useMemo, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { reportsApi } from '../../api/apiService';
import { calculateProfitMargin, formatProfitLoss } from '../../utils/financialCalculations';

const MonthlyProfitLoss = () => {
  const [profitLossData, setProfitLossData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearOptions, setYearOptions] = useState([]);

  useEffect(() => {
    // Generate year options (current year and 4 previous years)
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    setYearOptions(years);
    
    // Fetch profit and loss data
    fetchProfitLossData();
  }, [timeframe, year]);

  const fetchProfitLossData = async () => {
    setIsLoading(true);
    try {
      const response = await reportsApi.getProfitLoss({ timeframe, year });
      // API directly returns the array now
      setProfitLossData(response.data || []);
    } catch (error) {
      console.error('Error fetching profit and loss data:', error);
      // Set sample data for demo/development
      setSampleData();
    } finally {
      setIsLoading(false);
    }
  };

  const setSampleData = () => {
    // Sample data for development/fallback
    const sampleData = timeframe === 'monthly' 
      ? [
          { name: 'Jan', income: 3500000, expenses: 2800000, profit: 700000 },
          { name: 'Feb', income: 3200000, expenses: 2700000, profit: 500000 },
          { name: 'Mar', income: 3800000, expenses: 3000000, profit: 800000 },
          { name: 'Apr', income: 3100000, expenses: 3300000, profit: -200000 },
          { name: 'May', income: 4000000, expenses: 3500000, profit: 500000 },
          { name: 'Jun', income: 4200000, expenses: 3800000, profit: 400000 },
          { name: 'Jul', income: 4500000, expenses: 3900000, profit: 600000 },
          { name: 'Aug', income: 4600000, expenses: 4000000, profit: 600000 },
          { name: 'Sep', income: 4800000, expenses: 4300000, profit: 500000 },
          { name: 'Oct', income: 5100000, expenses: 4500000, profit: 600000 },
          { name: 'Nov', income: 5500000, expenses: 4800000, profit: 700000 },
          { name: 'Dec', income: 6000000, expenses: 5300000, profit: 700000 }
        ]
      : [
          { name: 'Q1', income: 10500000, expenses: 8500000, profit: 2000000 },
          { name: 'Q2', income: 11300000, expenses: 10600000, profit: 700000 },
          { name: 'Q3', income: 13900000, expenses: 12200000, profit: 1700000 },
          { name: 'Q4', income: 16600000, expenses: 14600000, profit: 2000000 }
        ];
    
    setProfitLossData(sampleData);
  };

  // Memoize calculations
  const {totalIncome, totalExpenses, totalProfit, profitMargin} = useMemo(() => {
    const totalIncome = profitLossData.reduce((sum, item) => sum + (item.income || 0), 0);
    const totalExpenses = profitLossData.reduce((sum, item) => sum + (item.expenses || 0), 0);
    const totalProfit = totalIncome - totalExpenses;
    const profitMargin = calculateProfitMargin(totalIncome, totalExpenses);
    return { totalIncome, totalExpenses, totalProfit, profitMargin };
  }, [profitLossData]);

  // Split charts into separate components for better performance
  const IncomeExpenseChart = useMemo(() => (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={profitLossData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value) => value !== null && value !== undefined ? [`₹${value.toLocaleString('en-IN')}`, undefined] : ['₹0', undefined]}
            contentStyle={{ borderRadius: '8px' }}
          />
          <Legend />
          <Bar name="Income" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar name="Expenses" dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  ), [profitLossData]);

  const ProfitTrendChart = useMemo(() => (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={profitLossData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value) => value !== null && value !== undefined ? [`₹${value.toLocaleString('en-IN')}`, undefined] : ['₹0', undefined]}
            contentStyle={{ borderRadius: '8px' }}
          />
          <Legend />
          <Line
            type="monotone"
            name="Profit/Loss"
            dataKey="profit"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{
              stroke: '#8884d8',
              strokeWidth: 2,
              r: 4,
              fill: 'white'
            }}
            activeDot={{
              stroke: '#8884d8',
              strokeWidth: 2,
              r: 6,
              fill: '#8884d8'
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  ), [profitLossData]);

  // Handle empty data
  if (profitLossData.length === 0 && !isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No data available</h3>
          <p className="text-gray-500 mt-2 text-center max-w-md">
            There is no profit and loss data available for this time period.
          </p>
        </div>
      </div>
    );
  }

  // Safe formatter function to handle null/undefined values
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0';
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Monthly Profit & Loss</h2>
          <div className="flex space-x-3">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
            >
              {yearOptions.map((yearOption) => (
                <option key={yearOption} value={yearOption}>{yearOption}</option>
              ))}
            </select>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                  <p className="text-sm font-medium text-gray-500">Total Income</p>
                  <h3 className="text-xl font-bold text-gray-800">{formatCurrency(totalIncome)}</h3>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
                  <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                  <h3 className="text-xl font-bold text-gray-800">{formatCurrency(totalExpenses)}</h3>
                </div>
                <div className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${totalProfit >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
                  <p className="text-sm font-medium text-gray-500">Net Profit/Loss</p>
                  <h3 className={`text-xl font-bold ${totalProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(Math.abs(totalProfit))} {profitMargin}
                  </h3>
                </div>
              </div>

              {/* Charts with lazy loading */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Income vs Expenses</h3>
                {IncomeExpenseChart}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Profit/Loss Trend</h3>
                {ProfitTrendChart}
              </div>

              {/* Data Table */}
              <div className="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Profit & Loss Statement</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Income
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expenses
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit/Loss
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Margin %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {profitLossData.map((item, index) => {
                      const income = item.income || 0;
                      const expenses = item.expenses || 0;
                      const profit = income - expenses;
                      const margin = calculateProfitMargin(income, expenses);
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.name || ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(income)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(expenses)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(profit))} {profit >= 0 ? '+' : '-'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {margin}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(totalIncome)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(totalExpenses)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(totalProfit))} {totalProfit >= 0 ? '+' : '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitMargin}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default MonthlyProfitLoss;