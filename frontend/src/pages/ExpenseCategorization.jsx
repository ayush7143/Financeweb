import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiApi, employeeExpenseApi, salaryExpenseApi, vendorPaymentApi } from '../api/apiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TagIcon, ArrowPathIcon, ChartBarIcon, ChartPieIcon, FunnelIcon, MagnifyingGlassIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useFormStyles, useCurrencyFormat } from '../utils/formUtils';

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error in ExpenseCategorization:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p>Please try refreshing the page or contact support if the problem persists.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Constants
const COLORS = [
  '#4C6EF5', '#3BC9DB', '#12B886', '#82C91E', '#FAB005', 
  '#FD7E14', '#FA5252', '#BE4BDB', '#7950F2', '#4C6EF5',
  '#4DABF7', '#22B8CF', '#20C997', '#94D82D', '#F59F00',
  '#E8590C', '#E03131', '#CC5DE8', '#845EF7', '#5C7CFA'
];

const CATEGORIES = {
  'Office Supplies': '#4C6EF5',
  'Travel': '#3BC9DB',
  'Technology': '#12B886',
  'Marketing': '#82C91E',
  'Utilities': '#FAB005',
  'Maintenance': '#FD7E14',
  'Miscellaneous': '#FA5252',
  'Food': '#BE4BDB',
  'Insurance': '#7950F2',
  'Rent': '#4DABF7',
  'Transportation': '#22B8CF',
  'Salary': '#20C997',
  'Legal': '#845EF7'
};

const SAMPLE_CATEGORIES = [
  'Office Supplies', 'Travel', 'Technology', 'Marketing', 
  'Utilities', 'Maintenance', 'Miscellaneous', 'Food', 
  'Insurance', 'Rent', 'Transportation'
];

const SAMPLE_VENDORS = [
  'Office Depot', 'Delta Airlines', 'Microsoft', 'Google', 'AT&T',
  'Maintenance Co', 'Amazon', 'Uber', 'Staples', 'Apple', 'WeWork',
  'Zoom', 'Adobe', 'Facebook', 'Salesforce', 'Slack'
];

const SAMPLE_EXPENSE_TYPES = [
  'Software', 'Hardware', 'Flight', 'Hotel', 'Supplies',
  'Internet', 'Electricity', 'Repair', 'Service', 'Subscription',
  'Meals', 'Transportation', 'Conference', 'Office Rent', 'Insurance'
];

// Helper functions
const formatDate = (dateString) => {
  try {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Invalid date';
  }
};

const generateSampleCategory = (description) => {
  if (!description) return SAMPLE_CATEGORIES[Math.floor(Math.random() * SAMPLE_CATEGORIES.length)];
  
  description = description.toLowerCase();
  if (description.includes('travel') || description.includes('flight') || description.includes('hotel'))
    return 'Travel';
  if (description.includes('computer') || description.includes('software') || description.includes('hardware'))
    return 'Technology';
  if (description.includes('office') || description.includes('paper') || description.includes('desk'))
    return 'Office Supplies';
  if (description.includes('ad') || description.includes('advertis') || description.includes('promotion'))
    return 'Marketing';
  
  return SAMPLE_CATEGORIES[Math.floor(Math.random() * SAMPLE_CATEGORIES.length)];
};

