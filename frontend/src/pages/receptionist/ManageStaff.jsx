import React, { useState, useEffect } from 'react';
import { receptionistAPI } from '../../api/endpoints';

const ManageStaff = () => {
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialization: '',
    phone: '',
    consultationFee: '',
    availability: {
      monday: { isAvailable: true, from: '09:00', to: '17:00' },
      tuesday: { isAvailable: true, from: '09:00', to: '17:00' },
      wednesday: { isAvailable: true, from: '09:00', to: '17:00' },
      thursday: { isAvailable: true, from: '09:00', to: '17:00' },
      friday: { isAvailable: true, from: '09:00', to: '17:00' },
      saturday: { isAvailable: false, from: '10:00', to: '14:00' },
      sunday: { isAvailable: false, from: '10:00', to: '14:00' },
    }
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await receptionistAPI.getDoctors();
      setDoctors(res.data.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch doctors');
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        // Update doctor
        await receptionistAPI.updateDoctor(editingDoctor._id, formData);
        setSuccess('Doctor updated successfully!');
      } else {
        // Add new doctor
        await receptionistAPI.addDoctor(formData);
        setSuccess('Doctor added successfully!');
      }
      setTimeout(() => {
        setShowModal(false);
        setEditingDoctor(null);
        setFormData({
          name: '',
          email: '',
          specialization: '',
          phone: '',
          consultationFee: '',
          availability: {
            monday: { isAvailable: true, from: '09:00', to: '17:00' },
            tuesday: { isAvailable: true, from: '09:00', to: '17:00' },
            wednesday: { isAvailable: true, from: '09:00', to: '17:00' },
            thursday: { isAvailable: true, from: '09:00', to: '17:00' },
            friday: { isAvailable: true, from: '09:00', to: '17:00' },
            saturday: { isAvailable: false, from: '10:00', to: '14:00' },
            sunday: { isAvailable: false, from: '10:00', to: '14:00' },
          }
        });
        setSuccess('');
        fetchDoctors();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save doctor');
      console.error('Error saving doctor:', err);
    }
  };

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.userId?.name || doctor.name || '',
      email: doctor.userId?.email || doctor.email || '',
      specialization: doctor.specialization || '',
      phone: doctor.userId?.phone || doctor.phone || '',
      consultationFee: doctor.consultationFee || '',
      availability: doctor.availability || formData.availability
    });
    setShowModal(true);
  };

  const handleDelete = async (doctorId) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await receptionistAPI.deleteDoctor(doctorId);
        setSuccess('Doctor deleted successfully!');
        setTimeout(() => {
          setSuccess('');
          fetchDoctors();
        }, 1500);
      } catch (err) {
        setError('Failed to delete doctor');
        console.error('Error deleting doctor:', err);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Staff</h1>
        <button
          onClick={() => { setShowModal(true); setEditingDoctor(null); }}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Add Doctor
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Specialization</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Consultation Fee</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.length > 0 ? (
              doctors.map(doctor => (
                <tr key={doctor._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{doctor.userId?.name || doctor.name || 'N/A'}</td>
                  <td className="px-6 py-4">{doctor.userId?.email || doctor.email || 'N/A'}</td>
                  <td className="px-6 py-4">{doctor.specialization || 'N/A'}</td>
                  <td className="px-6 py-4">{doctor.userId?.phone || doctor.phone || 'N/A'}</td>
                  <td className="px-6 py-4">₹{doctor.consultationFee || '0'}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => handleEdit(doctor)}
                      className="text-blue-500 hover:text-blue-700 px-3 py-1 rounded border border-blue-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(doctor._id)}
                      className="text-red-500 hover:text-red-700 px-3 py-1 rounded border border-red-500"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No doctors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-96 overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Specialization</label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Select Specialization</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="neurology">Neurology</option>
                    <option value="orthopedics">Orthopedics</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="dermatology">Dermatology</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Consultation Fee</label>
                  <input
                    type="number"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-3">Weekly Availability</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(formData.availability).map(([day, schedule]) => (
                    <div key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={schedule.isAvailable}
                        onChange={(e) => handleAvailabilityChange(day, 'isAvailable', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-semibold w-16 capitalize">{day}</span>
                      {schedule.isAvailable && (
                        <>
                          <input
                            type="time"
                            value={schedule.from}
                            onChange={(e) => handleAvailabilityChange(day, 'from', e.target.value)}
                            className="px-2 py-1 border rounded text-sm w-24"
                          />
                          <span className="text-sm">to</span>
                          <input
                            type="time"
                            value={schedule.to}
                            onChange={(e) => handleAvailabilityChange(day, 'to', e.target.value)}
                            className="px-2 py-1 border rounded text-sm w-24"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingDoctor(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editingDoctor ? 'Update' : 'Add'} Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStaff;

