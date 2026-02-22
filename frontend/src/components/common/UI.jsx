import React from 'react';
import clsx from 'clsx';

export const Button = ({ children, onClick, className, variant = 'primary', size = 'md', disabled = false, ...props }) => {
  const baseStyles = 'font-semibold rounded transition-colors duration-200 cursor-pointer border-none';
  
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400',
    success: 'bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400',
  };

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input = ({ label, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      <input
        className={clsx(
          'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
          error ? 'border-red-500' : 'border-gray-300',
          className
        )}
        {...props}
      />
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
};

export const Card = ({ children, className }) => {
  return (
    <div className={clsx('bg-white rounded-lg shadow-md p-6', className)}>
      {children}
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-2xl font-bold">×</button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="mt-4">Loading...</p>
    </div>
  </div>
);

export const Alert = ({ type = 'info', message }) => {
  const typeStyles = {
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  return (
    <div className={clsx('border rounded-lg p-4 mb-4', typeStyles[type])}>
      {message}
    </div>
  );
};

export const Badge = ({ children, variant = 'primary', className }) => {
  const variants = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-cyan-100 text-cyan-800',
  };

  return (
    <span className={clsx('inline-flex items-center px-3 py-1 rounded-full text-sm font-medium', variants[variant], className)}>
      {children}
    </span>
  );
};
