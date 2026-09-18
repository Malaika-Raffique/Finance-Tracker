const mongoose = require('mongoose');

const DebtSchema = new mongoose.Schema({
  person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  type: { 
    type: String, 
    enum: ['borrowed', 'salary_advance', 'other'], 
    default: 'borrowed' 
  },
  originalAmount: { type: Number, required: true, min: 0 },
  remainingAmount: { type: Number, required: true, min: 0 },
  dateReceived: { type: String, required: true }, // YYYY-MM-DD
  dueDate: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['active', 'settled', 'overdue'], 
    default: 'active' 
  },
  note: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Debt', DebtSchema);
