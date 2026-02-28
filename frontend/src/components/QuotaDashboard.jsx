import React, { useState } from 'react';
import { 
  MdStorage, MdInsertDriveFile, MdUpload, MdDownload,
  MdWarning, MdError, MdInfo, MdClose, MdExpandMore,
  MdExpandLess, MdCloud, MdTimer, MdFilePresent
} from 'react-icons/md';
import useQuota from '../hooks/useQuota';
import QuotaProgressBar from './QuotaProgressBar';
import QuotaWarning from './QuotaWarning';
import { formatBytes } from '../config/quotaConfig';

const QuotaDashboard = ({ className = '', showDetails = true }) => {
  const [expanded, setExpanded] = useState(false);
  const quota = useQuota();

  if (quota.loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  if (quota.error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
        <QuotaWarning
          type="error"
          title="Failed to load quota"
          message={quota.error}
        />
        <button
          onClick={quota.refreshQuota}
          className="mt-2 w-full px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // Calculate daily reset time
  const getTimeUntilReset = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    
    const hours = Math.floor((midnight - now) / (1000 * 60 * 60));
    const minutes = Math.floor(((midnight - now) % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MdStorage className="text-white text-xl" />
            <h3 className="text-white font-semibold">Storage Overview</h3>
          </div>
          <span className="text-xs text-white bg-white/20 px-2 py-1 rounded-full">
            {quota.plan === 'free' ? 'Free Plan' : 'Pro Plan'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Storage Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Storage Used</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white">
              {formatBytes(quota.used)} / {formatBytes(quota.total)}
            </span>
          </div>
          <QuotaProgressBar
            used={quota.used}
            total={quota.total}
            size="md"
            showPercentage={true}
            showLabel={false}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <MdInsertDriveFile className="text-blue-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Files</span>
            </div>
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {quota.fileCount} / {quota.maxFiles}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {quota.maxFiles - quota.fileCount} remaining
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <MdTimer className="text-green-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Daily Reset</span>
            </div>
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {getTimeUntilReset()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatBytes(quota.daily.used)} / {formatBytes(quota.daily.limit)}
            </p>
          </div>
        </div>

        {/* Daily Usage */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Today's Upload
            </span>
            <span className={`text-xs font-medium ${
              quota.daily.used >= quota.daily.limit * 0.85 ? 'text-yellow-600' : 'text-gray-500'
            }`}>
              {((quota.daily.used / quota.daily.limit) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                quota.daily.used >= quota.daily.limit * 0.95 ? 'bg-red-500' :
                quota.daily.used >= quota.daily.limit * 0.85 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min((quota.daily.used / quota.daily.limit) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Warning Messages */}
        {quota.warningMessages.length > 0 && (
          <div className="mb-4 space-y-2">
            {quota.warningMessages.map((warning, index) => (
              <QuotaWarning
                key={index}
                type={warning.type}
                title={warning.title}
                message={warning.message}
              />
            ))}
          </div>
        )}

        {/* Upgrade Plan Button - Only show for free plan */}
        {quota.plan === 'free' && (
          <button
            onClick={() => window.location.href = '/upgrade'}
            className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Upgrade to Pro Plan
          </button>
        )}

        {/* Expandable Details */}
        {showDetails && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-3 flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {expanded ? (
                <>Show Less <MdExpandLess /></>
              ) : (
                <>Show More Details <MdExpandMore /></>
              )}
            </button>

            {expanded && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                {/* File Type Breakdown */}
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Storage by Type
                </h4>
                <div className="space-y-2 mb-4">
                  {quota.fileTypeBreakdown.map((item) => (
                    <div key={item.type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize text-gray-600 dark:text-gray-400">
                          {item.type}
                        </span>
                        <span className="text-gray-800 dark:text-white">
                          {item.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-orange-500 h-1.5 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{item.count} files</span>
                        <span>{formatBytes(item.size)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Limits Info */}
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plan Limits
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Max File Size</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {formatBytes(quota.limits.maxFileSize)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Daily Upload</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {formatBytes(quota.limits.dailyUpload)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Storage</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {formatBytes(quota.total)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuotaDashboard;