import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../api/endpoints';
import { FiArrowLeft } from 'react-icons/fi';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        const { data } = response.data;
        
        // Get role from user data
        const userRole = data.role;
        setRole(userRole);
        
        // Prepare form data based on role
        const initialData = {
          // User fields
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
        };

        if (userRole === 'patient' && data.patient) {
          initialData.dateOfBirth = data.patient.dateOfBirth ? data.patient.dateOfBirth.split('T')[0] : '';
          initialData.gender = data.patient.gender || '';
          initialData.street = data.patient.address?.street || '';
          initialData.city = data.patient.address?.city || '';
          initialData.state = data.patient.address?.state || '';
          initialData.zipCode = data.patient.address?.zipCode || '';
          initialData.country = data.patient.address?.country || '';
          initialData.medicalHistory = data.patient.medicalHistory?.join(', ') || '';
          initialData.allergies = data.patient.allergies?.join(', ') || '';
          initialData.emergencyContactName = data.patient.emergencyContact?.name || '';
          initialData.emergencyContactPhone = data.patient.emergencyContact?.phone || '';
          initialData.emergencyContactRelation = data.patient.emergencyContact?.relation || '';
        } else if (userRole === 'doctor' && data.doctor) {
          initialData.specialization = data.doctor.specialization || '';
          initialData.licenseNumber = data.doctor.licenseNumber || '';
          initialData.experience = data.doctor.experience || '';
          initialData.consultationFee = data.doctor.consultationFee || '';
          initialData.qualifications = data.doctor.qualifications?.map(q => `${q.degree} from ${q.institution} (${q.year})`).join('; ') || '';
        }

        setFormData(initialData);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    try {
      const dataToSubmit = { ...formData };
      await authAPI.updateProfile(dataToSubmit);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-200 rounded-lg transition"
        >
          <FiArrowLeft className="text-2xl" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Information</h1>
          <p className="text-gray-600">Update your profile details</p>
        </div>
      </div>

      {/* Messages */}
      {saved && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          Profile updated successfully!
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Basic Information Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        {/* Patient-Specific Information */}
        {role === 'patient' && (
          <>
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                  <input
                    type="text"
                    name="emergencyContactRelation"
                    value={formData.emergencyContactRelation}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Medical History & Allergies Section */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medical History</label>
                  <textarea
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleChange}
                    placeholder="Separate multiple conditions with commas (e.g., Diabetes, Hypertension, Asthma)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                  <p className="text-xs text-gray-500 mt-1">List any previous medical conditions or surgeries</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                  <textarea
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="Separate multiple allergies with commas (e.g., Penicillin, Peanuts, Shellfish)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                  <p className="text-xs text-gray-500 mt-1">List any known allergies (medications, food, etc.)</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Doctor-Specific Information */}
        {role === 'doctor' && (
          <>
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Specialization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Specialization</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="General">General</option>
                  </select>
                </div>

                {/* License Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Consultation Fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee</label>
                  <input
                    type="number"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Qualifications Section */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Qualifications</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Educational Qualifications</label>
                <textarea
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleChange}
                  placeholder="Example: MD from Harvard Medical School (2015); BS in Biology from MIT (2011)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                />
                <p className="text-xs text-gray-500 mt-1">Enter qualifications in format: Degree from Institution (Year). Separate multiple entries with semicolon.</p>
              </div>
            </div>
          </>
        )}

        {/* Submit Button */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
