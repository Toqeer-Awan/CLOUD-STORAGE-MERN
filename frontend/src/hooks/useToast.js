import { useCallback } from 'react';
import toast from 'react-hot-toast';

const useToast = () => {
  const success = useCallback((message, options = {}) => {
    return toast.success(message, {
      icon: '✅',
      style: {
        background: '#065F46',
        color: '#D1FAE5',
        border: '1px solid #059669',
      },
      ...options,
    });
  }, []);

  const error = useCallback((message, options = {}) => {
    return toast.error(message, {
      icon: '❌',
      style: {
        background: '#7F1D1D',
        color: '#FEE2E2',
        border: '1px solid #DC2626',
      },
      ...options,
    });
  }, []);

  const info = useCallback((message, options = {}) => {
    return toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#1E3A8A',
        color: '#DBEAFE',
        border: '1px solid #3B82F6',
      },
      ...options,
    });
  }, []);

  const warning = useCallback((message, options = {}) => {
    return toast(message, {
      icon: '⚠️',
      style: {
        background: '#92400E',
        color: '#FEF3C7',
        border: '1px solid #F59E0B',
      },
      ...options,
    });
  }, []);

  const loading = useCallback((message, options = {}) => {
    return toast.loading(message, {
      icon: '⏳',
      style: {
        background: '#1E3A8A',
        color: '#DBEAFE',
        border: '1px solid #3B82F6',
      },
      ...options,
    });
  }, []);

  const promise = useCallback((promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Processing...',
        success: messages.success || 'Success!',
        error: messages.error || 'Error occurred',
      },
      {
        loading: {
          icon: '⏳',
          style: {
            background: '#1E3A8A',
            color: '#DBEAFE',
            border: '1px solid #3B82F6',
          },
        },
        success: {
          icon: '✅',
          style: {
            background: '#065F46',
            color: '#D1FAE5',
            border: '1px solid #059669',
          },
        },
        error: {
          icon: '❌',
          style: {
            background: '#7F1D1D',
            color: '#FEE2E2',
            border: '1px solid #DC2626',
          },
        },
        ...options,
      }
    );
  }, []);

  const uploadSuccess = useCallback((message, options = {}) => {
    return toast.success(message, {
      icon: '⬆️',
      ...options,
    });
  }, []);

  const downloadSuccess = useCallback((message, options = {}) => {
    return toast.success(message, {
      icon: '⬇️',
      ...options,
    });
  }, []);

  const deleteSuccess = useCallback((message, options = {}) => {
    return toast.success(message, {
      icon: '🗑️',
      ...options,
    });
  }, []);

  const loginSuccess = useCallback((message, options = {}) => {
    return toast.success(message, {
      icon: '🔓',
      ...options,
    });
  }, []);

  const logoutSuccess = useCallback((message, options = {}) => {
    return toast(message, {
      icon: '🔒',
      style: {
        background: '#1E3A8A',
        color: '#DBEAFE',
        border: '1px solid #3B82F6',
      },
      ...options,
    });
  }, []);

  const userAdded = useCallback((message, options = {}) => {
    return toast.success(message, {
      icon: '👤',
      ...options,
    });
  }, []);

  const fileUploaded = useCallback((message, options = {}) => {
    return toast.success(message, {
      icon: '📄',
      ...options,
    });
  }, []);

  const folderCreated = useCallback((message, options = {}) => {
    return toast.success(message, {
      icon: '📁',
      ...options,
    });
  }, []);

  const settingsSaved = useCallback((message, options = {}) => {
    return toast.success(message, {
      icon: '⚙️',
      ...options,
    });
  }, []);

  const networkOnline = useCallback((message, options = {}) => {
    return toast.success(message, {
      icon: '📶',
      duration: 3000,
      ...options,
    });
  }, []);

  const networkOffline = useCallback((message, options = {}) => {
    return toast.error(message, {
      icon: '📴',
      duration: Infinity,
      ...options,
    });
  }, []);

  const storageWarning = useCallback((message, options = {}) => {
    return toast(message, {
      icon: '💾',
      style: {
        background: '#92400E',
        color: '#FEF3C7',
        border: '1px solid #F59E0B',
      },
      duration: 6000,
      ...options,
    });
  }, []);

  const storageFull = useCallback((message, options = {}) => {
    return toast.error(message, {
      icon: '❌',
      duration: 8000,
      ...options,
    });
  }, []);

  const permissionDenied = useCallback((message, options = {}) => {
    return toast.error(message, {
      icon: '🔒',
      duration: 5000,
      ...options,
    });
  }, []);

  const permissionGranted = useCallback((message, options = {}) => {
    return toast.success(message, {
      icon: '🔓',
      ...options,
    });
  }, []);

  const dismiss = useCallback((toastId) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }, []);

  return {
    success,
    error,
    info,
    warning,
    loading,
    promise,
    dismiss,
    uploadSuccess,
    downloadSuccess,
    deleteSuccess,
    loginSuccess,
    logoutSuccess,
    userAdded,
    fileUploaded,
    folderCreated,
    settingsSaved,
    networkOnline,
    networkOffline,
    storageWarning,
    storageFull,
    permissionDenied,
    permissionGranted,
  };
};

export default useToast;