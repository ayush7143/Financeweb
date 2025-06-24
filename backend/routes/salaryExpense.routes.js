const express = require('express');
const router = express.Router();
const { SalaryExpense } = require('../Database/financialSchemas');

// Create salary expense
router.post('/', async (req, res) => {
    try {
        const newExpense = await SalaryExpense.create(req.body);
        res.status(201).json(newExpense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all salary expenses
router.get('/', async (req, res) => {
    try {
        const expenses = await SalaryExpense.find();
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single salary expense
router.get('/:id', async (req, res) => {
    try {
        const expense = await SalaryExpense.findById(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update salary expense
router.put('/:id', async (req, res) => {
    try {
        const expense = await SalaryExpense.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        res.json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete salary expense
router.delete('/:id', async (req, res) => {
    try {
        const expense = await SalaryExpense.findByIdAndDelete(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        res.json({ message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
