import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import EmployeeExpenseForm from './EmployeeExpenseForm';
import SalaryExpenseForm from './SalaryExpenseForm';
import VendorPaymentForm from './VendorPaymentForm';

const ExpenseForm = () => {
  const [expenseType, setExpenseType] = useState('employee');
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    // Fetch expense types
    axios.get('/api/reference/expense-types')
      .then(response => setExpenseTypes(response.data))
      .catch(error => console.error('Error fetching expense types:', error));

    // Fetch vendors
    axios.get('/api/reference/vendors')
      .then(response => setVendors(response.data))
      .catch(error => console.error('Error fetching vendors:', error));
  }, []);

  const handleExpenseTypeChange = (e) => {
    setExpenseType(e.target.value);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Expense Type
        </label>
        <select
          value={expenseType}
          onChange={handleExpenseTypeChange}
          className="w-full p-2 border rounded-md"
        >
          <option value="employee">Employee Expense</option>
          <option value="salary">Salary Expense</option>
          <option value="vendor">Vendor Payment</option>
        </select>
      </div>

      {expenseType === 'employee' && (
        <EmployeeExpenseForm expenseTypes={expenseTypes} />
      )}
      {expenseType === 'salary' && (
        <SalaryExpenseForm />
      )}
      {expenseType === 'vendor' && (
        <VendorPaymentForm vendors={vendors} />
      )}
    </div>
  );
};

export default ExpenseForm; 