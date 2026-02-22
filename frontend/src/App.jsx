import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { PrivateRoute } from './context/PrivateRoute';
import { clearAuthState } from './store/slices/authSlice';
import { FiHome, FiUsers, FiDollarSign, FiFileText, FiBarChart2, FiCalendar, FiActivity, FiCheckCircle } from 'react-icons/fi';
import './index.css';

// Common Components
import Navigation from './components/common/Navigation';
import { Sidebar } from './components/common/Layout';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientLandingPage from './pages/PatientLandingPage';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions';
import DoctorAnalytics from './pages/doctor/DoctorAnalytics';
import DoctorMedicalDocuments from './pages/doctor/DoctorMedicalDocuments';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientBookAppointment from './pages/patient/PatientBookAppointment';
import PatientAppointments from './pages/patient/PatientAppointments';
import PatientMedicalRecords from './pages/patient/PatientMedicalRecords';
import PatientLabTests from './pages/patient/PatientLabTests';
import PatientBilling from './pages/patient/PatientBilling';
import PatientFeedback from './pages/patient/PatientFeedback';
import PatientMedicalDocuments from './pages/patient/PatientMedicalDocuments';

// Receptionist Pages
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import ReceptionistQueue from './pages/receptionist/ReceptionistQueue';
import ReceptionistAppointments from './pages/receptionist/ReceptionistAppointments';
import ReceptionistBilling from './pages/receptionist/ReceptionistBilling';
import ReceptionistDoctorVerification from './pages/receptionist/ReceptionistDoctorVerification';
import ManageStaff from './pages/receptionist/ManageStaff';
import ManageServices from './pages/receptionist/ManageServices';

// Settings Pages
import AccountSettings from './pages/settings/AccountSettings';
import PasswordSettings from './pages/settings/PasswordSettings';

