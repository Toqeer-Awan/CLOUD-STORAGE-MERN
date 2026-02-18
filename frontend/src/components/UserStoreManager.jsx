import React, { useState } from 'react';
import { storageAPI } from '../redux/api/api';
import useToast from '../hooks/useToast';
import { MdClose, MdWarning, MdStorage } from 'react-icons/md';

const UserStorageManager = ({ user, admin, onClose, onSuccess }) => {
  const [storageAmount, setStorageAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  console.log('📦 UserStorageManager received:', { user, admin });

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!storageAmount || storageAmount < 0.1) {
      toast.error('Storage must be at least 0.1 GB');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📤 Sending allocation request:', {
        userId: user._id,
        storageInGB: parseFloat(storageAmount)
      });

      const response = await storageAPI.allocateToUser({
        userId: user._id,
        storageInGB: parseFloat(storageAmount)
      });
      
      console.log('✅ Allocation response:', response.data);
      toast.success(`${storageAmount}GB allocated to ${user.username}`);
      onSuccess();
      
    } catch (error) {
      console.error('❌ Allocation error:', error.response?.data || error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to allocate storage';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            Allocate Storage to {user?.username}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={loading}
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-white">{user?.username}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Storage Info */}
        <div className="mb-4 space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Current Allocation:</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {formatBytes(user?.storageAllocated || 0)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Currently Used:</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {formatBytes(user?.storageUsed || 0)}
            </span>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-600 my-2 pt-2">
            <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
              <span className="text-sm font-medium">Admin Available:</span>
              <span className="font-bold">{formatBytes(admin?.availableToAllocate || 0)}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Storage Amount (GB)
            </label>
            <div className="relative">
              <MdStorage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={storageAmount}
                onChange={(e) => setStorageAmount(e.target.value)}
                placeholder="Enter storage in GB"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Enter any amount (will be validated by server)
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Allocating...</span>
                </>
              ) : (
                <span>Allocate Storage</span>
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserStorageManager;