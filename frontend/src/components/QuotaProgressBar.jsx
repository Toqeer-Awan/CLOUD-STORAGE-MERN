import React from 'react';
import { MdStorage, MdWarning, MdError } from 'react-icons/md';
import { getQuotaBgColor, formatBytes } from '../config/quotaConfig'; // Remove getQuotaColor if not used

const QuotaProgressBar = ({ 
  used, 
  total, 
  label = 'Storage Usage',
  showPercentage = true,
  showLabel = true,
  size = 'md', // sm, md, lg
  className = '',
  warningThreshold = 80,
  criticalThreshold = 95
}) => {
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  
  const getStatusColor = () => {
    if (percentage >= criticalThreshold) return 'bg-red-500';
    if (percentage >= warningThreshold) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (percentage >= criticalThreshold) 
      return <MdError className="text-red-500" title="Critical" />;
    if (percentage >= warningThreshold) 
      return <MdWarning className="text-yellow-500" title="Warning" />;
    return null;
  };

  const getHeight = () => {
    switch(size) {
      case 'sm': return 'h-1.5';
      case 'lg': return 'h-4';
      default: return 'h-2.5';
    }
  };

  const getTextSize = () => {
    switch(size) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-base';
      default: return 'text-sm';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <span className={`${getTextSize()} font-medium text-gray-700 dark:text-gray-300`}>
              {label}
            </span>
            {getStatusIcon()}
          </div>
          <div className="flex items-center gap-2">
            <span className={`${getTextSize()} text-gray-600 dark:text-gray-400`}>
              {formatBytes(used)} / {formatBytes(total)}
            </span>
          </div>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${getHeight()}`}>
        <div 
          className={`${getStatusColor()} ${getHeight()} rounded-full transition-all duration-500 ease-in-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {showPercentage && (
        <div className="flex justify-end mt-1">
          <span className={`${getTextSize()} text-gray-500 dark:text-gray-400`}>
            {percentage.toFixed(1)}% used
          </span>
        </div>
      )}
    </div>
  );
};

export default QuotaProgressBar;