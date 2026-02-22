import React, { useState, useEffect, useMemo } from 'react';
import { medicalDocumentAPI } from '../../api/endpoints';
import { FiUpload, FiTrash2, FiList, FiUsers } from 'react-icons/fi';

const PatientMedicalDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [uploadData, setUploadData] = useState({
    file: null,
    documentType: 'Report',
    description: '',
  });

  useEffect(() => {
    fetchDocuments();
    fetchAvailableDoctors();
  }, []);

  const fileBaseUrl = useMemo(() => {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const root = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
    if (root.startsWith('http://') || root.startsWith('https://')) {
      return root.replace(/\/$/, '');
    }
    const normalized = root.startsWith('/') ? root : `/${root}`;
    return `${window.location.origin}${normalized}`.replace(/\/$/, '');
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await medicalDocumentAPI.getPatientDocuments();
      setDocuments(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch documents');
      console.error('Fetch documents error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDoctors = async () => {
    try {
      const response = await medicalDocumentAPI.getAvailableDoctors();
      setDoctors(response.data.data);
    } catch (err) {
      console.error('Fetch doctors error:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setUploadData({ ...uploadData, file });
      setError('');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!uploadData.file) {
      setError('Please select a file');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('documentType', uploadData.documentType);
      formData.append('description', uploadData.description);

      const response = await medicalDocumentAPI.uploadDocument(formData);

      setSuccess('Document uploaded successfully!');
      setShowUploadModal(false);
      setUploadData({ file: null, documentType: 'Report', description: '' });

      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';

      // Refresh documents
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setLoading(true);
      await medicalDocumentAPI.deleteDocument(documentId);
      setSuccess('Document deleted successfully!');
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    if (selectedDoctors.length === 0) {
      setError('Please select at least one doctor');
      return;
    }

    try {
      setLoading(true);
      await medicalDocumentAPI.grantDoctorAccess(selectedDocId, selectedDoctors);
      setSuccess('Access granted successfully!');
      setShowAccessModal(false);
      setSelectedDoctors([]);
      setSelectedDocId(null);
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to grant access');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (documentId, doctorId) => {
    if (!window.confirm('Are you sure you want to revoke this doctor\'s access?')) {
      return;
    }

    try {
      setLoading(true);
      await medicalDocumentAPI.revokeDoctorAccess(documentId, doctorId);
      setSuccess('Access revoked successfully!');
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke access');
    } finally {
      setLoading(false);
    }
  };

  const openAccessModal = (docId) => {
    setSelectedDocId(docId);
    setSelectedDoctors([]);
    setShowAccessModal(true);
  };

  const handleDoctorToggle = (doctorId) => {
    if (selectedDoctors.includes(doctorId)) {
      setSelectedDoctors(selectedDoctors.filter((id) => id !== doctorId));
    } else {
      setSelectedDoctors([...selectedDoctors, doctorId]);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FiList className="text-blue-600" />
            Medical Documents
          </h1>
          <p className="text-gray-600 mt-2">
            Upload and manage your medical documents with controlled access for doctors
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          <FiUpload />
          Upload Document
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError('')}
            className="ml-4 text-red-700 hover:text-red-900"
          >
            X
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
          <button
            type="button"
            aria-label="Dismiss success message"
            onClick={() => setSuccess('')}
            className="ml-4 text-green-700 hover:text-green-900"
          >
            X
          </button>
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        {loading && documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="animate-pulse">Loading...</div>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <FiList className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">No documents uploaded yet</p>
            <p className="text-gray-500">Upload your first medical document to get started</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc._id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Document Info */}
                <div className="col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900">{doc.fileName}</h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Type:</span> {doc.documentType}
                    </p>
                    {doc.description && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Description:</span> {doc.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Uploaded:</span> {formatDate(doc.uploadedAt)}
                    </p>
                  </div>

                  {/* Doctor Access List */}
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Doctors with Access ({doc.grantedDoctorIds.length})
                    </p>
                    {doc.grantedDoctorIds.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">
                        No doctors have access yet
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {doc.grantedDoctorIds.map((doctor) => (
                          <div
                            key={doctor._id}
                            className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            <span>Dr. {doctor.name}</span>
                            <button
                              type="button"
                              aria-label={`Revoke access for Dr. ${doctor.name}`}
                              onClick={() => handleRevokeAccess(doc._id, doctor._id)}
                              className="text-blue-800 hover:text-blue-950 font-bold"
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 justify-start">
                  <button
                    onClick={() => openAccessModal(doc._id)}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                  >
                    <FiUsers size={16} />
                    Share with Doctor
                  </button>
                  <a
                    href={`${fileBaseUrl}${doc.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDeleteDocument(doc._id)}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                  >
                    <FiTrash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Document</h2>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Max 10MB. Allowed: PDF, Images, Documents
                </p>
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={uploadData.documentType}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, documentType: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>Report</option>
                  <option>Lab Test</option>
                  <option>Prescription</option>
                  <option>Medical History</option>
                  <option>X-Ray</option>
                  <option>Scan</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, description: e.target.value })
                  }
                  placeholder="Add any additional information about this document"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
                >
                  {loading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Modal */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Grant Doctor Access</h2>

            <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
              {doctors.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No doctors available</p>
              ) : (
                doctors.map((doctor) => (
                  <label
                    key={doctor._id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDoctors.includes(doctor._id)}
                      onChange={() => handleDoctorToggle(doctor._id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Dr. {doctor.name}</p>
                      <p className="text-sm text-gray-500">{doctor.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleGrantAccess}
                disabled={loading || selectedDoctors.length === 0}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-green-400"
              >
                {loading ? 'Granting...' : 'Grant Access'}
              </button>
              <button
                onClick={() => setShowAccessModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientMedicalDocuments;

