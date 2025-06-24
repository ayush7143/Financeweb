const express = require('express');
const router = express.Router();
const { Income } = require('../Database/financialSchemas');

// Create income
router.post('/', async (req, res) => {
    try {
        console.log('Creating new income entry:', req.body);
        const newIncome = await Income.create(req.body);
        console.log('Income entry created successfully:', newIncome);
        res.status(201).json(newIncome);
    } catch (error) {
        console.error('Error creating income entry:', error);
        res.status(400).json({ 
            message: error.message,
            details: error.errors || 'Validation failed'
        });
    }
});

// Get all incomes
router.get('/', async (req, res) => {
    try {
        console.log('Fetching all income entries');
        const incomes = await Income.find().sort({ date: -1 });
        console.log(`Found ${incomes.length} income entries`);
        res.json(incomes);
    } catch (error) {
        console.error('Error fetching income entries:', error);
        res.status(500).json({ 
            message: 'Failed to fetch income entries',
            details: error.message
        });
    }
});

// Get single income
router.get('/:id', async (req, res) => {
    try {
        console.log(`Fetching income entry with ID: ${req.params.id}`);
        const income = await Income.findById(req.params.id);
        if (!income) {
            console.log(`Income entry not found with ID: ${req.params.id}`);
            return res.status(404).json({ message: 'Income not found' });
        }
        console.log('Income entry found:', income);
        res.json(income);
    } catch (error) {
        console.error('Error fetching income entry:', error);
        res.status(500).json({ 
            message: 'Failed to fetch income entry',
            details: error.message
        });
    }
});

// Update income
router.put('/:id', async (req, res) => {
    try {
        console.log(`Updating income entry with ID: ${req.params.id}`, req.body);
        const income = await Income.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!income) {
            console.log(`Income entry not found for update with ID: ${req.params.id}`);
            return res.status(404).json({ message: 'Income not found' });
        }
        console.log('Income entry updated successfully:', income);
        res.json(income);
    } catch (error) {
        console.error('Error updating income entry:', error);
        res.status(400).json({ 
            message: error.message,
            details: error.errors || 'Validation failed'
        });
    }
});

// Delete income
router.delete('/:id', async (req, res) => {
    try {
        console.log(`Deleting income entry with ID: ${req.params.id}`);
        const income = await Income.findByIdAndDelete(req.params.id);
        if (!income) {
            console.log(`Income entry not found for deletion with ID: ${req.params.id}`);
            return res.status(404).json({ message: 'Income not found' });
        }
        console.log('Income entry deleted successfully');
        res.json({ message: 'Income deleted' });
    } catch (error) {
        console.error('Error deleting income entry:', error);
        res.status(500).json({ 
            message: 'Failed to delete income entry',
            details: error.message
        });
    }
});

module.exports = router;
