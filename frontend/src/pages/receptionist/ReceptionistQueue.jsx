import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/common/UI';
import { receptionistAPI } from '../../api/endpoints';

const initialWalkInForm = {
  name: '',
  phone: '',
  age: '',
  gender: '',
  doctorId: '',
  consultationReason: '',
  medicalRecordConsent: true,
};

const formatCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;
const formatStatus = (status) => String(status || '').replace('-', ' ');
const getId = (value) => (typeof value === 'string' ? value : value?._id);
const getTodayDate = () => new Date().toISOString().split('T')[0];

const ReceptionistQueue = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [queueList, setQueueList] = useState([]);
  const [walkInAppointments, setWalkInAppointments] = useState([]);
  const [pendingWalkIns, setPendingWalkIns] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchToken, setSearchToken] = useState('');

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState(initialWalkInForm);
  const [registering, setRegistering] = useState(false);
  const [registeredWalkIn, setRegisteredWalkIn] = useState(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [checkInModal, setCheckInModal] = useState(false);
  const [patientToCheckIn, setPatientToCheckIn] = useState(null);
  const [processingCheckIn, setProcessingCheckIn] = useState(false);

  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingQueuePatient, setBillingQueuePatient] = useState(null);
  const [consultationCharge, setConsultationCharge] = useState(500);
  const [additionalServiceRows, setAdditionalServiceRows] = useState([{ serviceId: '', quantity: 1 }]);
  const [generatingBill, setGeneratingBill] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [selectedDate]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchQueueData();
      fetchPendingWalkIns();
      fetchWalkInAppointments();
    }, 10000);
    return () => clearInterval(id);
  }, [selectedDate]);

  const fetchInitialData = async () => {
    await Promise.all([
      fetchQueueData({ showLoader: true }),
      fetchDoctors(),
      fetchServices(),
      fetchPendingWalkIns(),
      fetchWalkInAppointments(),
    ]);
  };

  const fetchQueueData = async ({ showLoader = false } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const params = selectedDate ? { date: selectedDate } : {};
      const response = await receptionistAPI.getWalkInQueue(params);
      const list = (response.data.data || []).sort((a, b) => (a.position || 0) - (b.position || 0));
      setQueueList(list);
      setError('');
    } catch (fetchError) {
      console.error(fetchError);
      setError('Failed to fetch current queue');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const fetchWalkInAppointments = async () => {
    try {
      const params = selectedDate ? { date: selectedDate } : {};
      const response = await receptionistAPI.getWalkInAppointments(params);
      setWalkInAppointments(response.data.data || []);
    } catch (fetchError) {
      console.error(fetchError);
      setWalkInAppointments([]);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await receptionistAPI.getDoctors();
      setDoctors(response.data.data || []);
    } catch (fetchError) {
      console.error(fetchError);
      setDoctors([]);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await receptionistAPI.getServices();
      setServices(response.data.data || []);
    } catch (fetchError) {
      console.error(fetchError);
      setServices([]);
    }
  };

  const fetchPendingWalkIns = async () => {
    try {
      const response = await receptionistAPI.getPendingWalkInPatients();
      setPendingWalkIns(response.data.data || []);
    } catch (fetchError) {
      console.error(fetchError);
      setPendingWalkIns([]);
    }
  };

  const labAndOtherServices = useMemo(() => services.filter((s) => s.category !== 'Consultation'), [services]);

  const filteredQueue = useMemo(() => {
    const query = searchToken.trim().toUpperCase();
    if (!query) return queueList;
    return queueList.filter((item) => String(item.tokenNumber || '').toUpperCase().includes(query));
  }, [queueList, searchToken]);

  const stats = useMemo(() => ({
    total: queueList.length,
    waiting: queueList.filter((q) => q.status === 'waiting').length,
    inConsultation: queueList.filter((q) => q.status === 'in-consultation').length,
    pendingBilling: queueList.filter((q) => q.status === 'pending-transaction').length,
    walkIn: queueList.filter((q) => q.appointmentId?.appointmentType === 'walk-in').length,
  }), [queueList]);

  const handleRegisterWalkIn = async (event) => {
    event.preventDefault();
    try {
      setRegistering(true);
      const response = await receptionistAPI.registerWalkInPatient({
        name: walkInForm.name,
        phone: walkInForm.phone,
        age: walkInForm.age ? Number(walkInForm.age) : undefined,
        gender: walkInForm.gender || undefined,
      });

      const patientId = response.data.data?._id;
      if (!patientId) {
        setError('Failed to register walk-in patient');
        return;
      }

      const appointmentResponse = await receptionistAPI.bookWalkInAppointment({
        patientId,
        doctorId: walkInForm.doctorId,
        reason: walkInForm.consultationReason,
        medicalRecordConsent: walkInForm.medicalRecordConsent,
      });
      const appointmentId = appointmentResponse.data.data?._id;
      if (!appointmentId) {
        setError('Failed to create walk-in appointment');
        return;
      }

      setRegisteredWalkIn({
        appointmentId,
        patientId,
        doctorId: walkInForm.doctorId,
        consultationReason: walkInForm.consultationReason,
        medicalRecordConsent: walkInForm.medicalRecordConsent,
      });
      setSuccess('Walk-in patient registered and added to pending list. Generate token to add to queue.');
      await fetchPendingWalkIns();
    } catch (registerError) {
      console.error(registerError);
      setError(registerError.response?.data?.message || 'Failed to register walk-in patient');
    } finally {
      setRegistering(false);
    }
  };

  const handleGenerateToken = async () => {
    if (!registeredWalkIn?.appointmentId) {
      setError('Missing appointment details for token generation');
      return;
    }

    try {
      setGeneratingToken(true);
      const tokenResponse = await receptionistAPI.generateWalkInToken({ appointmentId: registeredWalkIn.appointmentId });
      const token = tokenResponse.data.data?.tokenNumber || '';

      setGeneratedToken(token);
      setShowTokenModal(true);
      setShowRegisterModal(false);
      setRegisteredWalkIn(null);
      setWalkInForm(initialWalkInForm);
      setSuccess(`Token generated: ${token}`);
      await Promise.all([fetchQueueData(), fetchPendingWalkIns()]);
    } catch (tokenError) {
      console.error(tokenError);
      setError(tokenError.response?.data?.message || 'Failed to generate token');
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCheckIn = (queuePatient) => {
    setPatientToCheckIn(queuePatient);
    setCheckInModal(true);
  };

  const confirmCheckIn = async () => {
    if (!patientToCheckIn) return;
    try {
      setProcessingCheckIn(true);
      const reordered = [patientToCheckIn, ...queueList.filter((q) => q._id !== patientToCheckIn._id)];
      await receptionistAPI.reorderQueue({ queueItems: reordered.map((q) => ({ _id: q._id })) });
      setQueueList(reordered);
      setSuccess('Patient moved to top of queue');
      setCheckInModal(false);
      setPatientToCheckIn(null);
    } catch (checkInError) {
      console.error(checkInError);
      setError('Failed to move patient to top');
    } finally {
      setProcessingCheckIn(false);
    }
  };

  const handleRemovePatient = async (queueId, patientName) => {
    if (!window.confirm(`Remove ${patientName} from queue?`)) return;
    try {
      await receptionistAPI.removePatientFromQueue(queueId);
      setQueueList((prev) => prev.filter((p) => p._id !== queueId));
      setSuccess(`${patientName} removed from queue`);
    } catch (removeError) {
      console.error(removeError);
      setError(removeError.response?.data?.message || 'Failed to remove patient');
    }
  };
  const fetchConsultationRecord = async (queuePatient) => {
    const appointmentId = queuePatient?.appointmentId?._id;
    if (!appointmentId) return null;
    try {
      const response = await receptionistAPI.getConsultationSummary(appointmentId);
      return response.data.data || null;
    } catch {
      return null;
    }
  };

  const printConsultationSheet = async (queuePatient, { silentOnMissing = false } = {}) => {
    const record = await fetchConsultationRecord(queuePatient);
    if (!record) {
      if (!silentOnMissing) {
        setError('Consultation sheet not available yet. Doctor must save consultation details first.');
      }
      return;
    }

    const patientName = queuePatient.patientId?.name || queuePatient.patientId?.userId?.name || 'Patient';
    const diagnosis = record.diagnosis || 'N/A';
    const notes = record.notes || 'N/A';
    const prescriptionRows = (record.prescription || [])
      .map((p) => `<tr><td>${p.medicineName || ''}</td><td>${p.dosage || ''}</td><td>${p.frequency || ''}</td><td>${p.duration || ''}</td></tr>`)
      .join('');
    const labRows = (record.labTests || [])
      .map((t) => `<tr><td>${t.testName || ''}</td><td>${formatStatus(t.status || 'pending')}</td></tr>`)
      .join('');

    const html = `
      <html>
        <head>
          <title>Consultation Sheet - ${patientName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
            h1, h2 { margin: 0 0 10px; }
            .meta { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .section { margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Consultation Sheet</h1>
          <div class="meta">
            <div><strong>Patient:</strong> ${patientName}</div>
            <div><strong>Doctor:</strong> ${record.doctorId?.userId?.name || 'N/A'}</div>
            <div><strong>Date:</strong> ${new Date(record.visitDate || record.createdAt || Date.now()).toLocaleDateString()}</div>
          </div>

          <div class="section"><strong>Diagnosis:</strong> ${diagnosis}</div>
          <div class="section"><strong>Notes:</strong> ${notes}</div>

          <div class="section">
            <h2>Prescription</h2>
            <table>
              <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
              <tbody>${prescriptionRows || '<tr><td colspan="4">No medicines recorded</td></tr>'}</tbody>
            </table>
          </div>

          <div class="section">
            <h2>Suggested Lab Tests</h2>
            <table>
              <thead><tr><th>Test</th><th>Status</th></tr></thead>
              <tbody>${labRows || '<tr><td colspan="2">No lab tests recorded</td></tr>'}</tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    const consultationWindow = window.open('', '', 'width=900,height=700');
    consultationWindow.document.write(html);
    consultationWindow.document.close();
    consultationWindow.print();
  };

  const openBillingModal = (queuePatient) => {
    if (queuePatient.status !== 'pending-transaction') {
      setError('Billing is enabled only after consultation is completed');
      return;
    }

    setConsultationCharge(Number(queuePatient?.doctorId?.consultationFee || 500));
    setAdditionalServiceRows([{ serviceId: '', quantity: 1 }]);
    setBillingQueuePatient(queuePatient);
    setShowBillingModal(true);
  };

  const getServiceById = (id) => services.find((s) => s._id === id);

  const billingItems = useMemo(() => {
    const items = [{
      description: 'Consultation Fee',
      amount: Number(consultationCharge || 0),
      quantity: 1,
    }];

    additionalServiceRows.forEach((row) => {
      if (!row.serviceId || !row.quantity) return;
      const service = getServiceById(row.serviceId);
      if (!service) return;
      items.push({
        serviceId: service._id,
        description: service.name,
        amount: Number(service.price || 0),
        quantity: Number(row.quantity || 1),
      });
    });
    return items;
  }, [consultationCharge, additionalServiceRows, services]);

  const subtotal = useMemo(() => billingItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0), [billingItems]);

  const addAdditionalServiceRow = () => {
    setAdditionalServiceRows((prev) => [...prev, { serviceId: '', quantity: 1 }]);
  };

  const removeAdditionalServiceRow = (index) => {
    setAdditionalServiceRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAdditionalServiceRow = (index, patch) => {
    setAdditionalServiceRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const printInvoice = (queuePatient, createdBilling, items, total) => {
    const patientName = queuePatient.patientId?.name || queuePatient.patientId?.userId?.name || 'Patient';
    const invoiceId = createdBilling?.invoiceNumber || createdBilling?._id || 'N/A';
    const rows = items
      .map((item) => `<tr><td>${item.description}</td><td>${item.quantity}</td><td>${formatCurrency(item.amount)}</td><td>${formatCurrency(item.amount * item.quantity)}</td></tr>`)
      .join('');

    const html = `
      <html>
        <head>
          <title>Invoice - ${invoiceId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
            h1 { margin-bottom: 8px; }
            .meta { margin-bottom: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .totals { margin-top: 16px; text-align: right; font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Invoice</h1>
          <div class="meta">
            <div><strong>Invoice:</strong> ${invoiceId}</div>
            <div><strong>Patient:</strong> ${patientName}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
          </div>

          <table>
            <thead><tr><th>Service</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>

          <div class="totals">Total: ${formatCurrency(total)}</div>
        </body>
      </html>
    `;

    const invoiceWindow = window.open('', '', 'width=900,height=700');
    invoiceWindow.document.write(html);
    invoiceWindow.document.close();
    invoiceWindow.print();
  };

  const handleGenerateBill = async () => {
    if (!billingQueuePatient) return;
    if (billingItems.length === 0) {
      setError('Please select at least one service');
      return;
    }

    try {
      setGeneratingBill(true);
      const payload = {
        patientId: getId(billingQueuePatient.patientId),
        appointmentId: getId(billingQueuePatient.appointmentId),
        items: billingItems.map((item) => ({ description: item.description, amount: item.amount, quantity: item.quantity })),
        subtotal,
        tax: 0,
        discount: 0,
        total: subtotal,
        dueDate: new Date().toISOString(),
        paymentMethod: 'cash',
      };

      const response = await receptionistAPI.createBilling(payload);
      const createdBilling = response.data.data;

      printInvoice(billingQueuePatient, createdBilling, billingItems, subtotal);
      await printConsultationSheet(billingQueuePatient, { silentOnMissing: true });
      window.dispatchEvent(new CustomEvent('billing:created'));

      setShowBillingModal(false);
      setBillingQueuePatient(null);
      setSuccess('Bill generated successfully and added to billing list');
    } catch (billError) {
      console.error(billError);
      setError(billError.response?.data?.message || 'Failed to generate bill');
    } finally {
      setGeneratingBill(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading queue...</div>;
  }
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Walk-in Queue Management</h1>
        <p className="text-gray-600 text-sm mb-4">This list contains only walk-in patients. Scheduled appointments are managed separately.</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded flex justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="font-bold">X</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-800 rounded flex justify-between">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess('')} className="font-bold">X</button>
        </div>
      )}

      <div className="flex gap-4 mb-8 items-center">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setSelectedDate('')}
          className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Clear Date
        </button>
        <button
          type="button"
          onClick={() => setSelectedDate(getTodayDate())}
          className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Today
        </button>
        <input
          type="text"
          value={searchToken}
          onChange={(e) => setSearchToken(e.target.value)}
          placeholder="Search token..."
          className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 flex-1 max-w-sm"
        />
        <Button onClick={() => setShowRegisterModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Register Walk-in
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="smart-card p-5"><p className="smart-card-title">Total Walk-ins</p><p className="smart-card-value text-indigo-600 mt-1">{stats.total}</p></div>
        <div className="smart-card p-5"><p className="smart-card-title">Waiting</p><p className="smart-card-value text-blue-600 mt-1">{stats.waiting}</p></div>
        <div className="smart-card p-5"><p className="smart-card-title">In Consultation</p><p className="smart-card-value text-amber-600 mt-1">{stats.inConsultation}</p></div>
        <div className="smart-card p-5"><p className="smart-card-title">Pending Bill</p><p className="smart-card-value text-orange-600 mt-1">{stats.pendingBilling}</p></div>
        <div className="smart-card p-5"><p className="smart-card-title">Walk-in</p><p className="smart-card-value text-purple-600 mt-1">{stats.walkIn}</p></div>
      </div>

      <div className="bg-white border rounded mb-8">
        <div className="p-4 bg-gray-100 border-b font-semibold text-sm">Pending Walk-in Patients (Registered, Token Not Generated)</div>
        {pendingWalkIns.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No pending walk-in patients</div>
        ) : (
          <div className="divide-y">
            {pendingWalkIns.map((item) => (
              <div key={item.appointmentId} className="p-4 flex items-center justify-between gap-3">
                <div className="text-sm">
                  <div className="font-semibold">{item.patientName || 'Unknown'}</div>
                  <div className="text-gray-600">Phone: {item.patientPhone || 'N/A'}</div>
                  <div className="text-gray-600">Doctor: {item.doctorName || 'N/A'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRegisteredWalkIn({
                      appointmentId: item.appointmentId,
                      patientId: item.patientId,
                      doctorId: item.doctorId,
                      consultationReason: item.reason || '',
                      medicalRecordConsent: true,
                    });
                    setShowRegisterModal(true);
                  }}
                  className="text-xs bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                >
                  Generate Token
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border rounded">
        <div className="p-4 bg-gray-100 border-b font-semibold text-sm">Walkin-Queue</div>
        <div className="grid grid-cols-10 gap-3 p-4 bg-gray-100 border-b font-semibold text-sm">
          <div>Token</div><div>Type</div><div>Patient</div><div>Doctor</div><div>Age</div><div>Gender</div><div>Contact</div><div>Reason</div><div>Status</div><div>Actions</div>
        </div>

        {filteredQueue.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No patients in queue</div>
        ) : (
          filteredQueue.map((patient, index) => (
            <div key={patient._id} className={`grid grid-cols-10 gap-3 p-4 border-b ${index % 2 ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="font-semibold">{patient.tokenNumber || 'N/A'}</div>
              <div className="capitalize">{patient.appointmentId?.appointmentType || 'N/A'}</div>
              <div>{patient.patientId?.name || patient.patientId?.userId?.name || 'Unknown'}</div>
              <div>{patient.doctorId?.userId?.name || 'N/A'}</div>
              <div>{patient.patientId?.age || 'N/A'}</div>
              <div className="capitalize">{patient.patientId?.gender || 'N/A'}</div>
              <div>{patient.patientId?.phone || patient.patientId?.userId?.phone || 'N/A'}</div>
              <div>{patient.appointmentId?.reason || 'N/A'}</div>
              <div>
                <span className={`text-xs px-2 py-1 rounded capitalize ${patient.status === 'waiting' ? 'bg-blue-100 text-blue-800' : patient.status === 'in-consultation' ? 'bg-amber-100 text-amber-800' : patient.status === 'pending-transaction' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                  {formatStatus(patient.status)}
                </span>
              </div>
              <div className="space-x-2">
                <button type="button" onClick={() => handleCheckIn(patient)} disabled={patient.status !== 'waiting'} className="text-green-600 hover:underline text-xs disabled:text-gray-400 disabled:no-underline">Check In</button>
                <button type="button" onClick={() => { setSelectedPatient(patient); setShowViewModal(true); }} className="text-blue-600 hover:underline text-xs">View</button>
                <button type="button" onClick={() => printConsultationSheet(patient)} className="text-blue-600 hover:underline text-xs">Rx</button>
                <button type="button" onClick={() => openBillingModal(patient)} disabled={patient.status !== 'pending-transaction'} className="text-blue-600 hover:underline text-xs disabled:text-gray-400 disabled:no-underline">Bill</button>
                <button type="button" onClick={() => handleRemovePatient(patient._id, patient.patientId?.name || patient.patientId?.userId?.name || 'Patient')} className="text-red-600 hover:underline text-xs">Remove</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-white border rounded mt-8">
        <div className="p-4 bg-gray-100 border-b font-semibold text-sm">
          Walk-in Patients List {selectedDate ? `(${selectedDate})` : '(All Dates)'}
        </div>
        <div className="grid grid-cols-8 gap-3 p-4 bg-gray-50 border-b font-semibold text-sm">
          <div>Token</div><div>Patient</div><div>Doctor</div><div>Date</div><div>Time</div><div>Reason</div><div>Status</div><div>Actions</div>
        </div>
        {walkInAppointments.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No walk-in patients found for selected date</div>
        ) : (
          walkInAppointments.map((apt, index) => (
            <div key={apt._id} className={`grid grid-cols-8 gap-3 p-4 border-b text-sm ${index % 2 ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="font-semibold">{apt.queueToken || 'N/A'}</div>
              <div>{apt.patientId?.name || apt.patientId?.userId?.name || 'Unknown'}</div>
              <div>{apt.doctorId?.userId?.name || 'N/A'}</div>
              <div>{apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : 'N/A'}</div>
              <div>{apt.startTime || 'N/A'}</div>
              <div>{apt.reason || 'N/A'}</div>
              <div>
                <span className={`text-xs px-2 py-1 rounded capitalize ${
                  apt.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : apt.status === 'pending-bill'
                    ? 'bg-orange-100 text-orange-800'
                    : apt.status === 'in-consultation'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {formatStatus(apt.status)}
                </span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => { setSelectedPatient(apt); setShowViewModal(true); }}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{registeredWalkIn ? 'Generate Token' : 'Register Walk-in Patient'}</h2>
                <button type="button" onClick={() => { setShowRegisterModal(false); setRegisteredWalkIn(null); }} className="text-gray-600 text-xl">X</button>
              </div>
            </div>

            <form onSubmit={handleRegisterWalkIn} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Name *</label><input type="text" value={walkInForm.name} onChange={(e) => setWalkInForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border rounded" disabled={Boolean(registeredWalkIn)} required /></div>
              <div><label className="block text-sm font-medium mb-1">Phone *</label><input type="text" value={walkInForm.phone} onChange={(e) => setWalkInForm((prev) => ({ ...prev, phone: e.target.value }))} className="w-full px-3 py-2 border rounded" disabled={Boolean(registeredWalkIn)} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Age</label><input type="number" value={walkInForm.age} onChange={(e) => setWalkInForm((prev) => ({ ...prev, age: e.target.value }))} className="w-full px-3 py-2 border rounded" disabled={Boolean(registeredWalkIn)} /></div>
                <div><label className="block text-sm font-medium mb-1">Gender</label><select value={walkInForm.gender} onChange={(e) => setWalkInForm((prev) => ({ ...prev, gender: e.target.value }))} className="w-full px-3 py-2 border rounded" disabled={Boolean(registeredWalkIn)}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Doctor *</label><select value={walkInForm.doctorId} onChange={(e) => setWalkInForm((prev) => ({ ...prev, doctorId: e.target.value }))} className="w-full px-3 py-2 border rounded" disabled={Boolean(registeredWalkIn)} required><option value="">Select Doctor</option>{doctors.map((doctor) => (<option key={doctor._id} value={doctor._id}>Dr. {doctor.userId?.name || 'Unknown'}</option>))}</select></div>
              <div><label className="block text-sm font-medium mb-1">Reason *</label><textarea rows={2} value={walkInForm.consultationReason} onChange={(e) => setWalkInForm((prev) => ({ ...prev, consultationReason: e.target.value }))} className="w-full px-3 py-2 border rounded" disabled={Boolean(registeredWalkIn)} required /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={walkInForm.medicalRecordConsent} onChange={(e) => setWalkInForm((prev) => ({ ...prev, medicalRecordConsent: e.target.checked }))} disabled={Boolean(registeredWalkIn)} />Patient consents to doctor viewing medical records</label>

              <div className="flex gap-3 pt-2">
                {!registeredWalkIn ? (
                  <>
                    <button type="submit" disabled={registering} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60">{registering ? 'Registering...' : 'Register'}</button>
                    <button type="button" onClick={() => setShowRegisterModal(false)} className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={handleGenerateToken} disabled={generatingToken} className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60">{generatingToken ? 'Generating...' : 'Generate Token'}</button>
                    <button type="button" onClick={() => { setRegisteredWalkIn(null); setWalkInForm(initialWalkInForm); }} className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">Reset</button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {showTokenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded border max-w-sm w-full p-6"><h2 className="text-xl font-bold mb-4">Token Generated</h2><p className="text-gray-600 mb-4">Token: <span className="text-2xl font-bold text-blue-600">{generatedToken}</span></p><button type="button" onClick={() => setShowTokenModal(false)} className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Close</button></div></div>
      )}

      {showViewModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded border max-w-2xl w-full"><div className="p-6 border-b flex justify-between items-center"><h2 className="text-xl font-bold">Patient Details</h2><button type="button" onClick={() => { setShowViewModal(false); setSelectedPatient(null); }} className="text-gray-600 text-xl">X</button></div><div className="p-6 grid grid-cols-2 gap-4 text-sm"><div><strong>Name:</strong> {selectedPatient.patientId?.name || selectedPatient.patientId?.userId?.name || 'N/A'}</div><div><strong>Token:</strong> {selectedPatient.tokenNumber || selectedPatient.queueToken || selectedPatient.appointmentId?.queueToken || 'N/A'}</div><div><strong>Email:</strong> {selectedPatient.patientId?.userId?.email || 'N/A'}</div><div><strong>Phone:</strong> {selectedPatient.patientId?.phone || selectedPatient.patientId?.userId?.phone || 'N/A'}</div><div><strong>Age:</strong> {selectedPatient.patientId?.age || 'N/A'}</div><div><strong>Gender:</strong> {selectedPatient.patientId?.gender || 'N/A'}</div><div><strong>Status:</strong> {formatStatus(selectedPatient.status)}</div><div><strong>Doctor:</strong> {selectedPatient.doctorId?.userId?.name || 'N/A'}</div><div className="col-span-2"><strong>Reason:</strong> {selectedPatient.appointmentId?.reason || selectedPatient.reason || 'N/A'}</div></div></div></div>
      )}

      {checkInModal && patientToCheckIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded border max-w-sm w-full p-6"><h2 className="text-lg font-bold mb-4">Check In Patient</h2><p className="text-gray-700 mb-6">Move <strong>{patientToCheckIn.patientId?.name || patientToCheckIn.patientId?.userId?.name || 'Patient'}</strong> to top of queue?</p><div className="flex gap-3"><button type="button" onClick={confirmCheckIn} disabled={processingCheckIn} className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60">{processingCheckIn ? 'Updating...' : 'Yes, Check In'}</button><button type="button" onClick={() => setCheckInModal(false)} className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">Cancel</button></div></div></div>
      )}

      {showBillingModal && billingQueuePatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center"><h2 className="text-xl font-bold">Generate Bill</h2><button type="button" onClick={() => setShowBillingModal(false)} className="text-gray-600 text-xl">X</button></div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-700"><div><strong>Patient:</strong> {billingQueuePatient.patientId?.name || billingQueuePatient.patientId?.userId?.name || 'Patient'}</div><div><strong>Token:</strong> {billingQueuePatient.tokenNumber}</div><div><strong>Status:</strong> {formatStatus(billingQueuePatient.status)}</div></div>

              <div>
                <label className="block text-sm font-medium mb-1">Consultation Charge *</label>
                <input
                  type="number"
                  value={consultationCharge}
                  readOnly
                  className="w-full px-3 py-2 border rounded bg-gray-100 text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-populated from selected doctor's consultation fee</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2"><label className="block text-sm font-medium">Additional Services / Lab Tests</label><button type="button" onClick={addAdditionalServiceRow} className="text-sm text-blue-700 hover:underline">+ Add Service</button></div>
                <div className="space-y-2">
                  {additionalServiceRows.map((row, index) => (
                    <div key={`service-row-${index}`} className="grid grid-cols-12 gap-2 items-center">
                      <select value={row.serviceId} onChange={(e) => updateAdditionalServiceRow(index, { serviceId: e.target.value })} className="col-span-8 px-3 py-2 border rounded"><option value="">Select Service</option>{labAndOtherServices.map((service) => (<option key={service._id} value={service._id}>{service.name} - {formatCurrency(service.price)}</option>))}</select>
                      <input type="number" min="1" value={row.quantity} onChange={(e) => updateAdditionalServiceRow(index, { quantity: Number(e.target.value || 1) })} className="col-span-2 px-3 py-2 border rounded" />
                      <button type="button" onClick={() => removeAdditionalServiceRow(index)} className="col-span-2 text-red-700 hover:underline text-sm">Remove</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded p-4 bg-gray-50">
                <h3 className="font-semibold mb-2">Bill Summary</h3>
                {billingItems.length === 0 ? (<p className="text-sm text-gray-600">No bill items selected</p>) : (<div className="space-y-1 text-sm">{billingItems.map((item, index) => (<div key={`summary-${index}`} className="flex justify-between"><span>{item.description} x {item.quantity}</span><span>{formatCurrency(item.amount * item.quantity)}</span></div>))}</div>)}
                <div className="mt-3 pt-2 border-t flex justify-between font-bold"><span>Total</span><span>{formatCurrency(subtotal)}</span></div>
              </div>

              <div className="flex gap-3 pt-2"><button type="button" onClick={handleGenerateBill} disabled={generatingBill} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60">{generatingBill ? 'Generating...' : 'Generate Bill'}</button><button type="button" onClick={() => setShowBillingModal(false)} className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">Cancel</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistQueue;
