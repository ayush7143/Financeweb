const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Passport config
require('./src/config/passport');

// Logger setup
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

// Middlewares
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
app.use(cookieParser());

// Express Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
  secure: process.env.NODE_ENV === 'production', // set to true on Render
  httpOnly: true,
  sameSite: 'lax', // or 'none' if frontend is on a different domain with HTTPS
  maxAge: 24 * 60 * 60 * 1000
}

  })
);

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect(process.env.DB_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  logger.info('Connected to MongoDB');
}).catch((err) => {
  logger.error(`Failed to connect to MongoDB: ${err.message}`);
});

// WebSocket Setup
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Routes
const authRoutes = require('./routes/auth.routes');
const incomeRoutes = require('./routes/income.routes');
const employeeExpenseRoutes = require('./routes/employeeExpense.routes');
const salaryExpenseRoutes = require('./routes/salaryExpense.routes');
const vendorPaymentRoutes = require('./routes/vendorPayment.routes');
const referenceDataRoutes = require('./routes/referenceData.routes');

app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/employee-expense', employeeExpenseRoutes);
app.use('/api/salary-expense', salaryExpenseRoutes);
app.use('/api/vendor-payment', vendorPaymentRoutes);
app.use('/api/reference', referenceDataRoutes);

// Error Handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
