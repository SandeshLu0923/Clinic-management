import React, { useEffect, useMemo, useState } from 'react';
import { medicalDocumentAPI } from '../../api/endpoints';
import { FiDownload, FiEye, FiFileText } from 'react-icons/fi';

const DoctorMedicalDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchAccessibleDocuments();
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

  const fetchAccessibleDocuments = async () => {
    try {
      setLoading(true);
      const response = await medicalDocumentAPI.getDoctorAccessibleDocuments();
      setDocuments(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch documents');
      console.error('Fetch documents error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const groupedByPatient = useMemo(() => {
    const grouped = {};
    documents.forEach((doc) => {
      const patientName = doc.userId?.name || 'Unknown Patient';
      if (!grouped[patientName]) grouped[patientName] = [];
      grouped[patientName].push(doc);
    });
    return grouped;
  }, [documents]);

  const closePreview = () => {
    setShowPreview(false);
    setSelectedDoc(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FiFileText className="text-blue-600" />
          Patient Medical Documents
        </h1>
        <p className="text-gray-600 mt-2">View medical documents that patients have shared with you</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-4 text-red-700 hover:text-red-900 font-bold">
            X
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <FiFileText className="mx-auto text-4xl text-gray-300 mb-4" />
          <p className="text-gray-600 text-lg">No shared documents yet</p>
          <p className="text-gray-500">Patients will share their medical documents with you here</p>
        </div>
      ) : (
        Object.entries(groupedByPatient).map(([patientName, patientDocs]) => (
          <div key={patientName} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">{patientName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patientDocs.map((doc) => (
                <div key={doc._id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{doc.fileName}</h3>
                      <p className="text-sm font-medium text-blue-600">{doc.documentType}</p>
                    </div>
                  </div>

                  {doc.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>}
                  <div className="text-xs text-gray-500 mb-4">
                    <p>Uploaded: {formatDate(doc.uploadedAt)}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedDoc(doc);
                        setShowPreview(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      <FiEye size={16} />
                      View
                    </button>
                    <a
                      href={`${fileBaseUrl}${doc.fileUrl}`}
                      download
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                    >
                      <FiDownload size={16} />
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {showPreview && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedDoc.fileName}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedDoc.documentType} - Uploaded {formatDate(selectedDoc.uploadedAt)}
                </p>
              </div>
              <button onClick={closePreview} className="text-2xl text-gray-500 hover:text-gray-700">
                X
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {selectedDoc.fileUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={`${fileBaseUrl}${selectedDoc.fileUrl}`} className="w-full h-full rounded-lg" title="PDF Preview" />
              ) : (
                <div className="text-center">
                  <img src={`${fileBaseUrl}${selectedDoc.fileUrl}`} alt="Document Preview" className="max-w-full max-h-full mx-auto rounded-lg" />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <a
                href={`${fileBaseUrl}${selectedDoc.fileUrl}`}
                download
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <FiDownload />
                Download
              </a>
              <button onClick={closePreview} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorMedicalDocuments;
