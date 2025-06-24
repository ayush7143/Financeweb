import { useState, useEffect } from 'react';
import { useCurrencyFormat } from '../utils/formUtils';
import { employeeExpenseApi, salaryExpenseApi, vendorPaymentApi, incomeApi } from '../api/apiService';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, CurrencyDollarIcon, DocumentTextIcon, UserGroupIcon, 
  BuildingOfficeIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  CalendarIcon, ChartPieIcon, DocumentChartBarIcon, ArrowPathIcon,
  ArrowDownTrayIcon, FunnelIcon, PencilIcon, TrashIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';

const Reports = () => {
  const formatCurrency = useCurrencyFormat();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState({
    employeeExpenses: [],
    salaryExpenses: [],
    vendorPayments: [],
    income: []
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0], // Today
    categories: ['employeeExpenses', 'salaryExpenses', 'vendorPayments', 'income'],
    timeframe: 'month',
    year: new Date().getFullYear()
  });
  
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch reports based on filters
  const fetchReports = async (currentFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      const [empExp, salExp, vendPay, incData] = await Promise.all([
        employeeExpenseApi.getAll(),
        salaryExpenseApi.getAll(),
        vendorPaymentApi.getAll(),
        incomeApi.getAll()
      ]);

      // Log raw data for debugging
      console.log('Raw Data:', {
        salaryExpenses: salExp?.data,
        vendorPayments: vendPay?.data
      });

      // Process and normalize the data with better amount handling
      const processedData = {
        employeeExpenses: empExp?.data || [],
        salaryExpenses: salExp?.data?.map(expense => ({
          ...expense,
          date: expense.paymentDate || expense.date,
          amount: Number(expense.amountPaid || expense.amount || expense.salary || 0),
          status: expense.status || 'Pending',
          employeeName: expense.employeeName || 'Unknown'
        })) || [],
        vendorPayments: vendPay?.data?.map(payment => ({
          ...payment,
          date: payment.invoiceDate || payment.paymentDate || payment.date,
          amount: Number(payment.amountInclGST || payment.amount || payment.totalAmount || 0),
          status: payment.status || 'Pending',
          vendorName: payment.vendorName || 'Unknown'
        })) || [],
        income: incData?.data || []
      };

      // Validate processed data
      console.log('Processed amounts:', {
        salaryExpenses: processedData.salaryExpenses.map(e => ({
          name: e.employeeName,
          amount: e.amount
        })),
        vendorPayments: processedData.vendorPayments.map(p => ({
          name: p.vendorName,
          amount: p.amount
        }))
      });

      setReports(processedData);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('Error in fetchReports:', err);
      setError('Failed to load reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and refresh interval
  useEffect(() => {
    console.log("Initial reports fetch");
    // Clear old data first
    setReports({
      employeeExpenses: [],
      salaryExpenses: [],
      vendorPayments: [],
      income: []
    });
    fetchReports();
    
    const intervalId = setInterval(() => fetchReports(), 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  // Fetch when filters change
  useEffect(() => {
    fetchReports(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRefresh = () => {
    fetchReports();
  };

  const exportToExcel = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Format data for each sheet
    const employeeExpensesData = reports.employeeExpenses.map(expense => ({
      'Employee Name': expense.employeeName,
      'Expense Type': expense.expenseType,
      'Amount': expense.amountPaid,
      'Date': new Date(expense.date).toLocaleDateString(),
      'Status': expense.status,
      'Remarks': expense.remarks || ''
    }));

    const salaryExpensesData = reports.salaryExpenses.map(expense => ({
      'Employee Name': expense.employeeName,
      'Department': expense.department,
      'Amount': expense.amount,
      'Date': new Date(expense.date).toLocaleDateString(),
      'Payment Status': expense.paymentStatus,
      'Remarks': expense.remarks || ''
    }));

    const vendorPaymentsData = reports.vendorPayments.map(payment => ({
      'Vendor Name': payment.vendorName,
      'Payment Type': payment.paymentType,
      'Amount': payment.amount,
      'Date': new Date(payment.date).toLocaleDateString(),
      'Status': payment.status,
      'Remarks': payment.remarks || ''
    }));

    const incomeData = reports.income.map(item => ({
      'Source': item.source,
      'Amount': item.amountReceived,
      'Date': new Date(item.date).toLocaleDateString(),
      'Payment Method': item.paymentMethod,
      'Remarks': item.remarks || ''
    }));

    // Create worksheets
    const employeeExpensesWS = XLSX.utils.json_to_sheet(employeeExpensesData);
    const salaryExpensesWS = XLSX.utils.json_to_sheet(salaryExpensesData);
    const vendorPaymentsWS = XLSX.utils.json_to_sheet(vendorPaymentsData);
    const incomeWS = XLSX.utils.json_to_sheet(incomeData);

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, employeeExpensesWS, "Employee Expenses");
    XLSX.utils.book_append_sheet(wb, salaryExpensesWS, "Salary Expenses");
    XLSX.utils.book_append_sheet(wb, vendorPaymentsWS, "Vendor Payments");
    XLSX.utils.book_append_sheet(wb, incomeWS, "Income");

    // Generate Excel file
    XLSX.writeFile(wb, `Financial_Reports_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Update calculateTotal function to handle different amount fields
  const calculateTotal = (items) => {
    if (!Array.isArray(items)) return 0;
    
    return items.reduce((sum, item) => {
      const amount = Number(
        item.amountReceived || 
        item.amount || 
        item.salary || 
        item.totalAmount || 
        0
      );
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const calculateTotalIncome = () => {
    return calculateTotal(reports.income);
  };

  const calculateTotalExpenses = () => {
    const employeeExpenses = calculateTotal(reports.employeeExpenses);
    const salaryExpenses = calculateTotal(reports.salaryExpenses);
    const vendorPayments = calculateTotal(reports.vendorPayments);
    return employeeExpenses + salaryExpenses + vendorPayments;
  };

  const calculateNetIncome = () => {
    return calculateTotalIncome() - calculateTotalExpenses();
  };

  const getMonthlyData = () => {
    console.log("Calculating monthly data with reports:", reports);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map((month, index) => {
      // Income calculation
      const monthIncome = reports.income
        .filter(item => {
          const date = new Date(item.date);
          return date.getMonth() === index && date.getFullYear() === parseInt(filters.year);
        })
        .reduce((sum, item) => sum + (Number(item.amountReceived) || 0), 0);

      // Employee expenses calculation
      const employeeExpenses = reports.employeeExpenses
        .filter(item => {
          const date = new Date(item.date);
          return date.getMonth() === index && date.getFullYear() === parseInt(filters.year);
        })
        .reduce((sum, item) => sum + (Number(item.amountPaid) || 0), 0);
      
      // Salary expenses calculation
      const salaryExpenses = reports.salaryExpenses
        .filter(item => {
          const date = new Date(item.paymentDate || item.date);
          return date.getMonth() === index && date.getFullYear() === parseInt(filters.year);
        })
        .reduce((sum, item) => sum + (Number(item.amountPaid || item.amount || item.salary) || 0), 0);
      
      // Vendor payments calculation
      const vendorExpenses = reports.vendorPayments
        .filter(item => {
          const date = new Date(item.invoiceDate || item.paymentDate || item.date);
          return date.getMonth() === index && date.getFullYear() === parseInt(filters.year);
        })
        .reduce((sum, item) => sum + (Number(item.amountInclGST || item.amount || item.totalAmount) || 0), 0);
      
      const monthExpenses = employeeExpenses + salaryExpenses + vendorExpenses;
      
      console.log(`Month ${month} data:`, {
        income: monthIncome,
        employeeExpenses,
        salaryExpenses,
        vendorExpenses,
        total: monthExpenses
      });

      return {
        name: month,
        income: monthIncome,
        expenses: monthExpenses,
        profit: monthIncome - monthExpenses
      };
    });
  };

  const getExpenseCategories = () => {
    const categories = {};
    
    // Process employee expenses
    if (Array.isArray(reports.employeeExpenses)) {
      reports.employeeExpenses.forEach(expense => {
        const category = expense.expenseType || 'Other';
        categories[category] = (categories[category] || 0) + (parseFloat(expense.amountPaid) || 0);
      });
    }

    // Process salary expenses
    if (Array.isArray(reports.salaryExpenses) && reports.salaryExpenses.length > 0) {
      console.log("Adding salary expenses to categories:", reports.salaryExpenses);
      reports.salaryExpenses.forEach(expense => {
        const amount = parseFloat(expense.amount || expense.salary || 0);
        if (amount > 0) {
          console.log(`Adding salary expense to category: ${amount}`);
          categories['Salaries'] = (categories['Salaries'] || 0) + amount;
        }
      });
    }

    // Process vendor payments
    if (Array.isArray(reports.vendorPayments) && reports.vendorPayments.length > 0) {
      console.log("Adding vendor payments to categories:", reports.vendorPayments);
      reports.vendorPayments.forEach(payment => {
        const amount = parseFloat(payment.amount || payment.totalAmount || 0);
        const category = payment.paymentType || payment.category || 'Vendor Payments';
        if (amount > 0) {
          console.log(`Adding vendor payment to category ${category}: ${amount}`);
          categories[category] = (categories[category] || 0) + amount;
        }
      });
    }

    // Convert categories object to array format required for charts
    const result = Object.entries(categories).map(([name, value]) => ({ name, value }));
    console.log("Final expense categories:", result);
    return result;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  // Calculate monthly data for charts
  const calculateMonthlyData = () => {
    const monthlyData = {};
    
    // Initialize all months with zero values
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = {
        month: new Date(filters.year, i - 1).toLocaleString('default', { month: 'short' }),
        income: 0,
        expenses: 0,
        netIncome: 0
      };
    }

    // Process income data
    if (Array.isArray(reports.income)) {
      reports.income.forEach(entry => {
        const date = new Date(entry.date);
        if (date.getFullYear() === parseInt(filters.year)) {
          const month = date.getMonth() + 1;
          monthlyData[month].income += parseFloat(entry.amountReceived) || 0;
        }
      });
    }

    // Process employee expenses
    if (Array.isArray(reports.employeeExpenses)) {
      reports.employeeExpenses.forEach(expense => {
        const date = new Date(expense.date);
        if (date.getFullYear() === parseInt(filters.year)) {
          const month = date.getMonth() + 1;
          monthlyData[month].expenses += parseFloat(expense.amountPaid) || 0;
        }
      });
    }

    // Process salary expenses - handle both date and paymentDate fields
    if (Array.isArray(reports.salaryExpenses)) {
      console.log("Processing salary expenses:", reports.salaryExpenses);
      reports.salaryExpenses.forEach(expense => {
        // Check for multiple possible date fields
        const dateField = expense.date || expense.paymentDate || expense.dateOfPayment;
        if (!dateField) {
          console.warn("Salary expense missing date field:", expense);
          return;
        }
        
        const date = new Date(dateField);
        if (isNaN(date.getTime())) {
          console.warn("Invalid date for salary expense:", expense);
          return;
        }
        
        if (date.getFullYear() === parseInt(filters.year)) {
          const month = date.getMonth() + 1;
          const amount = parseFloat(expense.amount || expense.salary || 0);
          console.log(`Adding salary expense for ${date.toISOString()}, month ${month}: ${amount}`);
          monthlyData[month].expenses += amount;
        }
      });
    }

    // Process vendor payments - handle both date and paymentDate fields
    if (Array.isArray(reports.vendorPayments)) {
      console.log("Processing vendor payments:", reports.vendorPayments);
      reports.vendorPayments.forEach(payment => {
        // Check for multiple possible date fields
        const dateField = payment.date || payment.paymentDate || payment.invoiceDate;
        if (!dateField) {
          console.warn("Vendor payment missing date field:", payment);
          return;
        }
        
        const date = new Date(dateField);
        if (isNaN(date.getTime())) {
          console.warn("Invalid date for vendor payment:", payment);
          return;
        }
        
        if (date.getFullYear() === parseInt(filters.year)) {
          const month = date.getMonth() + 1;
          const amount = parseFloat(payment.amount || payment.totalAmount || 0);
          console.log(`Adding vendor payment for ${date.toISOString()}, month ${month}: ${amount}`);
          monthlyData[month].expenses += amount;
        }
      });
    }

    // Calculate net income for each month
    Object.keys(monthlyData).forEach(month => {
      monthlyData[month].netIncome = monthlyData[month].income - monthlyData[month].expenses;
    });

    return Object.values(monthlyData);
  };

  // Calculate expense distribution
  const calculateExpenseDistribution = () => {
    const distribution = {
      employeeExpenses: 0,
      salaryExpenses: 0,
      vendorPayments: 0
    };

    if (Array.isArray(reports.employeeExpenses)) {
      distribution.employeeExpenses = reports.employeeExpenses.reduce((sum, expense) => 
        sum + (parseFloat(expense.amountPaid) || 0), 0);
    }

    if (Array.isArray(reports.salaryExpenses)) {
      distribution.salaryExpenses = reports.salaryExpenses.reduce((sum, expense) => 
        sum + (parseFloat(expense.amount) || 0), 0);
    }

    if (Array.isArray(reports.vendorPayments)) {
      distribution.vendorPayments = reports.vendorPayments.reduce((sum, payment) => 
        sum + (parseFloat(payment.amount) || 0), 0);
    }

    return [
      { name: 'Employee Expenses', value: distribution.employeeExpenses },
      { name: 'Salary Expenses', value: distribution.salaryExpenses },
      { name: 'Vendor Payments', value: distribution.vendorPayments }
    ].filter(item => item.value > 0);
  };

  const monthlyData = calculateMonthlyData();
  const expenseDistribution = calculateExpenseDistribution();

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };

  const formatAmount = (amount) => {
    if (!amount || isNaN(amount)) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Financial Reports</h1>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-4">
            <select
              value={filters.timeframe}
              onChange={(e) => handleFilterChange('timeframe', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>

      {!loading && !error && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Income Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(calculateTotalIncome())}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ArrowTrendingDownIcon className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(calculateTotalExpenses())}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Income Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Income</p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(calculateNetIncome())}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Last Updated Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CalendarIcon className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</p>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {lastUpdated.toLocaleString()}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Income vs Expenses Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Income vs Expenses</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getMonthlyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" fill="#10B981" name="Income" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expense Distribution Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expense Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={calculateExpenseDistribution()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {calculateExpenseDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#EF4444', '#F59E0B', '#3B82F6'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Employee Expenses</h2>
          <div className="space-y-4">
            {Array.isArray(reports.employeeExpenses) && reports.employeeExpenses.length > 0 ? (
              reports.employeeExpenses.map((expense) => (
                <div key={expense._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{expense.employeeName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{expense.expenseType}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 dark:text-white font-medium">{formatCurrency(expense.amountPaid)}</p>
                    <p className={`text-xs ${expense.status === 'Approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {expense.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No employee expenses found</p>
            )}
          </div>
        </motion.div>

        {/* Salary Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Salary Expenses</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {Array.isArray(reports.salaryExpenses) && reports.salaryExpenses.length > 0 ? (
                  reports.salaryExpenses.map((expense, index) => (
                    <motion.tr 
                      key={expense._id || index} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {expense.employeeName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {expense.month || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                        {formatAmount(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          expense.status === 'Paid' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : expense.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {expense.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="max-w-xs truncate" title={expense.notes || '-'}>
                          {expense.notes || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            onClick={() => window.location.href = `/salary-expenses/edit/${expense._id}`}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this salary expense?')) {
                                salaryExpenseApi.delete(expense._id)
                                  .then(() => {
                                    handleRefresh();
                                  })
                                  .catch(err => {
                                    console.error('Error deleting salary expense:', err);
                                  });
                              }
                            }}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No salary expenses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Vendor Payments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vendor Payments</h2>
          <div className="space-y-4">
            {Array.isArray(reports.vendorPayments) && reports.vendorPayments.length > 0 ? (
              reports.vendorPayments.map((payment) => (
                <div key={payment._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{payment.vendorName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{payment.paymentType}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 dark:text-white font-medium">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{payment.status}</p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button 
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      onClick={() => window.location.href = `/vendor-payments/edit/${payment._id}`}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this vendor payment?')) {
                          vendorPaymentApi.delete(payment._id)
                            .then(() => {
                              handleRefresh();
                            })
                            .catch(err => {
                              console.error('Error deleting vendor payment:', err);
                            });
                        }
                      }}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No vendor payments found</p>
            )}
          </div>
        </motion.div>

        {/* Income */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Income</h2>
          <div className="space-y-4">
            {!reports.income || reports.income.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No income entries found
              </div>
            ) : (
              reports.income.map((item) => (
                <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.source}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.remarks}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 dark:text-white font-medium">{formatCurrency(item.amountReceived)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.paymentMethod}</p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button 
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      onClick={() => window.location.href = `/income/edit/${item._id}`}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this income entry?')) {
                          incomeApi.delete(item._id)
                            .then(() => {
                              handleRefresh();
                            })
                            .catch(err => {
                              console.error('Error deleting income entry:', err);
                            });
                        }
                      }}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;