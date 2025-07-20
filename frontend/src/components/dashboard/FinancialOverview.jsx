import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useCurrencyFormat } from '../../utils/formUtils';
import { 
  employeeExpenseApi, 
  salaryExpenseApi, 
  vendorPaymentApi, 
  incomeApi 
} from '../../api/apiService';

const FinancialOverview = () => {
  const formatCurrency = useCurrencyFormat();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    expenseBreakdown: {
      employeeExpenses: 0,
      salaryExpenses: 0,
      vendorPayments: 0
    }
  });

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Add cache-busting timestamp to prevent stale data
      const timestamp = Date.now();
      console.log('FinancialOverview: Fetching data with timestamp:', timestamp);
      
      // Fetch all data in parallel with cache busting
      const [
        employeeExpensesResponse,
        salaryExpensesResponse,
        vendorPaymentsResponse,
        incomesResponse
      ] = await Promise.all([
        employeeExpenseApi.getAll(),
        salaryExpenseApi.getAll(),
        vendorPaymentApi.getAll(),
        incomeApi.getAll()
      ]);

      // Extract data from responses
      const employeeExpenses = employeeExpensesResponse.data || [];
      const salaryExpenses = salaryExpensesResponse.data || [];
      const vendorPayments = vendorPaymentsResponse.data || [];
      const incomes = incomesResponse.data || [];

      console.log('Fetched fresh data:', {
        timestamp,
        employeeExpenses: employeeExpenses.length,
        salaryExpenses: salaryExpenses.length,
        vendorPayments: vendorPayments.length,
        incomes: incomes.length
      });

      // Calculate totals
      const totalEmployeeExpenses = employeeExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
      const totalSalaryExpenses = salaryExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amountPaid) || 0), 0);
      const totalVendorPayments = vendorPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
      const totalIncome = incomes.reduce((sum, income) => sum + (parseFloat(income.amount) || 0), 0);

      const totalExpenses = totalEmployeeExpenses + totalSalaryExpenses + totalVendorPayments;

      console.log('Calculated fresh totals:', {
        totalEmployeeExpenses,
        totalSalaryExpenses,
        totalVendorPayments,
        totalIncome,
        totalExpenses
      });

      setData({
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        expenseBreakdown: {
          employeeExpenses: totalEmployeeExpenses,
          salaryExpenses: totalSalaryExpenses,
          vendorPayments: totalVendorPayments
        }
      });
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError('Failed to load financial data. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Listen for dashboard refresh events
    const handleRefresh = () => fetchData(true);
    window.addEventListener('dashboardRefresh', handleRefresh);
    
    return () => window.removeEventListener('dashboardRefresh', handleRefresh);
  }, []);

  const handleManualRefresh = () => {
    fetchData(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Overview</h2>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <ArrowPathIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Total Income</h3>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(data.totalIncome)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Total Expenses</h3>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(data.totalExpenses)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Net Income</h3>
          <p className={`mt-2 text-3xl font-bold ${
            data.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(data.netIncome)}
          </p>
        </motion.div>
      </div>

      {/* Expense Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Expense Breakdown</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee Expenses</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                {formatCurrency(data.expenseBreakdown.employeeExpenses)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{
                  width: `${(data.expenseBreakdown.employeeExpenses / (data.totalExpenses || 1)) * 100}%`
                }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Salary Expenses</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                {formatCurrency(data.expenseBreakdown.salaryExpenses)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-green-600 h-2.5 rounded-full"
                style={{
                  width: `${(data.expenseBreakdown.salaryExpenses / (data.totalExpenses || 1)) * 100}%`
                }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Vendor Payments</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                {formatCurrency(data.expenseBreakdown.vendorPayments)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-purple-600 h-2.5 rounded-full"
                style={{
                  width: `${(data.expenseBreakdown.vendorPayments / (data.totalExpenses || 1)) * 100}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FinancialOverview; 