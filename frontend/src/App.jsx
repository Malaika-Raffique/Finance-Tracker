import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { PasscodeLock } from './components/layout/PasscodeLock';

import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { LoansView } from './components/loans/LoansView';
import { DebtsView } from './components/debts/DebtsView';
import { AccountsView } from './components/accounts/AccountsView';
import { PeopleView } from './components/people/PeopleView';
import { ReportsView } from './components/reports/ReportsView';

import { QuickAddModal } from './components/modals/QuickAddModal';
import { LoanRepaymentModal } from './components/modals/LoanRepaymentModal';
import { DebtPayModal } from './components/modals/DebtPayModal';
import { SettingsModal } from './components/modals/SettingsModal';

function MainContent() {
  const { activeTab, isLocked } = useApp();
  
  // Modals state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddTab, setQuickAddTab] = useState('income');
  const [selectedRepayLoan, setSelectedRepayLoan] = useState(null);
  const [selectedPayDebt, setSelectedPayDebt] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleOpenQuickAdd = (tab = 'income') => {
    setQuickAddTab(tab);
    setQuickAddOpen(true);
  };

  if (isLocked) {
    return <PasscodeLock />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Top Header Navbar */}
      <Navbar 
        onOpenQuickAdd={() => handleOpenQuickAdd('income')} 
        onOpenSettings={() => setSettingsOpen(true)} 
      />

      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto pb-16 lg:pb-0">
        
        {/* Navigation Sidebar */}
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} />

        {/* Main Workspace Area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardView onOpenQuickAdd={handleOpenQuickAdd} />}
          {activeTab === 'transactions' && <TransactionsView />}
          {activeTab === 'loans' && <LoansView onOpenQuickAdd={handleOpenQuickAdd} onOpenRepayModal={(loan) => setSelectedRepayLoan(loan)} />}
          {activeTab === 'debts' && <DebtsView onOpenQuickAdd={handleOpenQuickAdd} onOpenDebtPayModal={(debt) => setSelectedPayDebt(debt)} />}
          {activeTab === 'accounts' && <AccountsView onOpenQuickAdd={handleOpenQuickAdd} />}
          {activeTab === 'people' && <PeopleView />}
          {activeTab === 'reports' && <ReportsView />}
        </main>

      </div>

      {/* Interactive Modals */}
      {quickAddOpen && (
        <QuickAddModal 
          initialTab={quickAddTab} 
          onClose={() => setQuickAddOpen(false)} 
        />
      )}

      {selectedRepayLoan && (
        <LoanRepaymentModal 
          loan={selectedRepayLoan} 
          onClose={() => setSelectedRepayLoan(null)} 
        />
      )}

      {selectedPayDebt && (
        <DebtPayModal 
          debt={selectedPayDebt} 
          onClose={() => setSelectedPayDebt(null)} 
        />
      )}

      {settingsOpen && (
        <SettingsModal 
          onClose={() => setSettingsOpen(false)} 
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
