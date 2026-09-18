const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const Loan = require('../models/Loan');
const Debt = require('../models/Debt');
const Transaction = require('../models/Transaction');

// GET all people with summary
router.get('/', async (req, res) => {
  try {
    const people = await Person.find().sort({ name: 1 });
    const result = await Promise.all(people.map(async (p) => {
      const loans = await Loan.find({ person: p._id });
      const debts = await Debt.find({ person: p._id });

      const totalLent = loans.reduce((sum, l) => sum + l.originalAmount, 0);
      const remainingLoans = loans.reduce((sum, l) => sum + l.remainingAmount, 0);
      const totalLoanRepaid = totalLent - remainingLoans;

      const totalBorrowed = debts.reduce((sum, d) => sum + d.originalAmount, 0);
      const remainingDebts = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
      const totalDebtPaid = totalBorrowed - remainingDebts;

      return {
        _id: p._id,
        name: p.name,
        phone: p.phone,
        note: p.note,
        createdAt: p.createdAt,
        financials: {
          totalLent,
          totalLoanRepaid,
          remainingLoans, // People owe you
          totalBorrowed,
          totalDebtPaid,
          remainingDebts, // You owe them
          netBalance: remainingLoans - remainingDebts // Positive = they owe you, Negative = you owe them
        }
      };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single person details with full transaction history
router.get('/:id', async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) return res.status(404).json({ error: 'Person not found' });

    const loans = await Loan.find({ person: person._id });
    const debts = await Debt.find({ person: person._id });
    const transactions = await Transaction.find({ person: person._id })
      .populate('account toAccount category loan debt')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      person,
      loans,
      debts,
      transactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create or find person
router.post('/', async (req, res) => {
  try {
    const { name, phone, note } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    let person = await Person.findOne({ name: name.trim() });
    if (!person) {
      person = await Person.create({ name: name.trim(), phone: phone || '', note: note || '' });
    }
    res.status(201).json(person);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
