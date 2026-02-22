import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Loading } from '../../components/common/UI';
import { patientAPI } from '../../api/endpoints';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiHeart } from 'react-icons/fi';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [vitals, setVitals] = useState(() => {
    const saved = localStorage.getItem('patient_vitals');
    return saved
      ? JSON.parse(saved)
      : {
          heartRate: 72,
          bloodPressure: '120/80',
          temperature: 98.6,
          weight: 70,
        };
  });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const formatStatus = (status) => String(status || '').replace('-', ' ');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, doctorsRes] = await Promise.all([
        patientAPI.getAppointments(),
        patientAPI.getDoctors(),
      ]);
      setAppointments(appointmentsRes.data.data || []);
      setDoctors(doctorsRes.data.data || []);
      setError('');
    } catch (fetchError) {
      console.error(fetchError);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const pendingAppointments = useMemo(
    () => appointments.filter((apt) => ['pending', 'scheduled', 'confirmed', 'accepted'].includes(apt.status)),
    [appointments]
  );

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Cancel this appointment?')) return;

    try {
      await patientAPI.cancelAppointment(appointmentId);
      setSuccess('Appointment cancelled successfully');
      fetchData();
    } catch (cancelError) {
      console.error(cancelError);
      setError(cancelError.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const handleUpdateVitals = () => {
    const heartRate = Number(window.prompt('Heart Rate (bpm):', vitals.heartRate));
    const bloodPressure = window.prompt('Blood Pressure (e.g. 120/80):', vitals.bloodPressure);
    const temperature = Number(window.prompt('Temperature (F):', vitals.temperature));
    const weight = Number(window.prompt('Weight (kg):', vitals.weight));

    if (!heartRate || !bloodPressure || !temperature || !weight) {
      setError('Vitals update cancelled or invalid values');
      return;
    }

    const nextVitals = { heartRate, bloodPressure, temperature, weight };
    setVitals(nextVitals);
    localStorage.setItem('patient_vitals', JSON.stringify(nextVitals));
    setSuccess('Vitals updated locally');
  };

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Vitals</h2>
            <FiHeart className="text-red-500" size={28} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-600 font-medium uppercase mb-1">Heart Rate</p>
              <p className="text-2xl font-bold text-blue-600">{vitals.heartRate}</p>
              <p className="text-xs text-gray-500 mt-1">bpm</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-600 font-medium uppercase mb-1">Blood Pressure</p>
              <p className="text-2xl font-bold text-blue-600">{vitals.bloodPressure}</p>
              <p className="text-xs text-gray-500 mt-1">mmHg</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-600 font-medium uppercase mb-1">Temperature</p>
              <p className="text-2xl font-bold text-green-600">{vitals.temperature}</p>
              <p className="text-xs text-gray-500 mt-1">F</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-600 font-medium uppercase mb-1">Weight</p>
              <p className="text-2xl font-bold text-purple-600">{vitals.weight}</p>
              <p className="text-xs text-gray-500 mt-1">kg</p>
            </div>
          </div>
          <Button className="w-full mt-4" onClick={handleUpdateVitals}>Update Vitals</Button>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Pending Appointments</h2>
            <FiCalendar className="text-amber-500" size={28} />
          </div>

          {pendingAppointments.length > 0 ? (
            <div className="space-y-3">
              {pendingAppointments.slice(0, 3).map((apt) => (
                <div key={apt._id} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-amber-500">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-900">Dr. {apt.doctorId?.userId?.name || 'Unknown'}</p>
                    <span className="text-xs font-bold bg-amber-200 text-amber-800 px-2 py-1 rounded capitalize">{formatStatus(apt.status)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Date: {new Date(apt.appointmentDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">Time: {apt.startTime}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <FiCalendar className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-gray-600 font-medium">No pending appointments</p>
            </div>
          )}
          <Button className="w-full mt-4" onClick={() => navigate('/patient/book-appointment')}>
            Book New Appointment
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-2">
          <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Doctor</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-gray-500">No appointments found.</td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr key={apt._id} className="border-b">
                      <td className="px-4 py-2">Dr. {apt.doctorId?.userId?.name || 'Unknown'}</td>
                      <td className="px-4 py-2">{new Date(apt.appointmentDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{apt.startTime}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-sm capitalize ${
                            apt.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : apt.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : apt.status === 'in-consultation'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {formatStatus(apt.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {(apt.status === 'scheduled' || apt.status === 'confirmed' || apt.status === 'accepted') ? (
                          <Button size="sm" variant="danger" onClick={() => handleCancelAppointment(apt._id)}>
                            Cancel
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-500">No action</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="col-span-2">
          <h2 className="text-xl font-semibold mb-4">Available Doctors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.slice(0, 4).map((doctor) => (
              <Card key={doctor._id} className="bg-blue-50">
                <h3 className="font-semibold">Dr. {doctor.userId?.name || 'Unknown'}</h3>
                <p className="text-sm text-gray-600">{doctor.specialization || 'General'}</p>
                <p className="text-sm text-gray-600">INR {Number(doctor.consultationFee || 0).toLocaleString('en-IN')}</p>
                <Button size="sm" className="mt-3 w-full" onClick={() => navigate('/patient/book-appointment')}>
                  Book Appointment
                </Button>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboard;
