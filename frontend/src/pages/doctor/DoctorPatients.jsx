import React, { useEffect, useMemo, useState } from 'react';
import { doctorAPI } from '../../api/endpoints';
import { Loading, Card } from '../../components/common/UI';
import { FiSearch, FiMoreVertical, FiClipboard, FiThermometer, FiActivity, FiEdit3 } from 'react-icons/fi';

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [openMenuPatientId, setOpenMenuPatientId] = useState(null);

  const [patientRecords, setPatientRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState('');

  const fetchPatients = async (search, date) => {
    setLoading(true);
    try {
      const response = await doctorAPI.getPatients({ search, date });
      setPatients(response.data.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch patients.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(searchTerm, filterDate);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filterDate]);

  const sortedPatients = useMemo(
    () => [...patients].sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit)),
    [patients]
  );

  const openPatientModal = (patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
    setOpenMenuPatientId(null);
  };

  const openRecordModal = async (patient) => {
    setSelectedPatient(patient);
    setShowRecordModal(true);
    setOpenMenuPatientId(null);
    setRecordsLoading(true);
    setRecordsError('');
    setPatientRecords([]);

    try {
      const response = await doctorAPI.getMedicalRecords(patient._id);
      setPatientRecords(response.data.data || []);
    } catch (err) {
      setRecordsError(err.response?.data?.message || 'Failed to fetch medical records.');
      console.error(err);
    } finally {
      setRecordsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">My Patients</h1>

      <Card>
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative md:col-span-2">
              <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visit Date Filter</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  All
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">{error}</div>
          )}

          {loading ? (
            <Loading />
          ) : sortedPatients.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No patients found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Gender</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Age</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Last Visit</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Total Visits</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPatients.map((patient) => (
                    <tr key={patient._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{patient.name}</td>
                      <td className="px-4 py-3 capitalize">{patient.patientType === 'walk-in' ? 'Walk-in' : 'Registered'}</td>
                      <td className="px-4 py-3 capitalize">{patient.gender || 'N/A'}</td>
                      <td className="px-4 py-3">{patient.age || 'N/A'}</td>
                      <td className="px-4 py-3">{patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-4 py-3">{patient.totalAppointments || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() => setOpenMenuPatientId(openMenuPatientId === patient._id ? null : patient._id)}
                            className="p-2 rounded hover:bg-gray-200"
                            aria-label="Open patient actions"
                          >
                            <FiMoreVertical />
                          </button>
                          {openMenuPatientId === patient._id && (
                            <div className="absolute right-0 mt-1 w-32 bg-white border rounded shadow z-10">
                              <button
                                type="button"
                                onClick={() => openPatientModal(patient)}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                View Patient
                              </button>
                              <button
                                type="button"
                                onClick={() => openRecordModal(patient)}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                View Record
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
          )}
        </div>
      </Card>

      {showPatientModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border w-full max-w-md p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Patient Details</h2>
              <button type="button" onClick={() => setShowPatientModal(false)} className="text-gray-600 text-xl">X</button>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div><span className="font-semibold">Name:</span> {selectedPatient.name}</div>
              <div><span className="font-semibold">Type:</span> {selectedPatient.patientType === 'walk-in' ? 'Walk-in' : 'Registered'}</div>
              <div><span className="font-semibold">Gender:</span> {selectedPatient.gender || 'N/A'}</div>
              <div><span className="font-semibold">Age:</span> {selectedPatient.age || 'N/A'}</div>
              <div><span className="font-semibold">Last Visit:</span> {selectedPatient.lastVisit ? new Date(selectedPatient.lastVisit).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-semibold">Total Visits:</span> {selectedPatient.totalAppointments || 0}</div>
            </div>
          </div>
        </div>
      )}

      {showRecordModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border w-full max-w-2xl max-h-[80vh] overflow-y-auto p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Medical Records - {selectedPatient.name}</h2>
              <button type="button" onClick={() => setShowRecordModal(false)} className="text-gray-600 text-xl">X</button>
            </div>

            {recordsLoading ? (
              <Loading />
            ) : recordsError ? (
              <div className="py-6 px-4 bg-red-50 rounded border border-red-200">
                <p className="text-red-600 font-semibold text-sm">{recordsError}</p>
              </div>
            ) : patientRecords.length > 0 ? (
              <div className="space-y-4">
                {patientRecords.map((record) => (
                  <div key={record._id} className="p-4 border rounded bg-white">
                    <p className="font-semibold mb-2">Visit on: {new Date(record.visitDate).toLocaleDateString()}</p>
                    <div className="space-y-3 text-sm">
                      {record.diagnosis && (
                        <div className="flex items-start">
                          <FiClipboard className="mr-3 mt-1 text-blue-500 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-700">Diagnosis</p>
                            <p className="text-gray-600">{record.diagnosis}</p>
                          </div>
                        </div>
                      )}
                      {record.symptoms && (
                        <div className="flex items-start">
                          <FiThermometer className="mr-3 mt-1 text-orange-500 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-700">Symptoms</p>
                            <p className="text-gray-600">{record.symptoms}</p>
                          </div>
                        </div>
                      )}
                      {record.prescription && record.prescription.length > 0 && (
                        <div className="flex items-start">
                          <FiActivity className="mr-3 mt-1 text-green-500 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-700">Prescription</p>
                            <ul className="list-disc list-inside text-gray-600">
                              {record.prescription.map((med, index) => (
                                <li key={index}>
                                  {(med.medicineName || med.medication)} ({med.dosage || 'N/A'}) - {med.frequency || 'N/A'}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      {record.notes && (
                        <div className="flex items-start">
                          <FiEdit3 className="mr-3 mt-1 text-purple-500 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-700">Notes</p>
                            <p className="text-gray-600">{record.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded">
                <p className="text-gray-500">No medical records found for this patient.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatients;
