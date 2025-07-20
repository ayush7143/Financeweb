// Load environment variables first
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
require('./config/passport'); // Initialize passport configuration

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'finance-web-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

// Import routes
const excelRoutes = require('./routes/excelRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const employeeExpenseRoutes = require('../routes/employeeExpense.routes');
const salaryExpenseRoutes = require('../routes/salaryExpense.routes');
const vendorPaymentRoutes = require('../routes/vendorPayment.routes');
const incomeRoutes = require('../routes/income.routes');
const authRoutes = require('../routes/auth.routes');

// Use routes
app.use('/api/excel', excelRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee-expense', employeeExpenseRoutes);
app.use('/api/salary-expense', salaryExpenseRoutes);
app.use('/api/vendor-payment', vendorPaymentRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/auth', authRoutes);

// MongoDB connection
mongoose.connect(process.env.DB_CONNECTION_STRING)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Test email configuration on startup
    const { testEmailConfig } = require('../utils/emailService');
    testEmailConfig();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('Finance Web API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});