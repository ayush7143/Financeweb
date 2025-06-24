import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFormStyles, useCurrencyFormat } from '../../utils/formUtils';
import { salaryExpenseApi } from '../../api/apiService';
import { CalendarIcon, UserIcon, DocumentTextIcon, BuildingOfficeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { SettingsContext } from '../../context/SettingsContext';

const SalaryExpenseForm = ({ expense, onSubmit, onCancel, showForm: initialShowForm = false, setShowForm: parentSetShowForm }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { inputStyles, labelStyles, selectStyles, buttonStyles } = useFormStyles();
  const formatCurrency = useCurrencyFormat();
  const { settings } = useContext(SettingsContext);
  
  const [formData, setFormData] = useState({
    date: '',
    employeeName: '',
    department: '',
    month: '',
    amountPaid: '',
    status: 'Pending',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showFormState, setShowFormState] = useState(initialShowForm);
  
  useEffect(() => {
    if (id) {
      loadExpense();
    }
    if (expense) {
      setFormData({
        ...expense,
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : ''
      });
    }
    loadExpenses();
  }, [id, expense]);
  
  const loadExpenses = async () => {
    try {
      const response = await salaryExpenseApi.getAll();
      setExpenses(response.data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setExpenses([]);
    }
  };
  
  const loadExpense = async () => {
    try {
      setLoading(true);
      const response = await salaryExpenseApi.getById(id);
      setFormData({
        ...response.data,
        _id: response.data._id,
        date: response.data.date.split('T')[0]
      });
    } catch (error) {
      setError('Failed to load expense');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Convert string amounts to numbers
      const amountPaid = parseFloat(formData.amountPaid) || 0;

      // Prepare the data in the format expected by the backend
      const submissionData = {
        date: formData.date,
        employeeName: formData.employeeName,
        department: formData.department,
        month: formData.month,
        amountPaid: amountPaid,
        status: formData.status,
        notes: formData.notes
      };

      // Log the data being sent for debugging
      console.log('Submitting salary expense:', submissionData);

      if (formData._id) {
        await salaryExpenseApi.update(formData._id, submissionData);
        setSuccess('Salary expense updated successfully');
      } else {
        await salaryExpenseApi.create(submissionData);
        setSuccess('Salary expense created successfully');
      }
      
      // Refresh the expenses list
      await loadExpenses();
      
      // Clear the form if it's a new expense
      if (!formData._id) {
        setFormData({
          date: '',
          employeeName: '',
          department: '',
          month: '',
          amountPaid: '',
          status: 'Pending',
          notes: ''
        });
      }
      
      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit();
      }
      
      // Hide the form after successful submission
      toggleForm(false);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.message || 'Failed to save salary expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Update parent component's state if provided
  const toggleForm = (value) => {
    setShowFormState(value);
    if (parentSetShowForm) {
      parentSetShowForm(value);
    }
    if (!value && onCancel) {
      onCancel();
    }
  };
  
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
    if (!amount || isNaN(amount)) return `${settings.currency}0.00`;
    return `${settings.currency}${parseFloat(amount).toFixed(2)}`;
  };

  const formatMonth = (monthString) => {
    if (!monthString) return '-';
    try {
      const date = new Date(monthString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch (error) {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {expense ? 'Edit Salary Expense' : 'Add New Salary Expense'}
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
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Department Field */}
            <div>
              <label htmlFor="department" className={labelStyles}>
                Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className={`${selectStyles} pl-10`}
                >
                  <option value="">Select Department</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Development">Development</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>

            {/* Amount Field */}
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
                  min="0"
                  step="0.01"
                  className={`${inputStyles} pl-8`}
                  placeholder="0.00"
                />
              </div>
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

            {/* Month Field */}
            <div>
              <label htmlFor="month" className={labelStyles}>
                Month
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="month"
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  required
                  className={`${selectStyles} pl-10`}
                >
                  <option value="">Select Month</option>
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
              </div>
            </div>

            {/* Status Field */}
            <div>
              <label htmlFor="status" className={labelStyles}>
                Status
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CheckCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className={`${selectStyles} pl-10`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Notes Field */}
            <div className="md:col-span-2">
              <label htmlFor="notes" className={labelStyles}>
                Notes
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className={`${inputStyles} pl-10`}
                  placeholder="Optional notes"
                />
              </div>
            </div>
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

      {/* Salary Expenses Table */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Salary Expenses</h3>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : !expenses || expenses.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No salary expenses found
          </div>
        ) : (
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
                {Array.isArray(expenses) && expenses.map((expense, index) => (
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
                      {formatMonth(expense.month)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                      {formatAmount(expense.amountPaid)}
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
                        <motion.button
                          onClick={() => {
                            // Set selected expense for editing
                            setFormData({
                              ...expense,
                              _id: expense._id,
                              date: expense.date.split('T')[0]
                            });
                            // Scroll to top of form
                            window.scrollTo({top: 0, behavior: 'smooth'});
                            // Show form if not already visible
                            if (!showFormState) toggleForm(true);
                          }}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </motion.button>
                        <motion.button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this salary expense?')) {
                              salaryExpenseApi.delete(expense._id)
                                .then(() => {
                                  loadExpenses();
                                  setSuccess('Salary expense deleted successfully');
                                })
                                .catch(err => {
                                  console.error('Error deleting salary expense:', err);
                                  setError('Failed to delete salary expense');
                                });
                            }
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SalaryExpenseForm;