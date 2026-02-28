import React from 'react';
import { MdUpload, MdDownload, MdAccessTime } from 'react-icons/md';
import { formatBytes } from '../config/quotaConfig';

const DailyUsageIndicator = ({ 
  uploadUsed, 
  uploadLimit,
  downloadUsed,
  downloadLimit,
  className = ''
}) => {
  const uploadPercentage = uploadLimit > 0 ? Math.min((uploadUsed / uploadLimit) * 100, 100) : 0;
  const downloadPercentage = downloadLimit > 0 ? Math.min((downloadUsed / downloadLimit) * 100, 100) : 0;

  const getProgressColor = (percentage) => {
    if (percentage >= 95) return 'bg-red-500';
    if (percentage >= 85) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getTimeUntilReset = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    
    const hours = Math.floor((midnight - now) / (1000 * 60 * 60));
    const minutes = Math.floor(((midnight - now) % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Daily Usage
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <MdAccessTime className="text-sm" />
          <span>Resets in {getTimeUntilReset()}</span>
        </div>
      </div>
      
      {/* Upload */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1">
            <MdUpload className="text-blue-500 dark:text-blue-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Upload</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {formatBytes(uploadUsed)} / {formatBytes(uploadLimit)}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`${getProgressColor(uploadPercentage)} h-2 rounded-full transition-all`}
            style={{ width: `${uploadPercentage}%` }}
          />
        </div>
        {uploadPercentage >= 85 && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            ⚠️ Approaching daily upload limit
          </p>
        )}
      </div>
      
      {/* Download */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1">
            <MdDownload className="text-green-500 dark:text-green-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Download</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {formatBytes(downloadUsed)} / {formatBytes(downloadLimit)}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`${getProgressColor(downloadPercentage)} h-2 rounded-full transition-all`}
            style={{ width: `${downloadPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default DailyUsageIndicator;