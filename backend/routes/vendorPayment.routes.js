const express = require('express');
const router = express.Router();
const { VendorPayment } = require('../Database/financialSchemas');

// Create vendor payment
router.post('/', async (req, res) => {
    try {
        const newPayment = await VendorPayment.create(req.body);
        res.status(201).json(newPayment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all vendor payments
router.get('/', async (req, res) => {
    try {
        const payments = await VendorPayment.find();
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single vendor payment
router.get('/:id', async (req, res) => {
    try {
        const payment = await VendorPayment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update vendor payment
router.put('/:id', async (req, res) => {
    try {
        const payment = await VendorPayment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        res.json(payment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete vendor payment
router.delete('/:id', async (req, res) => {
    try {
        const payment = await VendorPayment.findByIdAndDelete(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        res.json({ message: 'Payment deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
