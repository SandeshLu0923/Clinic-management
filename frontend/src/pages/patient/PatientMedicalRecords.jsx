import React, { useEffect, useState } from 'react';
import { Card, Button } from '../../components/common/UI';
import { patientAPI } from '../../api/endpoints';

const PatientMedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await patientAPI.getMedicalRecords();
      setRecords(res.data.data || []);
      setError('');
    } catch (fetchError) {
      console.error(fetchError);
      setError('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (record) => {
    const text = [
      `Visit Date: ${new Date(record.visitDate || record.createdAt).toLocaleDateString()}`,
      `Doctor: ${record.doctorId?.userId?.name || 'Unknown'}`,
      `Diagnosis: ${record.diagnosis || 'N/A'}`,
      `Notes: ${record.notes || 'N/A'}`,
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-record-${record._id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = (record) => {
    const html = `
      <html><head><title>Medical Record</title></head><body>
      <h2>Medical Record</h2>
      <p><strong>Date:</strong> ${new Date(record.visitDate || record.createdAt).toLocaleDateString()}</p>
      <p><strong>Doctor:</strong> ${record.doctorId?.userId?.name || 'Unknown'}</p>
      <p><strong>Diagnosis:</strong> ${record.diagnosis || 'N/A'}</p>
      <p><strong>Notes:</strong> ${record.notes || 'N/A'}</p>
      </body></html>
    `;
    const w = window.open('', '', 'width=800,height=600');
    w.document.write(html);
    w.document.close();
    w.print();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Medical Records</h1>
      {error && <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded">{error}</div>}

      <div className="space-y-4">
        {loading ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">Loading records...</p>
          </Card>
        ) : records.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">No medical records available</p>
          </Card>
        ) : (
          records.map((record) => (
            <Card key={record._id} className="p-6">
              <div className="cursor-pointer" onClick={() => setExpandedRecord(expandedRecord === record._id ? null : record._id)}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Dr. {record.doctorId?.userId?.name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-600">{new Date(record.visitDate || record.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm font-medium text-gray-700 mt-2">Diagnosis: {record.diagnosis || 'N/A'}</p>
                  </div>
                  <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-800">Completed</span>
                </div>
              </div>

              {expandedRecord === record._id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm">Prescription</h4>
                    <p className="text-gray-700">
                      {(record.prescription || []).length > 0
                        ? record.prescription.map((p) => p.medicineName).filter(Boolean).join(', ')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Notes</h4>
                    <p className="text-gray-700">{record.notes || 'N/A'}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="secondary" onClick={() => handleDownload(record)}>Download</Button>
                    <Button size="sm" variant="secondary" onClick={() => handlePrint(record)}>Print</Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientMedicalRecords;
