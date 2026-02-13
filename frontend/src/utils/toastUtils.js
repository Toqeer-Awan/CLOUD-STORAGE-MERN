import toast from 'react-hot-toast';

export const showSuccess = (message) => {
  return toast.success(message, {
    icon: '✅',
  });
};

export const showError = (message) => {
  return toast.error(message, {
    icon: '❌',
  });
};

export const showInfo = (message) => {
  return toast(message, {
    icon: 'ℹ️',
  });
};

export const showWarning = (message) => {
  return toast(message, {
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
    },
  });
};

export const showLoading = (message) => {
  return toast.loading(message);
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export const showPromise = (promise, messages) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Error occurred',
    },
    {
      style: {
        minWidth: '250px',
      },
    }
  );
};