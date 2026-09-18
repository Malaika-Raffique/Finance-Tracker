const express = require('express');
const router = express.Router();
const { getFinancialOverview } = require('../utils/ledgerEngine');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Person = require('../models/Person');

// GET dashboard metrics
router.get('/dashboard', async (req, res) => {
  try {
    const { month } = req.query; // format YYYY-MM
    const overview = await getFinancialOverview(month);
    res.json(overview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET yearly matrix report
router.get('/yearly', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear().toString();
    const transactions = await Transaction.find({
      date: { $regex: `^${year}` },
      type: { $in: ['income', 'expense'] }
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthNum = String(i + 1).padStart(2, '0');
      const monthKey = `${year}-${monthNum}`;
      return {
        monthKey,
        monthName: new Date(Number(year), i, 1).toLocaleString('default', { month: 'short' }),
        income: 0,
        expense: 0,
        net: 0
      };
    });

    transactions.forEach(tx => {
      const monthIndex = parseInt(tx.date.split('-')[1], 10) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        if (tx.type === 'income') {
          monthlyData[monthIndex].income += tx.amount;
        } else if (tx.type === 'expense') {
          monthlyData[monthIndex].expense += tx.amount;
        }
      }
    });

    monthlyData.forEach(m => {
      m.net = m.income - m.expense;
    });

    const totalYearIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
    const totalYearExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0);
    const totalYearNet = totalYearIncome - totalYearExpense;

    res.json({
      year,
      monthlyData,
      totals: {
        income: totalYearIncome,
        expense: totalYearExpense,
        net: totalYearNet
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET custom Category & Date Range Query (e.g. "How much was spent on Family from Feb 1 to Mar 31?")
router.get('/query', async (req, res) => {
  try {
    const { categoryId, type, startDate, endDate, personId } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (categoryId) filter.category = categoryId;
    if (personId) filter.person = personId;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const transactions = await Transaction.find(filter)
      .populate('category account person')
      .sort({ date: -1 });

    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    let categoryObj = null;
    if (categoryId) {
      categoryObj = await Category.findById(categoryId);
    }

    let personObj = null;
    if (personId) {
      personObj = await Person.findById(personId);
    }

    res.json({
      totalAmount,
      count: transactions.length,
      startDate: startDate || 'Beginning',
      endDate: endDate || 'Present',
      category: categoryObj,
      person: personObj,
      transactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Timeframe Report (Daily, Weekly, Monthly, Custom)
router.get('/timeframe', async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let start = startDate;
    let end = endDate || todayStr;

    if (period === 'daily') {
      start = todayStr;
      end = todayStr;
    } else if (period === 'weekly') {
      const pastWeek = new Date(today);
      pastWeek.setDate(today.getDate() - 7);
      start = pastWeek.toISOString().split('T')[0];
    } else if (period === 'monthly') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      start = `${year}-${month}-01`;
    }

    const filter = {};
    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = start;
      if (end) filter.date.$lte = end;
    }

    const transactions = await Transaction.find(filter)
      .populate('category account person')
      .sort({ date: -1 });

    let income = 0;
    let expense = 0;
    transactions.forEach(tx => {
      if (tx.type === 'income') income += tx.amount;
      if (tx.type === 'expense') expense += tx.amount;
    });

    res.json({
      period: period || 'custom',
      startDate: start || 'All',
      endDate: end || 'All',
      income,
      expense,
      net: income - expense,
      count: transactions.length,
      transactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
