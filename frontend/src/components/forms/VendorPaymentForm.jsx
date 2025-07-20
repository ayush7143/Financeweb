import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFormStyles, useCurrencyFormat } from '../../utils/formUtils';
import { vendorPaymentApi } from '../../api/apiService';
import { CalendarIcon, UserIcon, DocumentTextIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { SettingsContext } from '../../context/SettingsContext';
import { useForm } from 'react-hook-form';
import axios from 'axios';

const VendorPaymentForm = ({ payment, onSubmit: onFormSubmit, onCancel, showForm: initialShowForm = false, setShowForm: parentSetShowForm, vendors }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { inputStyles, labelStyles, selectStyles, buttonStyles } = useFormStyles();
  const formatCurrency = useCurrencyFormat();
  const { settings } = useContext(SettingsContext);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: payment || {
      date: new Date().toISOString().split('T')[0],
      amount: '',
      description: '',
      category: '',
      status: 'pending'
    }
  });
  const [showNewVendorForm, setShowNewVendorForm] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    contact: '',
    address: ''
  });
  
  const [formData, setFormData] = useState({
    invoiceDate: '',
    vendorName: '',
    invoiceNumber: '',
    amountExclGST: '',
    gst: '',
    cgst: '',
    igst: '',
    amountInclGST: '',
    paymentMethod: '',
    status: 'Pending',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [payments, setPayments] = useState([]);
  const [showFormState, setShowFormState] = useState(initialShowForm);
  
  useEffect(() => {
    if (id) {
      loadPayment();
    }
    if (payment) {
      setFormData({
        ...payment,
        invoiceDate: payment.invoiceDate ? new Date(payment.invoiceDate).toISOString().split('T')[0] : ''
      });
    }
    loadPayments();
  }, [id, payment]);
  
  const loadPayments = async () => {
    try {
      const response = await vendorPaymentApi.getAll();
      setPayments(response.data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      setPayments([]);
    }
  };
  
  const loadPayment = async () => {
    try {
      setLoading(true);
      const response = await vendorPaymentApi.getById(id);
      const date = response.data.date ? new Date(response.data.date).toISOString().split('T')[0] : '';
      setFormData({
        ...response.data,
        _id: response.data._id,
        date
      });
    } catch (error) {
      setError('Failed to load payment');
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
  
  const submitPayment = handleSubmit(data => {
    onFormSubmit(data);
  });
  
  const handleFormSubmit = async (data) => {
    try {
      await onFormSubmit(data);
      reset();
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting payment:', error);
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

  const calculateGST = (amount) => {
    if (!amount) return { gst: '0.00', cgst: '0.00', igst: '0.00', total: '0.00' };
    
    const amountNum = parseFloat(amount);
    const gst = (amountNum * 0.18).toFixed(2);
    const cgst = (amountNum * 0.09).toFixed(2);
    const igst = (amountNum * 0.09).toFixed(2);
    const total = (amountNum + parseFloat(gst)).toFixed(2);
    
    return { gst, cgst, igst, total };
  };

  const handleAmountChange = (e) => {
    const { value } = e.target;
    const { gst, cgst, igst, total } = calculateGST(value);
    
    setFormData(prev => ({
      ...prev,
      amountExclGST: value,
      gst,
      cgst,
      igst,
      amountInclGST: total
    }));
  };

  const formatAmount = (amount) => {
    if (!amount || isNaN(amount)) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
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

  const handleAddNewVendor = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/reference/vendors', newVendor);
      setNewVendor({ name: '', contact: '', address: '' });
      setShowNewVendorForm(false);
      // Refresh vendors list
      window.location.reload();
    } catch (error) {
      console.error('Error adding new vendor:', error);
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
            {payment ? 'Edit Vendor Payment' : 'Add New Vendor Payment'}
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
          <motion.div 
            className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center">
              <ExclamationCircleIcon className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
        
        {success && (
          <motion.div 
            className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              <span>{success}</span>
            </div>
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Date Field */}
            <div>
              <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Invoice Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="invoiceDate"
                  name="invoiceDate"
                  value={formData.invoiceDate}
                  onChange={handleChange}
                  required
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            
            {/* Vendor Name Field */}
            <div>
              <label htmlFor="vendorName" className={labelStyles}>
                Vendor
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex gap-2">
                  <select
                    {...register('vendorName', { required: true })}
                    className={`${inputStyles} pl-10`}
                  >
                    <option value="">Select vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor._id} value={vendor.name}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewVendorForm(!showNewVendorForm)}
                    className="px-3 py-2 bg-gray-200 rounded-md"
                  >
                    Add New
                  </button>
                </div>
              </div>
            </div>
            
            {/* Invoice Number Field */}
            <div>
              <label htmlFor="invoiceNumber" className={labelStyles}>
                Invoice Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="invoiceNumber"
                  name="invoiceNumber"
                  required
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  className={`${inputStyles} pl-10`}
                  placeholder="Invoice number"
                />
              </div>
            </div>
            
            {/* Amount Field */}
            <div>
              <label htmlFor="amountExclGST" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount (Excl. GST)
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm ml-1">{settings.currencySymbol}</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className={`${inputStyles} pl-8`}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* GST Field (Auto-calculated) */}
            <div>
              <label htmlFor="gst" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                GST (18%)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">{settings.currency}</span>
                </div>
                <input
                  type="text"
                  id="gst"
                  name="gst"
                  value={formData.gst}
                  readOnly
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* CGST Field (Auto-calculated) */}
            <div>
              <label htmlFor="cgst" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CGST (9%)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">{settings.currency}</span>
                </div>
                <input
                  type="text"
                  id="cgst"
                  name="cgst"
                  value={formData.cgst}
                  readOnly
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* IGST Field (Auto-calculated) */}
            <div>
              <label htmlFor="igst" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                IGST (9%)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">{settings.currency}</span>
                </div>
                <input
                  type="text"
                  id="igst"
                  name="igst"
                  value={formData.igst}
                  readOnly
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Total Amount Field (Auto-calculated) */}
            <div>
              <label htmlFor="amountInclGST" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Amount (Incl. GST)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">{settings.currency}</span>
                </div>
                <input
                  type="text"
                  id="amountInclGST"
                  name="amountInclGST"
                  value={formData.amountInclGST}
                  readOnly
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-medium"
                />
              </div>
            </div>
            
            {/* Description Field */}
            <div className="md:col-span-2">
              <label htmlFor="description" className={labelStyles}>
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={inputStyles}
                rows="3"
                required
              />
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
                  className={`${selectStyles} pl-10`}
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
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
              ) : payment ? 'Update Payment' : 'Save Payment'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Vendor Payments Table */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Vendor Payments</h3>
          {!showFormState && (
            <motion.button
              onClick={() => toggleForm(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Payment
            </motion.button>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : !payments || payments.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No vendor payments found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {Array.isArray(payments) && payments.map((payment, index) => (
                  <motion.tr 
                    key={payment._id || index} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(payment.invoiceDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {payment.vendorName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {payment.invoiceNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                      {formatAmount(payment.amountInclGST)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payment.status === 'Paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : payment.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {payment.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="max-w-xs truncate" title={payment.description || '-'}>
                        {payment.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <motion.button
                          onClick={() => {
                            // Set selected payment for editing
                            setFormData({
                              ...payment,
                              _id: payment._id, // Ensure the _id is set for updates
                              invoiceDate: payment.invoiceDate ? new Date(payment.invoiceDate).toISOString().split('T')[0] : ''
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
                            if (window.confirm('Are you sure you want to delete this vendor payment?')) {
                              vendorPaymentApi.delete(payment._id)
                                .then(() => {
                                  loadPayments();
                                  setSuccess('Vendor payment deleted successfully');
                                })
                                .catch(err => {
                                  console.error('Error deleting vendor payment:', err);
                                  setError('Failed to delete vendor payment');
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

export default VendorPaymentForm;