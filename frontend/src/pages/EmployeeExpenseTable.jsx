import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  PencilIcon, TrashIcon, FunnelIcon as FilterIcon, ArrowUpIcon, ArrowDownIcon, MagnifyingGlassIcon as SearchIcon, PlusIcon, XMarkIcon as XIcon, ChevronLeftIcon, ChevronRightIcon, ArrowDownTrayIcon as DocumentDownloadIcon
} from '@heroicons/react/24/outline';
import DataTable from '../components/tables/DataTable';
import EmployeeExpenseForm from '../components/forms/EmployeeExpenseForm';
import { employeeExpenseApi } from '../api/apiService';

const EmployeeExpenseTable = () => {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    expenseType: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Expense types for filter dropdown
  const expenseTypes = ['All', 'Travel', 'Meals', 'Accommodation', 'Office Supplies', 'Software', 'Training', 'Other'];
  
  useEffect(() => {
    fetchExpenses();
  }, [sortField, sortDirection, currentPage]);
  
  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await employeeExpenseApi.getAll({
        sort: `${sortDirection === 'desc' ? '-' : ''}${sortField}`,
        page: currentPage,
        limit: itemsPerPage
      });
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      // Set some sample data for development/demo purposes
      setSampleData();
    } finally {
      setIsLoading(false);
    }
  };
  
  const setSampleData = () => {
    // Generate 20 sample expenses
    const sampleData = Array.from({ length: 20 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 60));
      
      const types = ['Travel', 'Meals', 'Accommodation', 'Office Supplies', 'Software', 'Training', 'Other'];
      const typeIndex = Math.floor(Math.random() * types.length);
      
      const employees = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Emily Davis', 'Michael Brown'];
      const employeeIndex = Math.floor(Math.random() * employees.length);
      
      return {
        _id: `sample-${i}`,
        date,
        employeeName: employees[employeeIndex],
        expenseType: types[typeIndex],
        amountPaid: Math.round(Math.random() * 1000) + 50,
        remarks: Math.random() > 0.7 ? `Sample expense ${i+1} remarks` : '',
        status: Math.random() > 0.3 ? 'Approved' : 'Pending'
      };
    });
    
    // Sort sample data based on current sort settings
    sampleData.sort((a, b) => {
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      } else if (sortField === 'amountPaid') {
        return sortDirection === 'asc'
          ? a.amountPaid - b.amountPaid
          : b.amountPaid - a.amountPaid;
      }
      // Default to alphabetical sorting for strings
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
    
    setExpenses(sampleData);
  };
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      expenseType: ''
    });
    setSearchQuery('');
    setCurrentPage(1);
  };
  
  const handleAdd = () => {
    setEditingExpense(null);
    setShowForm(true);
  };
  
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };
  
  const handleDelete = async (id) => {
    if (confirmDelete === id) {
      try {
        await employeeExpenseApi.delete(id);
        setExpenses(expenses.filter(expense => expense._id !== id));
        setConfirmDelete(null);
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense. Please try again.');
      }
    } else {
      setConfirmDelete(id);
      // Auto-cancel after 3 seconds
      setTimeout(() => {
        setConfirmDelete(null);
      }, 3000);
    }
  };
  
  const handleFormSuccess = (updatedExpense) => {
    if (editingExpense) {
      // Update expense in list
      setExpenses(expenses.map(expense => 
        expense._id === updatedExpense._id ? updatedExpense : expense
      ));
    } else {
      // Add new expense to list
      setExpenses([updatedExpense, ...expenses]);
    }
    setShowForm(false);
    setEditingExpense(null);
  };
  
  const exportToCSV = () => {
    // Create CSV content
    const headers = ['Date', 'Employee Name', 'Expense Type', 'Amount Paid', 'Remarks', 'Status'];
    
    const csvContent = [
      headers.join(','),
      ...filteredExpenses.map(expense => {
        const date = new Date(expense.date).toLocaleDateString();
        return [
          `"${date}"`,
          `"${expense.employeeName}"`,
          `"${expense.expenseType}"`,
          expense.amountPaid,
          `"${expense.remarks || ''}"`,
          `"${expense.status}"`
        ].join(',');
      })
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `employee-expenses-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Apply filters and search to expenses
  const filteredExpenses = expenses.filter(expense => {
    // Search query filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      expense.employeeName.toLowerCase().includes(searchLower) ||
      expense.expenseType.toLowerCase().includes(searchLower) ||
      (expense.remarks && expense.remarks.toLowerCase().includes(searchLower));
    
    // Date range filter
    const expenseDate = new Date(expense.date);
    const matchesDateFrom = !filters.dateFrom || expenseDate >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || expenseDate <= new Date(filters.dateTo);
    
    // Amount range filter
    const matchesMinAmount = !filters.minAmount || expense.amountPaid >= Number(filters.minAmount);
    const matchesMaxAmount = !filters.maxAmount || expense.amountPaid <= Number(filters.maxAmount);
    
    // Expense type filter
    const matchesType = !filters.expenseType || filters.expenseType === 'All' || expense.expenseType === filters.expenseType;
    
    return matchesSearch && matchesDateFrom && matchesDateTo && matchesMinAmount && matchesMaxAmount && matchesType;
  });
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Employee Expenses</h1>
        
        <div className="flex space-x-2">
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Add Expense
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm ${
              Object.values(filters).some(v => v !== '') || searchQuery
                ? 'bg-primary-50 text-primary-700 border-primary-300'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
          >
            <FilterIcon className="h-5 w-5 mr-1" />
            Filters
            {(Object.values(filters).some(v => v !== '') || searchQuery) && (
              <span className="ml-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full px-2 py-0.5">
                Active
              </span>
            )}
          </button>
          
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <DocumentDownloadIcon className="h-5 w-5 mr-1" />
            Export
          </button>
        </div>
      </div>
      
      {/* Search and Filter Panel */}
      <div className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 ${
        showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        {showFilters && (
          <div className="p-6 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Search by employee, expense type or remarks..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              {/* Amount Range Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                <input
                  type="number"
                  name="minAmount"
                  value={filters.minAmount}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                <input
                  type="number"
                  name="maxAmount"
                  value={filters.maxAmount}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>
              
              {/* Expense Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type</label>
                <select
                  name="expenseType"
                  value={filters.expenseType}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Types</option>
                  {expenseTypes.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <XIcon className="h-5 w-5 mr-1" />
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Form Section */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <EmployeeExpenseForm 
            onSuccess={handleFormSuccess} 
            expenseToEdit={editingExpense}
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingExpense(null);
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
      
      {/* Expenses Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : paginatedExpenses.length === 0 ? (
          <div className="py-24 text-center text-gray-500">
            <p>No expenses found. Add a new expense to get started.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center">
                        Date
                        {sortField === 'date' && (
                          sortDirection === 'asc' 
                            ? <ArrowUpIcon className="ml-1 h-4 w-4" /> 
                            : <ArrowDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('employeeName')}
                    >
                      <div className="flex items-center">
                        Employee
                        {sortField === 'employeeName' && (
                          sortDirection === 'asc' 
                            ? <ArrowUpIcon className="ml-1 h-4 w-4" /> 
                            : <ArrowDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('expenseType')}
                    >
                      <div className="flex items-center">
                        Type
                        {sortField === 'expenseType' && (
                          sortDirection === 'asc' 
                            ? <ArrowUpIcon className="ml-1 h-4 w-4" /> 
                            : <ArrowDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('amountPaid')}
                    >
                      <div className="flex items-center">
                        Amount
                        {sortField === 'amountPaid' && (
                          sortDirection === 'asc' 
                            ? <ArrowUpIcon className="ml-1 h-4 w-4" /> 
                            : <ArrowDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {sortField === 'status' && (
                          sortDirection === 'asc' 
                            ? <ArrowUpIcon className="ml-1 h-4 w-4" /> 
                            : <ArrowDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedExpenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{expense.employeeName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {expense.expenseType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(expense.amountPaid || expense.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                        {expense.remarks || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          expense.status === 'Approved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => handleEdit(expense)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(expense._id)}
                            className={`${confirmDelete === expense._id ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredExpenses.length)}
                    </span> of <span className="font-medium">{filteredExpenses.length}</span> expenses
                  </p>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Show</span>
                    <select
                      className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first, last, current, and pages around current
                        return page === 1 || page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1);
                      })
                      .map((page, i, pages) => {
                        // Add ellipsis if there are gaps
                        if (i > 0 && pages[i - 1] !== page - 1) {
                          return (
                            <span 
                              key={`ellipsis-${page}`}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                            >
                              ...
                            </span>
                          );
                        }
                        
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeExpenseTable; 