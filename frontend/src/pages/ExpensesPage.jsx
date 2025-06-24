import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormStyles, useCurrencyFormat, useDateFormat } from '../utils/formUtils';
import { SettingsContext } from '../context/SettingsContext';
import { useContext } from 'react';
import { BanknotesIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { employeeExpenseApi, salaryExpenseApi, vendorPaymentApi } from '../api/apiService';
import { useForm } from 'react-hook-form';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { useSnackbar } from '../context/SnackbarContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ExpensesPage = () => {
  const { settings } = useContext(SettingsContext);
  const { inputStyles, labelStyles, selectStyles, buttonStyles } = useFormStyles();
  const formatCurrency = useCurrencyFormat();
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm();
  const { formatDate, formatDateRange } = useDateFormat();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseType, setExpenseType] = useState('employee'); // 'employee', 'salary', or 'vendor'
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Add filter states
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    status: '',
    searchQuery: ''
  });

  // Add filter handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Add filtered expenses calculation
  const filteredExpenses = expenses.filter(expense => {
    // Date filter
    if (filters.dateFrom && new Date(expense.date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(expense.date) > new Date(filters.dateTo)) return false;
    
    // Amount filter
    if (filters.minAmount && expense.amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && expense.amount > parseFloat(filters.maxAmount)) return false;
    
    // Status filter
    if (filters.status && expense.status.toLowerCase() !== filters.status.toLowerCase()) return false;
    
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        expense.employeeName?.toLowerCase().includes(query) ||
        expense.vendorName?.toLowerCase().includes(query) ||
        expense.expenseType?.toLowerCase().includes(query) ||
        expense.department?.toLowerCase().includes(query) ||
        expense.remarks?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Add filter UI
  const renderFilters = () => (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <label className={labelStyles}>Date Range</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className={`${inputStyles} w-full pl-10`}
            />
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <div className="relative">
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className={`${inputStyles} w-full pl-10`}
            />
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
        {filters.dateFrom && filters.dateTo && (
          <p className="text-sm text-gray-500">
            {formatDateRange(filters.dateFrom, filters.dateTo)}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <label className={labelStyles}>Amount Range</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <input
              type="number"
              placeholder="Min"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              className={`${inputStyles} w-full pl-8`}
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {settings.currencySymbol}
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder="Max"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              className={`${inputStyles} w-full pl-8`}
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {settings.currencySymbol}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className={labelStyles}>Status</label>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className={`${selectStyles} w-full`}
        >
          <option value="">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Paid">Paid</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
      
      <div className="md:col-span-3 space-y-2">
        <label className={labelStyles}>Search</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, type, or remarks..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            className={`${inputStyles} w-full pl-10`}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const [employeeResponse, salaryResponse, vendorResponse] = await Promise.all([
        employeeExpenseApi.getAll(),
        salaryExpenseApi.getAll(),
        vendorPaymentApi.getAll()
      ]);

      const employeeExpenses = employeeResponse.data || [];
      const salaryExpenses = salaryResponse.data || [];
      const vendorPayments = vendorResponse.data || [];

      const allExpenses = [
        ...employeeExpenses.map(exp => ({ 
          ...exp, 
          type: 'employee',
          amount: exp.amountPaid,
          date: exp.date,
          status: exp.status || 'Pending'
        })),
        ...salaryExpenses.map(exp => ({ 
          ...exp, 
          type: 'salary',
          amount: exp.amountPaid,
          date: exp.date,
          status: exp.status || 'Pending'
        })),
        ...vendorPayments.map(exp => ({ 
          ...exp, 
          type: 'vendor',
          amount: exp.amountInclGST,
          date: exp.invoiceDate,
          status: exp.status || 'Pending'
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setExpenses(allExpenses);
    } catch (err) {
      setError('Failed to load expenses');
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setExpenseType(expense.type);
    setShowForm(true);
    
    // Format the date properly for the form
    const formattedDate = expense.date ? new Date(expense.date) : new Date();
    const formattedInvoiceDate = expense.invoiceDate ? new Date(expense.invoiceDate) : new Date();
    
    // Reset form with expense data
    reset({
      ...expense,
      date: formattedDate.toISOString(),
      invoiceDate: formattedInvoiceDate.toISOString(),
      status: expense.status || 'Pending',
      // For employee expenses
      employeeName: expense.employeeName,
      expenseType: expense.expenseType,
      amountPaid: expense.amountPaid,
      // For salary expenses
      department: expense.department,
      // For vendor payments
      vendorName: expense.vendorName,
      gstNumber: expense.gstNumber,
      invoiceNumber: expense.invoiceNumber,
      amountInclGST: expense.amountInclGST,
      amountExclGST: expense.amountExclGST,
      IGST: expense.IGST,
      CGST: expense.CGST,
      remarks: expense.remarks
    });
  };

  const handleDelete = async (expense) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      let response;
      switch (expense.type) {
        case 'employee':
          response = await employeeExpenseApi.delete(expense._id);
          break;
        case 'salary':
          response = await salaryExpenseApi.delete(expense._id);
          break;
        case 'vendor':
          response = await vendorPaymentApi.delete(expense._id);
          break;
      }
      
      if (response) {
        loadExpenses();
      }
    } catch (err) {
      setError('Failed to delete expense');
      console.error('Error deleting expense:', err);
    }
  };

  const onSubmit = async (data) => {
    try {
      let response;
      const formattedData = {
        ...data,
        status: data.status || 'Pending'
      };

      // Create a date object with the current time
      const now = new Date();
      const selectedDate = data.date ? new Date(data.date) : new Date();
      selectedDate.setHours(now.getHours());
      selectedDate.setMinutes(now.getMinutes());
      selectedDate.setSeconds(now.getSeconds());

      // For vendor payments, handle invoice date separately
      const invoiceDate = data.invoiceDate ? new Date(data.invoiceDate) : null;
      if (invoiceDate) {
        invoiceDate.setHours(now.getHours());
        invoiceDate.setMinutes(now.getMinutes());
        invoiceDate.setSeconds(now.getSeconds());
      }

      switch (expenseType) {
        case 'employee':
          const employeeData = {
            date: selectedDate,
            employeeName: formattedData.employeeName?.trim(),
            amountPaid: parseFloat(formattedData.amountPaid) || 0,
            expenseType: formattedData.expenseType?.trim(),
            description: formattedData.description?.trim(),
            status: formattedData.status || 'Pending'
          };

          // Validate required fields
          if (!employeeData.employeeName || !employeeData.expenseType || !employeeData.description || employeeData.amountPaid <= 0) {
            throw new Error('Please fill in all required fields');
          }

          response = selectedExpense 
            ? await employeeExpenseApi.update(selectedExpense._id, employeeData)
            : await employeeExpenseApi.create(employeeData);
          break;

        case 'salary':
          const salaryData = {
            date: selectedDate,
            employeeName: formattedData.employeeName?.trim(),
            department: formattedData.department?.trim(),
            amountPaid: parseFloat(formattedData.amountPaid) || 0,
            description: formattedData.description?.trim() || '',
            status: formattedData.status || 'Pending'
          };

          // Validate required fields
          if (!salaryData.employeeName || !salaryData.department || salaryData.amountPaid <= 0) {
            throw new Error('Please fill in all required fields');
          }

          response = selectedExpense 
            ? await salaryExpenseApi.update(selectedExpense._id, salaryData)
            : await salaryExpenseApi.create(salaryData);
          break;

        case 'vendor':
          const vendorData = {
            invoiceDate: invoiceDate || selectedDate,
            vendorName: formattedData.vendorName?.trim(),
            gstNumber: formattedData.gstNumber?.trim() || '',
            amountInclGST: parseFloat(formattedData.amountInclGST) || 0,
            amountExclGST: parseFloat(formattedData.amountExclGST) || 0,
            IGST: parseFloat(formattedData.IGST) || 0,
            CGST: parseFloat(formattedData.CGST) || 0,
            remarks: formattedData.remarks?.trim() || '',
            invoiceNumber: formattedData.invoiceNumber?.trim(),
            status: formattedData.status || 'Pending'
          };

          // Validate required fields
          if (!vendorData.vendorName || !vendorData.invoiceNumber || vendorData.amountInclGST <= 0) {
            throw new Error('Please fill in all required fields');
          }

          response = selectedExpense 
            ? await vendorPaymentApi.update(selectedExpense._id, vendorData)
            : await vendorPaymentApi.create(vendorData);
          break;
      }
      
      if (response) {
        await loadExpenses();
        setShowForm(false);
        setSelectedExpense(null);
        reset();
        showSnackbar('Expense saved successfully', 'success');
        window.dispatchEvent(new Event('dashboardRefresh'));
      }
    } catch (err) {
      setError(err.message || 'Failed to save expense');
      console.error('Error saving expense:', err);
      showSnackbar(err.message || 'Failed to save expense', 'error');
    }
  };

  const getExpenseTypeLabel = (type) => {
    switch (type) {
      case 'employee':
        return 'Employee Expense';
      case 'salary':
        return 'Salary Expense';
      case 'vendor':
        return 'Vendor Payment';
      default:
        return 'Expense';
    }
  };

  const calculateGST = (amountInclGST) => {
    const gstRate = 0.18; // 18% GST
    const amountExclGST = amountInclGST / (1 + gstRate);
    const gstAmount = amountInclGST - amountExclGST;
    const igstAmount = gstAmount / 2; // 9% IGST
    const cgstAmount = gstAmount / 2; // 9% CGST

    return {
      amountExclGST: parseFloat(amountExclGST.toFixed(2)),
      IGST: parseFloat(igstAmount.toFixed(2)),
      CGST: parseFloat(cgstAmount.toFixed(2))
    };
  };

  const handleAmountInclGSTChange = (e) => {
    const amountInclGST = parseFloat(e.target.value) || 0;
    const calculatedGST = calculateGST(amountInclGST);
    
    // Update form values
    setValue('amountExclGST', calculatedGST.amountExclGST);
    setValue('IGST', calculatedGST.IGST);
    setValue('CGST', calculatedGST.CGST);
  };

  const renderDateInput = (date, onChange, name, placeholder) => (
    <div className="relative w-full h-12">
      <DatePicker
        selected={date ? new Date(date) : null}
        onChange={(date) => {
          if (date) {
            setValue(name, date.toISOString());
          }
        }}
        dateFormat="dd/MM/yyyy"
        placeholderText={placeholder}
        className={`${inputStyles} w-full h-12 pl-10 pr-4`}
        showYearDropdown
        showMonthDropdown
        dropdownMode="select"
        yearDropdownItemNumber={10}
        scrollableYearDropdown
        required
      />
      <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );

  const renderExpenseForm = () => {
    switch (expenseType) {
      case 'employee':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelStyles}>Employee Name</label>
              <input
                type="text"
                {...register('employeeName', { required: true })}
                className={`${inputStyles} w-full h-12`}
                placeholder="Enter employee name"
              />
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>Expense Type</label>
              <input
                type="text"
                {...register('expenseType', { required: true })}
                className={`${inputStyles} w-full h-12`}
                placeholder="Enter expense type"
              />
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>Amount Paid</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  {...register('amountPaid', { required: true, min: 0.01 })}
                  className={`${inputStyles} w-full h-12 pl-8 pr-4`}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>Status</label>
              <select
                {...register('status', { required: true })}
                className={`${selectStyles} w-full h-12`}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className={labelStyles}>Description</label>
              <textarea
                {...register('description', { required: true })}
                className={`${inputStyles} w-full h-32`}
                rows="4"
                placeholder="Enter expense description"
              />
            </div>
          </div>
        );
      case 'salary':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelStyles}>Employee Name</label>
              <input
                type="text"
                {...register('employeeName', { required: true })}
                className={`${inputStyles} w-full h-12`}
                placeholder="Enter employee name"
              />
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>Department</label>
              <input
                type="text"
                {...register('department', { required: true })}
                className={`${inputStyles} w-full h-12`}
                placeholder="Enter department"
              />
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>Amount Paid</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  {...register('amountPaid', { required: true, min: 0.01 })}
                  className={`${inputStyles} w-full h-12 pl-8 pr-4`}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>Status</label>
              <select
                {...register('status', { required: true })}
                className={`${selectStyles} w-full h-12`}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className={labelStyles}>Description</label>
              <textarea
                {...register('description', { required: true })}
                className={`${inputStyles} w-full h-32`}
                rows="4"
                placeholder="Enter salary description"
              />
            </div>
          </div>
        );
      case 'vendor':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelStyles}>Vendor Name</label>
              <input
                type="text"
                {...register('vendorName', { required: true })}
                className={`${inputStyles} w-full h-12`}
                placeholder="Enter vendor name"
              />
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>GST Number</label>
              <input
                type="text"
                {...register('gstNumber')}
                className={`${inputStyles} w-full h-12`}
                placeholder="Enter GST number"
              />
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>Invoice Number</label>
              <input
                type="text"
                {...register('invoiceNumber', { required: true })}
                className={`${inputStyles} w-full h-12`}
                placeholder="Enter invoice number"
              />
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>Invoice Date</label>
              {renderDateInput(watch('invoiceDate'), setValue, 'invoiceDate', 'Select invoice date')}
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>Amount (Incl. GST)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  {...register('amountInclGST', { required: true })}
                  className={`${inputStyles} w-full h-12 pl-8 pr-4`}
                  placeholder="0.00"
                  onChange={handleAmountInclGSTChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>Amount (Excl. GST)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  {...register('amountExclGST', { required: true })}
                  className={`${inputStyles} w-full h-12 pl-8 pr-4`}
                  placeholder="0.00"
                  readOnly
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>IGST</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  {...register('IGST', { required: true })}
                  className={`${inputStyles} w-full h-12 pl-8 pr-4`}
                  placeholder="0.00"
                  readOnly
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>CGST</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  {...register('CGST', { required: true })}
                  className={`${inputStyles} w-full h-12 pl-8 pr-4`}
                  placeholder="0.00"
                  readOnly
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className={labelStyles}>Description</label>
              <textarea
                {...register('description', { required: true })}
                className={`${inputStyles} w-full h-32`}
                rows="4"
                placeholder="Enter vendor payment description"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderAmountInput = (label, name, value, onChange, required = true) => (
    <div className="w-full">
      <label className={labelStyles}>{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
          {settings.currencySymbol}
        </span>
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          className={`${inputStyles} w-full pl-8 pr-4`}
          step="0.01"
          min="0"
          required={required}
        />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
        {!showForm && (
          <button
            onClick={() => {
              setSelectedExpense(null);
              setExpenseType('employee'); // Reset to default type
              setShowForm(true);
              reset(); // Reset form data
            }}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Expense
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          <div className="flex items-center">
            <ExclamationCircleIcon className="w-5 h-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {!showForm && renderFilters()}

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {selectedExpense ? 'Edit' : 'Add New'} Expense
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelStyles}>Expense Type</label>
                  <select
                    {...register('type', { required: true })}
                    value={expenseType}
                    onChange={(e) => {
                      setExpenseType(e.target.value);
                      reset({
                        type: e.target.value,
                        date: new Date().toISOString(),
                        status: 'Pending'
                      });
                    }}
                    className={`${selectStyles} w-full h-12`}
                  >
                    <option value="employee">Employee Expense</option>
                    <option value="salary">Salary Expense</option>
                    <option value="vendor">Vendor Payment</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={labelStyles}>Date</label>
                  {renderDateInput(watch('date'), setValue, 'date', 'Select date')}
                </div>
              </div>

              {/* Dynamic form fields based on expense type */}
              {renderExpenseForm()}

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedExpense(null);
                    reset();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {selectedExpense ? 'Update' : 'Add'} Expense
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl my-8 mx-auto"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Edit Expense
                </h3>
                <button 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => setShowEditModal(false)}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelStyles}>Expense Type</label>
                      <select
                        {...register('type', { required: true })}
                        value={expenseType}
                        onChange={(e) => {
                          setExpenseType(e.target.value);
                          reset(); // Reset form when type changes
                        }}
                        className={selectStyles}
                      >
                        <option value="employee">Employee Expense</option>
                        <option value="salary">Salary Expense</option>
                        <option value="vendor">Vendor Payment</option>
                      </select>
                    </div>

                    {renderDateInput(watch('date'), setValue, 'date', 'Select date')}

                    {/* Dynamic form fields based on expense type */}
                    {renderExpenseForm()}

                    <div className="md:col-span-2">
                      <label className={labelStyles}>Remarks</label>
                      <textarea
                        {...register('remarks')}
                        className={inputStyles}
                        rows="3"
                      />
                    </div>

                    <div>
                      <label className={labelStyles}>Status</label>
                      <select
                        {...register('status', { required: true })}
                        className={selectStyles}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedExpense(null);
                        reset();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-primary-600 rounded-md hover:bg-primary-700"
                    >
                      Update Expense
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredExpenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(expense.date, 'short')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(expense.date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {getExpenseTypeLabel(expense.type)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {expense.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      expense.type === 'salary'
                        ? expense.status?.toLowerCase() === 'paid'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : expense.status?.toLowerCase() === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : expense.status?.toLowerCase() === 'approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : expense.status?.toLowerCase() === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {expense.type === 'salary' 
                        ? expense.status === 'Paid' ? 'Paid' 
                          : expense.status === 'Pending' ? 'Pending'
                          : 'Cancelled'
                        : expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;