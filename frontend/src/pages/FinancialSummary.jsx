import { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ComposedChart, Area
} from 'recharts';
import { 
  ArrowDownTrayIcon as DocumentDownloadIcon, ChevronDownIcon, CalendarIcon, CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { incomeApi, employeeExpenseApi, salaryExpenseApi, vendorPaymentApi } from '../api/apiService';
import { calculateProfitMargin, formatProfitLoss } from '../utils/financialCalculations';

const FinancialSummary = () => {
  const [timeframe, setTimeframe] = useState('year');
  const [summaryData, setSummaryData] = useState({
    income: [],
    expenses: [],
    categories: [],
    monthly: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const chartRef = useRef(null);
  
  // Initialize with current year and last 5 years as options
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    yearOptions.push(currentYear - i);
  }
  
  useEffect(() => {
    fetchFinancialData();
  }, [timeframe, selectedYear]);
  
  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would fetch all this data from your backend
      // For now, we'll use sample data
      generateSampleData();
    } catch (error) {
      console.error('Error fetching financial data:', error);
      generateSampleData();
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateSampleData = () => {
    // Month names
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate monthly data
    const monthlyData = months.map((month, index) => {
      // Base values with some randomness for realistic sample data
      const baseIncome = 25000 + Math.random() * 10000;
      const baseExpense = 20000 + Math.random() * 8000;
      
      // Add seasonal patterns
      const seasonalFactor = Math.sin((index / 12) * Math.PI * 2) * 5000;
      
      const income = Math.max(baseIncome + seasonalFactor, 15000);
      const expenses = Math.max(baseExpense - seasonalFactor/2, 12000);
      
      return {
        name: month,
        income: Math.round(income),
        expenses: Math.round(expenses),
        profit: Math.round(income - expenses)
      };
    });
    
    // Generate expense categories
    const categories = [
      { name: 'Salaries', value: Math.round(Math.random() * 60000 + 120000) },
      { name: 'Office Supplies', value: Math.round(Math.random() * 5000 + 8000) },
      { name: 'Equipment', value: Math.round(Math.random() * 15000 + 25000) },
      { name: 'Marketing', value: Math.round(Math.random() * 10000 + 20000) },
      { name: 'Travel', value: Math.round(Math.random() * 8000 + 12000) },
      { name: 'Software', value: Math.round(Math.random() * 6000 + 15000) },
      { name: 'Other', value: Math.round(Math.random() * 4000 + 8000) }
    ];
    
    // Calculate total income
    const totalIncome = monthlyData.reduce((sum, item) => sum + item.income, 0);
    
    // Calculate total expenses
    const totalExpenses = monthlyData.reduce((sum, item) => sum + item.expenses, 0);
    
    setSummaryData({
      income: [{ name: 'Total Income', value: totalIncome }],
      expenses: [{ name: 'Total Expenses', value: totalExpenses }],
      categories: categories,
      monthly: monthlyData
    });
  };
  
  const exportToPDF = () => {
    // In a real app, you would use a library like jsPDF to generate PDF
    alert('PDF export functionality would be implemented here');
  };
  
  const exportToCSV = () => {
    // Create CSV content
    const headers = ['Month', 'Income', 'Expenses', 'Profit'];
    
    const csvContent = [
      headers.join(','),
      ...summaryData.monthly.map(item => {
        return [
          `"${item.name}"`,
          item.income,
          item.expenses,
          item.profit
        ].join(',');
      })
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial-summary-${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Calculate summary metrics
  const totalIncome = summaryData.monthly.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = summaryData.monthly.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;
  const profitMargin = calculateProfitMargin(totalIncome, totalExpenses);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Financial Summary</h1>
        
        <div className="flex space-x-3">
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <ChevronDownIcon className="h-4 w-4" />
            </div>
          </div>
          
          <div className="relative">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="year">Yearly</option>
              <option value="quarter">Quarterly</option>
              <option value="month">Monthly</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <ChevronDownIcon className="h-4 w-4" />
            </div>
          </div>
          
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <DocumentDownloadIcon className="h-5 w-5 mr-2" />
            Export CSV
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Income</p>
                  <p className="text-2xl font-bold text-gray-800">${totalIncome.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-800">${totalExpenses.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <CurrencyDollarIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
            
            <div className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${totalProfit >= 0 ? 'border-green-500' : 'border-orange-500'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Net Profit</p>
                  <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    ${Math.abs(totalProfit).toLocaleString()} ({profitMargin}%)
                  </p>
                </div>
                <div className={`p-3 ${totalProfit >= 0 ? 'bg-green-100' : 'bg-orange-100'} rounded-full`}>
                  <CurrencyDollarIcon className={`h-6 w-6 ${totalProfit >= 0 ? 'text-green-600' : 'text-orange-600'}`} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Income vs Expenses Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Income vs Expenses</h2>
              <div className="h-80" ref={chartRef}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={summaryData.monthly}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, undefined]}
                      contentStyle={{ borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar name="Income" dataKey="income" fill="#0088FE" radius={[4, 4, 0, 0]} />
                    <Bar name="Expenses" dataKey="expenses" fill="#FF8042" radius={[4, 4, 0, 0]} />
                    <Line name="Profit" type="monotone" dataKey="profit" stroke="#8884d8" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Expense Categories */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Expense Breakdown</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summaryData.categories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {summaryData.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `$${value.toLocaleString()}`}
                      contentStyle={{ borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Financial Table */}
          <div className="bg-white p-6 rounded-lg shadow-sm overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month
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
                  {summaryData.monthly.map((month, index) => {
                    const margin = month.income > 0 ? ((month.profit / month.income) * 100).toFixed(1) : 0;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {month.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${month.income.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${month.expenses.toLocaleString()}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          month.profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${Math.abs(month.profit).toLocaleString()} {month.profit >= 0 ? '' : '(Loss)'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${totalIncome.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${totalExpenses.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${Math.abs(totalProfit).toLocaleString()} {totalProfit >= 0 ? '' : '(Loss)'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {profitMargin}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinancialSummary;