const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    source: { type: String, required: true },
    category: { type: String, required: true },
    amountReceived: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Income', incomeSchema);
