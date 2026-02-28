// Quota configuration matching backend
export const FREE_PLAN = {
  name: 'Free',
  maxStorage: 5 * 1024 * 1024 * 1024, // 5GB in bytes
  maxFiles: 100,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  dailyUploadLimit: 1 * 1024 * 1024 * 1024, // 1GB
  allowedTypes: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'video/mp4', 'video/quicktime',
    'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip'
  ]
};

export const PRO_PLAN = {
  name: 'Pro',
  maxStorage: 50 * 1024 * 1024 * 1024, // 50GB
  maxFiles: 1000,
  maxFileSize: 500 * 1024 * 1024, // 500MB
  dailyUploadLimit: 10 * 1024 * 1024 * 1024, // 10GB
  allowedTypes: ['*'] // All types allowed
};

// Warning thresholds
export const WARNING_THRESHOLDS = {
  storage: 0.8, // 80% - warning
  critical: 0.95, // 95% - critical warning
  files: 0.9, // 90% of file limit
  daily: 0.85 // 85% of daily limit
};

// Helper functions
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Export these color functions - these were missing!
export const getQuotaColor = (percentage) => {
  if (percentage >= 95) return '#ef4444'; // red-500
  if (percentage >= 80) return '#f59e0b'; // yellow-500
  if (percentage >= 50) return '#3b82f6'; // blue-500
  return '#10b981'; // green-500
};

export const getQuotaBgColor = (percentage) => {
  if (percentage >= 95) return 'bg-red-500';
  if (percentage >= 80) return 'bg-yellow-500';
  if (percentage >= 50) return 'bg-blue-500';
  return 'bg-green-500';
};

export const getQuotaTextColor = (percentage) => {
  if (percentage >= 95) return 'text-red-600';
  if (percentage >= 80) return 'text-yellow-600';
  return 'text-gray-700';
};