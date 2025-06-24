import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useFormStyles, useCurrencyFormat } from '../utils/formUtils';
import { employeeExpenseApi } from '../api/apiService';
import EmployeeExpenseForm from '../components/forms/EmployeeExpenseForm';
import FloatingButton from '../components/common/FloatingButton';
import { useSnackbar } from '../context/SnackbarContext';

const EmployeeExpensePage = () => {
  const { inputStyles, labelStyles, selectStyles, buttonStyles } = useFormStyles();
  const formatCurrency = useCurrencyFormat();
  const { showSnackbar } = useSnackbar();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeExpenseApi.getAll();
      
      // Add logging for debugging
      console.log('Fetched employee expenses:', response.data);
      
      // Validate data before setting state
      if (Array.isArray(response.data)) {
        setExpenses(response.data);
      } else {
        console.error('Invalid expense data format:', response.data);
        setExpenses([]);
        setError('Invalid data received from server');
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to load expenses. Please try again.');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await employeeExpenseApi.delete(id);
      showSnackbar('Expense deleted successfully', 'success');
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      showSnackbar('Failed to delete expense', 'error');
    }
  };

  const handleEdit = (expense) => {
    // Make sure we have a valid amount before editing
    const expenseWithValidAmount = {
      ...expense,
      amountPaid: parseFloat(expense.amountPaid || 0)
    };
    
    setSelectedExpense(expenseWithValidAmount);
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setSelectedExpense(null);
    fetchExpenses();
  };

  const handleAddExpense = () => {
    setSelectedExpense(null);
    setShowForm(true);
  };

  const renderAmount = (amount) => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      console.warn('Invalid amount value:', amount);
      return formatCurrency(0);
    }
    return formatCurrency(parsedAmount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employee Expenses</h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
          <button 
            className="ml-2 underline" 
            onClick={fetchExpenses}
          >
            Retry
          </button>
        </div>
      )}

      {showForm ? (
        <div className="mb-8">
          <EmployeeExpenseForm
            expense={selectedExpense}
            onSubmit={handleFormSubmit}
            showForm={showForm}
            setShowForm={setShowForm}
            onCancel={() => {
              setShowForm(false);
              setSelectedExpense(null);
            }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center">
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {expense.employeeName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {expense.expenseType || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {expense.description || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderAmount(expense.amountPaid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          expense.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-800' :
                          expense.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {expense.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FloatingButton 
        onClick={handleAddExpense} 
        label="Add Expense"
        isVisible={!showForm}
      />
    </div>
  );
};

export default EmployeeExpensePage;