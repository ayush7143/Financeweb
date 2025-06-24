import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useFormStyles, useCurrencyFormat } from '../utils/formUtils';
import { incomeApi } from '../api/apiService';
import IncomeEntryForm from '../components/forms/IncomeEntryForm';
import FloatingButton from '../components/common/FloatingButton';
import { useSnackbar } from '../context/SnackbarContext';

const IncomePage = () => {
  const { inputStyles, labelStyles, selectStyles, buttonStyles } = useFormStyles();
  const formatCurrency = useCurrencyFormat();
  const { showSnackbar } = useSnackbar();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormState, setShowFormState] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const response = await incomeApi.getAll();
      setIncomes(response.data || []);
    } catch (error) {
      console.error('Error fetching incomes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await incomeApi.delete(id);
      showSnackbar('Income entry deleted successfully', 'success');
      fetchIncomes();
    } catch (error) {
      console.error('Error deleting income:', error);
      showSnackbar('Failed to delete income entry', 'error');
    }
  };

  const handleEdit = (income) => {
    setSelectedIncome(income);
    setShowFormState(true);
  };

  const handleFormSubmit = () => {
    setShowFormState(false);
    setSelectedIncome(null);
    fetchIncomes();
  };

  const handleAddIncome = () => {
    setSelectedIncome(null);
    setShowFormState(true);
  };

  const loadIncomes = async () => {
    try {
      const response = await incomeApi.getAll();
      setIncomes(response.data || []);
    } catch (error) {
      console.error('Error loading incomes:', error);
      setIncomes([]);
    }
  };

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Income Entries</h1>
      </div>

      {showFormState ? (
        <div className="mb-8">
          <IncomeEntryForm
            income={selectedIncome}
            onSubmit={handleFormSubmit}
            showForm={showFormState}
            setShowForm={setShowFormState}
            onCancel={() => {
              setShowFormState(false);
              setSelectedIncome(null);
            }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : incomes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      No income entries found
                    </td>
                  </tr>
                ) : (
                  incomes.map((income) => (
                    <tr key={income._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(income.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {income.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(income.amountReceived)}
                      </td>
                      <td className="px-6 py-4">
                        {income.remarks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(income)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(income._id)}
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
        onClick={handleAddIncome} 
        label="Add Income"
        isVisible={!showFormState}
      />
    </div>
  );
};

export default IncomePage;