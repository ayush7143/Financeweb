import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { 
  employeeExpenseApi, 
  salaryExpenseApi, 
  vendorPaymentApi, 
  incomeApi 
} from '../api/apiService';

const Transactions = () => {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        
        const [
          employeeExpensesResponse,
          salaryExpensesResponse,
          vendorPaymentsResponse,
          incomesResponse
        ] = await Promise.all([
          employeeExpenseApi.getAll(),
          salaryExpenseApi.getAll(),
          vendorPaymentApi.getAll(),
          incomeApi.getAll()
        ]);

        const allTransactions = [
          ...employeeExpensesResponse.data.map(expense => ({
            id: expense._id,
            type: 'expense',
            category: 'Employee Expense',
            amount: expense.amountPaid,
            date: expense.date,
            description: expense.description || 'Employee Expense'
          })),
          ...salaryExpensesResponse.data.map(expense => ({
            id: expense._id,
            type: 'expense',
            category: 'Salary',
            amount: expense.amountPaid,
            date: expense.date,
            description: expense.description || 'Salary Payment'
          })),
          ...vendorPaymentsResponse.data.map(payment => ({
            id: payment._id,
            type: 'expense',
            category: 'Vendor Payment',
            amount: payment.amountInclGST,
            date: payment.invoiceDate,
            description: payment.description || 'Vendor Payment'
          })),
          ...incomesResponse.data.map(income => ({
            id: income._id,
            type: 'income',
            category: income.source,
            amount: income.amountReceived,
            date: income.date,
            description: income.description || 'Income'
          }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        setTransactions(allTransactions);
      } catch (error) {
        setError('Failed to load transactions');
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Transactions</h1>
        <div className="flex space-x-4">
          <Link
            to="/employee-expense/new"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">+</span> New Expense
          </Link>
          <Link
            to="/income/new"
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <span className="mr-2">+</span> New Income
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

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
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-2 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="border-t">
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      transaction.type === 'income' 
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
  );
};

export default Transactions; 