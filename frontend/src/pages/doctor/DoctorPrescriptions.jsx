import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Loading } from '../../components/common/UI';
import { doctorAPI } from '../../api/endpoints';
import { FiEye, FiEdit2, FiMoreVertical } from 'react-icons/fi';

const defaultPrescriptionRow = () => ({
  medicineName: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
});

const DoctorPrescriptions = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [openMenuRecordId, setOpenMenuRecordId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    diagnosis: '',
    symptoms: '',
    notes: '',
    prescription: [defaultPrescriptionRow()],
  });

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const patientsRes = await doctorAPI.getPatients();
      const patients = patientsRes.data.data || [];

      const results = await Promise.all(
        patients.map(async (patient) => {
          try {
            const recordsRes = await doctorAPI.getMedicalRecords(patient._id);
            const patientRecords = recordsRes.data.data || [];
            return patientRecords.map((record) => ({
              ...record,
              patientName: patient.name || 'Unknown',
            }));
          } catch (fetchError) {
            return [];
          }
        })
      );

      const flattened = results.flat().sort((a, b) => new Date(b.visitDate || b.createdAt) - new Date(a.visitDate || a.createdAt));
      setRecords(flattened);
      setError('');
    } catch (fetchError) {
      console.error(fetchError);
      setError('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const normalizedRecords = useMemo(() => {
    return records.map((record) => {
      const labTests = record.labTests || [];
      const pendingLabTests = labTests.filter((test) => test.status === 'pending').length;
      const allTestsCompleted = labTests.length > 0 && pendingLabTests === 0;

      let status = 'active';
      if (labTests.length > 0 && allTestsCompleted) status = 'tests-complete';
      if ((record.prescription || []).length === 0 && labTests.length > 0) status = 'tests-only';

      return {
        ...record,
        computedStatus: status,
      };
    });
  }, [records]);

  const filteredRecords = useMemo(() => {
    return normalizedRecords.filter((record) => {
      const patientMatch = (record.patientName || '').toLowerCase().includes(search.toLowerCase());
      const diagnosisMatch = (record.diagnosis || '').toLowerCase().includes(search.toLowerCase());
      const statusMatch = statusFilter === 'all' || record.computedStatus === statusFilter;
      return (patientMatch || diagnosisMatch) && statusMatch;
    });
  }, [normalizedRecords, search, statusFilter]);

  const statusBadgeClass = (status) => {
    if (status === 'tests-complete') return 'bg-green-100 text-green-800';
    if (status === 'tests-only') return 'bg-purple-100 text-purple-800';
    return 'bg-blue-100 text-blue-800';
  };

  const statusLabel = (status) => {
    if (status === 'tests-complete') return 'tests complete';
    if (status === 'tests-only') return 'tests only';
    return 'active';
  };

  const openEditModal = (record) => {
    setOpenMenuRecordId(null);
    setEditingRecord(record);
    setEditForm({
      diagnosis: record.diagnosis || '',
      symptoms: (record.symptoms || []).join(', '),
      notes: record.notes || '',
      prescription: (record.prescription && record.prescription.length > 0)
        ? record.prescription.map((item) => ({
          medicineName: item.medicineName || '',
          dosage: item.dosage || '',
          frequency: item.frequency || '',
          duration: item.duration || '',
          instructions: item.instructions || '',
        }))
        : [defaultPrescriptionRow()],
    });
    setShowEditModal(true);
  };

  const openViewModal = (record) => {
    setOpenMenuRecordId(null);
    setViewingRecord(record);
    setShowViewModal(true);
  };

  const updatePrescriptionRow = (index, field, value) => {
    setEditForm((prev) => {
      const next = [...prev.prescription];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, prescription: next };
    });
  };

  const addPrescriptionRow = () => {
    setEditForm((prev) => ({
      ...prev,
      prescription: [...prev.prescription, defaultPrescriptionRow()],
    }));
  };

  const removePrescriptionRow = (index) => {
    setEditForm((prev) => ({
      ...prev,
      prescription: prev.prescription.length > 1
        ? prev.prescription.filter((_, i) => i !== index)
        : prev.prescription,
    }));
  };

  const handleSavePrescriptionEdit = async () => {
    if (!editingRecord?._id) return;
    try {
      setSavingEdit(true);
      const symptoms = String(editForm.symptoms || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      const prescription = editForm.prescription
        .map((item) => ({
          medicineName: item.medicineName?.trim(),
          dosage: item.dosage?.trim(),
          frequency: item.frequency?.trim(),
          duration: item.duration?.trim(),
          instructions: item.instructions?.trim(),
        }))
        .filter((item) => item.medicineName);

      await doctorAPI.updateMedicalRecord(editingRecord._id, {
        diagnosis: editForm.diagnosis,
        symptoms,
        notes: editForm.notes,
        prescription,
        labTests: editingRecord.labTests || [],
        vitals: editingRecord.vitals || {},
        followUpDate: editingRecord.followUpDate || null,
      });

      setSuccess('Prescription updated successfully');
      setShowEditModal(false);
      setEditingRecord(null);
      await fetchPrescriptions();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.response?.data?.message || 'Failed to update prescription');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <h1 className="text-3xl font-bold">Prescriptions & Lab Tests</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchPrescriptions}>Refresh</Button>
          <Button onClick={() => navigate('/doctor/dashboard')}>Open Consultation Workspace</Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
          <span>{error}</span>
          <button type="button" aria-label="Dismiss error" onClick={() => setError('')} className="font-bold">X</button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded flex justify-between items-center">
          <span>{success}</span>
          <button type="button" aria-label="Dismiss success" onClick={() => setSuccess('')} className="font-bold">X</button>
        </div>
      )}

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient or diagnosis..."
            className="w-full border rounded px-3 py-2"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="tests-complete">Tests complete</option>
            <option value="tests-only">Tests only</option>
          </select>
          <div className="text-sm text-gray-600 flex items-center justify-start md:justify-end">
            Showing {filteredRecords.length} record(s)
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <Card className="text-center py-8 text-gray-500">
            <p>No prescriptions found.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Patient</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Visit Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Diagnosis</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Lab Tests</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record._id} className="border-b hover:bg-gray-50 align-top">
                      <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">{record.patientName}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {new Date(record.visitDate || record.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate">
                        {record.diagnosis || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs">
                        {(record.labTests || []).length > 0 ? (
                          <div className="space-y-1">
                            {(record.labTests || []).slice(0, 2).map((test, idx) => (
                              <div key={`${record._id}-lab-${idx}`} className="truncate capitalize">
                                {test.testName || 'Test'}{test.status ? ` - ${test.status}` : ''}
                              </div>
                            ))}
                            {(record.labTests || []).length > 2 && (
                              <div className="text-gray-500">+{(record.labTests || []).length - 2} more</div>
                            )}
                          </div>
                        ) : (
                          'No lab tests'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-3 py-1 rounded text-xs font-semibold capitalize whitespace-nowrap ${statusBadgeClass(record.computedStatus)}`}>
                          {statusLabel(record.computedStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() => setOpenMenuRecordId(openMenuRecordId === record._id ? null : record._id)}
                            className="p-2 rounded hover:bg-gray-200"
                            aria-label="Open prescription actions"
                          >
                            <FiMoreVertical />
                          </button>
                          {openMenuRecordId === record._id && (
                            <div className="absolute right-0 mt-1 w-28 bg-white border rounded shadow z-10">
                              <button
                                type="button"
                                onClick={() => openViewModal(record)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 inline-flex items-center gap-2"
                              >
                                <FiEye size={14} />
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(record)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 inline-flex items-center gap-2"
                              >
                                <FiEdit2 size={14} />
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {showViewModal && viewingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Prescription Details - {viewingRecord.patientName}</h2>
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  setViewingRecord(null);
                }}
                className="text-gray-600 text-xl"
              >
                X
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div><span className="font-semibold">Visit Date:</span> {new Date(viewingRecord.visitDate || viewingRecord.createdAt).toLocaleDateString()}</div>
              <div><span className="font-semibold">Status:</span> {statusLabel(viewingRecord.computedStatus)}</div>
              <div><span className="font-semibold">Diagnosis:</span> {viewingRecord.diagnosis || 'N/A'}</div>
              <div>
                <span className="font-semibold">Symptoms:</span>{' '}
                {(viewingRecord.symptoms || []).length > 0 ? (viewingRecord.symptoms || []).join(', ') : 'N/A'}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Medications</h3>
                {(viewingRecord.prescription || []).length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {(viewingRecord.prescription || []).map((med, idx) => (
                      <li key={`view-med-${idx}`}>
                        {med.medicineName || 'Medicine'}
                        {med.dosage ? ` - ${med.dosage}` : ''}
                        {med.frequency ? ` (${med.frequency})` : ''}
                        {med.duration ? ` for ${med.duration}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No medications</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Lab Tests</h3>
                {(viewingRecord.labTests || []).length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {(viewingRecord.labTests || []).map((test, idx) => (
                      <li key={`view-lab-${idx}`} className="capitalize">
                        {test.testName || 'Test'}{test.status ? ` - ${test.status}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No lab tests</p>
                )}
              </div>

              <div><span className="font-semibold">Notes:</span> {viewingRecord.notes || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Prescription - {editingRecord.patientName || 'Patient'}</h2>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-gray-600 text-xl">X</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Diagnosis</label>
                <textarea
                  value={editForm.diagnosis}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
                  rows={2}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Symptoms</label>
                <textarea
                  value={editForm.symptoms}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, symptoms: e.target.value }))}
                  rows={2}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Comma separated symptoms"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Prescription</label>
                  <Button size="sm" variant="secondary" onClick={addPrescriptionRow}>Add Medicine</Button>
                </div>
                <div className="space-y-3">
                  {editForm.prescription.map((item, index) => (
                    <div key={`edit-rx-${index}`} className="border rounded p-3 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input value={item.medicineName} onChange={(e) => updatePrescriptionRow(index, 'medicineName', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Medicine name" />
                        <input value={item.dosage} onChange={(e) => updatePrescriptionRow(index, 'dosage', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Dosage" />
                        <input value={item.frequency} onChange={(e) => updatePrescriptionRow(index, 'frequency', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Frequency" />
                        <input value={item.duration} onChange={(e) => updatePrescriptionRow(index, 'duration', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Duration" />
                      </div>
                      <textarea value={item.instructions} onChange={(e) => updatePrescriptionRow(index, 'instructions', e.target.value)} rows={2} className="w-full border rounded px-3 py-2" placeholder="Instructions" />
                      <div className="flex justify-end">
                        <Button size="sm" variant="danger" onClick={() => removePrescriptionRow(index)}>Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSavePrescriptionEdit} disabled={savingEdit}>
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={savingEdit}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPrescriptions;
