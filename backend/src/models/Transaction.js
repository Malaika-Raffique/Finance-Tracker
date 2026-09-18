const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['income', 'expense', 'loan_given', 'loan_repayment', 'debt_received', 'debt_payment', 'transfer'], 
    required: true 
  },
  amount: { type: Number, required: true, min: 0.01 },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  toAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // For transfers
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // Income/Expense category
  person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },     // Loan/Debt person
  loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },         // Loan ref
  debt: { type: mongoose.Schema.Types.ObjectId, ref: 'Debt' },         // Debt ref
  date: { type: String, required: true },                              // YYYY-MM-DD
  description: { type: String, default: '' },
  note: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
