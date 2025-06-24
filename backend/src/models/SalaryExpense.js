const mongoose = require('mongoose');

const salaryExpenseSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    employeeName: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    remarks: { type: String },
    department: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('SalaryExpense', salaryExpenseSchema);
