import React, { useState } from 'react';
import { storageAPI } from '../redux/api/api';
import useToast from '../hooks/useToast';
import { MdStorage, MdClose, MdCheck, MdWarning } from 'react-icons/md';

const UserStorageManager = ({ user, company, onClose, onSuccess }) => {
  const [storageAmount, setStorageAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 GB';
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
      console.log('Allocating storage:', {
        userId: user._id,
        storageInGB: parseFloat(storageAmount)
      });

      await storageAPI.allocateToUser({
        userId: user._id,
        storageInGB: parseFloat(storageAmount)
      });
      
      toast.success(`Storage allocated to ${user.username}`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Storage allocation error:', error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to allocate storage');
    } finally {
      setLoading(false);
    }
  };

  // Calculate available storage in company
  const totalAllocated = company.users?.reduce((total, u) => {
    if (u._id !== user._id) {
      return total + (u.storageAllocated || 0);
    }
    return total;
  }, 0) || 0;
  
  const availableStorage = company.totalStorage - totalAllocated;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            Allocate Storage to {user.username}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            <strong>Current Storage:</strong> {formatBytes(user.storageAllocated || 0)}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
            <strong>Used:</strong> {formatBytes(user.storageUsed || 0)}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
            <strong>Available in Company:</strong> {formatBytes(availableStorage)}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
            <strong>Company Total:</strong> {formatBytes(company.totalStorage)}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Storage Amount (GB)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max={availableStorage / (1024 * 1024 * 1024)}
              value={storageAmount}
              onChange={(e) => setStorageAmount(e.target.value)}
              placeholder="Enter storage in GB"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Min: 0.1 GB | Max: {(availableStorage / (1024 * 1024 * 1024)).toFixed(2)} GB
            </p>
          </div>

          {parseFloat(storageAmount) > 0 && (
            <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start gap-2">
              <MdWarning className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                This will allocate {storageAmount}GB to {user.username}. 
                Make sure your company has enough storage available.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Allocating...' : 'Allocate Storage'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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