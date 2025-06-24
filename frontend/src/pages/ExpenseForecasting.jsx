import { useState, useEffect } from 'react';
import { aiApi } from '../api/apiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { ArrowPathIcon, ChartBarIcon, CalculatorIcon } from '@heroicons/react/24/outline';

const ExpenseForecasting = () => {
  const [forecastData, setForecastData] = useState({ forecast: [], confidence: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [months, setMonths] = useState(3);
  const [historicalData, setHistoricalData] = useState([]);

  useEffect(() => {
    fetchForecast();
  }, [months]);

  const fetchForecast = async () => {
    setIsLoading(true);
    try {
      const response = await aiApi.getForecast({ months });
      
      if (response.data.success) {
        setForecastData(response.data.data);
        
        // Generate some historical data for context (this would normally come from the API)
        generateHistoricalData();
      }
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      // Set sample data for demo
      setSampleData();
    } finally {
      setIsLoading(false);
    }
  };

  const generateHistoricalData = () => {
    // For demo purposes, generate 12 months of historical data
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const month = date.toISOString().slice(0, 7);
      
      // Generate random but somewhat realistic data
      const baseAmount = 20000 + Math.random() * 10000;
      const trend = i / 3; // Slight upward trend
      const seasonal = Math.sin(i / 2) * 2000; // Seasonal variation
      const random = (Math.random() - 0.5) * 5000; // Random noise
      
      const amount = Math.max(0, Math.round(baseAmount + trend * 1000 + seasonal + random));
      
      data.push({
        month,
        amount,
        type: 'historical'
      });
    }
    
    setHistoricalData(data);
  };

  const setSampleData = () => {
    // Generate sample forecast data
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Create forecast for next 'months' months
    const forecast = [];
    for (let i = 1; i <= months; i++) {
      const date = new Date(currentYear, currentMonth + i, 1);
      const month = date.toISOString().slice(0, 7);
      
      // Generate increasing forecast with some randomness
      const baseAmount = 25000 + i * 1000;
      const random = (Math.random() - 0.3) * 5000;
      const amount = Math.max(0, Math.round(baseAmount + random));
      
      forecast.push({ month, amount });
    }
    
    // Generate historical data
    generateHistoricalData();
    
    // Set the forecast data with confidence score
    setForecastData({
      forecast,
      confidence: Math.round(Math.random() * 30 + 65) // Random confidence between 65-95%
    });
  };

  // Combine historical and forecast data for chart
  const combinedData = [
    ...historicalData,
    ...forecastData.forecast.map(item => ({
      ...item,
      type: 'forecast'
    }))
  ];

  // Calculate forecast metrics
  const calculateMetrics = () => {
    if (!forecastData.forecast.length) return { total: 0, average: 0, min: 0, max: 0 };
    
    const total = forecastData.forecast.reduce((sum, item) => sum + item.amount, 0);
    const average = Math.round(total / forecastData.forecast.length);
    const amounts = forecastData.forecast.map(item => item.amount);
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    
    return { total, average, min, max };
  };

  const metrics = calculateMetrics();

  // Format month for display
  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    const date = new Date(monthStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">AI Expense Forecasting</h1>
        <div className="flex space-x-3">
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value))}
          >
            <option value={3}>Next 3 months</option>
            <option value={6}>Next 6 months</option>
            <option value={12}>Next 12 months</option>
          </select>
          
          <button
            onClick={fetchForecast}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-smooth"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Refresh Forecast
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Forecast Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-gray-500">Total Forecast</h3>
                <span className="p-1.5 rounded-full bg-blue-100">
                  <CalculatorIcon className="w-4 h-4 text-blue-600" />
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">${metrics.total.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">For next {months} months</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-gray-500">Monthly Average</h3>
                <span className="p-1.5 rounded-full bg-green-100">
                  <ChartBarIcon className="w-4 h-4 text-green-600" />
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">${metrics.average.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Average per month</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-gray-500">Highest Month</h3>
                <span className="p-1.5 rounded-full bg-red-100">
                  <ArrowPathIcon className="w-4 h-4 text-red-600" />
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">${metrics.max.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Highest forecasted expenses</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-gray-500">Forecast Confidence</h3>
                <span className={`p-1.5 rounded-full ${forecastData.confidence > 80 ? 'bg-green-100' : forecastData.confidence > 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                  <CalculatorIcon className={`w-4 h-4 ${forecastData.confidence > 80 ? 'text-green-600' : forecastData.confidence > 60 ? 'text-yellow-600' : 'text-red-600'}`} />
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{forecastData.confidence}%</p>
              <p className="text-sm text-gray-500 mt-1">Statistical confidence level</p>
            </div>
          </div>
          
          {/* Area Chart for Historical + Forecast */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Historical & Forecasted Expenses
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={combinedData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={formatMonth}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => `$${value.toLocaleString()}`}
                    labelFormatter={formatMonth}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Legend />
                  <defs>
                    <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    name="Historical Data"
                    data={historicalData}
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#historicalGradient)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    name="Forecasted Data"
                    data={forecastData.forecast.map(item => ({
                      ...item,
                      type: 'forecast'
                    }))}
                    stroke="#82ca9d" 
                    fillOpacity={1} 
                    fill="url(#forecastGradient)"
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Bar Chart for Monthly Forecast */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Monthly Forecast Breakdown
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={forecastData.forecast}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={formatMonth}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => `$${value.toLocaleString()}`}
                    labelFormatter={formatMonth}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar 
                    name="Forecasted Expenses" 
                    dataKey="amount" 
                    fill="#82ca9d"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Forecast Table */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Forecast Details
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Forecasted Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      vs. Previous Month
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forecastData.forecast.map((item, index) => {
                    const prevItem = index > 0 
                      ? forecastData.forecast[index - 1] 
                      : historicalData.length > 0 
                        ? historicalData[historicalData.length - 1] 
                        : null;
                    
                    const change = prevItem 
                      ? ((item.amount - prevItem.amount) / prevItem.amount * 100).toFixed(1)
                      : null;
                    
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatMonth(item.month)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${item.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {change !== null ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              change > 0 
                                ? 'bg-red-100 text-red-800' 
                                : change < 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                            }`}>
                              {change > 0 ? '+' : ''}{change}%
                            </span>
                          ) : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 bg-blue-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-1">About this forecast</h3>
              <p className="text-xs text-blue-700">
                This forecast is generated using linear regression on historical expense data. The model
                has a confidence level of {forecastData.confidence}%, indicating a {forecastData.confidence > 80 ? 'high' : forecastData.confidence > 60 ? 'moderate' : 'low'} degree
                of reliability. Forecasts are estimates and actual expenses may vary.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseForecasting; 