import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addFile } from '../redux/slices/fileSlice';
import useToast from '../hooks/useToast';
import uploadService from '../services/uploadService';
import { userAPI } from '../redux/api/api';
import { MdUpload, MdCloud, MdWarning, MdStorage } from "react-icons/md";

const Upload = () => {
  const [files, setLocalFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [quota, setQuota] = useState({
    used: 0,
    total: 0,
    available: 0,
    percentage: 0
  });
  const [loadingQuota, setLoadingQuota] = useState(true);
  const [quotaError, setQuotaError] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const toast = useToast();

  // Fetch fresh quota data on component mount
  const fetchQuota = async () => {
    try {
      setLoadingQuota(true);
      setQuotaError(false);
      console.log('📡 Fetching quota for user:', user?._id);
      const response = await userAPI.getQuota();
      console.log('📊 Quota Data:', response.data);
      setQuota(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch quota:', error);
      setQuotaError(true);
      // Set default values based on user role if API fails
      if (user?.role === 'admin') {
        setQuota({
          used: 0,
          total: 50 * 1024 * 1024 * 1024, // 50GB
          available: 50 * 1024 * 1024 * 1024,
          percentage: 0
        });
      } else if (user?.role === 'user') {
        // For regular users, they might have allocated storage
        setQuota({
          used: 0,
          total: user?.storageAllocated || 0,
          available: user?.storageAllocated || 0,
          percentage: 0
        });
      }
    } finally {
      setLoadingQuota(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchQuota();
    }
  }, [user]);

  const handleFileSelect = (selectedFiles) => {
    const newFiles = Array.from(selectedFiles).map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      formattedSize: formatBytes(file.size),
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      progress: 0,
      status: 'pending',
      error: null
    }));
    
    // Check total size against available quota
    const totalSize = newFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > quota.available) {
      toast.error(`Not enough space. Available: ${formatBytes(quota.available)}`);
      return;
    }
    
    setLocalFiles(prev => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} file(s) selected`);
  };

  const handleDragOver = (e) => { 
    e.preventDefault(); 
    setIsDragging(true); 
  };

  const handleDragLeave = (e) => { 
    e.preventDefault(); 
    setIsDragging(false); 
  };

  const handleDrop = (e) => { 
    e.preventDefault(); 
    setIsDragging(false); 
    handleFileSelect(e.dataTransfer.files); 
  };

  const handleFileInput = (e) => { 
    handleFileSelect(e.target.files); 
    e.target.value = ''; 
  };

  const removeFile = (fileId) => {
    setLocalFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const uploadFile = async (fileData) => {
    try {
      setLocalFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'uploading' } : f
      ));

      const result = await uploadService.uploadFile(fileData.file, ({ progress }) => {
        setLocalFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, progress } : f
        ));
      });

      setLocalFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, progress: 100, status: 'completed' } : f
      ));

      return { success: true, file: result.file };
    } catch (error) {
      setLocalFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'failed', error: error.message } : f
      ));
      return { success: false, error: error.message };
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading(`Uploading ${files.length} file(s)...`);

    const results = await Promise.all(files.map(file => uploadFile(file)));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    toast.dismiss(loadingToast);

    if (successful > 0) {
      toast.success(`${successful} file(s) uploaded successfully`);
      // Refresh quota after successful uploads
      await fetchQuota();
    }
    if (failed > 0) {
      toast.error(`${failed} file(s) failed to upload`);
    }

    // Remove successful files from list
    setLocalFiles(prev => prev.filter(file => 
      !results.some(r => r.success && r.file?.name === file.name)
    ));

    setIsUploading(false);
  };

  const formatBytes = (bytes) => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 GB';
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  // Determine color based on quota percentage
  const getQuotaColor = () => {
    const percentage = quota.percentage || 0;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Check if user can upload
  const canUploadAny = user?.role === 'superAdmin' || user?.permissions?.upload === true;

  if (!canUploadAny) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <MdWarning className="mx-auto text-5xl text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">You don't have permission to upload files</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Quota Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Upload to Cloud Storage
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Files upload directly to Backblaze B2
            </p>
          </div>
          
          {/* Quota Card - Now Dynamic */}
          
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging 
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
            : 'border-gray-300 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-600'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <MdCloud className="mx-auto text-6xl text-gray-400 dark:text-gray-600 mb-4" />
        <p className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
          Drag & drop files here
        </p>
        <p className="text-gray-500 dark:text-gray-500 mb-6">
          or click to browse files from your computer
        </p>
        
        <input 
          type="file" 
          id="file-upload" 
          multiple 
          onChange={handleFileInput} 
          className="hidden" 
          disabled={isUploading || quota.available <= 0}
        />
        
        <label
          htmlFor="file-upload"
          className={`inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg cursor-pointer transition-colors ${
            isUploading || quota.available <= 0
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-orange-700'
          }`}
        >
          <MdUpload className="mr-2" /> Browse Files
        </label>
        
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
          Max file size: 5GB (multipart upload for larger files)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {files.length} file(s) selected
              </span>
              <span className="ml-4 text-sm text-gray-500">
                Total: {formatBytes(files.reduce((sum, f) => sum + f.size, 0))}
              </span>
            </div>
            
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <MdUpload className="mr-2" /> Upload to B2
                </>
              )}
            </button>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {files.map(file => (
              <div key={file.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-gray-800 dark:text-white font-medium">{file.name}</span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        ({file.formattedSize})
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    {file.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{file.progress}% uploaded</p>
                      </div>
                    )}
                    
                    {/* Error message */}
                    {file.status === 'failed' && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        Failed: {file.error || 'Upload failed'}
                      </p>
                    )}
                  </div>
                  
                  {/* Status icon */}
                  <div className="ml-4">
                    {file.status === 'completed' && (
                      <span className="text-green-500">✅</span>
                    )}
                    {file.status === 'failed' && (
                      <button
                        onClick={() => uploadFile(file)}
                        className="text-orange-600 hover:text-orange-700 text-sm"
                      >
                        Retry
                      </button>
                    )}
                    {file.status === 'pending' && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;