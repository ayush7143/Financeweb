const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const excelRoutes = require('./routes/excelRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reportRoutes = require('./routes/reportRoutes');
const employeeExpenseRoutes = require('../routes/employeeExpense.routes');
const salaryExpenseRoutes = require('../routes/salaryExpense.routes');
const vendorPaymentRoutes = require('../routes/vendorPayment.routes');
const incomeRoutes = require('../routes/income.routes');
const authRoutes = require('../routes/auth.routes');

// Use routes
app.use('/api/excel', excelRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/employee-expense', employeeExpenseRoutes);
app.use('/api/salary-expense', salaryExpenseRoutes);
app.use('/api/vendor-payment', vendorPaymentRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/auth', authRoutes);

// MongoDB connection
mongoose.connect(process.env.DB_CONNECTION_STRING)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('Finance Web API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});