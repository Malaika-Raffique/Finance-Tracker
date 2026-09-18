const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { seedInitialData } = require('../utils/ledgerEngine');

// GET categories (auto-seed if empty)
router.get('/', async (req, res) => {
  try {
    let categories = await Category.find();
    if (categories.length === 0) {
      await seedInitialData();
      categories = await Category.find();
    }
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create custom category
router.post('/', async (req, res) => {
  try {
    const { name, type, icon } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });
    const category = await Category.create({
      name,
      type,
      icon: icon || 'tag',
      isCustom: true
    });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE custom category
router.delete('/:id', async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (cat && !cat.isCustom) {
      return res.status(400).json({ error: 'Cannot delete default category' });
    }
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
