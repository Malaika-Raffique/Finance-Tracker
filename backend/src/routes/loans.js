const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const Person = require('../models/Person');
const Transaction = require('../models/Transaction');
const { getAccountBalances } = require('../utils/ledgerEngine');

// GET all loans
router.get('/', async (req, res) => {
  try {
    const loans = await Loan.find().populate('person').sort({ dateGiven: -1 });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create loan (Give Loan - with Sufficient Balance Check)
router.post('/', async (req, res) => {
  try {
    const { personName, amount, dateGiven, dueDate, accountId, note } = req.body;
    if (!personName || !amount || !accountId) {
      return res.status(400).json({ error: 'Person name, amount, and account are required' });
    }

    const loanAmount = Number(amount);
    if (loanAmount <= 0) {
      return res.status(400).json({ error: 'Loan amount must be greater than zero' });
    }

    // Sufficient Balance Check
    const balances = await getAccountBalances();
    const account = balances.find(a => a._id.toString() === accountId.toString());
    
    if (!account) {
      return res.status(400).json({ error: 'Selected account not found' });
    }

    if (account.balance < loanAmount) {
      return res.status(400).json({ 
        error: `Insufficient Funds! Account "${account.name}" has a balance of Rs. ${account.balance}. You cannot lend Rs. ${loanAmount}. Please add funds to your account first.` 
      });
    }

    // Find or create person
    let person = await Person.findOne({ name: personName.trim() });
    if (!person) {
      person = await Person.create({ name: personName.trim() });
    }

    const loan = await Loan.create({
      person: person._id,
      originalAmount: loanAmount,
      remainingAmount: loanAmount,
      dateGiven: dateGiven || new Date().toISOString().split('T')[0],
      dueDate: dueDate || '',
      status: 'active',
      note: note || ''
    });

    // Create ledger transaction for loan given
    await Transaction.create({
      type: 'loan_given',
      amount: loanAmount,
      account: accountId,
      person: person._id,
      loan: loan._id,
      date: dateGiven || new Date().toISOString().split('T')[0],
      description: `Lent to ${person.name}`,
      note: note || ''
    });

    const populatedLoan = await Loan.findById(loan._id).populate('person');
    res.status(201).json(populatedLoan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST record repayment on loan
router.post('/:id/repay', async (req, res) => {
  try {
    const { amount, accountId, date, note } = req.body;
    if (!amount || !accountId) {
      return res.status(400).json({ error: 'Amount and account are required' });
    }

    const loan = await Loan.findById(req.params.id).populate('person');
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    const repayAmt = Number(amount);
    const newRemaining = Math.max(0, loan.remainingAmount - repayAmt);
    loan.remainingAmount = newRemaining;
    if (newRemaining === 0) {
      loan.status = 'settled';
    }
    await loan.save();

    // Create ledger transaction for repayment
    await Transaction.create({
      type: 'loan_repayment',
      amount: repayAmt,
      account: accountId,
      person: loan.person._id,
      loan: loan._id,
      date: date || new Date().toISOString().split('T')[0],
      description: `Loan Repayment from ${loan.person.name}`,
      note: note || ''
    });

    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
