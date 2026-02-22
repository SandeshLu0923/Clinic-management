import React, { useState } from 'react';
import { Card, Button, Badge, Input } from '../../components/common/UI';

const ReceptionistDoctorVerification = () => {
  const [doctors, setDoctors] = useState([
    {
      id: 1,
      name: 'Dr. Robert Smith',
      email: 'robert@clinic.com',
      license: 'MD-12345',
      specialization: 'Cardiology',
      status: 'verified',
      verificationDate: '2025-01-15',
      documents: ['License', 'Degree', 'Insurance'],
    },
    {
      id: 2,
      name: 'Dr. Sarah Johnson',
      email: 'sarah@clinic.com',
      license: 'MD-67890',
      specialization: 'Pediatrics',
      status: 'pending',
      documents: ['License', 'Degree'],
    },
    {
      id: 3,
      name: 'Dr. Michael Brown',
      email: 'michael@clinic.com',
      license: 'MD-11111',
      specialization: 'Orthopedics',
      status: 'rejected',
      reason: 'License expired',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const filteredDoctors = doctors.filter(
    (d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVerify = (id) => {
    const updated = doctors.map((d) =>
      d.id === id ? { ...d, status: 'verified', verificationDate: new Date().toISOString().split('T')[0], reason: undefined } : d
    );
    setDoctors(updated);
    setSelectedDoctor(updated.find((d) => d.id === id) || null);
  };

  const handleReject = (id) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;

    const updated = doctors.map((d) => (d.id === id ? { ...d, status: 'rejected', reason } : d));
    setDoctors(updated);
    setSelectedDoctor(updated.find((d) => d.id === id) || null);
  };

  const handleRevertToPending = (id) => {
    const updated = doctors.map((d) => (d.id === id ? { ...d, status: 'pending', reason: undefined } : d));
    setDoctors(updated);
    setSelectedDoctor(updated.find((d) => d.id === id) || null);
  };

  return (
    <div className="p-8">
      <div className="space-y-6">
        <Input placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2">
            {filteredDoctors.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-gray-500">No doctors found</p>
              </Card>
            ) : (
              filteredDoctors.map((doctor) => (
                <Card
                  key={doctor.id}
                  className={`p-4 cursor-pointer transition ${selectedDoctor?.id === doctor.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <h3 className="font-semibold">{doctor.name}</h3>
                  <p className="text-sm text-gray-600">{doctor.specialization}</p>
                  <Badge status={doctor.status} className="mt-2">
                    {doctor.status}
                  </Badge>
                </Card>
              ))
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedDoctor ? (
              <Card className="p-6 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedDoctor.name}</h2>
                  <p className="text-gray-600">{selectedDoctor.specialization}</p>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <p>
                    <strong>Email:</strong> {selectedDoctor.email}
                  </p>
                  <p>
                    <strong>License:</strong> {selectedDoctor.license}
                  </p>
                  {selectedDoctor.status === 'verified' && (
                    <p>
                      <strong>Verified on:</strong> {selectedDoctor.verificationDate}
                    </p>
                  )}
                  {selectedDoctor.status === 'rejected' && (
                    <p className="text-red-600">
                      <strong>Rejection Reason:</strong> {selectedDoctor.reason}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Submitted Documents</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {(selectedDoctor.documents || []).map((doc, idx) => (
                      <li key={idx} className="text-gray-700">
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedDoctor.status === 'pending' && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={() => handleVerify(selectedDoctor.id)} className="flex-1">
                      Verify Doctor
                    </Button>
                    <Button variant="secondary" onClick={() => handleReject(selectedDoctor.id)} className="flex-1">
                      Reject
                    </Button>
                  </div>
                )}

                {selectedDoctor.status === 'verified' && (
                  <Card className="p-4 bg-green-50 border-green-200">
                    <p className="text-green-700">? This doctor has been verified</p>
                  </Card>
                )}

                {selectedDoctor.status === 'rejected' && (
                  <Card className="p-4 bg-red-50 border-red-200">
                    <p className="text-red-700">? Verification rejected</p>
                    <Button className="mt-2 w-full" onClick={() => handleRevertToPending(selectedDoctor.id)}>
                      Revert to Pending
                    </Button>
                  </Card>
                )}
              </Card>
            ) : (
              <Card className="text-center py-12">
                <p className="text-gray-500">Select a doctor to view details</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDoctorVerification;
