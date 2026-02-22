import React, { useState, useEffect } from 'react';
import { receptionistAPI } from '../../api/endpoints';
import { Loading } from '../../components/common/UI';
import { FiChevronDown } from 'react-icons/fi';

const ReceptionistAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // includes pending-bill

  // Modal states
  const [viewModal, setViewModal] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', startTime: '09:00', endTime: '09:30' });
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  useEffect(() => {
    fetchAppointments({ showLoader: loading });
  }, [filterValue, statusFilter]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchAppointments();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [filterValue, statusFilter]);

  const fetchAppointments = async ({ showLoader = false } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      setError('');
      
      let params = {};
      
      // Only add status filter if it's not 'all'
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (filterValue) {
        params.date = filterValue;
      }
      
      const res = await receptionistAPI.getScheduledAppointments(params);
      let fetchedAppointments = res.data.data || [];

      // Format appointment data
      const formattedAppointments = fetchedAppointments.map(appointment => {
        const patient = appointment.patientId || {};
        const doctor = appointment.doctorId || {};

        return {
          _id: appointment._id,
          appointmentId: appointment.appointmentId || appointment._id.substring(0, 8), // Use appointment ID
          patientName: patient.name || patient.userId?.name || 'Unknown',
          patientId: patient._id,
          patientPhone: patient.phone || 'N/A',
          doctorName: doctor.userId?.name || doctor.name || 'Unknown',
          doctorId: doctor._id,
          date: appointment.appointmentDate ? appointment.appointmentDate.split('T')[0] : 'N/A',
          time: appointment.startTime || 'N/A',
          endTime: appointment.endTime || 'N/A',
          status: appointment.status || 'scheduled',
          phone: patient.phone || 'N/A',
          reason: appointment.reason || 'General Checkup',
          appointmentType: appointment.appointmentType,
          appointmentDate: appointment.appointmentDate,
          queueStatus: appointment.queueStatus || 'not-in-queue',
        };
      });

      // Limit to 50 items
      setAppointments(formattedAppointments.slice(0, 50));
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments');
      setAppointments([]);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setViewModal(true);
  };

  const handleRescheduleClick = (appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleData({
      date: appointment.date,
      startTime: appointment.time,
      endTime: appointment.endTime
    });
    setRescheduleModal(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleData.date || !rescheduleData.startTime) {
      setError('Please select date and time');
      return;
    }

    try {
      setProcessing(true);
      await receptionistAPI.rescheduleAppointment(selectedAppointment._id, {
        date: rescheduleData.date,
        startTime: rescheduleData.startTime,
        endTime: rescheduleData.endTime,
      });
      setSuccess('Appointment rescheduled successfully');
      setRescheduleModal(false);
      setSelectedAppointment(null);
      await fetchAppointments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelAppointment = (appointment) => {
    setAppointmentToCancel(appointment);
    setCancelModal(true);
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) return;

    try {
      setProcessing(true);
      await receptionistAPI.cancelAppointment(appointmentToCancel._id, {});
      setSuccess(`Appointment for ${appointmentToCancel.patientName} has been cancelled`);
      setDropdownOpen(null);
      setCancelModal(false);
      setAppointmentToCancel(null);
      await fetchAppointments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setProcessing(false);
    }
  };

  const handleMoveToQueue = async (appointment) => {
    try {
      setProcessing(true);
      // For scheduled appointments, check-in directly once.
      // The backend places the patient at queue priority, so no second insert is needed.
      const checkInRes = await receptionistAPI.checkInPatient({
        appointmentId: appointment._id,
      });

      const token = checkInRes?.data?.data?.tokenNumber;
      setSuccess(`${appointment.patientName} moved to queue${token ? ` with token: ${token}` : ''}`);
      await fetchAppointments();
      setDropdownOpen(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to move patient to queue');
      console.error('Move to queue error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const filteredAppointments = appointments.filter(apt =>
    apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Scheduled Appointments</h1>
        <p className="text-gray-600 text-sm mb-4">
          View and manage scheduled appointments booked in advance. For walk-in patients, see the Queue Management page.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold">X</button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="font-bold">X</button>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Bar */}
            <div>
              <label className="block text-sm font-semibold mb-2">Search</label>
              <input
                type="text"
                placeholder="Patient or Doctor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2">Filter by Date</label>
              <input
                type="date"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setFilterValue('')}
                  className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Clear Date
                </button>
                <button
                  type="button"
                  onClick={() => setFilterValue(new Date().toISOString().split('T')[0])}
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="arrived">Arrived</option>
                <option value="in-consultation">In Consultation</option>
                <option value="pending-bill">Pending Bill</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No appointments found
            </div>
          ) : (
            <>
              <div className="mb-4 p-4 text-sm text-gray-600 border-b">
                Showing {filteredAppointments.length} appointment(s)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-6 py-3 text-left text-sm font-semibold">Appointment ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Patient Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Doctor</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Time</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Reason</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Queue Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((appointment) => (
                      <tr key={appointment._id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm text-blue-600">{appointment.appointmentId}</td>
                        <td className="px-6 py-4">{appointment.patientName}</td>
                        <td className="px-6 py-4">{appointment.doctorName}</td>
                        <td className="px-6 py-4">{appointment.date}</td>
                        <td className="px-6 py-4">{appointment.time}</td>
                        <td className="px-6 py-4">{appointment.reason}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded text-sm font-semibold ${
                              appointment.status === 'scheduled'
                                ? 'bg-yellow-100 text-yellow-800'
                                : appointment.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-800'
                                : appointment.status === 'arrived'
                                ? 'bg-cyan-100 text-cyan-800'
                                : appointment.status === 'in-consultation'
                                ? 'bg-purple-100 text-purple-800'
                                : appointment.status === 'pending-bill'
                                ? 'bg-orange-100 text-orange-800'
                                : appointment.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded text-xs font-semibold capitalize ${
                              appointment.queueStatus === 'waiting'
                                ? 'bg-blue-100 text-blue-800'
                                : appointment.queueStatus === 'in-consultation'
                                ? 'bg-purple-100 text-purple-800'
                                : appointment.queueStatus === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {appointment.queueStatus === 'not-in-queue' ? 'Not in queue' : appointment.queueStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <button
                              onClick={() => setDropdownOpen(dropdownOpen === appointment._id ? null : appointment._id)}
                              disabled={processing}
                              className="text-gray-600 hover:text-gray-800 font-semibold border border-gray-600 px-3 py-2 rounded flex items-center gap-1 text-sm"
                            >
                              Actions <FiChevronDown size={16} />
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen === appointment._id && (
                              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
                                <button
                                  onClick={() => {
                                    handleViewAppointment(appointment);
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm border-b"
                                >
                                  View
                                </button>

                                {!['cancelled', 'completed', 'pending-bill'].includes(appointment.status) && (
                                  <>
                                    <button
                                      onClick={() => {
                                        handleRescheduleClick(appointment);
                                        setDropdownOpen(null);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm border-b"
                                    >
                                      Reschedule
                                    </button>

                                    <button
                                      onClick={() => {
                                        handleMoveToQueue(appointment);
                                        setDropdownOpen(null);
                                      }}
                                      disabled={processing || appointment.queueStatus !== 'not-in-queue'}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm border-b disabled:opacity-50"
                                    >
                                      Move to Queue
                                    </button>

                                    <button
                                      onClick={() => {
                                        handleCancelAppointment(appointment);
                                        setDropdownOpen(null);
                                      }}
                                      disabled={processing}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm border-b disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
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

        {/* View Appointment Modal */}
        {viewModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Appointment Details</h2>
                <button onClick={() => setViewModal(false)} className="text-gray-500 text-2xl">X</button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Appointment ID</p>
                  <p className="text-sm font-mono text-blue-600">{selectedAppointment.appointmentId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Patient</p>
                  <p className="text-sm font-semibold">{selectedAppointment.patientName}</p>
                  <p className="text-xs text-gray-600">{selectedAppointment.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Doctor</p>
                  <p className="text-sm font-semibold">{selectedAppointment.doctorName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Date</p>
                    <p className="text-sm font-semibold">{selectedAppointment.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Time</p>
                    <p className="text-sm font-semibold">{selectedAppointment.time}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Reason</p>
                  <p className="text-sm">{selectedAppointment.reason}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                      selectedAppointment.status === 'scheduled'
                        ? 'bg-yellow-100 text-yellow-800'
                        : selectedAppointment.status === 'confirmed'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedAppointment.status === 'arrived'
                        ? 'bg-cyan-100 text-cyan-800'
                        : selectedAppointment.status === 'in-consultation'
                        ? 'bg-purple-100 text-purple-800'
                        : selectedAppointment.status === 'pending-bill'
                        ? 'bg-orange-100 text-orange-800'
                        : selectedAppointment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedAppointment.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Queue Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-semibold capitalize ${
                      selectedAppointment.queueStatus === 'waiting'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedAppointment.queueStatus === 'in-consultation'
                        ? 'bg-purple-100 text-purple-800'
                        : selectedAppointment.queueStatus === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {selectedAppointment.queueStatus === 'not-in-queue' ? 'Not in queue' : selectedAppointment.queueStatus}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setViewModal(false)}
                className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Reschedule Appointment Modal */}
        {rescheduleModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Reschedule Appointment</h2>
                <button onClick={() => setRescheduleModal(false)} className="text-gray-500 text-2xl">X</button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Rescheduling appointment for <strong>{selectedAppointment.patientName}</strong>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">New Date</label>
                  <input
                    type="date"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Start Time</label>
                  <input
                    type="time"
                    value={rescheduleData.startTime}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">End Time</label>
                  <input
                    type="time"
                    value={rescheduleData.endTime}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleRescheduleSubmit}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {processing ? 'Updating...' : 'Reschedule'}
                </button>
                <button
                  onClick={() => setRescheduleModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {cancelModal && appointmentToCancel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-sm w-full p-6">
              <h2 className="text-lg font-bold mb-4">Confirm Cancellation</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel the appointment for <strong>{appointmentToCancel.patientName}</strong>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmCancelAppointment}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                >
                  {processing ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
                <button
                  onClick={() => setCancelModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                >
                  No, Keep It
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceptionistAppointments;

