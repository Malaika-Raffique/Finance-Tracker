const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const Category = require('../models/Category');
const Person = require('../models/Person');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const Debt = require('../models/Debt');
const Setting = require('../models/Setting');
const { getFinancialOverview } = require('../utils/ledgerEngine');

// GET Export JSON Backup
router.get('/export', async (req, res) => {
  try {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      accounts: await Account.find(),
      categories: await Category.find(),
      people: await Person.find(),
      transactions: await Transaction.find(),
      loans: await Loan.find(),
      debts: await Debt.find(),
      settings: await Setting.find()
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=finance_backup_${new Date().toISOString().split('T')[0]}.json`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Import JSON Backup
router.post('/import', async (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.accounts || !data.transactions) {
      return res.status(400).json({ error: 'Invalid backup file payload' });
    }

    // Clear existing collection records
    await Account.deleteMany({});
    await Category.deleteMany({});
    await Person.deleteMany({});
    await Transaction.deleteMany({});
    await Loan.deleteMany({});
    await Debt.deleteMany({});
    await Setting.deleteMany({});

    // Restore collections
    if (data.accounts?.length) await Account.insertMany(data.accounts);
    if (data.categories?.length) await Category.insertMany(data.categories);
    if (data.people?.length) await Person.insertMany(data.people);
    if (data.loans?.length) await Loan.insertMany(data.loans);
    if (data.debts?.length) await Debt.insertMany(data.debts);
    if (data.transactions?.length) await Transaction.insertMany(data.transactions);
    if (data.settings?.length) await Setting.insertMany(data.settings);

    res.json({ message: 'Backup restored successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Export CSV
router.get('/csv', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('account toAccount category person')
      .sort({ date: -1 });

    let csvContent = 'ID,Date,Type,Amount,Account,ToAccount,Category,Person,Description,Note\n';

    transactions.forEach(tx => {
      const row = [
        tx._id,
        tx.date,
        tx.type,
        tx.amount,
        `"${tx.account ? tx.account.name : ''}"`,
        `"${tx.toAccount ? tx.toAccount.name : ''}"`,
        `"${tx.category ? tx.category.name : ''}"`,
        `"${tx.person ? tx.person.name : ''}"`,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        `"${(tx.note || '').replace(/"/g, '""')}"`
      ].join(',');
      csvContent += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=finance_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Complete Printable PDF Report Statement (All Options Included)
