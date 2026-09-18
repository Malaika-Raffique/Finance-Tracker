const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./db/connect');
const { seedInitialData } = require('./utils/ledgerEngine');

const accountsRoute = require('./routes/accounts');
const categoriesRoute = require('./routes/categories');
const peopleRoute = require('./routes/people');
const loansRoute = require('./routes/loans');
const debtsRoute = require('./routes/debts');
const transactionsRoute = require('./routes/transactions');
const reportsRoute = require('./routes/reports');
const backupRoute = require('./routes/backup');
const settingsRoute = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure DB Connection Middleware for Serverless execution
let isSeeded = false;
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  
  if (mongoose.connection.readyState !== 1) {
    const connected = await connectDB();
    if (connected && !isSeeded) {
      await seedInitialData();
      isSeeded = true;
    }
  }
  
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database not connected. Please configure MONGODB_URI in Vercel Environment Variables.'
    });
  }
  next();
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    dbConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString() 
  });
});

// API Routes
app.use('/api/accounts', accountsRoute);
app.use('/api/categories', categoriesRoute);
app.use('/api/people', peopleRoute);
app.use('/api/loans', loansRoute);
app.use('/api/debts', debtsRoute);
app.use('/api/transactions', transactionsRoute);
app.use('/api/reports', reportsRoute);
app.use('/api/backup', backupRoute);
app.use('/api/settings', settingsRoute);

async function startServer() {
  const connected = await connectDB();
  if (connected) {
    await seedInitialData();
    isSeeded = true;
  }

  app.listen(PORT, () => {
    console.log(`🚀 Finance Tracker API Server running on port ${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'production') {
  startServer();
}

module.exports = app;
