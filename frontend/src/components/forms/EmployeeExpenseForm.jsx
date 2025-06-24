import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFormStyles, useCurrencyFormat } from '../../utils/formUtils';
import { employeeExpenseApi } from '../../api/apiService';
import { CalendarIcon, UserIcon, DocumentTextIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { SettingsContext } from '../../context/SettingsContext';
import { useForm } from 'react-hook-form';
import axios from 'axios';

const EmployeeExpenseForm = ({ expense, onSubmit: onFormSubmit, onCancel, showForm: initialShowForm = false, setShowForm: parentSetShowForm, expenseTypes }) => {
  const navigate = useNavigate();
  const { inputStyles, labelStyles, selectStyles, buttonStyles } = useFormStyles();
  const formatCurrency = useCurrencyFormat();
  const { settings } = useContext(SettingsContext);
  const { register, handleSubmit: formHandleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: expense || {
      date: new Date().toISOString().split('T')[0],
      amount: '',
      description: '',
      category: '',
      status: 'pending'
    }
  });
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newType, setNewType] = useState('');
  
  const [formData, setFormData] = useState({
    employeeName: '',
    expenseType: '',
    amountPaid: '',
    date: '',
    status: 'Pending',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(initialShowForm);

  // Initialize form data if expense is provided (edit mode)
  useEffect(() => {
    if (expense) {
      setFormData({
        ...expense,
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : ''
      });
    }
  }, [expense]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    await onFormSubmit(data);
  };

  const onSubmit = async (data) => {
    try {
      await axios.post('/api/employee-expense', data);
      reset();
    } catch (error) {
      console.error('Error submitting expense:', error);
    }
  };

  const handleAddNewType = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/reference/expense-types', { name: newType });
      setNewType('');
      setShowNewTypeForm(false);
      // Refresh expense types list
      window.location.reload();
    } catch (error) {
      console.error('Error adding new expense type:', error);
    }
  };

  // Update parent component's state if provided
  const toggleForm = (value) => {
    setShowForm(value);
    if (parentSetShowForm) {
      parentSetShowForm(value);
    }
    if (!value && onCancel) {
      onCancel();
    }
  };

  const submitForm = async (data) => {
    try {
      await onFormSubmit(data);
      reset();
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting expense:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {expense ? 'Edit Employee Expense' : 'Add New Employee Expense'}
        </h2>
        <button
          onClick={() => toggleForm(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {success && (
        <div className="mb-4 p-4 rounded-md bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-md bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200">
          <div className="flex items-center">
            <ExclamationCircleIcon className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={formHandleSubmit(submitForm)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employee Name Field */}
          <div>
            <label htmlFor="employeeName" className={labelStyles}>
              Employee Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="employeeName"
                name="employeeName"
                value={formData.employeeName}
                onChange={handleChange}
                required
                className={`${inputStyles} pl-10`}
                placeholder="Employee name"
              />
            </div>
          </div>

          {/* Expense Type Field */}
          <div>
            <label htmlFor="expenseType" className={labelStyles}>
              Expense Type
            </label>
            <div className="flex gap-2">
              <select
                id="expenseType"
                name="expenseType"
                value={formData.expenseType}
                onChange={handleChange}
                required
                className={selectStyles}
              >
                <option value="">Select expense type</option>
                {expenseTypes.map((type) => (
                  <option key={type._id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewTypeForm(!showNewTypeForm)}
                className="px-3 py-2 bg-gray-200 rounded-md"
              >
                Add New
              </button>
            </div>
            {showNewTypeForm && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="New expense type"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddNewType}
                  className="px-3 py-2 bg-green-500 text-white rounded-md"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Amount Paid Field */}
          <div>
            <label htmlFor="amountPaid" className={labelStyles}>
              Amount Paid
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm ml-1">{settings.currencySymbol}</span>
              </div>
              <input
                type="number"
                id="amountPaid"
                name="amountPaid"
                value={formData.amountPaid}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                className={`${inputStyles} pl-8`}
                placeholder="0.00"
              />
            </div>
            <small className="text-gray-500 mt-1 block">Enter a non-zero amount</small>
          </div>

          {/* Date Field */}
          <div>
            <label htmlFor="date" className={labelStyles}>
              Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className={`${inputStyles} pl-10`}
              />
            </div>
          </div>

          {/* Status Field */}
          <div>
            <label htmlFor="status" className={labelStyles}>
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={selectStyles}
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="description" className={labelStyles}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className={inputStyles}
            placeholder="Description of the expense"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => toggleForm(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : expense ? 'Update Expense' : 'Save Expense'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default EmployeeExpenseForm;