import React, { useState, useEffect } from 'react';
import { receptionistAPI } from '../../api/endpoints';

const ManageServices = () => {
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: ''
  });

  const serviceCategories = [
    'Consultation',
    'Lab Test',
    'Imaging',
    'Procedure',
    'Treatment',
    'Follow-up',
    'Other'
  ];

  const defaultServices = [
    { name: 'General Consultation', category: 'Consultation', price: 300, description: 'Initial consultation with doctor' },
    { name: 'Blood Test', category: 'Lab Test', price: 500, description: 'Complete blood count and analysis' },
    { name: 'X-Ray', category: 'Imaging', price: 800, description: 'Standard X-ray imaging' },
    { name: 'Ultrasound', category: 'Imaging', price: 1000, description: 'Ultrasound examination' },
    { name: 'CT Scan', category: 'Imaging', price: 2500, description: 'Computed tomography scan' },
    { name: 'MRI Scan', category: 'Imaging', price: 3500, description: 'Magnetic resonance imaging' },
    { name: 'ECG', category: 'Lab Test', price: 400, description: 'Electrocardiogram test' },
    { name: 'Vaccination', category: 'Treatment', price: 200, description: 'Vaccination service' },
    { name: 'Dental Cleaning', category: 'Procedure', price: 600, description: 'Dental cleaning and scaling' },
    { name: 'Follow-up Consultation', category: 'Follow-up', price: 200, description: 'Follow-up consultation' }
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await receptionistAPI.getServices();
      setServices(res.data.data || []);
      setError('');
    } catch (err) {
      setError('Using fallback local services. API unavailable.');
      setServices(defaultServices);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await receptionistAPI.updateService(editingService._id, formData);
        setSuccess('Service updated successfully!');
      } else {
        await receptionistAPI.addService(formData);
        setSuccess('Service added successfully!');
      }
      setTimeout(() => {
        setShowModal(false);
        setEditingService(null);
        setFormData({
          name: '',
          description: '',
          price: '',
          category: ''
        });
        setSuccess('');
        fetchServices();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save service');
      console.error('Error saving service:', err);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      price: service.price || '',
      category: service.category || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        // If this is fallback local data (no DB id), remove locally.
        if (!String(serviceId).match(/^[a-fA-F0-9]{24}$/)) {
          setServices((prev) => prev.filter((service) => (service._id || service.name) !== serviceId));
          setSuccess('Service removed locally');
          return;
        }

        await receptionistAPI.deleteService(serviceId);
        setSuccess('Service deleted successfully!');
        setTimeout(() => {
          setSuccess('');
          fetchServices();
        }, 1500);
      } catch (err) {
        setError('Failed to delete service');
        console.error('Error deleting service:', err);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Services</h1>
        <button
          onClick={() => { setShowModal(true); setEditingService(null); setFormData({ name: '', description: '', price: '', category: '' }); }}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Add Service
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
              <th className="px-6 py-3 text-left text-sm font-semibold">Service Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Description</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.length > 0 ? (
              services.map(service => (
                <tr key={service._id || service.name} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{service.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {service.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold">₹{service.price}</td>
                  <td className="px-6 py-4 text-gray-600">{service.description || '-'}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-blue-500 hover:text-blue-700 px-3 py-1 rounded border border-blue-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service._id || service.name)}
                      className="text-red-500 hover:text-red-700 px-3 py-1 rounded border border-red-500"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No services found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Service Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Blood Test"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {serviceCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                  placeholder="Enter price"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                  placeholder="Enter service description"
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingService(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editingService ? 'Update' : 'Add'} Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageServices;
