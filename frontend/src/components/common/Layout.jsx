import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import Navigation from './Navigation';

export { Navigation };

export const Sidebar = ({ items, isOpen, onClose, role }) => {
  const navigate = useNavigate();
  const [expandedSettings, setExpandedSettings] = useState(false);

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const settingsItems = [
    { id: 'profile', label: 'Profile Information', path: `/${role}/settings/profile` },
    { id: 'password', label: 'Change Password', path: `/${role}/settings/password` }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static
        top-0 left-0
        w-64 h-screen
        bg-gray-800 text-white
        p-4
        pb-8
        z-40
        transition-transform duration-300 ease-in-out
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg transition"
        >
          <FiX className="text-2xl" />
        </button>

        {/* Main Navigation - Scrollable */}
        <nav className="space-y-2 mt-8 lg:mt-0 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
            >
              {item.icon && <span className="text-xl">{item.icon}</span>}
              <span className="text-sm lg:text-base">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Account Settings - Inside Sidebar at Bottom */}
        <div className="border-t border-gray-700 pt-3 mt-4">
          <button
            onClick={() => setExpandedSettings(!expandedSettings)}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 transition flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              <span className="text-sm lg:text-base font-semibold">Account Settings</span>
            </div>
            <FiChevronDown className={`transition-transform ${expandedSettings ? 'rotate-180' : ''}`} />
          </button>

          {/* Settings Submenu */}
          {expandedSettings && (
            <div className="mt-2 space-y-2 ml-4 border-l-2 border-gray-600 pl-4 pb-2 max-h-40 overflow-y-auto">
              {settingsItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-700 transition text-gray-300 hover:text-white"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export const LayoutWrapper = ({ children, sidebarItems, sidebarOpen, onToggleSidebar }) => {
  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={sidebarItems} isOpen={sidebarOpen} onClose={onToggleSidebar} />
        <main className="flex-1 overflow-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export const Footer = () => (
  <footer className="bg-gray-800 text-white text-center py-4 mt-12">
    <p>&copy; 2025 Clinic Management System. All rights reserved.</p>
  </footer>
);
