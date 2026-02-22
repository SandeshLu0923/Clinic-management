import React, { useEffect, useState } from 'react';
import { Card, Loading } from '../../components/common/UI';
import { receptionistAPI } from '../../api/endpoints';

const getTodayDate = () => new Date().toISOString().split('T')[0];
const isValidDateInput = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
const getSafeDate = (value) => (isValidDateInput(value) ? value : getTodayDate());
const getId = (value) => (typeof value === 'string' ? value : value?._id);

const ReceptionistDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [billings, setBillings] = useState([]);
  const [services, setServices] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [checkInModal, setCheckInModal] = useState(false);
  const [patientToCheckIn, setPatientToCheckIn] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showProcessBillingModal, setShowProcessBillingModal] = useState(false);
  const [billingToProcess, setBillingToProcess] = useState(null);
  const [processingBilling, setProcessingBilling] = useState(false);
  const [processPaymentMethod, setProcessPaymentMethod] = useState('cash');
  const [showEditBillingModal, setShowEditBillingModal] = useState(false);
  const [billingToEdit, setBillingToEdit] = useState(null);
  const [consultationFee, setConsultationFee] = useState(500);
  const [editTax, setEditTax] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [additionalFeeRows, setAdditionalFeeRows] = useState([]);
  const [savingBillingEdit, setSavingBillingEdit] = useState(false);
  const [deletingBillingId, setDeletingBillingId] = useState(null);

  const formatCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;
  const consultationService = services.find((service) => service.category === 'Consultation');
  const additionalServices = services.filter((service) => service.category !== 'Consultation');
  const pendingBillingTransactions = billings.filter((billing) => billing.paymentStatus !== 'paid');
  const pendingBillingCount = pendingBillingTransactions.length;

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const safeDate = getSafeDate(selectedDate);
      const [queueRes, billingsRes, reportRes, servicesRes] = await Promise.all([
        receptionistAPI.getQueueStatus({ date: safeDate }),
        receptionistAPI.getBillings({}),
        receptionistAPI.getDailyReport({ date: safeDate }),
        receptionistAPI.getServices(),
      ]);
      setQueue(queueRes.data.data || []);
      setBillings(billingsRes.data.data || []);
      setReport(reportRes.data.data);
      setServices(servicesRes.data.data || []);
      setError('');
    } catch (fetchError) {
      console.error('Error fetching data:', fetchError);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = (patient) => {
    setPatientToCheckIn(patient);
    setCheckInModal(true);
  };

  const confirmCheckIn = async () => {
    try {
      if (!patientToCheckIn) return;

      const reorderedQueue = [
        patientToCheckIn,
        ...queue.filter((q) => q._id !== patientToCheckIn._id),
      ];

      await receptionistAPI.reorderQueue({
        queueItems: reorderedQueue.map((item) => ({ _id: item._id })),
      });

      setSuccess('Patient moved to top of doctor queue');
      setCheckInModal(false);
      setPatientToCheckIn(null);
      fetchData();
    } catch (checkInError) {
      console.error('Check-in error:', checkInError);
      setError('Failed to check in patient');
    }
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setShowViewModal(true);
  };

  const handlePrintPrescription = async (queueItem) => {
    const patientName = queueItem?.patientId?.name || queueItem?.patientId?.userId?.name || 'Patient';
    const appointmentId = getId(queueItem?.appointmentId);
    if (!appointmentId) {
      setError('Cannot print prescription: appointment details missing');
      return;
    }

    try {
      const response = await receptionistAPI.getConsultationSummary(appointmentId);
      const record = response?.data?.data;

      if (!record) {
        setError('Consultation details not found for this patient');
        return;
      }

      const symptoms = (record.symptoms || []).join(', ') || 'N/A';
      const diagnosis = record.diagnosis || 'N/A';
      const notes = record.notes || 'N/A';
      const prescriptionRows = (record.prescription || []).length
        ? (record.prescription || []).map((med) => `
            <tr>
              <td>${med.medicineName || 'N/A'}</td>
              <td>${med.dosage || 'N/A'}</td>
              <td>${med.frequency || 'N/A'}</td>
              <td>${med.duration || 'N/A'}</td>
            </tr>
          `).join('')
        : '<tr><td colspan="4">No medications prescribed</td></tr>';

      const prescriptionContent = `
      <html>
        <head>
          <title>Prescription - ${patientName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .patient-info { margin-bottom: 20px; }
            .prescription-section { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>PRESCRIPTION</h2>
            <p>Clinic Management System</p>
          </div>
          <div class="patient-info">
            <p><strong>Patient Name:</strong> ${patientName}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Diagnosis:</strong> ${diagnosis}</p>
            <p><strong>Symptoms:</strong> ${symptoms}</p>
          </div>
          <div class="prescription-section">
            <h3>Medications</h3>
            <table>
              <thead>
                <tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr>
              </thead>
              <tbody>${prescriptionRows}</tbody>
            </table>
          </div>
          <div class="prescription-section">
            <h3>Notes</h3>
            <p>${notes}</p>
          </div>
        </body>
      </html>
    `;

      const printWindow = window.open('', '', 'width=900,height=700');
      printWindow.document.write(prescriptionContent);
      printWindow.document.close();
      printWindow.print();
    } catch (printError) {
      console.error(printError);
      setError(printError.response?.data?.message || 'Failed to fetch prescription data');
    }
  };

  const handleGenerateBill = async (queuePatient) => {
    try {
      if (queuePatient?.status !== 'pending-transaction') {
        setError('Billing is enabled only after consultation is completed');
        return;
      }

      const patientId = getId(queuePatient?.patientId);
      const appointmentId = getId(queuePatient?.appointmentId);
      const patientName = queuePatient?.patientId?.name || 'Patient';
      const consultationFee = Number(queuePatient?.doctorId?.consultationFee || 500);
      if (!patientId || !appointmentId) {
        setError('Cannot generate bill: missing patient or appointment details');
        return;
      }

      await receptionistAPI.createBilling({
        patientId,
        appointmentId,
        items: [{ description: 'Consultation Fee', amount: consultationFee, quantity: 1 }],
        subtotal: consultationFee,
        tax: 0,
        discount: 0,
        total: consultationFee,
        dueDate: new Date().toISOString(),
        paymentMethod: 'cash',
      });

      setSuccess(`Bill generated for ${patientName}`);
      window.dispatchEvent(new CustomEvent('billing:created'));
      fetchData();
    } catch (billingError) {
      console.error('Generate bill error:', billingError);
      setError(billingError.response?.data?.message || 'Failed to generate bill');
    }
  };

  const handleRemovePatient = async (queueId, patientName) => {
    if (window.confirm(`Remove ${patientName} from queue?`)) {
      try {
        await receptionistAPI.removePatientFromQueue(queueId);
        setSuccess(`${patientName} removed from queue`);
        fetchData();
      } catch (removeError) {
        console.error('Error removing patient:', removeError);
        setError('Failed to remove patient from queue');
      }
    }
  };

  const openProcessBillingModal = (billing) => {
    setBillingToProcess(billing);
    setProcessPaymentMethod('cash');
    setShowProcessBillingModal(true);
  };

  const handleProcessBilling = async () => {
    if (!billingToProcess?._id) return;
    try {
      setProcessingBilling(true);
      await receptionistAPI.updateBillingStatus(billingToProcess._id, {
        paymentStatus: 'paid',
        paymentMethod: processPaymentMethod,
        paymentDate: new Date().toISOString(),
      });

      const paidAppointmentId = getId(billingToProcess.appointmentId);
      const paidBillingId = billingToProcess._id;

      // Optimistic UI: remove fully paid patient from receptionist queue immediately.
      if (paidAppointmentId) {
        setQueue((prev) => prev.filter((q) => getId(q.appointmentId) !== paidAppointmentId));
      }

      // Optimistic UI: reflect payment status in recent billing cards/list immediately.
      setBillings((prev) => prev.map((billing) => (
        billing._id === paidBillingId
          ? {
            ...billing,
            paymentStatus: 'paid',
            paymentMethod: processPaymentMethod,
          }
          : billing
      )));

      setSuccess(`Payment processed for bill #${billingToProcess.invoiceNumber || billingToProcess._id}`);
      setShowProcessBillingModal(false);
      setBillingToProcess(null);
      fetchData();
    } catch (processError) {
      console.error(processError);
      setError(processError.response?.data?.message || 'Failed to process billing payment');
    } finally {
      setProcessingBilling(false);
    }
  };

  const openEditBillingModal = (billing) => {
    const existingItems = billing.items || [];
    const existingConsultation = existingItems.find((item) =>
      String(item.description || '').toLowerCase().includes('consultation')
    );
    const defaultConsultation = Number(existingConsultation?.amount ?? consultationService?.price ?? 500);
    const nonConsultationItems = existingItems.filter(
      (item) => !String(item.description || '').toLowerCase().includes('consultation')
    );

    setBillingToEdit(billing);
    setConsultationFee(defaultConsultation);
    setEditTax(Number(billing.tax || 0));
    setEditDiscount(Number(billing.discount || 0));
    setAdditionalFeeRows(
      nonConsultationItems.map((item) => ({
        serviceId: '',
        description: item.description || '',
        amount: Number(item.amount || 0),
        quantity: Number(item.quantity || 1),
      }))
    );
    setShowEditBillingModal(true);
  };

  const addAdditionalFeeRow = () => {
    setAdditionalFeeRows((prev) => [...prev, { serviceId: '', description: '', amount: 0, quantity: 1 }]);
  };

  const removeAdditionalFeeRow = (index) => {
    setAdditionalFeeRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAdditionalFeeRow = (index, patch) => {
    setAdditionalFeeRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const getEditBillingTotals = () => {
    const consultAmount = Number(consultationFee || 0);
    const additionalSubtotal = additionalFeeRows.reduce((sum, row) => {
      const amount = Number(row.amount || 0);
      const quantity = Number(row.quantity || 1);
      return sum + amount * quantity;
    }, 0);
    const subtotal = consultAmount + additionalSubtotal;
    const tax = Number(editTax || 0);
    const discount = Number(editDiscount || 0);
    const total = subtotal + tax - discount;
    return { subtotal, total: total >= 0 ? total : 0 };
  };

  const handleSaveBillingEdit = async () => {
    if (!billingToEdit?._id) return;
    try {
      setSavingBillingEdit(true);

      const additionalItems = additionalFeeRows
        .map((row) => ({
          description: String(row.description || '').trim(),
          amount: Number(row.amount || 0),
          quantity: Number(row.quantity || 1),
        }))
        .filter((row) => row.description && row.amount >= 0 && row.quantity > 0);

      const items = [
        { description: 'Consultation Fee', amount: Number(consultationFee || 0), quantity: 1 },
        ...additionalItems,
      ];

      const response = await receptionistAPI.updateBillingStatus(billingToEdit._id, {
        items,
        tax: Number(editTax || 0),
        discount: Number(editDiscount || 0),
      });
      const updated = response?.data?.data;
      if (updated?._id) {
        setBillings((prev) => prev.map((billing) => (
          billing._id === updated._id
            ? {
              ...billing,
              items: updated.items || billing.items || [],
              subtotal: Number(updated.subtotal ?? billing.subtotal ?? 0),
              tax: Number(updated.tax ?? billing.tax ?? 0),
              discount: Number(updated.discount ?? billing.discount ?? 0),
              total: Number(updated.total ?? billing.total ?? 0),
              totalAmount: Number(updated.total ?? billing.totalAmount ?? billing.total ?? 0),
              paymentStatus: updated.paymentStatus || billing.paymentStatus,
              paymentMethod: updated.paymentMethod || billing.paymentMethod,
              description: updated.description || billing.description,
              dueDate: updated.dueDate || billing.dueDate,
            }
            : billing
        )));
      }

      setSuccess(`Billing updated for #${billingToEdit.invoiceNumber || billingToEdit._id}`);
      setShowEditBillingModal(false);
      setBillingToEdit(null);
      fetchData();
    } catch (editError) {
      console.error(editError);
      setError(editError.response?.data?.message || 'Failed to update billing');
    } finally {
      setSavingBillingEdit(false);
    }
  };

  const handleDeleteBilling = async (billing) => {
    if (!billing?._id) return;
    if (!window.confirm(`Delete billing #${billing.invoiceNumber || billing._id}?`)) return;
    try {
      setDeletingBillingId(billing._id);
      await receptionistAPI.deleteBilling(billing._id);
      setSuccess(`Billing deleted: #${billing.invoiceNumber || billing._id}`);
      fetchData();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError.response?.data?.message || 'Failed to delete billing');
    } finally {
      setDeletingBillingId(null);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <h2 className="text-lg font-semibold mb-2">Total Appointments</h2>
          <p className="text-3xl font-bold text-blue-500">{report?.totalAppointments || 0}</p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-2">Completed</h2>
          <p className="text-3xl font-bold text-green-500">{report?.completedAppointments || 0}</p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-2">Total Billing</h2>
          <p className="text-3xl font-bold text-yellow-500">INR {Number(report?.totalBilling || 0).toLocaleString('en-IN')}</p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-2">Queue Count</h2>
          <p className="text-3xl font-bold text-purple-500">{queue.length}</p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-2">Pending Transactions</h2>
          <p className="text-3xl font-bold text-red-500">{pendingBillingCount}</p>
        </Card>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-300">{success}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Current Queue</h2>
            <input
              type="date"
              value={getSafeDate(selectedDate)}
              onChange={(e) => setSelectedDate(getSafeDate(e.target.value))}
              className="px-4 py-2 border rounded"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Token</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Patient</th>
                  <th className="px-4 py-2 text-left">Doctor</th>
                  <th className="px-4 py-2 text-left">Position</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((q) => (
                  <tr key={q._id} className="border-b">
                    <td className="px-4 py-2 font-semibold">{q.tokenNumber}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          q.appointmentId?.appointmentType === 'walk-in'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {q.appointmentId?.appointmentType === 'walk-in' ? 'Walk-in' : 'Scheduled'}
                      </span>
                    </td>
                    <td className="px-4 py-2">{q.patientId?.name || q.patientId?.userId?.name || 'N/A'}</td>
                    <td className="px-4 py-2">{q.doctorId?.userId?.name || 'N/A'}</td>
                    <td className="px-4 py-2 font-semibold">{q.position}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          q.status === 'waiting'
                            ? 'bg-blue-100 text-blue-800'
                            : q.status === 'in-consultation'
                            ? 'bg-yellow-100 text-yellow-800'
                            : q.status === 'pending-transaction'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="space-x-2">
                        <button
                          onClick={() => handleCheckIn(q)}
                          disabled={q.status !== 'waiting'}
                          className="text-green-600 hover:underline text-xs disabled:text-gray-400 disabled:no-underline"
                        >
                          Check In
                        </button>
                        <button onClick={() => handleViewPatient(q)} className="text-blue-600 hover:underline text-xs">
                          View
                        </button>
                        <button onClick={() => handlePrintPrescription(q)} className="text-blue-600 hover:underline text-xs">
                          Rx
                        </button>
                        <button
                          onClick={() => handleGenerateBill(q)}
                          disabled={q.status !== 'pending-transaction' || !getId(q.appointmentId)}
                          className="text-blue-600 hover:underline text-xs disabled:text-gray-400 disabled:no-underline"
                        >
                          Bill
                        </button>
                        <button
                          onClick={() => handleRemovePatient(q._id, q.patientId?.name || 'Patient')}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="col-span-2">
          <h2 className="text-xl font-semibold mb-4">Recent Billings</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left text-sm">Bill</th>
                  <th className="px-3 py-2 text-left text-sm">Patient</th>
                  <th className="px-3 py-2 text-left text-sm">Amount</th>
                  <th className="px-3 py-2 text-left text-sm">Status</th>
                  <th className="px-3 py-2 text-left text-sm">Method</th>
                  <th className="px-3 py-2 text-left text-sm">Date</th>
                  <th className="px-3 py-2 text-left text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {billings.slice(0, 10).map((billing) => (
                  <tr key={billing._id} className="border-b">
                    <td className="px-3 py-2 text-sm font-semibold">{billing.invoiceNumber || billing._id}</td>
                    <td className="px-3 py-2 text-sm">{billing.patientId?.name || billing.patientId?.userId?.name || 'Patient'}</td>
                    <td className="px-3 py-2 text-sm">{formatCurrency(billing.totalAmount ?? billing.total)}</td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          billing.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {billing.paymentStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm capitalize">{(billing.paymentMethod || 'pending').replace('_', ' ')}</td>
                    <td className="px-3 py-2 text-sm">{billing.billDate ? new Date(billing.billDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openProcessBillingModal(billing)}
                          disabled={billing.paymentStatus === 'paid'}
                          className="text-green-700 hover:underline text-xs disabled:text-gray-400 disabled:no-underline"
                        >
                          Process
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditBillingModal(billing)}
                          className="text-blue-700 hover:underline text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBilling(billing)}
                          disabled={deletingBillingId === billing._id}
                          className="text-red-700 hover:underline text-xs disabled:text-gray-400 disabled:no-underline"
                        >
                          {deletingBillingId === billing._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {showProcessBillingModal && billingToProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Process Payment</h2>
            <p className="text-sm text-gray-700 mb-2">
              Bill: <span className="font-semibold">{billingToProcess.invoiceNumber || billingToProcess._id}</span>
            </p>
            <p className="text-sm text-gray-700 mb-4">
              Amount: <span className="font-semibold">{formatCurrency(billingToProcess.totalAmount ?? billingToProcess.total)}</span>
            </p>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <select
              value={processPaymentMethod}
              onChange={(e) => setProcessPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleProcessBilling}
                disabled={processingBilling}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
              >
                {processingBilling ? 'Processing...' : 'Confirm Process'}
              </button>
              <button
                type="button"
                onClick={() => setShowProcessBillingModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditBillingModal && billingToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Edit Billing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Consultation Fee</label>
                <input
                  type="number"
                  value={consultationFee}
                  min="0"
                  onChange={(e) => setConsultationFee(Number(e.target.value || 0))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Additional Fees (X-Ray, Tests, etc.)</label>
                  <button type="button" onClick={addAdditionalFeeRow} className="text-sm text-blue-700 hover:underline">
                    + Add Fee
                  </button>
                </div>
                <div className="space-y-2">
                  {additionalFeeRows.map((row, index) => (
                    <div key={`fee-row-${index}`} className="grid grid-cols-12 gap-2 items-center">
                      <select
                        value={row.serviceId}
                        onChange={(e) => {
                          const selectedService = additionalServices.find((service) => service._id === e.target.value);
                          updateAdditionalFeeRow(index, {
                            serviceId: e.target.value,
                            description: selectedService?.name || row.description,
                            amount: Number(selectedService?.price || row.amount || 0),
                          });
                        }}
                        className="col-span-4 px-3 py-2 border rounded"
                      >
                        <option value="">Select Service</option>
                        {additionalServices.map((service) => (
                          <option key={service._id} value={service._id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => updateAdditionalFeeRow(index, { description: e.target.value })}
                        placeholder="Description"
                        className="col-span-3 px-3 py-2 border rounded"
                      />
                      <input
                        type="number"
                        value={row.amount}
                        onChange={(e) => updateAdditionalFeeRow(index, { amount: Number(e.target.value || 0) })}
                        placeholder="Amount"
                        className="col-span-2 px-3 py-2 border rounded"
                      />
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => updateAdditionalFeeRow(index, { quantity: Number(e.target.value || 1) })}
                        placeholder="Qty"
                        className="col-span-2 px-3 py-2 border rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeAdditionalFeeRow(index)}
                        className="col-span-1 text-red-700 hover:underline text-sm"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tax</label>
                  <input
                    type="number"
                    value={editTax}
                    onChange={(e) => setEditTax(Number(e.target.value || 0))}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount</label>
                  <input
                    type="number"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(Number(e.target.value || 0))}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              <div className="p-3 border rounded bg-gray-50 text-sm">
                <p>
                  Subtotal: <span className="font-semibold">{formatCurrency(getEditBillingTotals().subtotal)}</span>
                </p>
                <p>
                  Total: <span className="font-semibold">{formatCurrency(getEditBillingTotals().total)}</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveBillingEdit}
                  disabled={savingBillingEdit}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingBillingEdit ? 'Saving...' : 'Save Billing'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditBillingModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {checkInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border max-w-sm w-full p-6">
            <h2 className="text-xl font-bold mb-4">Confirm Check In</h2>
            <p className="text-gray-600 mb-6">
              Move <span className="font-semibold">{patientToCheckIn?.patientId?.name || 'Patient'}</span> to top of queue?
            </p>
            <div className="flex gap-3">
              <button onClick={confirmCheckIn} className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Confirm
              </button>
              <button onClick={() => setCheckInModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Patient Details</h2>
              <button
                type="button"
                aria-label="Close patient details modal"
                onClick={() => setShowViewModal(false)}
                className="text-gray-600 text-xl"
              >
                X
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <p>
                <span className="font-semibold">Name:</span> {selectedPatient.patientId?.name || 'N/A'}
              </p>
              <p>
                <span className="font-semibold">Age:</span> {selectedPatient.patientId?.age || 'N/A'} years
              </p>
              <p>
                <span className="font-semibold">Gender:</span> {selectedPatient.patientId?.gender || 'N/A'}
              </p>
              <p>
                <span className="font-semibold">Contact:</span> {selectedPatient.patientId?.phone || 'N/A'}
              </p>
              <p>
                <span className="font-semibold">Doctor:</span> {selectedPatient.doctorId?.userId?.name || 'N/A'}
              </p>
              <p>
                <span className="font-semibold">Reason:</span> {selectedPatient.appointmentId?.reason || 'N/A'}
              </p>
              <p>
                <span className="font-semibold">Status:</span> {selectedPatient.status}
              </p>
            </div>
            <button onClick={() => setShowViewModal(false)} className="w-full bg-blue-500 text-white px-4 py-2 rounded mt-6 hover:bg-blue-600">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;