// Main component
const ExpenseCategorization = () => {
  const { buttonStyles } = useFormStyles();
  const formatCurrency = useCurrencyFormat();
  
  // Primary state
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  
  // UI state
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('pie'); // 'pie' or 'bar'
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfidenceTooltip, setShowConfidenceTooltip] = useState(null);

  // Track whether data is loaded from real API or using sample data
  const [isUsingSampleData, setIsUsingSampleData] = useState(false);

  // Add new state for category editing
  const [editingCategory, setEditingCategory] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // New state for sorting
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  useEffect(() => {
    fetchCategorizedExpenses();
  }, []);

  const fetchCategorizedExpenses = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setIsRefreshing(true);
    
    try {
      const response = await aiApi.categorizeExpenses();
      
      if (response.data && response.data.success) {
        const categorizedData = response.data.data;
        setExpenses(categorizedData);
        processExpenseData(categorizedData);
        setIsUsingSampleData(false);
      } else {
        throw new Error('Failed to get categorization data');
      }
    } catch (error) {
      console.error('Error fetching categorized expenses:', error);
      setErrorMessage('Could not connect to AI categorization service. Using sample data instead.');
      
      // Attempt to fetch real expense data and categorize locally
      try {
        const [employeeResponse, salaryResponse, vendorResponse] = await Promise.all([
          employeeExpenseApi.getAll(),
          salaryExpenseApi.getAll(),
          vendorPaymentApi.getAll(),
        ]);
        
        const allExpenses = [
          ...(employeeResponse.data || []).map(exp => ({ 
            ...exp, 
            type: 'employee',
            suggestedCategory: generateSampleCategory(exp.expenseType) 
          })),
          ...(salaryResponse.data || []).map(exp => ({ 
            ...exp, 
            type: 'salary',
            suggestedCategory: 'Salary' 
          })),
          ...(vendorResponse.data || []).map(exp => ({ 
            ...exp, 
            type: 'vendor',
            suggestedCategory: generateSampleCategory(exp.description) 
          })),
        ];
        
        if (allExpenses.length > 0) {
          setExpenses(allExpenses);
          processExpenseData(allExpenses);
          setIsUsingSampleData(true);
        } else {
          // If no real expenses are found, use sample data
          setSampleData();
        }
      } catch (fetchError) {
        console.error('Error fetching real expense data:', fetchError);
        // Fall back to completely sample data
        setSampleData();
      }
    } finally {
      setIsLoading(false);
      // Give some time for the "Refreshing" indication to be visible
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  // Generate sample data for development or when API fails
  const setSampleData = () => {
    const sampleCategories = [
      'Office Supplies', 'Travel', 'Technology', 'Marketing', 
      'Utilities', 'Maintenance', 'Miscellaneous', 'Food', 
      'Rent', 'Insurance', 'Transportation'
    ];
    
    const sampleVendors = [
      'Office Depot', 'Delta Airlines', 'Microsoft', 'Google', 'AT&T',
      'Maintenance Co', 'Amazon', 'Uber', 'Staples', 'Apple', 'WeWork',
      'Zoom', 'Adobe', 'Facebook', 'Salesforce', 'Slack'
    ];
    
    const sampleExpenseTypes = [
      'Software', 'Hardware', 'Flight', 'Hotel', 'Supplies',
      'Internet', 'Electricity', 'Repair', 'Service', 'Subscription',
      'Meals', 'Transportation', 'Conference', 'Office Rent', 'Insurance'
    ];
    
    // Create sample expenses across the past 12 months
    const currentDate = new Date();
    const sampleData = [];
    
    // Generate 100 sample expenses
    for (let i = 0; i < 100; i++) {
      const amount = Math.round(Math.random() * 5000 + 100);
      const vendorIndex = Math.floor(Math.random() * sampleVendors.length);
      const typeIndex = Math.floor(Math.random() * sampleExpenseTypes.length);
      const categoryIndex = Math.floor(Math.random() * sampleCategories.length);
      
      // Generate a random date within the past 12 months (ensuring valid date)
      const monthsAgo = Math.floor(Math.random() * 12);
      const sampleDate = new Date(currentDate);
      sampleDate.setMonth(currentDate.getMonth() - monthsAgo);
      sampleDate.setDate(Math.floor(Math.random() * 28) + 1);
      
      const expenseType = sampleExpenseTypes[typeIndex];
      const vendorName = sampleVendors[vendorIndex];
      
      sampleData.push({
        id: i,
        date: sampleDate.toISOString(),
        amount: amount,
        vendorName: vendorName,
        expenseType: expenseType,
        // Either assign a category related to the expense type or a random one
        suggestedCategory: Math.random() > 0.7 
          ? generateSampleCategory(expenseType) 
          : sampleCategories[categoryIndex],
        paymentMethod: Math.random() > 0.5 ? 'Credit Card' : 'Bank Transfer',
        description: `Payment for ${expenseType} from ${vendorName}`,
        type: Math.random() > 0.7 ? 'employee' : (Math.random() > 0.5 ? 'vendor' : 'salary')
      });
    }
    
    setExpenses(sampleData);
    processExpenseData(sampleData);
    setIsUsingSampleData(true);
  };

  // Memoized filtered expenses based on search and category filter
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const vendorOrEmployee = expense.vendorName || expense.employeeName || '';
      const typeOrDescription = expense.expenseType || expense.description || '';
      
      const matchesSearch = searchTerm === '' || 
        vendorOrEmployee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        typeOrDescription.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || 
        (expense.suggestedCategory === filterType);
      
      return matchesSearch && matchesFilter;
    });
  }, [expenses, searchTerm, filterType]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredExpenses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredExpenses, page, itemsPerPage]);

  // Calculate total amount for filtered expenses
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce(
      (sum, expense) => sum + parseFloat(expense.amount || expense.amountPaid || expense.salary || expense.amountInclGST || 0), 
      0
    );
  }, [filteredExpenses]);

  // Process expense data to calculate statistics
  const processExpenseData = (data) => {
    if (!data || data.length === 0) {
      setCategoryStats([]);
      setMonthlyStats([]);
      return;
    }
    
    // Calculate category statistics
    const categoryMap = data.reduce((acc, expense) => {
      const category = expense.suggestedCategory || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = { count: 0, amount: 0 };
      }
      acc[category].count += 1;
      const amount = parseFloat(expense.amount || expense.amountPaid || expense.salary || expense.amountInclGST || 0);
      if (!isNaN(amount)) {
        acc[category].amount += amount;
      }
      return acc;
    }, {});
    
    const stats = Object.entries(categoryMap).map(([name, { count, amount }]) => ({
      name,
      value: count,
      amount
    }));
    
    setCategoryStats(stats);
    
    // Calculate monthly statistics
    const monthlyData = data.reduce((acc, expense) => {
      const dateValue = expense.date || expense.invoiceDate || expense.paymentDate;
      if (!dateValue) return acc;
      
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return acc;
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { 
          month: monthLabel, 
          total: 0,
          categories: {}
        };
      }
      
      const amount = parseFloat(expense.amount || expense.amountPaid || expense.salary || expense.amountInclGST || 0);
      if (!isNaN(amount)) {
        acc[monthKey].total += amount;
        
        const category = expense.suggestedCategory || 'Uncategorized';
        if (!acc[monthKey].categories[category]) {
          acc[monthKey].categories[category] = 0;
        }
        acc[monthKey].categories[category] += amount;
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    const monthlyStatsArray = Object.entries(monthlyData).map(([key, data]) => ({
      name: data.month,
      value: data.total,
      ...data.categories
    })).sort((a, b) => {
      const aDate = new Date(a.name);
      const bDate = new Date(b.name);
      return aDate - bDate;
    });
    
    setMonthlyStats(monthlyStatsArray);
  };

  // Add new function to handle category updates
  const handleCategoryUpdate = async (expense, newCategory) => {
    try {
      // Update the expense with the new category
      const updatedExpense = {
        ...expense,
        suggestedCategory: newCategory,
        lastCategorized: new Date().toISOString()
      };

      // Call the backend to update and learn from this categorization
      await aiApi.updateCategorization(updatedExpense);

      // Update the local state
      setExpenses(prevExpenses => 
        prevExpenses.map(exp => 
          exp.id === expense.id ? updatedExpense : exp
        )
      );

      // Show confirmation animation
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    } catch (error) {
      console.error('Error updating category:', error);
      setErrorMessage('Failed to update category. Please try again.');
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.7) return 'bg-blue-100 text-blue-800';
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.9) return 'High Confidence';
    if (confidence >= 0.7) return 'Good Confidence';
    if (confidence >= 0.5) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'historical_vendor':
        return '📊';
      case 'similar_vendor':
        return '🔍';
      case 'expense_type':
        return '📝';
      case 'ai_analysis':
        return '🤖';
      default:
        return '❓';
    }
  };

  const getMethodTooltip = (method) => {
    switch (method) {
      case 'historical_vendor':
        return 'Based on previous categorizations of this vendor';
      case 'similar_vendor':
        return 'Based on similar vendors in our database';
      case 'expense_type':
        return 'Based on expense type patterns';
      case 'ai_analysis':
        return 'Based on AI analysis of expense details';
      default:
        return 'Unknown categorization method';
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <ErrorBoundary>
      <motion.div 
        className="space-y-6 max-w-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header with title and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
            <TagIcon className="w-6 h-6 mr-2 text-primary-600" />
            AI Expense Categorization
            {isUsingSampleData && (
              <span className="ml-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                Sample Data
              </span>
            )}
          </h1>
          <div className="flex flex-wrap gap-2">
            <motion.button
              onClick={() => fetchCategorizedExpenses()}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-smooth"
              whileTap={{ scale: 0.95 }}
              disabled={isRefreshing}
            >
              <ArrowPathIcon className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Analysis'}
            </motion.button>
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <motion.button
                onClick={() => setViewMode('pie')}
                className={`px-3 py-2 flex items-center ${viewMode === 'pie' 
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' 
                  : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}
                whileTap={{ scale: 0.95 }}
              >
                <ChartPieIcon className="w-5 h-5 mr-1" />
                <span className="hidden sm:inline">Pie</span>
              </motion.button>
              <motion.button
                onClick={() => setViewMode('bar')}
                className={`px-3 py-2 flex items-center ${viewMode === 'bar' 
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' 
                  : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}
                whileTap={{ scale: 0.95 }}
              >
                <ChartBarIcon className="w-5 h-5 mr-1" />
                <span className="hidden sm:inline">Timeline</span>
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Error message alert */}
        {errorMessage && (
          <motion.div 
            className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4 rounded-md"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-200">{errorMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <button 
                  onClick={() => setErrorMessage('')}
                  className="inline-flex text-yellow-500 hover:text-yellow-600 focus:outline-none"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Analyzing your expense data...</p>
          </div>
        ) : (
          <>
            {/* Charts and Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Charts - takes 3/4 of the space on larger screens */}
              <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  {viewMode === 'pie' ? 'Expense Distribution by Category' : 'Monthly Expense Breakdown'}
                </h2>
                
                {/* Render either pie chart or bar chart based on viewMode */}
                {viewMode === 'pie' ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="amount"
                          label={({ name, percent }) => 
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {categoryStats.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => formatCurrency(value)} 
                          contentStyle={{ 
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)'
                          }}
                        />
                        <Legend 
                          layout="vertical" 
                          verticalAlign="middle" 
                          align="right"
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={value => formatCurrency(value, false)} />
                        <Tooltip 
                          formatter={(value, name) => [formatCurrency(value), name]}
                          contentStyle={{ 
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)'
                          }}
                        />
                        <Legend />
                        {categoryStats.slice(0, 8).map((category, index) => (
                          <Bar 
                            key={`bar-${index}`}
                            dataKey={category.name} 
                            stackId="a" 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              
              {/* Summary Stats - takes 1/4 of the space on larger screens */}
              <div className="space-y-4 lg:col-span-1">
                <motion.div 
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
                  whileHover={{ y: -2, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Summary
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{filteredExpenses.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{categoryStats.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Time Period</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{monthlyStats.length} months</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
                  whileHover={{ y: -2, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Filter & Search
                  </h2>
                  
                  {/* Category Filter */}
                  <div className="mb-4">
                    <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <FunnelIcon className="w-4 h-4 inline mr-1" />
                      Category
                    </label>
                    <select
                      id="categoryFilter"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      value={filterType}
                      onChange={(e) => {
                        setFilterType(e.target.value);
                        setPage(1); // Reset to first page when filtering
                      }}
                    >
                      <option value="all">All Categories</option>
                      {categoryStats.map((category, index) => (
                        <option key={index} value={category.name}>
                          {category.name} ({category.value})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Search Box */}
                  <div>
                    <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <MagnifyingGlassIcon className="w-4 h-4 inline mr-1" />
                      Search
                    </label>
                    <div className="relative">
                      <input
                        id="searchTerm"
                        type="text"
                        placeholder="Vendor, employee, or type..."
                        className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setPage(1); // Reset to first page when searching
                        }}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      {searchTerm && (
                        <button 
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setSearchTerm('')}
                        >
                          <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* Expense Table */}
            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Categorized Expenses
                  {filterType !== 'all' && (
                    <span className="ml-2 text-sm px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded-full">
                      {filterType}
                    </span>
                  )}
                </h2>
                
                {/* Items per page selector */}
                <div className="flex items-center">
                  <span className="mr-2 text-sm text-gray-600 dark:text-gray-300">Show:</span>
                  <select
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setPage(1); // Reset to first page when changing items per page
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>
                        Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('vendorName')}>
                        Vendor {sortConfig.key === 'vendorName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('amount')}>
                        Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">AI Category</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedExpenses.length > 0 ? (
                      paginatedExpenses.map((expense, index) => (
                        <motion.tr 
                          key={index}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                          onClick={() => setSelectedExpense(expense)}
                          whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.5)' }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {formatDate(expense.date || expense.paymentDate || expense.invoiceDate)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {expense.vendorName || expense.employeeName || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {expense.expenseType || expense.description || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(expense.amount || expense.amountPaid || expense.salary || expense.amountInclGST || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {expense.suggestedCategory}
                              </span>
                              <div className="relative">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(expense.confidence)}`}
                                  onMouseEnter={() => setShowConfidenceTooltip(expense._id)}
                                  onMouseLeave={() => setShowConfidenceTooltip(null)}
                                >
                                  {getConfidenceText(expense.confidence)}
                                </span>
                                {showConfidenceTooltip === expense._id && (
                                  <div className="absolute z-10 w-48 p-2 mt-1 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg">
                                    Confidence Score: {(expense.confidence * 100).toFixed(1)}%
                                  </div>
                                )}
                              </div>
                              <div className="relative">
                                <span
                                  className="text-lg cursor-help"
                                  onMouseEnter={() => setShowConfidenceTooltip(expense._id + '_method')}
                                  onMouseLeave={() => setShowConfidenceTooltip(null)}
                                >
                                  {getMethodIcon(expense.categorizationMethod)}
                                </span>
                                {showConfidenceTooltip === expense._id + '_method' && (
                                  <div className="absolute z-10 w-48 p-2 mt-1 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg">
                                    {getMethodTooltip(expense.categorizationMethod)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No expense data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Empty state */}
              {filteredExpenses.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No expenses found</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm || filterType !== 'all' 
                      ? 'No expenses match your current search and filter criteria.'
                      : 'No expense data is available. Try refreshing or check your data sources.'}
                  </p>
                  <div className="mt-6 space-x-3">
                    {(searchTerm || filterType !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterType('all');
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Clear filters
                      </button>
                    )}
                    <button
                      onClick={() => fetchCategorizedExpenses()}
                      className={`inline-flex items-center px-4 py-2 border ${
                        searchTerm || filterType !== 'all'
                          ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50' 
                          : 'border-transparent text-white bg-primary-600 hover:bg-primary-700'
                      } shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                    >
                      <ArrowPathIcon className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Refreshing...' : 'Refresh data'}
                    </button>
                  </div>
                </div>
              )}

              {/* Pagination controls */}
              {filteredExpenses.length > 0 && (
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 mt-4">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage(page > 1 ? page - 1 : 1)}
                      disabled={page === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md ${
                        page === 1 
                          ? 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800' 
                          : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                      disabled={page === totalPages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md ${
                        page === totalPages 
                          ? 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800' 
                          : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing <span className="font-medium">{((page - 1) * itemsPerPage) + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(page * itemsPerPage, filteredExpenses.length)}
                        </span>{' '}
                        of <span className="font-medium">{filteredExpenses.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setPage(page > 1 ? page - 1 : 1)}
                          disabled={page === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                            page === 1 
                              ? 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800' 
                              : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Show pages around the current page
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === pageNum 
                                  ? 'z-10 bg-primary-50 dark:bg-primary-900 border-primary-500 dark:border-primary-700 text-primary-600 dark:text-primary-200' 
                                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                          disabled={page === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                            page === totalPages 
                              ? 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800' 
                              : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
            
            {/* Expense Detail Modal */}
            {selectedExpense && (
              <motion.div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelectedExpense(null)}
              >
                <motion.div 
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-2xl w-full"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Expense Details</h3>
                    <button 
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={() => setSelectedExpense(null)}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</p>
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedExpense.date || selectedExpense.paymentDate || selectedExpense.invoiceDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(selectedExpense.amount || selectedExpense.amountPaid || selectedExpense.salary || selectedExpense.amountInclGST || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor/Source</p>
                      <p className="text-gray-900 dark:text-gray-100">{selectedExpense.vendorName || selectedExpense.employeeName || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</p>
                      <p className="text-gray-900 dark:text-gray-100">{selectedExpense.expenseType || selectedExpense.description || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">AI Categorization</p>
                      <div className="flex items-center mt-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                          <TagIcon className="w-4 h-4 mr-1" />
                          {selectedExpense.suggestedCategory || 'Uncategorized'}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</p>
                      <p className="text-gray-900 dark:text-gray-100">{selectedExpense.remarks || selectedExpense.description || 'No additional notes'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => setSelectedExpense(null)}
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </ErrorBoundary>
  );
};

export default ExpenseCategorization; 