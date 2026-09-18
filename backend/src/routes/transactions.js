const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Category = require('../models/Category');
const Person = require('../models/Person');
const { getAccountBalances } = require('../utils/ledgerEngine');

// GET transactions with optional filters
router.get('/', async (req, res) => {
  try {
    const { month, date, type, accountId, categoryId, personId, search, limit } = req.query;
    const filter = {};

    if (month) {
      filter.date = { $regex: `^${month}` }; // YYYY-MM
    } else if (date) {
      filter.date = date;
    }

    if (type) filter.type = type;
    if (accountId) filter.account = accountId;
    if (categoryId) filter.category = categoryId;
    if (personId) filter.person = personId;

    if (search) {
      const regex = new RegExp(search, 'i');
      const matchingPeople = await Person.find({ name: regex }).select('_id');
      const personIds = matchingPeople.map(p => p._id);
      
      filter.$or = [
        { description: regex },
        { note: regex },
        { person: { $in: personIds } }
      ];
    }

    let query = Transaction.find(filter)
      .populate('account toAccount category person loan debt')
      .sort({ date: -1, createdAt: -1 });

    if (limit) {
      query = query.limit(Number(limit));
    }

    const transactions = await query;
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create transaction (Income, Expense, Transfer - with Balance Validation)
router.post('/', async (req, res) => {
  try {
    const { type, amount, accountId, toAccountId, categoryId, personName, date, description, note } = req.body;

    if (!type || !amount || !accountId) {
      return res.status(400).json({ error: 'Type, amount, and account are required' });
    }

    const txAmount = Number(amount);
    if (txAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero' });
    }

    if (type === 'transfer' && !toAccountId) {
      return res.status(400).json({ error: 'Target account is required for transfers' });
    }

    // Sufficient Balance Check for Expense & Transfer
    if (type === 'expense' || type === 'transfer') {
      const balances = await getAccountBalances();
      const account = balances.find(a => a._id.toString() === accountId.toString());

      if (!account) {
        return res.status(400).json({ error: 'Selected account not found' });
      }

      if (account.balance < txAmount) {
        return res.status(400).json({ 
          error: `Insufficient Funds! Account "${account.name}" has a balance of Rs. ${account.balance}. You cannot ${type === 'expense' ? 'spend' : 'transfer'} Rs. ${txAmount}.` 
        });
      }
    }

    let personId = null;
    if (personName && personName.trim()) {
      let person = await Person.findOne({ name: personName.trim() });
      if (!person) {
        person = await Person.create({ name: personName.trim() });
      }
      personId = person._id;
    }

    const txDate = date || new Date().toISOString().split('T')[0];

    const transaction = await Transaction.create({
      type,
      amount: txAmount,
      account: accountId,
      toAccount: type === 'transfer' ? toAccountId : undefined,
      category: categoryId || undefined,
      person: personId || undefined,
      date: txDate,
      description: description || '',
      note: note || ''
    });

    const populatedTx = await Transaction.findById(transaction._id)
      .populate('account toAccount category person');
    
    res.status(201).json(populatedTx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE transaction
router.delete('/:id', async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
