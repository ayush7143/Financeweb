const mongoose = require('mongoose');

const employeeExpenseSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    employeeName: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    remarks: { type: String },
    expenseType: { type: String, required: true },
    status: { type: String, default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeExpense', employeeExpenseSchema);
