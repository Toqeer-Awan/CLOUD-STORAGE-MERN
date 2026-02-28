import React from 'react';
import { MdWarning, MdError, MdInfo, MdClose } from 'react-icons/md';

const QuotaWarning = ({ 
  type = 'info', // info, warning, error
  title,
  message,
  details,
  onDismiss,
  className = ''
}) => {
  const getStyles = () => {
    switch(type) {
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-300',
          icon: <MdError className="text-red-600 dark:text-red-400 text-xl flex-shrink-0" />
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-300',
          icon: <MdWarning className="text-yellow-600 dark:text-yellow-400 text-xl flex-shrink-0" />
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-300',
          icon: <MdInfo className="text-blue-600 dark:text-blue-400 text-xl flex-shrink-0" />
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {styles.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-medium ${styles.text} mb-1`}>
              {title}
            </h4>
          )}
          
          <p className={`text-sm ${styles.text} opacity-90`}>
            {message}
          </p>
          
          {details && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {details}
            </div>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <MdClose size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default QuotaWarning;