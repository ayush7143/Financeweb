const mongoose = require('mongoose');

const salaryExpenseSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    employeeName: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    department: { type: String, required: true },
    month: { type: String },
    status: { 
        type: String, 
        enum: ['Pending', 'Paid', 'Cancelled'], 
        default: 'Pending' 
    },
    notes: { type: String },
    remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SalaryExpense', salaryExpenseSchema);
