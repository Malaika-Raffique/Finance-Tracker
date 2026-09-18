const express = require('express');
const router = express.Router();
const Debt = require('../models/Debt');
const Person = require('../models/Person');
const Transaction = require('../models/Transaction');
const { getAccountBalances } = require('../utils/ledgerEngine');

// GET all debts
router.get('/', async (req, res) => {
  try {
    const debts = await Debt.find().populate('person').sort({ dateReceived: -1 });
    res.json(debts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create debt / salary advance
router.post('/', async (req, res) => {
  try {
    const { creditorName, type, amount, dateReceived, dueDate, accountId, note } = req.body;
    if (!creditorName || !amount || !accountId) {
      return res.status(400).json({ error: 'Creditor name, amount, and account are required' });
    }

    // Find or create person/creditor
    let person = await Person.findOne({ name: creditorName.trim() });
    if (!person) {
      person = await Person.create({ name: creditorName.trim() });
    }

    const debt = await Debt.create({
      person: person._id,
      type: type || 'borrowed', // 'borrowed', 'salary_advance', 'other'
      originalAmount: Number(amount),
      remainingAmount: Number(amount),
      dateReceived: dateReceived || new Date().toISOString().split('T')[0],
      dueDate: dueDate || '',
      status: 'active',
      note: note || ''
    });

    // Create ledger transaction for debt received
    const descPrefix = type === 'salary_advance' ? 'Salary Advance received from' : 'Debt borrowed from';
    await Transaction.create({
      type: 'debt_received',
      amount: Number(amount),
      account: accountId,
      person: person._id,
      debt: debt._id,
      date: dateReceived || new Date().toISOString().split('T')[0],
      description: `${descPrefix} ${person.name}`,
      note: note || ''
    });

    const populatedDebt = await Debt.findById(debt._id).populate('person');
    res.status(201).json(populatedDebt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST record payment on debt (with Balance Check)
router.post('/:id/pay', async (req, res) => {
  try {
    const { amount, accountId, date, note } = req.body;
    if (!amount || !accountId) {
      return res.status(400).json({ error: 'Amount and account are required' });
    }

    const payAmt = Number(amount);
    if (payAmt <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero' });
    }

    // Sufficient Balance Check
    const balances = await getAccountBalances();
    const account = balances.find(a => a._id.toString() === accountId.toString());

    if (!account) {
      return res.status(400).json({ error: 'Selected account not found' });
    }

    if (account.balance < payAmt) {
      return res.status(400).json({ 
        error: `Insufficient Funds! Account "${account.name}" has a balance of Rs. ${account.balance}. You cannot pay Rs. ${payAmt}.` 
      });
    }

    const debt = await Debt.findById(req.params.id).populate('person');
    if (!debt) return res.status(404).json({ error: 'Debt not found' });

    const newRemaining = Math.max(0, debt.remainingAmount - payAmt);
    debt.remainingAmount = newRemaining;
    if (newRemaining === 0) {
      debt.status = 'settled';
    }
    await debt.save();

    // Create ledger transaction for debt payment
    await Transaction.create({
      type: 'debt_payment',
      amount: payAmt,
      account: accountId,
      person: debt.person._id,
      debt: debt._id,
      date: date || new Date().toISOString().split('T')[0],
      description: `Debt Payment to ${debt.person.name}`,
      note: note || ''
    });

    res.json(debt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