// DashboardLayout component for pages with navigation and sidebar
const DashboardLayout = ({ children, role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getSidebarItems = () => {
    switch (role) {
      case 'doctor':
        return [
          { id: 'dashboard', label: 'Dashboard', path: '/doctor/dashboard', icon: <FiHome /> },
          { id: 'appointments', label: 'Appointments', path: '/doctor/appointments', icon: <FiCalendar /> },
          { id: 'patients', label: 'My Patients', path: '/doctor/patients', icon: <FiUsers /> },
          { id: 'medical-documents', label: 'Medical Documents', path: '/doctor/medical-documents', icon: <FiFileText /> },
          { id: 'prescriptions', label: 'Prescriptions', path: '/doctor/prescriptions', icon: <FiActivity /> },
          { id: 'analytics', label: 'Analytics', path: '/doctor/analytics', icon: <FiBarChart2 /> }
        ];
      case 'patient':
        return [
          { id: 'dashboard', label: 'Dashboard', path: '/patient/dashboard', icon: <FiHome /> },
          { id: 'book-appointment', label: 'Book Appointment', path: '/patient/book-appointment', icon: <FiCalendar /> },
          { id: 'appointments', label: 'My Appointments', path: '/patient/appointments', icon: <FiFileText /> },
          { id: 'medical-documents', label: 'Medical Documents', path: '/patient/medical-documents', icon: <FiFileText /> },
          { id: 'lab-tests', label: 'Lab Tests', path: '/patient/lab-tests', icon: <FiActivity /> },
          { id: 'billing', label: 'Billing', path: '/patient/billing', icon: <FiDollarSign /> },
          { id: 'feedback', label: 'Feedback', path: '/patient/feedback', icon: <FiCheckCircle /> }
        ];
      case 'receptionist':
        return [
          { id: 'dashboard', label: 'Dashboard', path: '/receptionist/dashboard', icon: <FiHome /> },
          { id: 'queue', label: 'Walk-in Queue', path: '/receptionist/queue', icon: <FiUsers /> },
          { id: 'appointments', label: 'Appointments', path: '/receptionist/appointments', icon: <FiCalendar /> },
          { id: 'billing', label: 'Billing', path: '/receptionist/billing', icon: <FiDollarSign /> },
          { id: 'manage-staff', label: 'Manage Staff', path: '/receptionist/manage-staff', icon: <FiUsers /> },
          { id: 'manage-services', label: 'Manage Services', path: '/receptionist/manage-services', icon: <FiActivity /> }
        ];
      default:
        return [{ id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <FiHome /> }];
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Navigation Bar */}
      <Navigation role={role} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar items={getSidebarItems()} role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto w-full">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch(clearAuthState());
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [dispatch, location.pathname, navigate]);

  return (
    <Routes>
        <Route path="/unauthorized" element={<div className="min-h-screen flex items-center justify-center text-xl font-semibold">Unauthorized access</div>} />
        {/* Public routes */}
        <Route path="/" element={<PatientLandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Doctor routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <PrivateRoute requiredRole="doctor">
              <DashboardLayout role="doctor">
                <DoctorDashboard />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            <PrivateRoute requiredRole="doctor">
              <DashboardLayout role="doctor">
                <DoctorAppointments />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/patients"
          element={
            <PrivateRoute requiredRole="doctor">
              <DashboardLayout role="doctor">
                <DoctorPatients />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/prescriptions"
          element={
            <PrivateRoute requiredRole="doctor">
              <DashboardLayout role="doctor">
                <DoctorPrescriptions />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/analytics"
          element={
            <PrivateRoute requiredRole="doctor">
              <DashboardLayout role="doctor">
                <DoctorAnalytics />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/medical-documents"
          element={
            <PrivateRoute requiredRole="doctor">
              <DashboardLayout role="doctor">
                <DoctorMedicalDocuments />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Patient routes */}
        <Route
          path="/patient/dashboard"
          element={
            <PrivateRoute requiredRole="patient">
              <DashboardLayout role="patient">
                <PatientDashboard />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/book-appointment"
          element={
            <PrivateRoute requiredRole="patient">
              <DashboardLayout role="patient">
                <PatientBookAppointment />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <PrivateRoute requiredRole="patient">
              <DashboardLayout role="patient">
                <PatientAppointments />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/medical-records"
          element={
            <PrivateRoute requiredRole="patient">
              <DashboardLayout role="patient">
                <PatientMedicalRecords />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/lab-tests"
          element={
            <PrivateRoute requiredRole="patient">
              <DashboardLayout role="patient">
                <PatientLabTests />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/billing"
          element={
            <PrivateRoute requiredRole="patient">
              <DashboardLayout role="patient">
                <PatientBilling />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/feedback"
          element={
            <PrivateRoute requiredRole="patient">
              <DashboardLayout role="patient">
                <PatientFeedback />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/medical-documents"
          element={
            <PrivateRoute requiredRole="patient">
              <DashboardLayout role="patient">
                <PatientMedicalDocuments />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Receptionist routes */}
        <Route
          path="/receptionist/dashboard"
          element={
            <PrivateRoute requiredRole="receptionist">
              <DashboardLayout role="receptionist">
                <ReceptionistDashboard />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/receptionist/queue"
          element={
            <PrivateRoute requiredRole="receptionist">
              <DashboardLayout role="receptionist">
                <ReceptionistQueue />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/receptionist/appointments"
          element={
            <PrivateRoute requiredRole="receptionist">
              <DashboardLayout role="receptionist">
                <ReceptionistAppointments />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/receptionist/billing"
          element={
            <PrivateRoute requiredRole="receptionist">
              <DashboardLayout role="receptionist">
                <ReceptionistBilling />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/receptionist/doctor-verification"
          element={
            <PrivateRoute requiredRole="receptionist">
              <DashboardLayout role="receptionist">
                <ReceptionistDoctorVerification />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/receptionist/manage-staff"
          element={
            <PrivateRoute requiredRole="receptionist">
              <DashboardLayout role="receptionist">
                <ManageStaff />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/receptionist/manage-services"
          element={
            <PrivateRoute requiredRole="receptionist">
              <DashboardLayout role="receptionist">
                <ManageServices />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Settings Routes - Doctor */}
        {/* Settings Routes - Doctor */}
        <Route
          path="/doctor/settings/profile"
          element={
            <PrivateRoute requiredRole="doctor">
              <DashboardLayout role="doctor">
                <AccountSettings />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/settings/password"
          element={
            <PrivateRoute requiredRole="doctor">
              <DashboardLayout role="doctor">
                <PasswordSettings />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Settings Routes - Patient */}
        <Route
          path="/patient/settings/profile"
          element={
            <PrivateRoute requiredRole="patient">
              <DashboardLayout role="patient">
                <AccountSettings />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/settings/password"
          element={
            <PrivateRoute requiredRole="patient">
              <DashboardLayout role="patient">
                <PasswordSettings />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Settings Routes - Receptionist */}
        <Route
          path="/receptionist/settings/profile"
          element={
            <PrivateRoute requiredRole="receptionist">
              <DashboardLayout role="receptionist">
                <AccountSettings />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/receptionist/settings/password"
          element={
            <PrivateRoute requiredRole="receptionist">
              <DashboardLayout role="receptionist">
                <PasswordSettings />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Redirect to login */}
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
