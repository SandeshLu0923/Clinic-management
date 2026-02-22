import React, { useEffect, useState } from 'react';
import { Card, Button, Loading } from '../../components/common/UI';
import { useSelector } from 'react-redux';
import { doctorAPI } from '../../api/endpoints';
import { FiRefreshCw } from 'react-icons/fi';

const defaultPrescriptionRow = () => ({
  medicineName: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
});

const defaultLabTestRow = () => ({
  testName: '',
});

const DoctorDashboard = () => {
  useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ appointments: 0, walkIns: 0, pending: 0, completed: 0 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [savingRecord, setSavingRecord] = useState(false);
  const [formError, setFormError] = useState('');
  const [consultationForm, setConsultationForm] = useState({
    diagnosis: '',
    symptoms: '',
    prescription: [defaultPrescriptionRow()],
    labTests: [defaultLabTestRow()],
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, appointmentsRes, queueRes] = await Promise.all([
        doctorAPI.getProfile(),
        doctorAPI.getAppointments(),
        doctorAPI.getTodayQueue(),
      ]);
      setProfile(profileRes.data.data);
      setAppointments(appointmentsRes.data.data);
      setQueue(queueRes.data.data.queue || []);
      setStats(queueRes.data.data.stats || { appointments: 0, walkIns: 0, pending: 0, completed: 0 });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = async (queueItem) => {
    try {
      await doctorAPI.startConsultation({ queueId: queueItem._id });
      setSelectedConsultation(queueItem);
      setConsultationForm({
        diagnosis: '',
        symptoms: '',
        prescription: [defaultPrescriptionRow()],
        labTests: [defaultLabTestRow()],
        notes: '',
      });
      setFormError('');
      setShowConsultationForm(true);
      fetchData();
    } catch (error) {
      console.error('Error starting consultation:', error);
    }
  };

  const handleSaveConsultation = async () => {
    if (!selectedConsultation) return;

    try {
      setSavingRecord(true);
      setFormError('');

      const prescription = consultationForm.prescription
        .map((item) => ({
          medicineName: item.medicineName?.trim(),
          dosage: item.dosage?.trim(),
          frequency: item.frequency?.trim(),
          duration: item.duration?.trim(),
          instructions: item.instructions?.trim(),
        }))
        .filter((item) => item.medicineName);

      const labTests = consultationForm.labTests
        .map((item) => ({ testName: item.testName?.trim() }))
        .filter((item) => item.testName);
      const symptoms = String(consultationForm.symptoms || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      await doctorAPI.createMedicalRecord({
        patientId: selectedConsultation.patientId?._id,
        appointmentId: selectedConsultation.appointmentId?._id,
        diagnosis: consultationForm.diagnosis,
        symptoms,
        prescription,
        labTests,
        notes: consultationForm.notes,
      });

      setShowConsultationForm(false);
      setSelectedConsultation(null);
      fetchData();
    } catch (error) {
      console.error('Error saving consultation:', error);
      setFormError(error.response?.data?.message || 'Failed to save consultation details');
    } finally {
      setSavingRecord(false);
    }
  };

  const handleCompleteConsultation = async (queueId) => {
    try {
      await doctorAPI.completeConsultation({ queueId });
      if (selectedConsultation?._id === queueId) {
        setShowConsultationForm(false);
        setSelectedConsultation(null);
        setConsultationForm({
          diagnosis: '',
          symptoms: '',
          prescription: [defaultPrescriptionRow()],
          labTests: [defaultLabTestRow()],
          notes: '',
        });
      }
      fetchData(); // Refresh queue after completing
    } catch (error) {
      console.error('Error completing consultation:', error);
    }
  };

  const handleOpenConsultationForm = (queueItem) => {
    setSelectedConsultation(queueItem);
    setFormError('');
    setShowConsultationForm(true);
  };

  const handlePrescriptionChange = (index, field, value) => {
    setConsultationForm((prev) => {
      const next = [...prev.prescription];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, prescription: next };
    });
  };

  const handleLabTestChange = (index, value) => {
    setConsultationForm((prev) => {
      const next = [...prev.labTests];
      next[index] = { ...next[index], testName: value };
      return { ...prev, labTests: next };
    });
  };

  const addPrescriptionRow = () => {
    setConsultationForm((prev) => ({
      ...prev,
      prescription: [...prev.prescription, defaultPrescriptionRow()],
    }));
  };

  const removePrescriptionRow = (index) => {
    setConsultationForm((prev) => ({
      ...prev,
      prescription: prev.prescription.length > 1
        ? prev.prescription.filter((_, i) => i !== index)
        : prev.prescription,
    }));
  };

  const addLabTestRow = () => {
    setConsultationForm((prev) => ({
      ...prev,
      labTests: [...prev.labTests, defaultLabTestRow()],
    }));
  };

  const removeLabTestRow = (index) => {
    setConsultationForm((prev) => ({
      ...prev,
      labTests: prev.labTests.length > 1
        ? prev.labTests.filter((_, i) => i !== index)
        : prev.labTests,
    }));
  };

  const filteredQueue = queue.filter(q => {
    if (filter === 'all') return true;
    return q.appointmentId?.appointmentType === filter;
  });

  if (loading) return <Loading />;

  return (
    <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <h2 className="text-lg font-semibold mb-2">Today's Appointments</h2>
              <p className="text-sm text-gray-500 mb-1">Scheduled</p>
              <p className="text-3xl font-bold text-blue-500">{stats.appointments}</p>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-2">Today's Walk-ins</h2>
              <p className="text-sm text-gray-500 mb-1">Registered</p>
              <p className="text-3xl font-bold text-purple-500">{stats.walkIns}</p>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-2">Pending Queue</h2>
              <p className="text-sm text-gray-500 mb-1">Waiting Now</p>
              <p className="text-3xl font-bold text-amber-500">{stats.pending}</p>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-2">Completed</h2>
              <p className="text-sm text-gray-500 mb-1">Patients Seen</p>
              <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Patient Queue</h2>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={fetchData} 
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition" 
                    title="Refresh Queue"
                  >
                    <FiRefreshCw />
                  </button>
                  <div className="flex gap-2 text-sm">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded transition ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('scheduled')}
                    className={`px-3 py-1 rounded transition ${filter === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                  >
                    Scheduled
                  </button>
                  <button
                    onClick={() => setFilter('walk-in')}
                    className={`px-3 py-1 rounded transition ${filter === 'walk-in' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800 hover:bg-purple-200'}`}
                  >
                    Walk-in
                  </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Token</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Patient</th>
                      <th className="px-4 py-2 text-left">Position</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQueue.length > 0 ? filteredQueue.map((q) => (
                      <tr key={q._id} className="border-b">
                        <td className="px-4 py-2 font-semibold">{q.tokenNumber}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            q.appointmentId?.appointmentType === 'walk-in' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {q.appointmentId ? (q.appointmentId.appointmentType === 'walk-in' ? 'Walk-in' : 'Scheduled') : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-2">{q.patientId?.name || q.patientId?.userId?.name || 'N/A'}</td>
                        <td className="px-4 py-2">{q.position}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-sm ${
                            q.status === 'waiting' ? 'bg-blue-100 text-blue-800' :
                            q.status === 'in-consultation' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {q.status === 'waiting' && (
                            <Button 
                              size="sm" 
                              variant="primary"
                              onClick={() => handleStartConsultation(q)}
                            >
                              Start
                            </Button>
                          )}
                          {q.status === 'in-consultation' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleOpenConsultationForm(q)}
                              >
                                Open Form
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleCompleteConsultation(q._id)}
                              >
                                Complete
                              </Button>
                            </div>
                          )}
                          {q.status === 'completed' && (
                            <span className="text-gray-500 text-sm font-medium">Done</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                          No patients in queue currently.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

      {showConsultationForm && selectedConsultation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Consultation Form</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowConsultationForm(false)}
                disabled={savingRecord}
              >
                Close
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Patient: {selectedConsultation.patientId?.name || selectedConsultation.patientId?.userId?.name || 'N/A'}
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Diagnosis</label>
                <textarea
                  value={consultationForm.diagnosis}
                  onChange={(e) => setConsultationForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
                  rows={3}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter diagnosis"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Symptoms</label>
                <textarea
                  value={consultationForm.symptoms}
                  onChange={(e) => setConsultationForm((prev) => ({ ...prev, symptoms: e.target.value }))}
                  rows={2}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter symptoms (comma separated)"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Prescription</label>
                  <Button size="sm" variant="secondary" onClick={addPrescriptionRow}>
                    Add Medicine
                  </Button>
                </div>
                <div className="space-y-3">
                  {consultationForm.prescription.map((item, index) => (
                    <div key={`rx-${index}`} className="border rounded p-3 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          value={item.medicineName}
                          onChange={(e) => handlePrescriptionChange(index, 'medicineName', e.target.value)}
                          className="w-full border rounded px-3 py-2"
                          placeholder="Medicine name"
                        />
                        <input
                          value={item.dosage}
                          onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                          className="w-full border rounded px-3 py-2"
                          placeholder="Dosage (e.g. 500mg)"
                        />
                        <input
                          value={item.frequency}
                          onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                          className="w-full border rounded px-3 py-2"
                          placeholder="Frequency (e.g. Twice daily)"
                        />
                        <input
                          value={item.duration}
                          onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                          className="w-full border rounded px-3 py-2"
                          placeholder="Duration (e.g. 5 days)"
                        />
                      </div>
                      <textarea
                        value={item.instructions}
                        onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)}
                        rows={2}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Instructions"
                      />
                      <div className="flex justify-end">
                        <Button size="sm" variant="danger" onClick={() => removePrescriptionRow(index)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Lab Tests</label>
                  <Button size="sm" variant="secondary" onClick={addLabTestRow}>
                    Add Test
                  </Button>
                </div>
                <div className="space-y-2">
                  {consultationForm.labTests.map((item, index) => (
                    <div key={`lab-${index}`} className="flex gap-2">
                      <input
                        value={item.testName}
                        onChange={(e) => handleLabTestChange(index, e.target.value)}
                        className="flex-1 border rounded px-3 py-2"
                        placeholder="Test name"
                      />
                      <Button size="sm" variant="danger" onClick={() => removeLabTestRow(index)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={consultationForm.notes}
                  onChange={(e) => setConsultationForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Additional notes"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="primary"
                onClick={handleSaveConsultation}
                disabled={savingRecord}
              >
                {savingRecord ? 'Saving...' : 'Save Consultation'}
              </Button>
              <Button
                variant="success"
                onClick={() => handleCompleteConsultation(selectedConsultation._id)}
                disabled={savingRecord}
              >
                Complete Consultation
              </Button>
              <Button
                onClick={() => setShowConsultationForm(false)}
                variant="secondary"
                disabled={savingRecord}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
