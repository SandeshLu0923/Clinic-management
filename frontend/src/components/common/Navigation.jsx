import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { FiMenu } from 'react-icons/fi';

const Navigation = ({ role, onMenuClick }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const getNavLinks = () => {
    const baseLinks = [
      { path: '/dashboard', label: 'Dashboard', key: 'dashboard' }
    ];

    switch (role) {
      case 'doctor':
        return [
          ...baseLinks,
          { path: '/appointments', label: 'Appointments', key: 'appointments' },
          { path: '/patients', label: 'My Patients', key: 'patients' },
          { path: '/prescriptions', label: 'Prescriptions', key: 'prescriptions' },
          { path: '/analytics', label: 'Analytics', key: 'analytics' }
        ];
      case 'patient':
        return [
          ...baseLinks,
          { path: '/book-appointment', label: 'Book Appointment', key: 'book-appointment' },
          { path: '/appointments', label: 'My Appointments', key: 'appointments' },
          { path: '/lab-tests', label: 'Lab Tests', key: 'lab-tests' },
          { path: '/billing', label: 'Billing', key: 'billing' },
          { path: '/feedback', label: 'Feedback', key: 'feedback' }
        ];
      case 'receptionist':
        return [
          ...baseLinks,
          { path: '/queue', label: 'Walk-in Queue', key: 'queue' },
          { path: '/appointments', label: 'Appointments', key: 'appointments' },
          { path: '/billing', label: 'Billing', key: 'billing' },
          { path: '/manage-staff', label: 'Manage Staff', key: 'manage-staff' },
          { path: '/manage-services', label: 'Manage Services', key: 'manage-services' }
        ];
      default:
        return baseLinks;
    }
  };

  const navLinks = getNavLinks();

  const isActive = (path) => {
    const fullPath = `/${role}${path}`;
    return location.pathname === fullPath;
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
      <div className="w-full px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left Section: Hamburger & Logo */}
          <div className="flex items-center space-x-4">
            {/* Hamburger Menu */}
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-blue-500 rounded transition lg:hidden"
              title="Toggle menu"
            >
              <FiMenu className="text-2xl" />
            </button>

            {/* Logo */}
            <Link to={`/${role}/dashboard`} className="text-xl font-bold hover:text-blue-100">
              Clinic Management
            </Link>
          </div>

          {/* Center Section: Nav Links */}
          <div className="hidden md:flex space-x-1 flex-1 justify-center">
            {navLinks.map(link => (
              <Link
                key={link.key}
                to={`/${role}${link.path}`}
                className={`px-3 py-2 rounded transition text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-blue-800 text-white'
                    : 'hover:bg-blue-500 text-blue-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section: User Info & Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold">{user?.name || 'User'}</p>
              <p className="text-xs text-blue-100 capitalize">{role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition text-sm font-medium whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden pb-4 space-y-2">
          {navLinks.map(link => (
            <Link
              key={link.key}
              to={`/${role}${link.path}`}
              className={`block px-3 py-2 rounded transition text-sm font-medium ${
                isActive(link.path)
                  ? 'bg-blue-800 text-white'
                  : 'hover:bg-blue-500 text-blue-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
