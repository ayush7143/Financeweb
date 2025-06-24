const express = require('express');
const router = express.Router();
const { EmployeeExpense } = require('../Database/financialSchemas');

// Create employee expense
router.post('/', async (req, res) => {
    try {
        // Validate required fields
        const { date, employeeName, expenseType, amountPaid, description, status } = req.body;
        
        // Enhanced validation including data types
        if (!date) return res.status(400).json({ message: 'Date is required' });
        if (!employeeName) return res.status(400).json({ message: 'Employee name is required' });
        if (!expenseType) return res.status(400).json({ message: 'Expense type is required' });
        if (!description) return res.status(400).json({ message: 'Description is required' });
        
        // Validate amount specifically
        const amount = parseFloat(amountPaid);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Amount must be a valid number greater than zero' });
        }

        // Create new expense with properly parsed amount
        const newExpense = new EmployeeExpense({
            date,
            employeeName,
            expenseType,
            amountPaid: amount,
            description,
            status: status || 'Pending'
        });

        // Log for debugging
        console.log('Creating new employee expense:', newExpense);

        await newExpense.save();
        res.status(201).json(newExpense);
    } catch (error) {
        console.error('Employee expense creation error:', error);
        res.status(400).json({ message: error.message });
    }
});

// Get all employee expenses
router.get('/', async (req, res) => {
    try {
        const expenses = await EmployeeExpense.find().sort({ date: -1 });
        
        // Log for debugging
        console.log(`Retrieved ${expenses.length} employee expenses`);
        
        res.json(expenses);
    } catch (error) {
        console.error('Error fetching employee expenses:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get single employee expense
router.get('/:id', async (req, res) => {
    try {
        const expense = await EmployeeExpense.findById(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update employee expense
router.put('/:id', async (req, res) => {
    try {
        // Validate required fields
        const { date, employeeName, expenseType, amountPaid, description, status } = req.body;
        
        // Enhanced validation
        if (!date) return res.status(400).json({ message: 'Date is required' });
        if (!employeeName) return res.status(400).json({ message: 'Employee name is required' });
        if (!expenseType) return res.status(400).json({ message: 'Expense type is required' });
        if (!description) return res.status(400).json({ message: 'Description is required' });
        
        // Validate amount specifically
        const amount = parseFloat(amountPaid);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Amount must be a valid number greater than zero' });
        }

        // Prepare update data with properly parsed amount
        const updateData = {
            date,
            employeeName,
            expenseType,
            amountPaid: amount,
            description,
            status: status || 'Pending'
        };

        // Log for debugging
        console.log('Updating employee expense:', req.params.id, updateData);

        const expense = await EmployeeExpense.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        res.json(expense);
    } catch (error) {
        console.error('Employee expense update error:', error);
        res.status(400).json({ message: error.message });
    }
});

// Delete employee expense
router.delete('/:id', async (req, res) => {
    try {
        const expense = await EmployeeExpense.findByIdAndDelete(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
