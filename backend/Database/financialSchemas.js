const mongoose = require('mongoose');

// Define schemas for reference data
const expenseTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String }
});

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  contact: { type: String },
  address: { type: String }
});

const incomeCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String }
});

// Define main schemas
const employeeExpenseSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  expenseType: { type: String, required: true },
  amountPaid: { type: Number, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  remarks: { type: String }
});

const salaryExpenseSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  department: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  remarks: { type: String }
});

const vendorPaymentSchema = new mongoose.Schema({
  vendorName: { type: String, required: true },
  paymentType: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  remarks: { type: String }
});

const incomeSchema = new mongoose.Schema({
  source: { type: String, required: true },
  category: { type: String, required: true },
  amountReceived: { type: Number, required: true },
  date: { type: Date, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  remarks: { type: String }
});

// Create models only if they don't exist
const ExpenseType = mongoose.models.ExpenseType || mongoose.model('ExpenseType', expenseTypeSchema);
const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);
const IncomeCategory = mongoose.models.IncomeCategory || mongoose.model('IncomeCategory', incomeCategorySchema);
const EmployeeExpense = mongoose.models.EmployeeExpense || mongoose.model('EmployeeExpense', employeeExpenseSchema);
const SalaryExpense = mongoose.models.SalaryExpense || mongoose.model('SalaryExpense', salaryExpenseSchema);
const VendorPayment = mongoose.models.VendorPayment || mongoose.model('VendorPayment', vendorPaymentSchema);
const Income = mongoose.models.Income || mongoose.model('Income', incomeSchema);

module.exports = {
  ExpenseType,
  Vendor,
  IncomeCategory,
  EmployeeExpense,
  SalaryExpense,
  VendorPayment,
  Income
};