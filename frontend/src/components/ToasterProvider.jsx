import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToasterProvider = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={12}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        duration: 4000,
        className: '',
        style: {
          background: '#1F2937',
          color: '#F9FAFB',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '400px',
          border: '1px solid #374151',
          backdropFilter: 'blur(8px)',
        },
        success: {
          duration: 3500,
          style: {
            background: '#065F46',
            color: '#D1FAE5',
            border: '1px solid #059669',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
          },
          iconTheme: {
            primary: '#10B981',
            secondary: '#FFFFFF',
          },
        },
        error: {
          duration: 4500,
          style: {
            background: '#7F1D1D',
            color: '#FEE2E2',
            border: '1px solid #DC2626',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
          },
          iconTheme: {
            primary: '#EF4444',
            secondary: '#FFFFFF',
          },
        },
        loading: {
          duration: Infinity,
          style: {
            background: '#1E3A8A',
            color: '#DBEAFE',
            border: '1px solid #3B82F6',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)',
          },
          iconTheme: {
            primary: '#3B82F6',
            secondary: '#FFFFFF',
          },
        },
      }}
    />
  );
};

export default ToasterProvider;