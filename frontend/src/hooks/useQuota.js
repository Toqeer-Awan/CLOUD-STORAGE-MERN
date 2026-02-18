import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../redux/api/api';
import useToast from './useToast';

const useQuota = () => {
  const [quota, setQuota] = useState({
    used: 0,
    total: 0,
    available: 0,
    daily: { limit: 0, used: 0 },
    entitlements: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);
  const toast = useToast();

  const fetchQuota = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/quota');
      setQuota(response.data);
    } catch (error) {
      console.error('Failed to fetch quota:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const canUpload = useCallback((size) => {
    return quota.available >= size;
  }, [quota.available]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getUsagePercentage = useCallback(() => {
    if (quota.total === 0) return 0;
    return Math.min((quota.used / quota.total) * 100, 100);
  }, [quota.used, quota.total]);

  useEffect(() => {
    if (user) {
      fetchQuota();
    }
  }, [user, fetchQuota]);

  return {
    ...quota,
    loading,
    fetchQuota,
    canUpload,
    formatBytes,
    usagePercentage: getUsagePercentage(),
    isNearLimit: quota.available < quota.total * 0.1, // 10% remaining
    isOverLimit: quota.available <= 0
  };
};

export default useQuota;