import React, { useState, useEffect } from 'react';
import { receptionistAPI } from '../../api/endpoints';
import { Loading } from '../../components/common/UI';
import { FiDollarSign, FiClock, FiCheckCircle, FiPrinter } from 'react-icons/fi';

const getTodayDate = () => new Date().toISOString().split('T')[0];
const isValidDateInput = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
const toDisplayPaymentMethod = (value) => {
  if (!value) return 'Pending';
  const normalized = String(value).replace(/_/g, ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const ReceptionistBilling = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, paid, pending
  const [selectedDate, setSelectedDate] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const formatCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

  useEffect(() => {
    fetchBillings({ showLoader: loading });
  }, [selectedDate]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchBillings();
    }, 10000);

    const handleBillingCreated = () => {
      fetchBillings();
    };

    window.addEventListener('billing:created', handleBillingCreated);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('billing:created', handleBillingCreated);
    };
  }, [selectedDate]);

  const fetchBillings = async ({ showLoader = false } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      setError('');
      const params = isValidDateInput(selectedDate) ? { date: selectedDate } : {};
      const res = await receptionistAPI.getBillings(params);
      const billings = res.data.data || [];
      
      // Format billing data
      const formattedBillings = billings.map(billing => ({
        _id: billing._id,
        invoiceId: billing.invoiceNumber || `INV-${billing._id?.substring(0, 6).toUpperCase()}`,
        patientName: billing.patientId?.name || billing.patientId?.userId?.name || 'Unknown',
        patientId: billing.patientId?._id,
        service: billing.serviceType || 'Consultation',
        amount: Number(billing.totalAmount ?? billing.total ?? 0),
        subtotal: Number(billing.subtotal ?? 0),
        tax: Number(billing.tax ?? 0),
        discount: Number(billing.discount ?? 0),
        items: Array.isArray(billing.items) ? billing.items : [],
        paymentMethod: toDisplayPaymentMethod(billing.paymentMethod),
        status: billing.paymentStatus === 'paid' ? 'completed' : (billing.status || 'pending'),
        paymentStatus: billing.paymentStatus || 'pending',
        date: billing.billDate ? billing.billDate.split('T')[0] : 'N/A',
        processedBy: billing.processedBy?.name || 'N/A',
        description: billing.description || ''
      }));

      setTransactions(formattedBillings);
    } catch (err) {
      console.error('Error fetching billings:', err);
      setError('Failed to load billing data');
      setTransactions([]);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  // Calculate statistics
  // API is already date-filtered by selectedDate.
  const todayTransactions = transactions;
  const completedTransactions = todayTransactions.filter(t => t.status === 'completed');
  const pendingTransactions = todayTransactions.filter(
    (t) => t.status === 'pending' || t.paymentStatus !== 'paid'
  );
  const totalIncomeToday = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCompletedCount = completedTransactions.length;
  const totalPendingCount = pendingTransactions.length;
  const totalPendingAmount = pendingTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Filter transactions
  let filteredTransactions = todayTransactions;
  if (filterStatus !== 'all') {
    filteredTransactions = todayTransactions.filter(t => t.status === filterStatus);
  }
  filteredTransactions = filteredTransactions.filter(t =>
    t.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.invoiceId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePayment = async (transactionId) => {
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to mark this transaction as paid?')) {
      return;
    }

    try {
      const paymentData = {
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        paymentDate: new Date()
      };
      
      await receptionistAPI.updateBillingStatus(transactionId, paymentData);
      
      // Update local state
      setTransactions(transactions.map(t =>
        t._id === transactionId ? { ...t, status: 'completed', paymentStatus: 'paid', paymentMethod: 'Cash' } : t
      ));
      
      // Refresh billing data
      fetchBillings();
    } catch (err) {
      console.error('Error marking as paid:', err);
      setError('Failed to mark transaction as paid. Please try again.');
    }
  };

  const handleReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReceipt(true);
  };

  const handlePrintReceipt = () => {
    if (!selectedTransaction) return;
    const receiptItems = (selectedTransaction.items || [])
      .map((item) => {
        const description = String(item.description || '').trim() || 'Service';
        const amount = Number(item.amount || 0);
        const quantity = Number(item.quantity || 1);
        return { description, amount, quantity, lineTotal: amount * quantity };
      });
    const receiptSubtotal = Number(selectedTransaction.subtotal || receiptItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const receiptTax = Number(selectedTransaction.tax || 0);
    const receiptDiscount = Number(selectedTransaction.discount || 0);
    const receiptTotal = Number(selectedTransaction.amount || (receiptSubtotal + receiptTax - receiptDiscount));
    const itemRows = receiptItems.length
      ? receiptItems
        .map((item) => `
              <tr>
                <td>${item.description}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td style="text-align: right;">${formatCurrency(item.lineTotal)}</td>
              </tr>
            `)
        .join('')
      : `
            <tr>
              <td>${selectedTransaction.service}</td>
              <td style="text-align: right;">1</td>
              <td style="text-align: right;">${formatCurrency(receiptTotal)}</td>
            </tr>
        `;
    
    const printWindow = window.open('', '', 'width=800,height=600');
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${selectedTransaction.invoiceId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .header h1 { margin: 0; font-size: 20px; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
          .detail-item { font-size: 12px; }
          .label { font-weight: bold; color: #666; }
          .table { width: 100%; margin: 20px 0; border-collapse: collapse; }
          .table th, .table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; font-size: 12px; }
          .table th { background: #f5f5f5; font-weight: bold; }
          .total-section { margin: 20px 0; text-align: right; }
          .total-row { font-size: 16px; font-weight: bold; margin-top: 10px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 11px; }
          .print-button { text-align: center; margin: 20px 0; }
          button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
          @media print { .print-button { display: none; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>INVOICE</h1>
            <p>${selectedTransaction.invoiceId}</p>
          </div>
          
          <div class="details">
            <div class="detail-item">
              <span class="label">Date:</span> ${selectedTransaction.date}
            </div>
            <div class="detail-item">
              <span class="label">Status:</span> ${selectedTransaction.status.toUpperCase()}
            </div>
            <div class="detail-item">
              <span class="label">Patient:</span> ${selectedTransaction.patientName}
            </div>
            <div class="detail-item">
              <span class="label">Payment Method:</span> ${selectedTransaction.paymentMethod}
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Qty</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <div class="total-section">
            <div>Subtotal: ${formatCurrency(receiptSubtotal)}</div>
            <div>Tax: ${formatCurrency(receiptTax)}</div>
            <div>Discount: ${formatCurrency(receiptDiscount)}</div>
            <div class="total-row">Total: ${formatCurrency(receiptTotal)}</div>
          </div>

          <div class="footer">
            <p>Thank you for using our clinic management system</p>
            <p>Processed by: ${selectedTransaction.processedBy}</p>
          </div>

          <div class="print-button">
            <button onclick="window.print()">Print Receipt</button>
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 w-full">
      <div className="mb-6 w-full">
        <h1 className="text-3xl font-bold mb-6">Billing Management</h1>

        {error && (
          <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
            {error}
          </div>
        )}

        {/* Smart Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
          {/* Total Income Today */}
          <div className="smart-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="smart-card-title">Total Income Today</p>
                <p className="smart-card-value text-green-600 mt-1">{formatCurrency(totalIncomeToday)}</p>
                <p className="smart-card-meta mt-1">{totalCompletedCount} completed transactions</p>
              </div>
              <div className="smart-card-icon text-green-600">
                <FiDollarSign />
              </div>
            </div>
          </div>

          {/* Pending Transactions */}
          <div className="smart-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="smart-card-title">Pending Transactions</p>
                <p className="smart-card-value text-red-600 mt-1">{totalPendingCount}</p>
                <p className="smart-card-meta mt-1">Awaiting payment: {formatCurrency(totalPendingAmount)}</p>
              </div>
              <div className="smart-card-icon text-red-600">
                <FiClock />
              </div>
            </div>
          </div>

          {/* Total Transactions (Completed) */}
          <div className="smart-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="smart-card-title">Total Transactions</p>
                <p className="smart-card-value text-blue-600 mt-1">{totalCompletedCount}</p>
                <p className="smart-card-meta mt-1">Completed today</p>
              </div>
              <div className="smart-card-icon text-blue-600">
                <FiCheckCircle />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold mb-2">Search</label>
              <input
                type="text"
                placeholder="Patient name or Invoice ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Clear Date
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(getTodayDate())}
                  className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow w-full">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No transactions found
            </div>
          ) : (
            <>
              <div className="mb-4 p-4 text-sm text-gray-600 border-b">
                Showing {filteredTransactions.length} invoice(s)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-6 py-3 text-left text-sm font-semibold">Invoice ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Patient Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Service</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Payment Method</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Processed By</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction._id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-blue-600">{transaction.invoiceId}</td>
                        <td className="px-6 py-4">{transaction.patientName}</td>
                        <td className="px-6 py-4">{transaction.service}</td>
                        <td className="px-6 py-4 font-semibold">{formatCurrency(transaction.amount)}</td>
                        <td className="px-6 py-4">{transaction.paymentMethod}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded text-sm font-semibold ${
                              transaction.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{transaction.processedBy}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {transaction.status === 'pending' && (
                              <button
                                onClick={() => handlePayment(transaction._id)}
                                className="text-green-600 hover:text-green-800 text-sm font-semibold border border-green-600 px-3 py-1 rounded"
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              onClick={() => handleReceipt(transaction)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-semibold border border-blue-600 px-3 py-1 rounded flex items-center gap-1"
                            >
                              <FiPrinter size={14} />
                              Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-modal-title"
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[82vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 id="receipt-modal-title" className="text-xl font-bold">Invoice {selectedTransaction.invoiceId}</h2>
              <button
                type="button"
                aria-label="Close receipt modal"
                onClick={() => setShowReceipt(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                X
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="text-center border-b pb-4">
                <h1 className="text-xl font-bold">INVOICE</h1>
                <p className="text-sm text-gray-600">{selectedTransaction.invoiceId}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Date</p>
                  <p className="text-sm">{selectedTransaction.date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Status</p>
                  <p className="text-sm font-semibold text-green-600">{selectedTransaction.status.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Patient</p>
                  <p className="text-sm">{selectedTransaction.patientName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Payment Method</p>
                  <p className="text-sm">{selectedTransaction.paymentMethod}</p>
                </div>
              </div>

              {/* Service Details */}
              <div className="border-t border-b py-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2">Description</th>
                      <th className="text-right pb-2">Qty</th>
                      <th className="text-right pb-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedTransaction.items || []).length ? (
                      selectedTransaction.items.map((item, index) => {
                        const quantity = Number(item.quantity || 1);
                        const amount = Number(item.amount || 0);
                        const lineTotal = quantity * amount;
                        return (
                          <tr key={`${selectedTransaction._id}-item-${index}`}>
                            <td className="py-2">{item.description || 'Service'}</td>
                            <td className="text-right py-2">{quantity}</td>
                            <td className="text-right py-2 font-semibold">{formatCurrency(lineTotal)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="py-2">{selectedTransaction.service}</td>
                        <td className="text-right py-2">1</td>
                        <td className="text-right py-2 font-semibold">{formatCurrency(selectedTransaction.amount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-gray-600 text-sm">Subtotal: {formatCurrency(selectedTransaction.subtotal)}</p>
                  <p className="text-gray-600 text-sm">Tax: {formatCurrency(selectedTransaction.tax)}</p>
                  <p className="text-gray-600 text-sm">Discount: {formatCurrency(selectedTransaction.discount)}</p>
                  <p className="text-xs text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-gray-600 pt-4 border-t">
                <p>Thank you for using our clinic management system</p>
                <p>Processed by: {selectedTransaction.processedBy}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700"
                >
                  <FiPrinter size={16} />
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded font-semibold hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}    </div>
  );
};

export default ReceptionistBilling;

