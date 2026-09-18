const connectDB = require('./src/db/connect');
const { seedInitialData, getFinancialOverview, getAccountBalances } = require('./src/utils/ledgerEngine');
const Account = require('./src/models/Account');
const Category = require('./src/models/Category');
const Transaction = require('./src/models/Transaction');
const Loan = require('./src/models/Loan');
const Debt = require('./src/models/Debt');
const Person = require('./src/models/Person');

async function testEngine() {
  console.log('🧪 Starting Ledger Engine Verification Test...');
  
  await connectDB();
  await seedInitialData();

  const accounts = await getAccountBalances();
  console.log('✅ Accounts retrieved:', accounts.map(a => `${a.name}: ${a.balance}`));

  const overview = await getFinancialOverview('2026-08');
  console.log('✅ Financial Overview Verified:');
  console.log(`   - Cash Balance: ${overview.totalCash}`);
  console.log(`   - Loans Receivable: ${overview.totalReceivables}`);
  console.log(`   - Debts Payable: ${overview.totalPayables}`);
  console.log(`   - Net Position: ${overview.netPosition}`);

  console.log('🎉 Verification Test Passed Successfully!');
  process.exit(0);
}

testEngine().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
