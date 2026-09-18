const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    enum: ['income', 'expense'], 
    required: true 
  },
  icon: { type: String, default: 'tag' },
  isCustom: { type: Boolean, default: false }
});

module.exports = mongoose.model('Category', CategorySchema);
