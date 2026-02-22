import React, { useState, useEffect } from 'react';
import { doctorAPI } from '../../api/endpoints';
import { FiCalendar, FiClock, FiUser, FiCheck, FiX, FiActivity, FiSearch } from 'react-icons/fi';
import { MdChecklistRtl } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatientAppointment, setSelectedPatientAppointment] = useState(null);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [selectedDiagnosisData, setSelectedDiagnosisData] = useState(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [filter, appointments, searchTerm, fromDate, toDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await doctorAPI.getAppointments();
      setAppointments(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
      console.error('Fetch appointments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments.filter((apt) => apt.appointmentType === 'scheduled');

    switch (filter) {
      case 'pending':
        filtered = filtered.filter((apt) => ['pending', 'scheduled', 'confirmed'].includes(apt.status));
        break;
      case 'accepted':
        filtered = filtered.filter((apt) => ['accepted', 'arrived', 'in-consultation'].includes(apt.status));
        break;
      case 'completed':
        filtered = filtered.filter((apt) => ['pending-bill', 'completed'].includes(apt.status));
        break;
      case 'cancelled':
        filtered = filtered.filter((apt) => apt.status === 'cancelled');
        break;
      default:
        filtered = filtered;
    }

    if (searchTerm.trim()) {
      const normalizedSearchTerm = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((apt) => {
        const patientName = (apt.patientId?.name || apt.patientId?.userId?.name || '').toLowerCase();
        const reason = (apt.reason || '').toLowerCase();
        return patientName.includes(normalizedSearchTerm) || reason.includes(normalizedSearchTerm);
      });
    }

    if (fromDate) {
      const fromDateTime = new Date(`${fromDate}T00:00:00`);
      filtered = filtered.filter((apt) => new Date(apt.appointmentDate) >= fromDateTime);
    }

    if (toDate) {
      const toDateTime = new Date(`${toDate}T23:59:59`);
      filtered = filtered.filter((apt) => new Date(apt.appointmentDate) <= toDateTime);
    }

    setFilteredAppointments(filtered.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate)));
  };

  const handleStartCheckup = async (appointmentId) => {
    try {
      setLoading(true);
      await doctorAPI.acceptAppointment(appointmentId);
      setSuccess('Checkup started successfully!');
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start checkup');
    } finally {
      setLoading(false);
    }
  };

  const handlePrescribe = (appointmentId) => {
    navigate('/doctor/dashboard');
  };

  const handleViewPatient = (appointment) => {
    setSelectedPatientAppointment(appointment);
    setShowPatientModal(true);
  };

  const handleViewDiagnosisPrescription = async (appointment) => {
    try {
      setDiagnosisLoading(true);
      setSelectedDiagnosisData(null);

      const patientId = appointment?.patientId?._id;
      if (!patientId) {
        setError('Patient details not found for this appointment');
        return;
      }

      const response = await doctorAPI.getMedicalRecords(patientId);
      const records = response?.data?.data || [];
      const record = records.find((entry) => {
        const recordAppointmentId = typeof entry.appointmentId === 'string'
          ? entry.appointmentId
          : entry.appointmentId?._id;
        return String(recordAppointmentId || '') === String(appointment._id);
      }) || null;

      setSelectedDiagnosisData({ appointment, record });
      setShowDiagnosisModal(true);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.response?.data?.message || 'Failed to load diagnosis and prescription');
    } finally {
      setDiagnosisLoading(false);
    }
  };

  const handleCompleted = async (appointmentId) => {
    try {
      setLoading(true);
      await doctorAPI.completeAppointment(appointmentId);
      setSuccess('Appointment marked as completed!');
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete appointment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getQueueStatusBadge = (queueStatus) => {
    switch (queueStatus) {
      case 'waiting':
        return <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">Waiting</span>;
      case 'in-consultation':
        return <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">In Consultation</span>;
      case 'completed':
        return <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Completed</span>;
      case 'pending-transaction':
        return <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">Pending Bill</span>;
      default:
        return <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">Not in queue</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
            Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            Accepted
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
            Scheduled
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full">
            Confirmed
          </span>
        );
      case 'arrived':
        return (
          <span className="inline-block px-2 py-1 bg-cyan-100 text-cyan-800 text-xs font-semibold rounded-full">
            Arrived
          </span>
        );
      case 'in-consultation':
        return (
          <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
            In Consultation
          </span>
        );
      case 'completed':
        return (
          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
            Completed
          </span>
        );
      case 'pending-bill':
        return (
          <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
            Pending Bill
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-600 mt-2">Manage scheduled appointments only</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900 font-bold">✕</button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900 font-bold">✕</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200">
        {['all', 'pending', 'accepted', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-3 font-medium capitalize transition border-b-2 ${
              filter === status
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-blue-600'
            }`}
          >
            {status} ({
              appointments.filter((a) => {
                if (status === 'all') return a.appointmentType === 'scheduled';
                if (status === 'pending') return a.appointmentType === 'scheduled' && ['pending', 'scheduled', 'confirmed'].includes(a.status);
                if (status === 'accepted') return a.appointmentType === 'scheduled' && ['accepted', 'arrived', 'in-consultation'].includes(a.status);
                return status === 'completed'
                  ? a.appointmentType === 'scheduled' && ['pending-bill', 'completed'].includes(a.status)
                  : a.appointmentType === 'scheduled' && a.status === status;
              }).length
            })
          </button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient or reason..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          aria-label="From date"
        />

        <div className="flex gap-2">
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            aria-label="To date"
          />
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setFromDate('');
              setToDate('');
            }}
            className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Appointments List */}
      {loading && filteredAppointments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading appointments...</div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <FiCalendar className="mx-auto text-4xl text-gray-300 mb-4" />
          <p className="text-gray-600 text-lg">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((appointment) => (
            <div
              key={appointment._id}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition"
            >
              {/* Appointment Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-7 gap-4 items-center mb-4">
                {/* Patient Name */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Patient</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FiUser className="text-blue-600" size={16} />
                    {appointment.patientId?.name || appointment.patientId?.userId?.name || 'Unknown'}
                  </p>
                </div>

                {/* Date */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FiCalendar className="text-blue-600" size={16} />
                    {formatDate(appointment.appointmentDate)}
                  </p>
                </div>

                {/* Time */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Time</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FiClock className="text-blue-600" size={16} />
                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                  </p>
                </div>

                {/* Reason */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reason</p>
                  <p className="text-sm text-gray-700 font-medium max-w-xs truncate">
                    {appointment.reason || 'General Checkup'}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                  {getStatusBadge(appointment.status)}
                </div>

                {/* Queue Status */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Queue</p>
                  {getQueueStatusBadge(appointment.queueStatus)}
                </div>

                {/* Actions */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Actions</p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenActionMenuId(openActionMenuId === appointment._id ? null : appointment._id)}
                      className="px-3 py-2 text-xs font-medium border border-gray-300 rounded bg-white hover:bg-gray-50"
                    >
                      Actions
                    </button>

                    {openActionMenuId === appointment._id && (
                      <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded shadow-lg z-20">
                        {['pending', 'scheduled', 'confirmed', 'arrived'].includes(appointment.status) && (
                          <button
                            onClick={() => {
                              handleStartCheckup(appointment._id);
                              setOpenActionMenuId(null);
                            }}
                            disabled={loading}
                            className="w-full text-left px-3 py-2 text-xs text-green-700 hover:bg-green-50 disabled:text-gray-400"
                          >
                            <FiActivity className="inline mr-1" size={14} />
                            Start
                          </button>
                        )}

                        {['accepted', 'arrived', 'in-consultation'].includes(appointment.status) && (
                          <button
                            onClick={() => {
                              handlePrescribe(appointment._id);
                              setOpenActionMenuId(null);
                            }}
                            disabled={loading}
                            className="w-full text-left px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 disabled:text-gray-400"
                          >
                            <MdChecklistRtl className="inline mr-1" size={14} />
                            Prescribe
                          </button>
                        )}

                        {appointment.status === 'accepted' || appointment.status === 'in-consultation' ? (
                          <button
                            onClick={() => {
                              handleCompleted(appointment._id);
                              setOpenActionMenuId(null);
                            }}
                            disabled={loading}
                            className="w-full text-left px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 disabled:text-gray-400"
                          >
                            <FiCheck className="inline mr-1" size={14} />
                            Completed
                          </button>
                        ) : null}

                        <button
                          onClick={() => {
                            handleViewPatient(appointment);
                            setOpenActionMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          <FiUser className="inline mr-1" size={14} />
                          View Patient
                        </button>

                        <button
                          onClick={() => {
                            handleViewDiagnosisPrescription(appointment);
                            setOpenActionMenuId(null);
                          }}
                          disabled={diagnosisLoading}
                          className="w-full text-left px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 disabled:text-gray-400"
                        >
                          <MdChecklistRtl className="inline mr-1" size={14} />
                          {diagnosisLoading ? 'Loading...' : 'View Diagnosis & Rx'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPatientModal && selectedPatientAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Patient Details</h2>
              <button type="button" onClick={() => setShowPatientModal(false)} className="text-gray-600 text-xl">X</button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><strong>Name:</strong> {selectedPatientAppointment.patientId?.name || selectedPatientAppointment.patientId?.userId?.name || 'N/A'}</div>
              <div><strong>Email:</strong> {selectedPatientAppointment.patientId?.userId?.email || 'N/A'}</div>
              <div><strong>Phone:</strong> {selectedPatientAppointment.patientId?.phone || selectedPatientAppointment.patientId?.userId?.phone || 'N/A'}</div>
              <div><strong>Gender:</strong> {selectedPatientAppointment.patientId?.gender || 'N/A'}</div>
              <div><strong>Age:</strong> {selectedPatientAppointment.patientId?.age || 'N/A'}</div>
              <div><strong>Patient Type:</strong> {selectedPatientAppointment.patientId?.patientType || 'registered'}</div>
              <div className="md:col-span-2"><strong>Reason:</strong> {selectedPatientAppointment.reason || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {showDiagnosisModal && selectedDiagnosisData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Diagnosis & Prescription</h2>
              <button type="button" onClick={() => setShowDiagnosisModal(false)} className="text-gray-600 text-xl">X</button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              {!selectedDiagnosisData.record ? (
                <div className="p-4 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded">
                  Diagnosis and prescription are not recorded yet for this appointment.
                </div>
              ) : (
                <>
                  <div>
                    <p className="font-semibold mb-1">Diagnosis</p>
                    <p className="text-gray-800">{selectedDiagnosisData.record.diagnosis || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Symptoms</p>
                    <p className="text-gray-800">{(selectedDiagnosisData.record.symptoms || []).join(', ') || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Notes</p>
                    <p className="text-gray-800">{selectedDiagnosisData.record.notes || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Prescription</p>
                    {(selectedDiagnosisData.record.prescription || []).length === 0 ? (
                      <p className="text-gray-800">No medicines prescribed.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-3 py-2 text-left">Medicine</th>
                              <th className="px-3 py-2 text-left">Dosage</th>
                              <th className="px-3 py-2 text-left">Frequency</th>
                              <th className="px-3 py-2 text-left">Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedDiagnosisData.record.prescription.map((item, index) => (
                              <tr key={`rx-${index}`} className="border-t">
                                <td className="px-3 py-2">{item.medicineName || 'N/A'}</td>
                                <td className="px-3 py-2">{item.dosage || 'N/A'}</td>
                                <td className="px-3 py-2">{item.frequency || 'N/A'}</td>
                                <td className="px-3 py-2">{item.duration || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
