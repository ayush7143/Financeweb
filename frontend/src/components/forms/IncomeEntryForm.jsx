import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFormStyles, useCurrencyFormat } from '../../utils/formUtils';
import { incomeApi } from '../../api/apiService';
import { CalendarIcon, BuildingOfficeIcon, DocumentTextIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { useSettings } from '../../context/SettingsContext';
import { useForm } from 'react-hook-form';
import axios from 'axios';

const IncomeEntryForm = ({ income, onSubmit, onCancel, showForm: initialShowForm = false, setShowForm: parentSetShowForm }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { inputStyles, labelStyles, selectStyles, buttonStyles } = useFormStyles();
  const formatCurrency = useCurrencyFormat();
  const { settings } = useSettings();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  // Predefined income categories
  const incomeCategories = [
    { _id: '1', name: 'Sales' },
    { _id: '2', name: 'Services' },
    { _id: '3', name: 'Interest' },
    { _id: '4', name: 'Rent' },
    { _id: '5', name: 'Commission' },
    { _id: '6', name: 'Other' }
  ];
  
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [localCategories, setLocalCategories] = useState(incomeCategories);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [incomes, setIncomes] = useState([]);
  const [showFormState, setShowFormState] = useState(initialShowForm);
  
  const [formData, setFormData] = useState({
    date: '',
    source: '',
    amountReceived: '',
    paymentMethod: '',
    category: '',
    remarks: ''
  });

  // Load incomes when component mounts
  useEffect(() => {
    loadIncomes();
  }, []);

  // Initialize form data when income prop changes
  useEffect(() => {
    if (income) {
      // When editing an existing entry
      setFormData({
        _id: income._id,
        date: income.date ? new Date(income.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        source: income.source || '',
        amountReceived: income.amountReceived?.toString() || '',
        paymentMethod: income.paymentMethod || '',
        category: income.category || '',
        remarks: income.remarks || ''
      });
    } else {
      // When creating a new entry
      setFormData({
        date: new Date().toISOString().split('T')[0],
        source: '',
        amountReceived: '',
        paymentMethod: '',
        category: '',
        remarks: ''
      });
    }
  }, [income]);

  const loadIncomes = async () => {
    try {
      const response = await incomeApi.getAll();
      setIncomes(response.data || []);
    } catch (error) {
      console.error('Error loading incomes:', error);
      setIncomes([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitForm = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Basic validation
      if (!formData.source || !formData.category || !formData.amountReceived || !formData.paymentMethod) {
        throw new Error('Please fill in all required fields');
      }

      // Prepare submission data
      const submissionData = {
        date: formData.date,
        source: formData.source.trim(),
        amountReceived: parseFloat(formData.amountReceived) || 0,
        paymentMethod: formData.paymentMethod,
        category: formData.category,
        remarks: formData.remarks?.trim() || ''
      };

      let response;
      if (formData._id) {
        // Update existing entry
        response = await incomeApi.update(formData._id, submissionData);
        setSuccess('Income entry updated successfully');
      } else {
        // Create new entry
        response = await incomeApi.create(submissionData);
        setSuccess('Income entry created successfully');
      }

      if (response) {
        // Refresh the list
        await loadIncomes();
        
        // Call onSubmit callback if provided
        if (onSubmit) {
          onSubmit();
        }
        
        // Clear form only for new entries
        if (!formData._id) {
          setFormData({
            date: new Date().toISOString().split('T')[0],
            source: '',
            amountReceived: '',
            paymentMethod: '',
            category: '',
            remarks: ''
          });
        }
        
        // Hide form after successful submission
        toggleForm(false);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.message || 'Failed to save income entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewCategory = async (e) => {
    e.preventDefault();
    if (newCategory.trim()) {
      const newCategoryObj = {
        _id: Date.now().toString(),
        name: newCategory.trim()
      };
      setLocalCategories([...localCategories, newCategoryObj]);
      setNewCategory('');
      setShowNewCategoryForm(false);
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
            {income ? 'Edit Income Entry' : 'Add New Income Entry'}
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

        <form onSubmit={(e) => {
          e.preventDefault();
          handleSubmitForm();
        }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Field */}
            <div>
              <label htmlFor="source" className={labelStyles}>Source</label>
              <input
                type="text"
                id="source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                required
                className={`${inputStyles} h-12`}
                placeholder="Income source"
              />
            </div>

            {/* Category Field */}
            <div>
              <label htmlFor="category" className={labelStyles}>Category</label>
              <div className="flex gap-2">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className={`${selectStyles} h-12`}
                >
                  <option value="">Select category</option>
                  {localCategories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                  className="px-4 py-2 bg-gray-200 rounded-md h-12 flex items-center justify-center hover:bg-gray-300 transition-colors"
                >
                  Add New
                </button>
              </div>
            </div>

            {/* Amount Field */}
            <div>
              <label htmlFor="amountReceived" className={labelStyles}>Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  id="amountReceived"
                  name="amountReceived"
                  value={formData.amountReceived}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className={`${inputStyles} h-12 pl-10`}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Date Field */}
            <div>
              <label htmlFor="date" className={labelStyles}>Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className={`${inputStyles} h-12`}
              />
            </div>

            {/* Payment Method Field */}
            <div>
              <label htmlFor="paymentMethod" className={labelStyles}>Payment Method</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                required
                className={`${selectStyles} h-12`}
              >
                <option value="">Select Payment Method</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Remarks Field */}
            <div className="md:col-span-2">
              <label htmlFor="remarks" className={labelStyles}>Remarks</label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={3}
                className={`${inputStyles} h-32`}
                placeholder="Optional remarks"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => toggleForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
              disabled={loading}
            >
              {loading ? 'Saving...' : (formData._id ? 'Update Income' : 'Save Income')}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Income Entries Table */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Income Entries</h3>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : !incomes || incomes.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No income entries found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">Remarks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {Array.isArray(incomes) && incomes.map((entry, index) => (
                  <motion.tr 
                    key={entry._id || index} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {entry.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                      {settings.currencySymbol}{formatCurrency(entry.amountReceived)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {entry.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="max-w-xs truncate" title={entry.remarks || '-'}>
                        {entry.remarks || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <motion.button
                          onClick={() => {
                            // Set selected income for editing
                            setFormData({
                              ...entry,
                              _id: entry._id, // Ensure the _id is set for updates
                              date: entry.date.split('T')[0]
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
                            if (window.confirm('Are you sure you want to delete this income entry?')) {
                              incomeApi.delete(entry._id)
                                .then(() => {
                                  loadIncomes();
                                  setSuccess('Income entry deleted successfully');
                                })
                                .catch(err => {
                                  console.error('Error deleting income entry:', err);
                                  setError('Failed to delete income entry');
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

export default IncomeEntryForm;