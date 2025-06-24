const express = require('express');
const router = express.Router();
const { ExpenseType, Vendor, IncomeCategory } = require('../Database/financialSchemas');

// Expense Types Routes
router.get('/expense-types', async (req, res) => {
  try {
    const types = await ExpenseType.find();
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/expense-types', async (req, res) => {
  try {
    const type = new ExpenseType(req.body);
    const savedType = await type.save();
    res.status(201).json(savedType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Vendor Routes
router.get('/vendors', async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/vendors', async (req, res) => {
  try {
    const vendor = new Vendor(req.body);
    const savedVendor = await vendor.save();
    res.status(201).json(savedVendor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Income Categories Routes
router.get('/income-categories', async (req, res) => {
  try {
    const categories = await IncomeCategory.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/income-categories', async (req, res) => {
  try {
    const category = new IncomeCategory(req.body);
    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 