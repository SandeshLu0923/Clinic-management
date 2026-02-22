import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Alert } from '../../components/common/UI';
import { patientAPI } from '../../api/endpoints';

const toDisplaySpecialization = (value) => String(value || 'general').replace(/_/g, ' ');
const formatCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

const PatientBookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [viewDoctor, setViewDoctor] = useState(null);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [medicalRecordConsent, setMedicalRecordConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (bookingDoctor && selectedDoctor?._id && selectedDate) {
      fetchAvailableSlots(selectedDoctor._id, selectedDate);
    } else {
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  }, [bookingDoctor, selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await patientAPI.getDoctors();
      setDoctors(res.data.data || []);
      setError('');
    } catch (fetchError) {
      console.error(fetchError);
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    try {
      const res = await patientAPI.getAvailableSlots({ doctorId, date });
      setAvailableSlots(Array.isArray(res.data.data) ? res.data.data : []);
      setSelectedSlot(null);
    } catch (slotError) {
      console.error(slotError);
      setError('Failed to load available slots');
      setAvailableSlots([]);
    }
  };

  const selectableSlots = useMemo(() => availableSlots.filter((slot) => slot.available), [availableSlots]);

  const openBookModal = (doctor) => {
    setBookingDoctor(doctor);
    setSelectedDoctor(doctor);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedSlot(null);
    setReason('');
    setMedicalRecordConsent(true);
    setError('');
  };

  const handleDoctorChangeForBooking = (doctorId) => {
    const doctor = doctors.find((entry) => entry._id === doctorId) || null;
    setSelectedDoctor(doctor);
    setBookingDoctor(doctor);
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedSlot || !reason.trim()) {
      setError('Select doctor, date, slot and reason');
      return;
    }

    try {
      setLoading(true);
      await patientAPI.bookAppointment({
        doctorId: selectedDoctor._id,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: reason.trim(),
        medicalRecordConsent,
      });

      setSuccess('Appointment booked successfully');
      setBookingDoctor(null);
      setSelectedDoctor(null);
      setReason('');
      setSelectedSlot(null);
    } catch (bookError) {
      console.error(bookError);
      setError(bookError.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Book Appointment</h1>

      {success && <Alert type="success" message={success} />}
      {error && <Alert type="error" message={error} />}

      <div>
        <h2 className="text-xl font-bold mb-4">Available Doctors</h2>
        <div className="space-y-3">
          {loading && doctors.length === 0 ? (
            <p>Loading doctors...</p>
          ) : doctors.length === 0 ? (
            <Card className="p-4">No doctors available right now.</Card>
          ) : (
            doctors.map((doctor) => (
              <Card key={doctor._id} className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Dr. {doctor.userId?.name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-600 capitalize">{toDisplaySpecialization(doctor.specialization)}</p>
                    <p className="text-sm text-gray-600">Rating: {Number(doctor.rating || 0).toFixed(1)} / 5</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setViewDoctor(doctor)}>
                      View
                    </Button>
                    <Button size="sm" onClick={() => openBookModal(doctor)}>
                      Book Appointment
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {viewDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Doctor Details</h2>
              <button type="button" onClick={() => setViewDoctor(null)} className="text-gray-600 text-xl">X</button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Name:</strong> Dr. {viewDoctor.userId?.name || 'Unknown'}</div>
              <div><strong>Specialization:</strong> {toDisplaySpecialization(viewDoctor.specialization)}</div>
              <div><strong>Experience:</strong> {Number(viewDoctor.experience || 0)} years</div>
              <div><strong>License:</strong> {viewDoctor.licenseNumber || 'N/A'}</div>
              <div><strong>Rating:</strong> {Number(viewDoctor.rating || 0).toFixed(1)} / 5</div>
              <div><strong>Patients Consulted:</strong> {Number(viewDoctor.totalConsultations || 0)}</div>
              <div><strong>Consultation Fee:</strong> {formatCurrency(viewDoctor.consultationFee || 0)}</div>
              <div><strong>Email:</strong> {viewDoctor.userId?.email || 'N/A'}</div>
              <div className="md:col-span-2"><strong>Phone:</strong> {viewDoctor.userId?.phone || 'N/A'}</div>
              <div className="md:col-span-2">
                <strong>Qualifications:</strong>{' '}
                {(viewDoctor.qualifications || []).length
                  ? viewDoctor.qualifications
                    .map((q) => `${q.degree || ''}${q.institution ? ` (${q.institution})` : ''}${q.year ? ` - ${q.year}` : ''}`)
                    .join(', ')
                  : 'N/A'}
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <Button className="flex-1" onClick={() => { setViewDoctor(null); openBookModal(viewDoctor); }}>
                Book Appointment
              </Button>
              <Button className="flex-1" variant="secondary" onClick={() => setViewDoctor(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {bookingDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Book Appointment</h2>
              <button type="button" onClick={() => { setBookingDoctor(null); setSelectedDoctor(null); }} className="text-gray-600 text-xl">X</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Doctor</label>
                <select
                  value={selectedDoctor?._id || ''}
                  onChange={(e) => handleDoctorChangeForBooking(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.userId?.name || 'Unknown'} - {toDisplaySpecialization(doctor.specialization)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Appointment Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Available Time Slots</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectableSlots.length > 0 ? (
                    selectableSlots.map((slot) => {
                      const label = `${slot.startTime} - ${slot.endTime}`;
                      return (
                        <Button
                          key={label}
                          onClick={() => setSelectedSlot(slot)}
                          variant={selectedSlot?.startTime === slot.startTime ? 'primary' : 'secondary'}
                          className="text-sm"
                        >
                          {label}
                        </Button>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 col-span-2">No available slots for selected date.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows="3"
                  placeholder="Describe your symptoms or reason for visit"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={medicalRecordConsent}
                  onChange={(e) => setMedicalRecordConsent(e.target.checked)}
                />
                I consent to doctor viewing my medical records for this appointment
              </label>
            </div>
            <div className="p-5 border-t flex gap-3">
              <Button onClick={handleBookAppointment} disabled={loading || !selectedDoctor || !selectedSlot || !reason.trim()} className="flex-1">
                {loading ? 'Booking...' : 'Book Appointment'}
              </Button>
              <Button variant="secondary" onClick={() => { setBookingDoctor(null); setSelectedDoctor(null); }} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientBookAppointment;
