import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button } from '../../components/common/UI';
import { patientAPI } from '../../api/endpoints';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await patientAPI.getAppointments();
      setAppointments(res.data.data || []);
      setError('');
    } catch (fetchError) {
      console.error(fetchError);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => filter === 'all' || apt.status === filter);
  }, [appointments, filter]);

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Cancel this appointment?')) return;

    try {
      await patientAPI.cancelAppointment(appointmentId);
      setSuccess('Appointment cancelled successfully');
      fetchAppointments();
    } catch (cancelError) {
      console.error(cancelError);
      setError(cancelError.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const handleViewDiagnosisPrescription = async (appointment) => {
    try {
      setDiagnosisLoading(true);
      setSelectedAppointment(appointment);
      setSelectedRecord(null);

      const response = await patientAPI.getMedicalRecords();
      const records = response?.data?.data || [];
      const matchedRecord = records.find((record) => {
        const recordAppointmentId = typeof record.appointmentId === 'string'
          ? record.appointmentId
          : record.appointmentId?._id;
        return String(recordAppointmentId || '') === String(appointment._id);
      }) || null;

      setSelectedRecord(matchedRecord);
      setShowDiagnosisModal(true);
      setError('');
    } catch (viewError) {
      console.error(viewError);
      setError(viewError.response?.data?.message || 'Failed to load diagnosis and prescription');
    } finally {
      setDiagnosisLoading(false);
    }
  };

  const handlePrintDiagnosisPrescription = () => {
    if (!selectedAppointment) return;

    const diagnosis = selectedRecord?.diagnosis || 'N/A';
    const symptoms = (selectedRecord?.symptoms || []).join(', ') || 'N/A';
    const notes = selectedRecord?.notes || 'N/A';
    const prescriptionRows = (selectedRecord?.prescription || []).map((item) => `
      <tr>
        <td style="border:1px solid #ccc;padding:8px;">${item.medicineName || 'N/A'}</td>
        <td style="border:1px solid #ccc;padding:8px;">${item.dosage || 'N/A'}</td>
        <td style="border:1px solid #ccc;padding:8px;">${item.frequency || 'N/A'}</td>
        <td style="border:1px solid #ccc;padding:8px;">${item.duration || 'N/A'}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Diagnosis and Prescription</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 16px;">
          <h2>Diagnosis and Prescription</h2>
          <p><strong>Doctor:</strong> Dr. ${selectedAppointment.doctorId?.userId?.name || 'Unknown'}</p>
          <p><strong>Date:</strong> ${new Date(selectedAppointment.appointmentDate).toLocaleDateString()}</p>
          <p><strong>Diagnosis:</strong> ${diagnosis}</p>
          <p><strong>Symptoms:</strong> ${symptoms}</p>
          <p><strong>Notes:</strong> ${notes}</p>
          <h3>Prescription</h3>
          ${prescriptionRows
            ? `<table style="border-collapse: collapse; width: 100%;">
                <thead>
                  <tr>
                    <th style="border:1px solid #ccc;padding:8px;text-align:left;">Medicine</th>
                    <th style="border:1px solid #ccc;padding:8px;text-align:left;">Dosage</th>
                    <th style="border:1px solid #ccc;padding:8px;text-align:left;">Frequency</th>
                    <th style="border:1px solid #ccc;padding:8px;text-align:left;">Duration</th>
                  </tr>
                </thead>
                <tbody>${prescriptionRows}</tbody>
              </table>`
            : '<p>No medicines prescribed.</p>'}
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const statusOptions = ['all', 'scheduled', 'confirmed', 'accepted', 'in-consultation', 'completed', 'cancelled'];
  const formatStatus = (status) => status.replace('-', ' ');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Appointments</h1>
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((status) => (
            <Button
              key={status}
              onClick={() => setFilter(status)}
              variant={filter === status ? 'primary' : 'secondary'}
              className="capitalize text-sm"
            >
              {formatStatus(status)}
            </Button>
          ))}
        </div>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded">{error}</div>}
      {success && <div className="p-3 bg-green-100 text-green-700 border border-green-300 rounded">{success}</div>}

      <div className="space-y-4">
        {loading ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">Loading appointments...</p>
          </Card>
        ) : filteredAppointments.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">No appointments found</p>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => (
            <Card key={appointment._id} className="p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Dr. {appointment.doctorId?.userId?.name || 'Unknown'}</h3>
                  <p className="text-sm text-gray-600 capitalize">{appointment.doctorId?.specialization || 'General'}</p>
                  <p className="text-gray-700 mt-2">
                    Date: {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.startTime}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">{appointment.reason || 'General consultation'}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium capitalize ${
                      appointment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : appointment.status === 'in-consultation'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                        >
                          {formatStatus(appointment.status)}
                        </span>

                  {(appointment.status === 'scheduled' || appointment.status === 'confirmed' || appointment.status === 'accepted') && (
                    <Button size="sm" variant="danger" onClick={() => handleCancel(appointment._id)}>
                      Cancel
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleViewDiagnosisPrescription(appointment)}
                    disabled={diagnosisLoading}
                  >
                    {diagnosisLoading ? 'Loading...' : 'View Diagnosis & Rx'}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {showDiagnosisModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Diagnosis & Prescription</h2>
              <button type="button" onClick={() => setShowDiagnosisModal(false)} className="text-gray-600 text-xl">X</button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              {!selectedRecord ? (
                <div className="p-4 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded">
                  Diagnosis and prescription are not recorded yet for this appointment.
                </div>
              ) : (
                <>
                  <div>
                    <p className="font-semibold mb-1">Diagnosis</p>
                    <p className="text-gray-800">{selectedRecord.diagnosis || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Symptoms</p>
                    <p className="text-gray-800">{(selectedRecord.symptoms || []).join(', ') || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Notes</p>
                    <p className="text-gray-800">{selectedRecord.notes || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Prescription</p>
                    {(selectedRecord.prescription || []).length === 0 ? (
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
                            {selectedRecord.prescription.map((item, index) => (
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

              <div className="pt-2 border-t flex justify-end gap-2">
                <Button size="sm" variant="secondary" onClick={handlePrintDiagnosisPrescription}>
                  Print
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
