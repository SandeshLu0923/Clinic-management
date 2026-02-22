import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Loading } from '../../components/common/UI';
import { patientAPI } from '../../api/endpoints';

const formatCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

const PatientBilling = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);

  useEffect(() => {
    fetchBillings();
  }, []);

  const fetchBillings = async () => {
    try {
      setLoading(true);
      const res = await patientAPI.getBillings();
      const list = res?.data?.data || [];
      setInvoices(
        list.map((invoice) => ({
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber || `INV-${String(invoice._id || '').substring(0, 6).toUpperCase()}`,
          date: invoice.billDate ? new Date(invoice.billDate).toISOString().split('T')[0] : '',
          items: invoice.items || [],
          subtotal: Number(invoice.subtotal || 0),
          tax: Number(invoice.tax || 0),
          discount: Number(invoice.discount || 0),
          amount: Number(invoice.total || 0),
          status: invoice.paymentStatus || 'pending',
          paymentMethod: invoice.paymentMethod || null,
          paymentDate: invoice.paymentDate ? new Date(invoice.paymentDate).toISOString().split('T')[0] : null,
          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : null,
        }))
      );
      setError('');
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.response?.data?.message || 'Failed to load billing data');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    const pendingAmount = invoices.filter((inv) => inv.status !== 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    return { totalAmount, paidAmount, pendingAmount };
  }, [invoices]);

  const handlePayNow = async (id) => {
    try {
      setPayingInvoiceId(id);
      await patientAPI.payBilling(id, { paymentMethod: 'card' });
      setSuccess('Payment completed successfully');
      await fetchBillings();
    } catch (payError) {
      console.error(payError);
      setError(payError.response?.data?.message || 'Failed to process payment');
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const handleDownload = (invoice, isReceipt = false) => {
    const itemRows = (invoice.items || [])
      .map((item) => `${item.description || 'Service'} x${Number(item.quantity || 1)}: ${formatCurrency(Number(item.amount || 0) * Number(item.quantity || 1))}`)
      .join('\n');
    const content = [
      `${isReceipt ? 'Receipt' : 'Invoice'}: ${invoice.invoiceNumber}`,
      `Date: ${invoice.date || 'N/A'}`,
      itemRows ? `Items:\n${itemRows}` : '',
      `Subtotal: ${formatCurrency(invoice.subtotal)}`,
      `Tax: ${formatCurrency(invoice.tax)}`,
      `Discount: ${formatCurrency(invoice.discount)}`,
      `Total: ${formatCurrency(invoice.amount)}`,
      `Status: ${invoice.status}`,
      invoice.paymentDate ? `Payment Date: ${invoice.paymentDate}` : '',
      invoice.paymentMethod ? `Payment Method: ${invoice.paymentMethod}` : '',
      invoice.dueDate ? `Due Date: ${invoice.dueDate}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${isReceipt ? 'receipt' : 'invoice'}-${invoice.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Billing & Payments</h1>
      {error && <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded">{error}</div>}
      {success && <div className="p-3 bg-green-100 text-green-700 border border-green-300 rounded">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 text-center">
          <p className="text-gray-600">Total Amount</p>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(totals.totalAmount)}</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-gray-600">Paid Amount</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totals.paidAmount)}</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-gray-600">Pending Amount</p>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(totals.pendingAmount)}</p>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Invoices</h2>
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">No invoices found</Card>
          ) : (
            invoices.map((invoice) => (
              <Card key={invoice.id} className="p-6">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
                    <p className="text-sm text-gray-600">Date: {invoice.date || 'N/A'}</p>
                    <div className="mt-2 text-sm text-gray-700 space-y-1">
                      {(invoice.items || []).length === 0 ? (
                        <p>No billed items</p>
                      ) : (
                        invoice.items.map((item, index) => (
                          <p key={`${invoice.id}-item-${index}`}>
                            {item.description || 'Service'} x{Number(item.quantity || 1)}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatCurrency(invoice.amount)}</p>
                    <span
                      className={`px-2 py-1 rounded text-sm capitalize ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {invoice.status}
                    </span>
                    {invoice.status === 'paid' && <p className="text-xs text-gray-600 mt-1">Paid: {invoice.paymentDate || 'N/A'}</p>}
                    {invoice.status !== 'paid' && <p className="text-xs text-red-600 mt-1">Due: {invoice.dueDate || 'N/A'}</p>}
                  </div>
                </div>

                {invoice.status !== 'paid' ? (
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePayNow(invoice.id)}
                      disabled={payingInvoiceId === invoice.id}
                    >
                      {payingInvoiceId === invoice.id ? 'Processing...' : 'Pay Now'}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleDownload(invoice)}>
                      Download Invoice
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t">
                    <Button size="sm" variant="secondary" onClick={() => handleDownload(invoice, true)}>
                      Download Receipt
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientBilling;
