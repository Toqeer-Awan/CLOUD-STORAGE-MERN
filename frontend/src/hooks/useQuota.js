import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../redux/api/api';
import { 
  FREE_PLAN, 
  WARNING_THRESHOLDS, 
  formatBytes,
  getQuotaColor,
  getQuotaBgColor,
  getQuotaTextColor 
} from '../config/quotaConfig';

const useQuota = () => {
  const [quota, setQuota] = useState({
    // Storage
    used: 0,
    total: FREE_PLAN.maxStorage,
    available: FREE_PLAN.maxStorage,
    percentage: 0,
    
    // Files
    fileCount: 0,
    maxFiles: FREE_PLAN.maxFiles,
    
    // Daily
    daily: {
      used: 0,
      limit: FREE_PLAN.dailyUploadLimit,
      remaining: FREE_PLAN.dailyUploadLimit,
      count: 0,
      download: {
        used: 0,
        limit: FREE_PLAN.dailyUploadLimit * 2
      }
    },
    
    // By file type
    byType: {
      images: { count: 0, size: 0 },
      videos: { count: 0, size: 0 },
      pdfs: { count: 0, size: 0 },
      documents: { count: 0, size: 0 },
      others: { count: 0, size: 0 }
    },
    
    // Status flags
    isNearLimit: false,
    isOverLimit: false,
    
    // Warnings
    warnings: {
      storage: false,
      files: false,
      daily: false
    },
    
    // Limits
    limits: {
      maxFileSize: FREE_PLAN.maxFileSize,
      maxFiles: FREE_PLAN.maxFiles,
      dailyUpload: FREE_PLAN.dailyUploadLimit
    },
    
    // Plan
    plan: 'free',
    
    loading: true,
    error: null
  });

  const { user } = useSelector((state) => state.auth);

  const fetchQuota = useCallback(async () => {
    try {
      setQuota(prev => ({ ...prev, loading: true, error: null }));
      const response = await api.get('/users/quota');
      
      // Ensure daily object has the correct structure
      const data = response.data;
      if (!data.daily.download) {
        data.daily.download = {
          used: 0,
          limit: data.daily.limit * 2
        };
      }
      
      setQuota({
        ...data,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('❌ Failed to fetch quota:', error);
      setQuota(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch quota'
      }));
    }
  }, []);

  // Check if a file can be uploaded
  const canUpload = useCallback((file) => {
    const checks = [];
    
    // Check file size
    if (file.size > quota.limits.maxFileSize) {
      checks.push({
        allowed: false,
        reason: 'fileSize',
        message: `File too large. Maximum size is ${formatBytes(quota.limits.maxFileSize)}.`
      });
    }
    
    // Check storage space
    if (quota.available < file.size) {
      checks.push({
        allowed: false,
        reason: 'storage',
        message: `Insufficient storage. Need ${formatBytes(file.size - quota.available)} more.`
      });
    }
    
    // Check file count
    if (quota.fileCount >= quota.maxFiles) {
      checks.push({
        allowed: false,
        reason: 'fileCount',
        message: `Maximum file limit (${quota.maxFiles}) reached.`
      });
    }
    
    // Check daily limit
    if (quota.daily.used + file.size > quota.daily.limit) {
      checks.push({
        allowed: false,
        reason: 'daily',
        message: `Daily upload limit exceeded. ${formatBytes(quota.daily.remaining)} remaining today.`
      });
    }
    
    // Check file type (for free plan)
    if (quota.plan === 'free') {
      const allowedTypes = FREE_PLAN.allowedTypes;
      if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
        checks.push({
          allowed: false,
          reason: 'fileType',
          message: 'File type not allowed. Free plan supports images, PDFs, videos, and documents.'
        });
      }
    }
    
    return checks.length === 0 ? { allowed: true } : checks[0];
  }, [quota]);

  // Check if multiple files can be uploaded
  const canUploadMultiple = useCallback((files) => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const totalCount = files.length;
    
    // Check total size against available storage
    if (totalSize > quota.available) {
      return {
        allowed: false,
        reason: 'storage',
        message: `Insufficient storage. Need ${formatBytes(totalSize - quota.available)} more.`
      };
    }
    
    // Check file count
    if (quota.fileCount + totalCount > quota.maxFiles) {
      return {
        allowed: false,
        reason: 'fileCount',
        message: `Cannot add ${totalCount} files. Only ${quota.maxFiles - quota.fileCount} slots remaining.`
      };
    }
    
    // Check daily limit
    if (quota.daily.used + totalSize > quota.daily.limit) {
      return {
        allowed: false,
        reason: 'daily',
        message: `Daily upload limit exceeded. ${formatBytes(quota.daily.remaining)} remaining today.`
      };
    }
    
    // Check individual files
    for (const file of files) {
      const result = canUpload(file);
      if (!result.allowed) {
        return result;
      }
    }
    
    return { allowed: true };
  }, [quota, canUpload]);

  // Get storage status
  const getStorageStatus = useCallback(() => {
    const percentage = quota.percentage;
    
    if (percentage >= 95) return 'critical';
    if (percentage >= 80) return 'warning';
    if (percentage >= 50) return 'info';
    return 'good';
  }, [quota.percentage]);

  // Get daily status
  const getDailyStatus = useCallback(() => {
    const percentage = (quota.daily.used / quota.daily.limit) * 100;
    
    if (percentage >= 95) return 'critical';
    if (percentage >= 85) return 'warning';
    if (percentage >= 50) return 'info';
    return 'good';
  }, [quota.daily]);

  // Get files status
  const getFilesStatus = useCallback(() => {
    const percentage = (quota.fileCount / quota.maxFiles) * 100;
    
    if (percentage >= 95) return 'critical';
    if (percentage >= 90) return 'warning';
    if (percentage >= 50) return 'info';
    return 'good';
  }, [quota.fileCount, quota.maxFiles]);

  // Get warning messages
  const getWarningMessages = useCallback(() => {
    const messages = [];
    
    if (quota.warnings.storage) {
      messages.push({
        type: 'warning',
        title: 'Storage Almost Full',
        message: `You have ${formatBytes(quota.available)} remaining (${quota.percentage.toFixed(1)}% used).`
      });
    }
    
    if (quota.warnings.files) {
      messages.push({
        type: 'warning',
        title: 'File Limit Approaching',
        message: `You have ${quota.maxFiles - quota.fileCount} file slots remaining.`
      });
    }
    
    if (quota.warnings.daily) {
      messages.push({
        type: 'warning',
        title: 'Daily Upload Limit Near',
        message: `You have ${formatBytes(quota.daily.remaining)} remaining for today.`
      });
    }
    
    if (quota.isOverLimit) {
      messages.push({
        type: 'error',
        title: 'Storage Full',
        message: 'You have used all your storage. Delete files to continue uploading.'
      });
    }
    
    return messages;
  }, [quota]);

  // Get file type breakdown
  const getFileTypeBreakdown = useCallback(() => {
    const total = quota.used;
    const breakdown = [];
    
    for (const [type, data] of Object.entries(quota.byType)) {
      if (data.count > 0) {
        breakdown.push({
          type,
          count: data.count,
          size: data.size,
          percentage: total > 0 ? ((data.size / total) * 100).toFixed(1) : 0
        });
      }
    }
    
    return breakdown.sort((a, b) => b.size - a.size);
  }, [quota.byType, quota.used]);

  // Refresh quota
  const refreshQuota = useCallback(() => {
    fetchQuota();
  }, [fetchQuota]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchQuota();
      
      // Refresh every 5 minutes
      const interval = setInterval(fetchQuota, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, fetchQuota]);

  return {
    // Data
    ...quota,
    
    // Methods
    fetchQuota,
    refreshQuota,
    canUpload,
    canUploadMultiple,
    formatBytes,
    
    // Status
    storageStatus: getStorageStatus(),
    dailyStatus: getDailyStatus(),
    filesStatus: getFilesStatus(),
    warningMessages: getWarningMessages(),
    fileTypeBreakdown: getFileTypeBreakdown(),
    
    // Color helpers - now properly returned
    getQuotaColor,
    getQuotaBgColor,
    getQuotaTextColor
  };
};

export default useQuota;