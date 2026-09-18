const Account = require('../models/Account');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const Debt = require('../models/Debt');
const Person = require('../models/Person');
const Setting = require('../models/Setting');

async function seedInitialData() {
  // Seed Default Currency
  const currencySetting = await Setting.findOne({ key: 'currency' });
  if (!currencySetting) {
    await Setting.create({ key: 'currency', value: { symbol: 'Rs.', code: 'PKR', name: 'Pakistani Rupee' } });
  }

  // Rename JazzCash to NayaPay if present in existing DB
  await Account.updateMany({ name: 'JazzCash' }, { name: 'NayaPay' });

  // Seed Default Accounts if empty
  const accountCount = await Account.countDocuments();
  if (accountCount === 0) {
    await Account.insertMany([
      { name: 'Cash', type: 'cash', initialBalance: 0 },
      { name: 'Bank Account', type: 'bank', initialBalance: 0 },
      { name: 'NayaPay', type: 'wallet', initialBalance: 0 },
      { name: 'Easypaisa', type: 'wallet', initialBalance: 0 }
    ]);
    console.log('🌱 Default accounts (Cash, Bank, NayaPay, Easypaisa) seeded.');
  }

  // Seed Default Categories if empty
  const categoryCount = await Category.countDocuments();
  if (categoryCount === 0) {
    await Category.insertMany([
      // Income
      { name: 'Salary', type: 'income', icon: 'briefcase', isCustom: false },
      { name: 'Commission', type: 'income', icon: 'trending-up', isCustom: false },
      { name: 'Project', type: 'income', icon: 'code', isCustom: false },
      { name: 'Other Income', type: 'income', icon: 'plus-circle', isCustom: false },
      // Expense
      { name: 'Family', type: 'expense', icon: 'home', isCustom: false },
      { name: 'Food', type: 'expense', icon: 'utensils', isCustom: false },
      { name: 'Transport', type: 'expense', icon: 'car', isCustom: false },
      { name: 'Education Expense', type: 'expense', icon: 'book', isCustom: false },
      { name: 'Other', type: 'expense', icon: 'more-horizontal', isCustom: false }
    ]);
    console.log('🌱 Default categories seeded.');
  }
}

async function getAccountBalances() {
  const accounts = await Account.find();
  const transactions = await Transaction.find();

  const balances = {};
  accounts.forEach(acc => {
    balances[acc._id.toString()] = {
      _id: acc._id,
      name: acc.name,
      type: acc.type,
      balance: acc.initialBalance
    };
  });

  transactions.forEach(tx => {
    const accId = tx.account ? tx.account.toString() : null;
    const toAccId = tx.toAccount ? tx.toAccount.toString() : null;

    if (accId && balances[accId]) {
      if (tx.type === 'income' || tx.type === 'loan_repayment' || tx.type === 'debt_received') {
        balances[accId].balance += tx.amount;
      } else if (tx.type === 'expense' || tx.type === 'loan_given' || tx.type === 'debt_payment') {
        balances[accId].balance -= tx.amount;
      } else if (tx.type === 'transfer') {
        balances[accId].balance -= tx.amount;
      }
    }

    if (tx.type === 'transfer' && toAccId && balances[toAccId]) {
      balances[toAccId].balance += tx.amount;
    }
  });

  return Object.values(balances);
}

async function getFinancialOverview(monthString) { // format YYYY-MM
  const accountsWithBalances = await getAccountBalances();
  const totalCash = accountsWithBalances.reduce((sum, acc) => sum + acc.balance, 0);

  // Receivables (Active Loans Given)
  const loans = await Loan.find({ status: { $ne: 'settled' } }).populate('person');
  const allLoans = await Loan.find().populate('person');
  const totalLent = allLoans.reduce((sum, l) => sum + l.originalAmount, 0);
  const totalReceivables = loans.reduce((sum, l) => sum + l.remainingAmount, 0);
  const totalLoanRecovered = totalLent - totalReceivables;

  // Payables (Active Debts Owed / Salary Advances)
  const debts = await Debt.find({ status: { $ne: 'settled' } }).populate('person');
  const allDebts = await Debt.find().populate('person');
  const totalBorrowed = allDebts.reduce((sum, d) => sum + d.originalAmount, 0);
  const totalPayables = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalDebtPaid = totalBorrowed - totalPayables;

  // Net Position = Cash + Receivables - Payables
  const netPosition = totalCash + totalReceivables - totalPayables;

  // Monthly Metrics
  let startMonth = monthString;
  if (!startMonth) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    startMonth = `${year}-${month}`;
  }

  const monthlyTxs = await Transaction.find({
    date: { $regex: `^${startMonth}` }
  }).populate('category account person');

  let monthlyIncome = 0;
  let monthlyExpense = 0;
  const incomeBreakdown = {};
  const expenseBreakdown = {};

  monthlyTxs.forEach(tx => {
    if (tx.type === 'income') {
      monthlyIncome += tx.amount;
      const catName = tx.category ? tx.category.name : 'Uncategorized';
      incomeBreakdown[catName] = (incomeBreakdown[catName] || 0) + tx.amount;
    } else if (tx.type === 'expense') {
      monthlyExpense += tx.amount;
      const catName = tx.category ? tx.category.name : 'Uncategorized';
      expenseBreakdown[catName] = (expenseBreakdown[catName] || 0) + tx.amount;
    }
  });

  const netCashFlow = monthlyIncome - monthlyExpense;

  // Due Alerts
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingLoans = loans.filter(l => l.dueDate && l.dueDate <= todayStr);
  const upcomingDebts = debts.filter(d => d.dueDate && d.dueDate <= todayStr);

  return {
    month: startMonth,
    totalCash,
    totalReceivables,
    totalPayables,
    netPosition,
    accounts: accountsWithBalances,
    monthly: {
      income: monthlyIncome,
      expense: monthlyExpense,
      netCashFlow,
      incomeBreakdown,
      expenseBreakdown
    },
    loansSummary: {
      totalLent,
      totalRecovered: totalLoanRecovered,
      outstanding: totalReceivables,
      activeCount: loans.length
    },
    debtsSummary: {
      totalOwed: totalBorrowed,
      totalPaid: totalDebtPaid,
      outstanding: totalPayables,
      activeCount: debts.length
    },
    alerts: {
      overdueLoansCount: upcomingLoans.length,
      overdueDebtsCount: upcomingDebts.length
    }
  };
}

module.exports = {
  seedInitialData,
  getAccountBalances,
  getFinancialOverview
};
