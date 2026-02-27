import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../redux/api/api';
import useToast from './useToast';

const useQuota = () => {
  const [quota, setQuota] = useState({
    used: 0,
    total: 0,
    available: 0,
    percentage: 0,
    fileCount: 0,
    maxFiles: 100,
    daily: {
      used: 0,
      limit: 1073741824, // 1GB
      remaining: 1073741824,
      uploadCount: 0,
      downloadCount: 0
    },
    plan: 'free',
    isNearLimit: false,
    isOverLimit: false,
    byType: {
      images: { count: 0, size: 0 },
      videos: { count: 0, size: 0 },
      pdfs: { count: 0, size: 0 },
      documents: { count: 0, size: 0 },
      others: { count: 0, size: 0 }
    },
    limits: {
      maxFileSize: 104857600, // 100MB
      maxFiles: 100,
      dailyUpload: 1073741824 // 1GB
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const toast = useToast();

  const fetchQuota = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/users/quota');
      setQuota(response.data);
    } catch (error) {
      console.error('Failed to fetch quota:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const canUpload = useCallback((size, fileType = '') => {
    // Check storage space
    if (quota.available < size) {
      return {
        allowed: false,
        reason: 'storage',
        message: `Insufficient storage. Need ${formatBytes(size)} more.`
      };
    }
    
    // Check file count
    if (quota.fileCount >= quota.maxFiles) {
      return {
        allowed: false,
        reason: 'fileCount',
        message: `Maximum file limit (${quota.maxFiles}) reached.`
      };
    }
    
    // Check file size
    if (size > quota.limits.maxFileSize) {
      return {
        allowed: false,
        reason: 'fileSize',
        message: `File too large. Maximum size is ${formatBytes(quota.limits.maxFileSize)}.`
      };
    }
    
    // Check daily limit
    if (quota.daily.used + size > quota.daily.limit) {
      const remaining = quota.daily.limit - quota.daily.used;
      return {
        allowed: false,
        reason: 'daily',
        message: `Daily upload limit exceeded. ${formatBytes(remaining)} remaining today.`
      };
    }
    
    return { allowed: true };
  }, [quota]);

  const getStorageColor = useCallback(() => {
    const percentage = quota.percentage;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  }, [quota.percentage]);

  const getProgressBarColor = useCallback(() => {
    const percentage = quota.percentage;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  }, [quota.percentage]);

  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getUsagePercentage = useCallback(() => {
    return quota.percentage || 0;
  }, [quota.percentage]);

  const getDailyUsagePercentage = useCallback(() => {
    if (quota.daily.limit === 0) return 0;
    return ((quota.daily.used / quota.daily.limit) * 100).toFixed(1);
  }, [quota.daily]);

  const resetDailyQuota = useCallback(() => {
    // This would be called by a cron job or at midnight
    fetchQuota();
  }, [fetchQuota]);

  useEffect(() => {
    if (user) {
      fetchQuota();
      
      // Refresh quota every 5 minutes
      const interval = setInterval(fetchQuota, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, fetchQuota]);

  return {
    ...quota,
    loading,
    error,
    fetchQuota,
    canUpload,
    formatBytes,
    getStorageColor,
    getProgressBarColor,
    usagePercentage: getUsagePercentage(),
    dailyUsagePercentage: getDailyUsagePercentage(),
    isNearLimit: quota.isNearLimit,
    isOverLimit: quota.isOverLimit,
    resetDailyQuota
  };
};

export default useQuota;