const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  originalAmount: { type: Number, required: true, min: 0 },
  remainingAmount: { type: Number, required: true, min: 0 },
  dateGiven: { type: String, required: true }, // YYYY-MM-DD
  dueDate: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['active', 'settled', 'overdue'], 
    default: 'active' 
  },
  note: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Loan', LoanSchema);
