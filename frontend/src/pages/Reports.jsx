import { useState, useEffect } from 'react';
import { useCurrencyFormat } from '../utils/formUtils';
import { triggerDashboardRefresh } from '../utils/dashboardUtils';
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
  const [fetching, setFetching] = useState(false); // Prevent simultaneous fetches
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
    // Prevent simultaneous fetches
    if (fetching) {
      console.log('Fetch already in progress, skipping...');
      return;
    }
    
    try {
      setFetching(true);
      setLoading(true);
      setError(null);

      // Add cache busting timestamp
      const timestamp = Date.now();
      console.log('Fetching reports with cache buster:', timestamp);

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
        employeeExpenses: (empExp?.data || []).map(expense => ({
          ...expense,
          amount: Number(expense.amountPaid || expense.amount || 0)
        })),
        salaryExpenses: (salExp?.data || []).map(expense => ({
          ...expense,
          date: expense.paymentDate || expense.date,
          amount: Number(expense.amountPaid || expense.amount || expense.salary || 0),
          status: expense.status || 'Pending',
          employeeName: expense.employeeName || 'Unknown'
        })),
        vendorPayments: (vendPay?.data || []).map(payment => ({
          ...payment,
          date: payment.invoiceDate || payment.paymentDate || payment.date,
          amount: Number(payment.amountInclGST || payment.amount || payment.totalAmount || 0),
          status: payment.status || 'Pending',
          vendorName: payment.vendorName || 'Unknown'
        })),
        income: (incData?.data || []).map(item => ({
          ...item,
          amount: Number(item.amountReceived || item.amount || 0)
        }))
      };

      // Validate processed data
      console.log('Processed amounts for reports:', {
        totalIncome: processedData.income.reduce((sum, item) => sum + item.amount, 0),
        totalEmployeeExpenses: processedData.employeeExpenses.reduce((sum, item) => sum + item.amount, 0),
        totalSalaryExpenses: processedData.salaryExpenses.reduce((sum, item) => sum + item.amount, 0),
        totalVendorPayments: processedData.vendorPayments.reduce((sum, item) => sum + item.amount, 0),
        itemCounts: {
          income: processedData.income.length,
          employeeExpenses: processedData.employeeExpenses.length,
          salaryExpenses: processedData.salaryExpenses.length,
          vendorPayments: processedData.vendorPayments.length
        }
      });

      setReports(processedData);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('Error in fetchReports:', err);
      setError('Failed to load reports. Please try again later.');
    } finally {
      setLoading(false);
      setFetching(false);
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
    
    // Listen for dashboard refresh events
    const handleRefresh = () => {
      console.log('Reports page received refresh event');
      fetchReports();
    };
    
    window.addEventListener('dashboardRefresh', handleRefresh);
    window.addEventListener('financialDataRefresh', handleRefresh);
    
    const intervalId = setInterval(() => fetchReports(), 5 * 60 * 1000); // Refresh every 5 minutes

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('dashboardRefresh', handleRefresh);
      window.removeEventListener('financialDataRefresh', handleRefresh);
    };
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
    const total = calculateTotal(reports.income);
    console.log('Calculating total income:', { reports: reports.income, total });
    return total;
  };

  const calculateTotalExpenses = () => {
    const employeeExpenses = calculateTotal(reports.employeeExpenses);
    const salaryExpenses = calculateTotal(reports.salaryExpenses);
    const vendorPayments = calculateTotal(reports.vendorPayments);
    const total = employeeExpenses + salaryExpenses + vendorPayments;
    console.log('Calculating total expenses:', { 
      employeeExpenses, 
      salaryExpenses, 
      vendorPayments, 
      total,
      rawData: {
        employeeExpenses: reports.employeeExpenses,
        salaryExpenses: reports.salaryExpenses,
        vendorPayments: reports.vendorPayments
      }
    });
    return total;
  };

  const calculateNetIncome = () => {
    const income = calculateTotalIncome();
    const expenses = calculateTotalExpenses();
    const net = income - expenses;
    console.log('Calculating net income:', { income, expenses, net });
    return net;
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
              className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative overflow-hidden group"
            >
              <span className="relative flex items-center justify-center w-6 h-6 mr-2">
                <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-spin-slow group-hover:animate-spin-fast"></span>
                <ArrowPathIcon className={`h-5 w-5 text-blue-500 z-10 ${loading ? 'animate-spin' : ''}`} />
              </span>
              <span className="font-semibold tracking-wide">Refresh</span>
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
              <h3 className="text-lg font-extrabold text-white mb-4 px-4 py-2 rounded-t-lg bg-gradient-to-r from-blue-500 to-blue-700 shadow-lg tracking-wide text-xl">Income vs Expenses</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getMonthlyData()} margin={{ left: 40, right: 20, top: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="4 4" />
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
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-transform duration-300 hover:scale-50 hover:shadow-2xl">
                    <h3 className="text-lg font-extrabold text-white mb-4 px-4 py-2 rounded-t-lg bg-gradient-to-r from-pink-500 to-yellow-500 shadow-lg tracking-wide text-xl">Expense Distribution</h3>
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
                        label={({ name, value }) => `₹${value.toLocaleString()}`}
                        isAnimationActive={true}
                        animationDuration={200}
                        animationEasing="ease-in-out"
                        activeIndex={null}
                        activeShape={(props) => {
                          const RADIAN = Math.PI / 180;
                          const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
                          const sin = Math.sin(-RADIAN * midAngle);
                          const cos = Math.cos(-RADIAN * midAngle);
                          const sx = cx + (outerRadius + 10) * cos;
                          const sy = cy + (outerRadius + 10) * sin;
                          const mx = cx + (outerRadius + 30) * cos;
                          const my = cy + (outerRadius + 30) * sin;
                          const ex = mx + (cos >= 0 ? 1 : -1) * 22;
                          const ey = my;
                          return (
                            <g>
                              <circle cx={cx} cy={cy} r={outerRadius + 6} fill="#fbbf24" opacity={0.2} />
                              <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none"/>
                              <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
                              <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={cos >= 0 ? 'start' : 'end'} fill="#333">{`${payload.name}: ₹${value.toLocaleString()}`}</text>
                              <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>
                            </g>
                          );
                        }}
                      >
                        {calculateExpenseDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#EF4444', '#F59E0B', '#3B82F6'][index % 3]} style={{ transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Legend formatter={(value) => `${value}`} />
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-800 dark:to-blue-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {Array.isArray(reports.employeeExpenses) && reports.employeeExpenses.length > 0 ? (
                  reports.employeeExpenses.map((expense, index) => (
                    <tr key={expense._id || index} className="transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/40">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(expense.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{expense.employeeName || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{expense.expenseType || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">{formatAmount(expense.amountPaid)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{expense.status || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{expense.remarks || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No employee expenses found</td>
                  </tr>
                )}
              </tbody>
            </table>
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-purple-500 to-pink-600 dark:from-purple-800 dark:to-pink-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {Array.isArray(reports.vendorPayments) && reports.vendorPayments.length > 0 ? (
                  reports.vendorPayments.map((payment, index) => (
                    <tr key={payment._id || index} className="transition-all duration-200 hover:bg-pink-50 dark:hover:bg-pink-900/40">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(payment.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{payment.vendorName || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{payment.paymentType || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">{formatAmount(payment.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{payment.status || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{payment.remarks || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No vendor payments found</td>
                  </tr>
                )}
              </tbody>
            </table>
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-green-500 to-teal-600 dark:from-green-800 dark:to-teal-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {Array.isArray(reports.income) && reports.income.length > 0 ? (
                  reports.income.map((item, index) => (
                    <tr key={item._id || index} className="transition-all duration-200 hover:bg-green-50 dark:hover:bg-green-900/40">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(item.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.source || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">{formatAmount(item.amountReceived)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.paymentMethod || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.remarks || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No income entries found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;