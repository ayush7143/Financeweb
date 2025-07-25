const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const morgan = require('morgan');
const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const app = express();
const PORT = process.env.PORT || 5000;

// Add request logging
app.use(morgan('dev', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Add error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

mongoose.connect(process.env.DB_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  logger.info('Connected to MongoDB');
}).catch((err) => {
  logger.error(`Failed to connect to MongoDB: ${err.message}`);
});

// Enable WebSocket
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Socket.io connection logging
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const incomeRoutes = require('./routes/income.routes');
const employeeExpenseRoutes = require('./routes/employeeExpense.routes');
const salaryExpenseRoutes = require('./routes/salaryExpense.routes');
const vendorPaymentRoutes = require('./routes/vendorPayment.routes');
const referenceDataRoutes = require('./routes/referenceData.routes');
// const aiRoutes = require('./routes/aiRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/employee-expense', employeeExpenseRoutes);
app.use('/api/salary-expense', salaryExpenseRoutes);
app.use('/api/vendor-payment', vendorPaymentRoutes);
app.use('/api/reference', referenceDataRoutes);
// app.use('/api/ai', aiRoutes);

// Change app.listen to server.listen
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
