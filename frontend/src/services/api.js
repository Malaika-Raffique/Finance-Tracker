import axios from 'axios';

const API = axios.create({
  baseURL: '/api'
});

export const api = {
  // Accounts
  getAccounts: () => API.get('/accounts').then(r => r.data),
  createAccount: (data) => API.post('/accounts', data).then(r => r.data),
  updateAccount: (id, data) => API.put(`/accounts/${id}`, data).then(r => r.data),
  deleteAccount: (id) => API.delete(`/accounts/${id}`).then(r => r.data),

  // Categories
  getCategories: () => API.get('/categories').then(r => r.data),
  createCategory: (data) => API.post('/categories', data).then(r => r.data),
  deleteCategory: (id) => API.delete(`/categories/${id}`).then(r => r.data),

  // People
  getPeople: () => API.get('/people').then(r => r.data),
  getPersonDetail: (id) => API.get(`/people/${id}`).then(r => r.data),
  createPerson: (data) => API.post('/people', data).then(r => r.data),

  // Loans Given
  getLoans: () => API.get('/loans').then(r => r.data),
  giveLoan: (data) => API.post('/loans', data).then(r => r.data),
  repayLoan: (loanId, data) => API.post(`/loans/${loanId}/repay`, data).then(r => r.data),

  // Debts & Salary Advances
  getDebts: () => API.get('/debts').then(r => r.data),
  borrowDebt: (data) => API.post('/debts', data).then(r => r.data),
  payDebt: (debtId, data) => API.post(`/debts/${debtId}/pay`, data).then(r => r.data),

  // Transactions
  getTransactions: (params) => API.get('/transactions', { params }).then(r => r.data),
  createTransaction: (data) => API.post('/transactions', data).then(r => r.data),
  deleteTransaction: (id) => API.delete(`/transactions/${id}`).then(r => r.data),

  // Reports & Analytics
  getDashboard: (month) => API.get('/reports/dashboard', { params: { month } }).then(r => r.data),
  getYearlyReport: (year) => API.get('/reports/yearly', { params: { year } }).then(r => r.data),
  queryReport: (params) => API.get('/reports/query', { params }).then(r => r.data),
  getTimeframeReport: (params) => API.get('/reports/timeframe', { params }).then(r => r.data),

  // Backup, CSV & PDF
  exportBackupUrl: '/api/backup/export',
  exportCsvUrl: '/api/backup/csv',
  exportPdfUrl: '/api/backup/pdf?print=true',
  importBackup: (data) => API.post('/backup/import', data).then(r => r.data),

  // Settings
  getSettings: () => API.get('/settings').then(r => r.data),
  updateSetting: (key, value) => API.post('/settings', { key, value }).then(r => r.data)
};
