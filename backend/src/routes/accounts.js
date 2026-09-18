const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const { getAccountBalances, seedInitialData } = require('../utils/ledgerEngine');

// GET all accounts with calculated balances (auto-seed if empty)
router.get('/', async (req, res) => {
  try {
    let accounts = await getAccountBalances();
    if (accounts.length === 0) {
      await seedInitialData();
      accounts = await getAccountBalances();
    }
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create account
router.post('/', async (req, res) => {
  try {
    const { name, type, initialBalance } = req.body;
    if (!name) return res.status(400).json({ error: 'Account name is required' });
    const account = await Account.create({
      name,
      type: type || 'cash',
      initialBalance: Number(initialBalance) || 0
    });
    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update account
router.put('/:id', async (req, res) => {
  try {
    const { name, type, initialBalance } = req.body;
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { name, type, initialBalance },
      { new: true }
    );
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE account
router.delete('/:id', async (req, res) => {
  try {
    await Account.findByIdAndDelete(req.params.id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
