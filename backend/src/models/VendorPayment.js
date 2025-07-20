const mongoose = require('mongoose');

const vendorPaymentSchema = new mongoose.Schema({
    invoiceDate: { type: Date, required: true },
    vendorName: { type: String, required: true },
    gstNumber: { type: String },
    amountInclGST: { type: Number, required: true },
    amountExclGST: { type: Number, required: true },
    IGST: { type: Number, default: 0 },
    CGST: { type: Number, default: 0 },
    remarks: { type: String },
    invoiceNumber: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Pending', 'Paid', 'Cancelled'], 
        default: 'Pending' 
    }
}, { timestamps: true });

module.exports = mongoose.model('VendorPayment', vendorPaymentSchema);