router.get('/pdf', async (req, res) => {
  try {
    const overview = await getFinancialOverview();
    const transactions = await Transaction.find()
      .populate('account toAccount category person')
      .sort({ date: -1 });
    
    const loans = await Loan.find().populate('person');
    const debts = await Debt.find().populate('person');
    const categories = await Category.find();
    const people = await Person.find();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Complete Financial Statement & Backup — PKR (Rs.)</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #0f172a; background: #fff; line-height: 1.4; }
          .header-box { border-bottom: 3px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { color: #0f172a; margin: 0; font-size: 24px; font-weight: 800; }
          .header-subtitle { color: #64748b; font-size: 12px; margin-top: 4px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-between: 25px; }
          .card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
          .card-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
          .card-value { font-size: 18px; font-weight: 800; margin-top: 4px; }
          .positive { color: #16a34a; }
          .negative { color: #dc2626; }
          .neutral { color: #2563eb; }
          .warning { color: #d97706; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; margin-bottom: 25px; }
          th { background: #f1f5f9; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 10px; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          .section-title { font-size: 14px; font-weight: 800; margin-top: 25px; margin-bottom: 8px; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px; }
          .badge { font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: #e2e8f0; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px;">
          <button onclick="window.print()" style="background: #16a34a; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 14px;">🖨️ Print / Save as PDF</button>
        </div>

        <div class="header-box">
          <div>
            <h1>Personal Finance & Ledger Complete Report</h1>
            <div class="header-subtitle">Generated on ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} • Standard Currency: PKR (Rs.)</div>
          </div>
        </div>

        <!-- KPI Summary -->
        <div class="summary-grid">
          <div class="card">
            <div class="card-title">Current Cash Balance</div>
            <div class="card-value ${overview.totalCash >= 0 ? 'positive' : 'negative'}">Rs. ${overview.totalCash.toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="card-title">Loans Given (Receivables)</div>
            <div class="card-value neutral">Rs. ${overview.totalReceivables.toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="card-title">Debts Owed (Payables)</div>
            <div class="card-value warning">Rs. ${overview.totalPayables.toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="card-title">Net Financial Position</div>
            <div class="card-value ${overview.netPosition >= 0 ? 'positive' : 'negative'}">Rs. ${overview.netPosition.toLocaleString()}</div>
          </div>
        </div>

        <!-- Accounts Table -->
        <div class="section-title">1. Accounts & Wallet Balances</div>
        <table>
          <thead>
            <tr>
              <th>Account Name</th>
              <th>Type</th>
              <th style="text-align: right;">Calculated Balance</th>
            </tr>
          </thead>
          <tbody>
            ${overview.accounts.map(acc => `
              <tr>
                <td><strong>${acc.name}</strong></td>
                <td><span class="badge">${acc.type}</span></td>
                <td style="text-align: right; font-weight: bold;">Rs. ${acc.balance.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Loans Given Table -->
        <div class="section-title">2. Loans Given Ledger (Receivables)</div>
        ${loans.length === 0 ? '<p style="font-size: 11px; color: #64748b;">No loan receivables recorded.</p>' : `
          <table>
            <thead>
              <tr>
                <th>Person Name</th>
                <th>Original Amount</th>
                <th>Remaining Receivable</th>
                <th>Date Given</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${loans.map(l => `
                <tr>
                  <td><strong>${l.person ? l.person.name : 'Unknown'}</strong></td>
                  <td>Rs. ${l.originalAmount.toLocaleString()}</td>
                  <td style="color: #2563eb; font-weight: bold;">Rs. ${l.remainingAmount.toLocaleString()}</td>
                  <td>${l.dateGiven}</td>
                  <td>${l.dueDate || 'N/A'}</td>
                  <td><span class="badge">${l.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}

        <!-- Debts Owed Table -->
        <div class="section-title">3. Debts & Advances Ledger (Payables)</div>
        ${debts.length === 0 ? '<p style="font-size: 11px; color: #64748b;">No debt obligations recorded.</p>' : `
          <table>
            <thead>
              <tr>
                <th>Creditor / Employer</th>
                <th>Debt Type</th>
                <th>Original Amount</th>
                <th>Remaining Payable</th>
                <th>Date Received</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${debts.map(d => `
                <tr>
                  <td><strong>${d.person ? d.person.name : 'Unknown'}</strong></td>
                  <td>${d.type}</td>
                  <td>Rs. ${d.originalAmount.toLocaleString()}</td>
                  <td style="color: #d97706; font-weight: bold;">Rs. ${d.remainingAmount.toLocaleString()}</td>
                  <td>${d.dateReceived}</td>
                  <td><span class="badge">${d.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}

        <!-- All Transactions Table -->
        <div class="section-title">4. Complete Transactions History Ledger (${transactions.length} entries)</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description / Note</th>
              <th>Account</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map(tx => `
              <tr>
                <td>${tx.date}</td>
                <td><span class="badge">${tx.type}</span></td>
                <td>
                  <strong>${tx.description || tx.type}</strong>
                  ${tx.person ? `<br/><span style="color:#64748b; font-size:10px;">Person: ${tx.person.name}</span>` : ''}
                  ${tx.category ? `<br/><span style="color:#16a34a; font-size:10px;">Category: ${tx.category.name}</span>` : ''}
                </td>
                <td>${tx.account ? tx.account.name : 'Cash'}</td>
                <td style="text-align: right; font-weight: bold;">Rs. ${tx.amount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            if (window.location.search.includes('print=true')) {
              window.print();
            }
          }
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
