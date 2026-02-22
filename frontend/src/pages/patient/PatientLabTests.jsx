import React, { useEffect, useState } from 'react';
import { Card, Button } from '../../components/common/UI';
import { patientAPI } from '../../api/endpoints';

const PatientLabTests = () => {
  const [tests, setTests] = useState([]);
  const [expandedTest, setExpandedTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      setLoading(true);
      const res = await patientAPI.getMedicalRecords();
      const records = res.data.data || [];
      const flattened = records.flatMap((record) =>
        (record.labTests || []).map((test, idx) => ({
          _id: `${record._id}-${idx}`,
          name: test.testName || 'Lab Test',
          date: new Date(record.visitDate || record.createdAt).toISOString().split('T')[0],
          status: test.status || 'pending',
          results: test.result || 'Results not added yet',
          doctorName: record.doctorId?.userId?.name || 'Unknown',
          reportUrl: test.reportUrl,
        }))
      );

      setTests(flattened);
      setError('');
    } catch (fetchError) {
      console.error(fetchError);
      setError('Failed to load lab tests');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (test) => {
    if (test.reportUrl) {
      window.open(test.reportUrl, '_blank');
      return;
    }

    const text = [
      `Test: ${test.name}`,
      `Date: ${test.date}`,
      `Doctor: ${test.doctorName}`,
      `Status: ${test.status}`,
      `Result: ${test.results}`,
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${test.name.replace(/\s+/g, '-').toLowerCase()}-result.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = (test) => {
    const html = `
      <html><head><title>Lab Result</title></head><body>
      <h2>Lab Test Result</h2>
      <p><strong>Test:</strong> ${test.name}</p>
      <p><strong>Date:</strong> ${test.date}</p>
      <p><strong>Doctor:</strong> ${test.doctorName}</p>
      <p><strong>Status:</strong> ${test.status}</p>
      <p><strong>Result:</strong> ${test.results}</p>
      </body></html>
    `;
    const w = window.open('', '', 'width=800,height=600');
    w.document.write(html);
    w.document.close();
    w.print();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Lab Tests</h1>
      {error && <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded">{error}</div>}

      <div className="space-y-4">
        {loading ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">Loading lab tests...</p>
          </Card>
        ) : tests.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">No lab tests available</p>
          </Card>
        ) : (
          tests.map((test) => (
            <Card key={test._id} className="p-6">
              <div className="cursor-pointer" onClick={() => setExpandedTest(expandedTest === test._id ? null : test._id)}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{test.name}</h3>
                    <p className="text-sm text-gray-600">Ordered on {test.date}</p>
                    <p className="text-sm text-gray-600">by Dr. {test.doctorName}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-sm capitalize ${
                      test.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {test.status}
                  </span>
                </div>
              </div>

              {expandedTest === test._id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm">Results</h4>
                    <p className="text-gray-700">{test.results}</p>
                  </div>
                  {test.status === 'completed' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleDownload(test)}>Download</Button>
                      <Button size="sm" variant="secondary" onClick={() => handlePrint(test)}>Print</Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientLabTests;
