import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  ChartBarIcon,
  BanknotesIcon as CashIcon,
  UsersIcon,
  ShoppingBagIcon,
  ArrowPathIcon as RefreshIcon,
  EllipsisHorizontalIcon as DotsHorizontalIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { FaMoneyBillWave, FaChartLine, FaWallet, FaChartPie } from 'react-icons/fa';
import Chart from 'chart.js/auto';
import { 
  employeeExpenseApi, 
  salaryExpenseApi, 
  vendorPaymentApi, 
  incomeApi 
} from '../api/apiService';
import '../styles/dashboard.css';
import { useCurrencyFormat } from '../utils/formUtils';
import { calculateProfitMargin } from '../utils/financialCalculations';
import { refreshFinancialData } from '../utils/dashboardUtils';
import AIBotWidget from '../components/common/AIBotWidget';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  
  // Add a state variable specifically for fixed date range
  const [fixedDateRange] = useState(() => {
    // Generate and return the fixed Apr 2025 to Mar 2026 date range
    const monthLabels = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 12; i++) {
      const monthIndex = (3 + i) % 12; // Start with April (index 3)
      const yearOffset = Math.floor((3 + i) / 12);
      const labelYear = 2025 + yearOffset;
      monthLabels.push(`${monthNames[monthIndex]} ${labelYear}`);
    }
    
    console.log("CREATING FIXED DATE RANGE:", monthLabels);
    return monthLabels;
  });
  
  const incomeChartRef = useRef(null);
  const expenseChartRef = useRef(null);
  const profitLossChartRef = useRef(null);
  
  // Format currency
  const formatCurrency = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: settings.currency || 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // Handle different date formats
      let date;
      if (typeof dateString === 'string') {
        // Try parsing the date string
        date = new Date(dateString);
        // If the date is invalid, try parsing with different formats
        if (isNaN(date.getTime())) {
          // Try parsing as ISO string
          date = new Date(dateString.replace('Z', ''));
          if (isNaN(date.getTime())) {
            // Try parsing as local date string
            const [year, month, day] = dateString.split('-');
            date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
        }
      } else if (dateString instanceof Date) {
        date = dateString;
      } else {
        return 'N/A';
      }

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }

      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'N/A';
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async (isRefresh = false) => {
      try {
        console.log(`FETCHING DATA - ${isRefresh ? 'Refreshing' : 'Starting fresh'} data fetch`);
        
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        
        // Clear any cached data
        localStorage.removeItem('chartData');
        localStorage.removeItem('dashboardStats');
        localStorage.removeItem('financialData');
        
        // Reset all state to clear any cached data
        setChartData(null);
        setStats(null);
        setRecentTransactions([]);
        
        // Add timestamp to avoid caching
        const timestamp = Date.now();
        console.log('Fetching dashboard data with timestamp:', timestamp);
        
        const [employeeExpensesResponse, salaryExpensesResponse, vendorPaymentsResponse, incomeResponse] = await Promise.all([
          employeeExpenseApi.getAll().catch(() => ({ data: [] })),
          salaryExpenseApi.getAll().catch(() => ({ data: [] })),
          vendorPaymentApi.getAll().catch(() => ({ data: [] })),
          incomeApi.getAll().catch(() => ({ data: [] }))
        ]);

        // Extract data from responses
        const employeeExpenses = Array.isArray(employeeExpensesResponse?.data) ? employeeExpensesResponse.data : [];
        const salaryExpenses = Array.isArray(salaryExpensesResponse?.data) ? salaryExpensesResponse.data : [];
        const vendorPayments = Array.isArray(vendorPaymentsResponse?.data) ? vendorPaymentsResponse.data : [];
        const income = Array.isArray(incomeResponse?.data) ? incomeResponse.data : [];

        console.log('Fetched data with timestamp:', timestamp, { employeeExpenses, salaryExpenses, vendorPayments, income });

        // Calculate totals
        const totalEmployeeExpenses = employeeExpenses.reduce((sum, item) => sum + (parseFloat(item.amountPaid) || 0), 0);
        // For salary, use amountPaid if present, else amount
        const totalSalaryExpenses = salaryExpenses.reduce((sum, item) => sum + (parseFloat(item.amountPaid || item.amount) || 0), 0);
        // For vendor, use amountInclGST if present, else amount
        const totalVendorExpenses = vendorPayments.reduce((sum, item) => sum + (parseFloat(item.amountInclGST || item.amount) || 0), 0);
        
        const totalIncome = income.reduce((sum, item) => sum + (parseFloat(item.amountReceived) || 0), 0);
        const totalExpenses = totalEmployeeExpenses + totalSalaryExpenses + totalVendorExpenses;
        const netIncome = totalIncome - totalExpenses;
        const profitMargin = calculateProfitMargin(totalIncome, totalExpenses);

        setStats({
          totalIncome,
          totalExpenses,
          netIncome,
          profitMargin,
          // Add category-specific expense totals for pie chart
          employeeExpenses: totalEmployeeExpenses,
          salaryExpenses: totalSalaryExpenses,
          vendorExpenses: totalVendorExpenses
        });

        // Prepare recent transactions
        const transactions = [
          ...employeeExpenses.map(expense => ({
            ...expense,
            type: 'Employee Expense',
            amount: parseFloat(expense.amountPaid) || 0,
            date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : null
          })),
          ...salaryExpenses.map(expense => ({
            ...expense,
            type: 'Salary Expense',
            amount: parseFloat(expense.amountPaid || expense.amount) || 0,
            date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : null
          })),
          ...vendorPayments.map(payment => ({
            ...payment,
            type: 'Vendor Payment',
            amount: parseFloat(payment.amountInclGST || payment.amount) || 0,
            date: payment.invoiceDate ? new Date(payment.invoiceDate).toISOString().split('T')[0] : null
          })),
          ...income.map(item => ({
            ...item,
            type: 'Income',
            amount: parseFloat(item.amountReceived) || 0,
            date: item.date ? new Date(item.date).toISOString().split('T')[0] : null
          }))
        ].sort((a, b) => {
          if (!a.date || !b.date) return 0;
          return new Date(b.date) - new Date(a.date);
        }).slice(0, 5);

        setRecentTransactions(transactions);

        console.log("BEFORE date range generation");
        
        // Use our fixed date range state variable for consistency
        console.log("Using fixed date range:", fixedDateRange);
        
        // Function to group transactions by month
        const groupByMonth = (transactions) => {
          // Initialize monthly data with zeros for each month
          const monthlyData = Array(fixedDateRange.length).fill(0);
          
          // Process each transaction and add to the appropriate month
          transactions.forEach(transaction => {
            try {
              if (!transaction.date) return;
              
              const transactionDate = new Date(transaction.date);
              if (isNaN(transactionDate.getTime())) return; // Skip invalid dates
              
              const transactionMonth = transactionDate.getMonth();
              const transactionYear = transactionDate.getFullYear();
              
              // Check if this transaction falls within Apr 2025 - Mar 2026
              if ((transactionYear === 2025 && transactionMonth >= 3) || // Apr 2025 - Dec 2025
                  (transactionYear === 2026 && transactionMonth <= 2)) { // Jan 2026 - Mar 2026
                
                // Calculate index in our month array
                let monthIndex;
                if (transactionYear === 2025) {
                  monthIndex = transactionMonth - 3; // 0-based: Apr=0, May=1, etc.
                } else {
                  monthIndex = 9 + transactionMonth; // Jan=9, Feb=10, Mar=11
                }
                
                if (monthIndex >= 0 && monthIndex < monthlyData.length) {
                  console.log(`Transaction from ${transaction.date} matches month ${fixedDateRange[monthIndex]}`);
                  const amount = transaction.type === 'Income' 
                    ? (parseFloat(transaction.amount) || 0) 
                    : (parseFloat(transaction.amount) || 0);
                    
                  monthlyData[monthIndex] += amount;
                }
              }
            } catch (err) {
              console.error('Error processing transaction date:', err, transaction);
            }
          });
          
          return monthlyData;
        };
        
        // Group all transactions data by month
        const incomeByMonth = groupByMonth(income.map(item => ({
          type: 'Income',
          amount: parseFloat(item.amountReceived) || 0,
          date: item.date
        })));
        const employeeExpensesByMonth = groupByMonth(employeeExpenses.map(expense => ({
          type: 'Employee Expense',
          amount: parseFloat(expense.amountPaid) || 0,
          date: expense.date
        })));
        // For salary, use amountPaid if present, else amount
        const salaryExpensesByMonth = groupByMonth(salaryExpenses.map(expense => ({
          type: 'Salary Expense',
          amount: parseFloat(expense.amountPaid || expense.amount) || 0,
          date: expense.date
        })));
        // For vendor, use amountInclGST if present, else amount, and invoiceDate if present, else date
        const vendorExpensesByMonth = groupByMonth(vendorPayments.map(payment => ({
          type: 'Vendor Payment',
          amount: parseFloat(payment.amountInclGST || payment.amount) || 0,
          date: payment.invoiceDate || payment.date
        })));
        // Calculate total expenses by month
        const expensesByMonth = fixedDateRange.map((_, index) => 
          employeeExpensesByMonth[index] + 
          salaryExpensesByMonth[index] + 
          vendorExpensesByMonth[index]
        );
        
        // Use actual data only for income and expenses - no placeholders
        const actualIncomeData = incomeByMonth;
        const actualExpenseData = expensesByMonth;
        
        // For expense distribution only - use real data if available
        const enhanceData = (data, baseAmount) => {
          // For expense distribution pie chart, enhance with placeholder data
          // We only want to show filled data for expense breakdown as it's not time-dependent
          return data.map((value, index) => {
            if (value === 0) {
              return 0; // Instead of generating random data, just use 0
            }
            return value;
          });
        };
        
        // Base values for expense distribution
        const avgExpense = totalExpenses > 0 ? totalExpenses / 
          (employeeExpenses.length + salaryExpenses.length + vendorPayments.length || 1) : 40000;
        
        // Update chart titles to reflect date range
        const getDateRangeText = () => {
          return `${fixedDateRange[0]} - ${fixedDateRange[fixedDateRange.length - 1]} (actual data only)`;
        };
        
        // Set chart data with only actual transaction data
        setChartData({
          labels: fixedDateRange,
          datasets: [
            {
              label: 'Income',
              data: actualIncomeData,
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              borderColor: 'rgb(34, 197, 94)',
              borderWidth: 1
            },
            {
              label: 'Expenses',
              data: actualExpenseData,
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              borderColor: 'rgb(239, 68, 68)',
              borderWidth: 1
            }
          ],
          // Add category data for pie chart - only use real data
          categoryData: {
            employeeExpenses: enhanceData(employeeExpensesByMonth, avgExpense / 3),
            salaryExpenses: enhanceData(salaryExpensesByMonth, avgExpense / 2),
            vendorExpenses: enhanceData(vendorExpensesByMonth, avgExpense / 4)
          },
          // Add date range text for chart titles
          dateRangeText: getDateRangeText()
        });
        
        console.log("FINAL CHART DATA - LABELS:", fixedDateRange);
        console.log("FINAL CHART DATA - INCOME:", actualIncomeData);
        console.log("FINAL CHART DATA - EXPENSES:", actualExpenseData);

      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchDashboardData();

    // Listen for dashboard refresh events
    const handleDashboardRefresh = () => {
      fetchDashboardData(true); // Pass true for refresh mode
    };

    const handleFinancialDataRefresh = () => {
      fetchDashboardData(true);
    };

    window.addEventListener('dashboardRefresh', handleDashboardRefresh);
    window.addEventListener('financialDataRefresh', handleFinancialDataRefresh);
    
    return () => {
      window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
      window.removeEventListener('financialDataRefresh', handleFinancialDataRefresh);
    };
  }, []);

  // Initialize charts once data is loaded
  useEffect(() => {
    // Clean up any existing charts
    let incomeChartInstance = null;
    
    if (!loading && chartData && incomeChartRef.current && chartData.datasets[0].data.some(val => val > 0)) {
      // Check if chart labels are still correct before rendering
      console.log("CHART INIT - Using labels:", chartData.labels);
      
      // Monthly Income Chart
      const ctx = incomeChartRef.current.getContext('2d');
      
      // Destroy existing chart if it exists
      const existingChart = Chart.getChart(incomeChartRef.current);
      if (existingChart) {
        existingChart.destroy();
      }

      incomeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          // Use our fixed date range state variable
          labels: fixedDateRange,
          datasets: [{
            label: 'Income',
            data: chartData.datasets[0].data,
            backgroundColor: theme === 'dark' 
              ? 'rgba(56, 189, 248, 0.8)' 
              : 'rgba(14, 165, 233, 0.8)',
            borderColor: theme === 'dark' 
              ? 'rgba(56, 189, 248, 1)' 
              : 'rgba(14, 165, 233, 1)',
            borderWidth: 1,
            borderRadius: 6,
            barThickness: 8,
            maxBarThickness: 12
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1500,
            easing: 'easeOutQuart'
          },
          layout: {
            padding: {
              top: 10,
              right: 10,
              bottom: 20,
              left: 10
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                callback: function(value) {
                  if (value >= 1000) {
                    return '₹' + (value / 1000).toFixed(0) + 'K';
                  }
                  return '₹' + value;
                },
                font: {
                  size: 8
                },
                maxRotation: 0
              },
              grid: {
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                drawBorder: false,
                drawTicks: false
              }
            },
            x: {
              ticks: {
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                font: {
                  size: 8
                },
                maxRotation: 45,
                minRotation: 45,
                autoSkip: false
              },
              grid: {
                display: false,
                drawBorder: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: chartData.dateRangeText ? `Monthly Income (${chartData.dateRangeText})` : 'Monthly Income',
              position: 'top',
              font: {
                size: 11,
                weight: 'normal'
              },
              padding: {
                top: 5,
                bottom: 10
              },
              color: theme === 'dark' ? '#e0e0e0' : '#333'
            },
            tooltip: {
              backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              titleColor: theme === 'dark' ? '#e0e0e0' : '#333',
              bodyColor: theme === 'dark' ? '#e0e0e0' : '#333',
              titleFont: {
                size: 11
              },
              bodyFont: {
                size: 11
              },
              padding: 10,
              cornerRadius: 8,
              boxPadding: 4,
              usePointStyle: true,
              callbacks: {
                label: function(context) {
                  return `Income: ${formatCurrency(context.raw)}`;
                }
              }
            }
          }
        }
        });
    }
    
    return () => {
      if (incomeChartInstance) {
        incomeChartInstance.destroy();
      }
    };
  }, [loading, chartData, theme, formatCurrency]);

  // Initialize expense chart
  useEffect(() => {
    let expenseChartInstance = null;
    
    if (!loading && stats && expenseChartRef.current) {
      console.log('Rendering expense chart with fresh stats:', stats);
      
      // Calculate expense distribution - use actual values only
      const employeeExpenses = stats.employeeExpenses || 0;
      const salaryExpenses = stats.salaryExpenses || 0;
      const vendorExpenses = stats.vendorExpenses || 0;
      
      // Only show chart if there's actual expense data
      if (employeeExpenses === 0 && salaryExpenses === 0 && vendorExpenses === 0) {
        // Clear the chart if no data
        const existingChart = Chart.getChart(expenseChartRef.current);
        if (existingChart) {
          existingChart.destroy();
        }
        return;
      }
      
      const expenseDistribution = [
        { category: 'Employee Expenses', value: employeeExpenses },
        { category: 'Salary Expenses', value: salaryExpenses },
        { category: 'Vendor Payments', value: vendorExpenses }
      ].filter(item => item.value > 0); // Only include categories with actual data
      
      // Destroy existing chart if it exists
      const existingChart = Chart.getChart(expenseChartRef.current);
      if (existingChart) {
        existingChart.destroy();
      }
      
      // Only create chart if we have data
      if (expenseDistribution.length > 0) {
        const ctx = expenseChartRef.current.getContext('2d');
        expenseChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: expenseDistribution.map(item => item.category),
            datasets: [{
              data: expenseDistribution.map(item => item.value),
              backgroundColor: [
                'rgba(249, 115, 22, 0.9)',  // Orange
                'rgba(79, 70, 229, 0.9)',   // Indigo
                'rgba(234, 179, 8, 0.9)',   // Yellow
                'rgba(20, 184, 166, 0.9)'   // Teal
              ].slice(0, expenseDistribution.length),
              borderColor: theme === 'dark' ? 'rgba(30, 30, 30, 0.8)' : 'white',
            borderWidth: 2,
            hoverOffset: 10,
            spacing: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1500,
            easing: 'easeOutCirc'
          },
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                padding: 10,
                usePointStyle: true,
                pointStyle: 'circle',
                font: {
                  size: 9,
                  weight: 'normal'
                },
                boxWidth: 8,
                boxHeight: 8
              }
            },
            title: {
              display: true,
              text: chartData && chartData.dateRangeText ? `Expense Distribution (${chartData.dateRangeText})` : 'Expense Distribution',
              position: 'top',
              font: {
                size: 11,
                weight: 'normal'
              },
              padding: {
                top: 5,
                bottom: 10
              },
              color: theme === 'dark' ? '#e0e0e0' : '#333'
            },
            tooltip: {
              backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              titleColor: theme === 'dark' ? '#e0e0e0' : '#333',
              bodyColor: theme === 'dark' ? '#e0e0e0' : '#333',
              padding: 12,
              cornerRadius: 8,
              boxPadding: 6,
              callbacks: {
                label: function(context) {
                  const value = context.raw;
                  const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                }
              }
            }
          }
        }});
      }
    }
    
    return () => {
      if (expenseChartInstance) {
        expenseChartInstance.destroy();
      }
    };
  }, [loading, stats, theme, formatCurrency, chartData]);

  // Initialize profit/loss chart
  useEffect(() => {
    let profitLossChartInstance = null;
    
    if (!loading && chartData && profitLossChartRef.current && 
        (chartData.datasets[0].data.some(val => val > 0) || chartData.datasets[1].data.some(val => val > 0))) {
      
      console.log("PROFIT/LOSS CHART - Using fixed date range:", fixedDateRange);
      
      // Calculate profit/loss data from income and expense data
      const profitLossData = fixedDateRange.map((_, index) => {
        const monthlyIncome = chartData.datasets[0].data[index] || 0;
        const monthlyExpenses = chartData.datasets[1].data[index] || 0;
        return monthlyIncome - monthlyExpenses;
      });
      
      // Destroy existing chart if it exists
      const existingChart = Chart.getChart(profitLossChartRef.current);
      if (existingChart) {
        existingChart.destroy();
      }
      
      // Create new chart
      const ctx = profitLossChartRef.current.getContext('2d');
      profitLossChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: fixedDateRange,
          datasets: [{
            label: 'Net Profit/Loss',
            data: profitLossData,
            fill: true,
            backgroundColor: function(context) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) {
                return;
              }
              const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
              gradient.addColorStop(0, theme === 'dark' ? 'rgba(16, 185, 129, 0)' : 'rgba(16, 185, 129, 0)');
              gradient.addColorStop(0.5, theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)');
              gradient.addColorStop(1, theme === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)');
              return gradient;
            },
            borderColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 1)',
            borderWidth: 3,
            tension: 0.4,
            pointBackgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 1)' : 'rgba(16, 185, 129, 1)',
            pointBorderColor: theme === 'dark' ? 'rgba(30, 30, 30, 1)' : 'white',
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 1)' : 'rgba(16, 185, 129, 1)',
            pointHoverBorderColor: theme === 'dark' ? 'white' : 'white',
            pointHoverBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1800,
            easing: 'easeOutQuint'
          },
          layout: {
            padding: {
              top: 10,
              right: 10,
              bottom: 20,
              left: 10
            }
          },
          scales: {
            y: {
              ticks: {
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                callback: function(value) {
                  // Simplify currency display for Y axis
                  if (value >= 1000) {
                    return '₹' + (value / 1000).toFixed(0) + 'K';
                  } else if (value <= -1000) {
                    return '-₹' + (Math.abs(value) / 1000).toFixed(0) + 'K';
                  }
                  return '₹' + value;
                },
                font: {
                  size: 8
                }
              },
              grid: {
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                drawBorder: false,
                drawTicks: false
              }
            },
            x: {
              ticks: {
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                font: {
                  size: 8
                },
                maxRotation: 45,
                minRotation: 45,
                autoSkip: false
              },
              grid: {
                display: false,
                drawBorder: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: chartData.dateRangeText ? `Profit/Loss Trend (${chartData.dateRangeText})` : 'Profit/Loss Trend',
              position: 'top',
              font: {
                size: 11,
                weight: 'normal'
              },
              padding: {
                top: 5,
                bottom: 10
              },
              color: theme === 'dark' ? '#e0e0e0' : '#333'
            },
            tooltip: {
              backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              titleColor: theme === 'dark' ? '#e0e0e0' : '#333',
              bodyColor: theme === 'dark' ? '#e0e0e0' : '#333',
              titleFont: {
                size: 10
              },
              bodyFont: {
                size: 10
              },
              padding: 8,
              cornerRadius: 6,
              boxPadding: 3,
              callbacks: {
                label: function(context) {
                  const value = context.raw;
                  return `${value >= 0 ? 'Profit' : 'Loss'}: ${formatCurrency(Math.abs(value))}`;
                }
              }
            }
          }
        }
        });
    }
    
    return () => {
      if (profitLossChartInstance) {
        profitLossChartInstance.destroy();
      }
    };
  }, [loading, chartData, theme, formatCurrency]);

  // Component for displaying financial stats
  const StatCard = ({ title, value, icon, isLoading }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="stat-content">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
          {isLoading ? (
            <div className="animate-pulse h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
          ) : (
            <p className="stat-value text-2xl font-semibold text-gray-900 dark:text-white mt-2">
              {title.includes('Margin') ? value : formatCurrency(value)}
            </p>
          )}
        </div>
        <div className="stat-icon p-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen">
      <div className="dashboard-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={() => refreshFinancialData()}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        <p className="dashboard-welcome">
          Welcome back{user ? `, ${user.name}` : ''}! Here's an overview of your financial data.
        </p>
        
        {/* Statistics Cards */}
        <div className="stats-grid">
          <StatCard
            title="Total Income"
            value={stats?.totalIncome || 0}
            icon={<FaMoneyBillWave className="text-green-500" />}
            isLoading={loading}
          />
          <StatCard
            title="Total Expenses"
            value={stats?.totalExpenses || 0}
            icon={<FaChartLine className="text-red-500" />}
            isLoading={loading}
          />
          <StatCard
            title="Net Profit"
            value={stats?.netIncome || 0}
            icon={<FaWallet className="text-blue-500" />}
            isLoading={loading}
          />
          <StatCard
            title="Profit Margin"
            value={stats?.profitMargin || 0}
            icon={<FaChartPie className="text-yellow-500" />}
            isLoading={loading}
          />
        </div>
        
        {/* Charts Section */}
        <div className="charts-container">
          {loading ? (
            <>
              <div className="chart-wrapper">
                <h2>Monthly Income (Apr 2025 - Mar 2026)</h2>
                <div className="chart-skeleton"></div>
              </div>
              <div className="chart-wrapper">
                <h2>Expense Distribution</h2>
                <div className="chart-skeleton"></div>
              </div>
              <div className="chart-wrapper profit-loss-chart">
                <h2>Profit/Loss Trend (Apr 2025 - Mar 2026)</h2>
                <div className="chart-skeleton"></div>
              </div>
            </>
          ) : (
            <>
              <div className="chart-wrapper">
                <h2>Monthly Income (Apr 2025 - Mar 2026)</h2>
                <div style={{ height: "350px", width: "100%", position: "relative" }}>
                  {chartData && chartData.datasets[0].data.some(val => val > 0) ? (
                    <canvas ref={incomeChartRef}></canvas>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No income data available for Apr 2025 - Mar 2026
                    </div>
                  )}
                </div>
              </div>
              <div className="chart-wrapper">
                <h2>Expense Distribution</h2>
                <div style={{ height: "350px", width: "100%", position: "relative" }}>
                  {stats && stats.totalExpenses > 0 ? (
                    <canvas ref={expenseChartRef}></canvas>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No expense data available
                    </div>
                  )}
                </div>
              </div>
              <div className="chart-wrapper profit-loss-chart">
                <h2>Profit/Loss Trend (Apr 2025 - Mar 2026)</h2>
                <div style={{ height: "350px", width: "100%", position: "relative" }}>
                  {chartData && (chartData.datasets[0].data.some(val => val > 0) || chartData.datasets[1].data.some(val => val > 0)) ? (
                    <canvas ref={profitLossChartRef}></canvas>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No profit/loss data available for Apr 2025 - Mar 2026
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Recent Transactions */}
        <div className="recent-transactions">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <Link
              to="/transactions"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all transactions
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-2 text-center">
                      <div className="animate-pulse h-6 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </td>
                  </tr>
                ) : recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-2 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((transaction, index) => (
                    <tr key={transaction.id || `transaction-${index}`} className="border-t">
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'Income' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-4 py-2">{transaction.category}</td>
                      <td className="px-4 py-2 text-right">
                        {transaction.type === 'expense' ? '-' : ''}
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-4 py-2">{formatDate(transaction.date)}</td>
                      <td className="px-4 py-2">{transaction.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <AIBotWidget />
      </div>
    </div>
  );
};

export default Dashboard;