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

  const sortedDocuments = useMemo(() => {
    return [...documents].sort(
      (a, b) => new Date(b.uploadedAt || b.createdAt) - new Date(a.uploadedAt || a.createdAt)
    );
  }, [documents]);

  const getDocumentUrl = (doc) => {
    const filePath = doc?.fileUrl || '';
    return encodeURI(`${fileBaseUrl}${filePath}`);
  };

  const isPdfDocument = (doc) => {
    const fileUrl = String(doc?.fileUrl || '').toLowerCase();
    const fileName = String(doc?.fileName || '').toLowerCase();
    return fileUrl.includes('.pdf') || fileName.endsWith('.pdf');
  };

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
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Patient</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">File Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Uploaded</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDocuments.map((doc) => (
                  <tr key={doc._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {doc.userId?.name || 'Unknown Patient'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">{doc.fileName}</td>
                    <td className="px-4 py-3 text-sm text-blue-700 capitalize whitespace-nowrap">
                      {doc.documentType || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                      {doc.description || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(doc.uploadedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedDoc(doc);
                            setShowPreview(true);
                          }}
                          className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition text-sm"
                        >
                          <FiEye size={14} />
                          View
                        </button>
                        <a
                          href={getDocumentUrl(doc)}
                          download
                          className="inline-flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition text-sm"
                        >
                          <FiDownload size={14} />
                          Download
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
              {isPdfDocument(selectedDoc) ? (
                <object
                  data={getDocumentUrl(selectedDoc)}
                  type="application/pdf"
                  className="w-full min-h-[60vh] rounded-lg border"
                >
                  <div className="text-center py-8 px-4 text-sm text-gray-600">
                    PDF preview is unavailable in this browser.
                    <a
                      href={getDocumentUrl(selectedDoc)}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-blue-600 underline"
                    >
                      Open in new tab
                    </a>
                  </div>
                </object>
              ) : (
                <div className="text-center">
                  <img src={getDocumentUrl(selectedDoc)} alt="Document Preview" className="max-w-full max-h-[60vh] mx-auto rounded-lg" />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <a
                href={getDocumentUrl(selectedDoc)}
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
