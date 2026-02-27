import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addFile } from '../redux/slices/fileSlice';
import useToast from '../hooks/useToast';
import uploadService from '../services/uploadService';
import api from '../redux/api/api'; // Changed from { userAPI }
import { 
  MdUpload, MdCloud, MdWarning, MdStorage, 
  MdFolder, MdInsertDriveFile, MdCheckCircle,
  MdError, MdClose, MdRefresh, MdImage, MdVideoLibrary,
  MdPictureAsPdf, MdDescription, MdAudioFile, MdArchive
} from "react-icons/md";
import { FaFileExcel, FaFileWord, FaFilePowerpoint, FaFileArchive } from 'react-icons/fa';

const Upload = () => {
  const [files, setLocalFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [quota, setQuota] = useState({
    used: 0,
    total: 5 * 1024 * 1024 * 1024,
    available: 5 * 1024 * 1024 * 1024,
    percentage: 0,
    fileCount: 0,
    maxFiles: 100,
    daily: {
      used: 0,
      limit: 1 * 1024 * 1024 * 1024,
      remaining: 1 * 1024 * 1024 * 1024,
      count: 0
    },
    warnings: {
      storage: false,
      files: false,
      daily: false
    },
    isNearLimit: false,
    isOverLimit: false
  });
  const [loadingQuota, setLoadingQuota] = useState(true);
  const [quotaError, setQuotaError] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const toast = useToast();

  const fetchQuota = useCallback(async () => {
    try {
      setLoadingQuota(true);
      setQuotaError(false);
      const response = await api.get('/users/quota'); // Changed from userAPI.getQuota()
      setQuota(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch quota:', error);
      setQuotaError(true);
    } finally {
      setLoadingQuota(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchQuota();
    }
  }, [user, fetchQuota]);

  // Format bytes helper
  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    const type = file.type || '';
    const name = file.name || '';
    const ext = name.split('.').pop()?.toLowerCase() || '';
    
    if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
      return <MdImage className="text-blue-500 dark:text-blue-400 text-2xl" />;
    }
    
    if (type.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) {
      return <MdVideoLibrary className="text-purple-500 dark:text-purple-400 text-2xl" />;
    }
    
    if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
      return <MdAudioFile className="text-pink-500 dark:text-pink-400 text-2xl" />;
    }
    
    if (type === 'application/pdf' || ext === 'pdf') {
      return <MdPictureAsPdf className="text-red-500 dark:text-red-400 text-2xl" />;
    }
    
    if (type.includes('word') || ['doc', 'docx'].includes(ext)) {
      return <FaFileWord className="text-blue-600 dark:text-blue-400 text-2xl" />;
    }
    
    if (type.includes('excel') || type.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FaFileExcel className="text-green-600 dark:text-green-400 text-2xl" />;
    }
    
    if (type.includes('powerpoint') || type.includes('presentation') || ['ppt', 'pptx'].includes(ext)) {
      return <FaFilePowerpoint className="text-orange-600 dark:text-orange-400 text-2xl" />;
    }
    
    if (type.includes('zip') || type.includes('compressed') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FaFileArchive className="text-yellow-600 dark:text-yellow-400 text-2xl" />;
    }
    
    if (type.includes('text') || ext === 'txt') {
      return <MdDescription className="text-gray-500 dark:text-gray-400 text-2xl" />;
    }
    
    if (file.path && file.path.includes('/')) {
      return <MdFolder className="text-yellow-500 dark:text-yellow-400 text-2xl" />;
    }
    
    return <MdInsertDriveFile className="text-gray-500 dark:text-gray-400 text-2xl" />;
  };

  const getFileTypeDisplay = (file) => {
    const type = file.type || '';
    const name = file.name || '';
    const ext = name.split('.').pop()?.toLowerCase() || '';
    
    if (type.startsWith('image/')) return 'Image';
    if (type.startsWith('video/')) return 'Video';
    if (type.startsWith('audio/')) return 'Audio';
    if (type === 'application/pdf' || ext === 'pdf') return 'PDF';
    if (type.includes('word') || ['doc', 'docx'].includes(ext)) return 'Word Document';
    if (type.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) return 'Excel Spreadsheet';
    if (type.includes('powerpoint') || ['ppt', 'pptx'].includes(ext)) return 'PowerPoint';
    if (type.includes('zip') || ['zip', 'rar', '7z'].includes(ext)) return 'Archive';
    if (type.includes('text') || ext === 'txt') return 'Text File';
    if (type) return type.split('/').pop()?.toUpperCase() || 'File';
    return 'File';
  };

  const handleFolderDrop = async (items) => {
    const files = [];
    
    const traverseDirectory = async (entry, path = '') => {
      if (entry.isFile) {
        const file = await new Promise((resolve) => entry.file(resolve));
        file._relativePath = path ? `${path}/${file.name}` : file.name;
        files.push(file);
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const entries = await new Promise((resolve) => {
          dirReader.readEntries(resolve);
        });
        
        for (const childEntry of entries) {
          const newPath = path ? `${path}/${entry.name}` : entry.name;
          await traverseDirectory(childEntry, newPath);
        }
      }
    };

    try {
      for (const item of items) {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          await traverseDirectory(entry);
        }
      }
      
      if (files.length > 0) {
        handleFileSelect(files);
      }
    } catch (error) {
      console.error('Error processing folder:', error);
      toast.error('Failed to process folder');
    }
  };

  const handleDragOver = (e) => { 
    e.preventDefault(); 
    setIsDragging(true); 
  };

  const handleDragLeave = (e) => { 
    e.preventDefault(); 
    setIsDragging(false); 
  };

  const handleDrop = async (e) => { 
    e.preventDefault(); 
    setIsDragging(false); 
    
    const items = e.dataTransfer.items;
    
    if (items) {
      let hasFolder = false;
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (entry && entry.isDirectory) {
          hasFolder = true;
          break;
        }
      }
      
      if (hasFolder) {
        await handleFolderDrop(items);
      } else {
        handleFileSelect(e.dataTransfer.files);
      }
    }
  };

  const handleFileSelect = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    
    // Check each file against quota
    for (const file of fileArray) {
      // Check file size
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 100MB limit`);
        return;
      }
      
      // Check total size against available quota
      const totalSize = fileArray.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > quota.available) {
        toast.error(`Not enough space. Available: ${formatBytes(quota.available)}`);
        return;
      }
      
      // Check file count
      if (quota.fileCount + fileArray.length > quota.maxFiles) {
        toast.error(`Cannot add ${fileArray.length} files. Only ${quota.maxFiles - quota.fileCount} slots remaining`);
        return;
      }
      
      // Check daily limit
      if (quota.daily.used + totalSize > quota.daily.limit) {
        const remaining = quota.daily.limit - quota.daily.used;
        toast.error(`Daily upload limit exceeded. ${formatBytes(remaining)} remaining today`);
        return;
      }
    }
    
    const newFiles = fileArray.map(file => ({
      id: Date.now() + Math.random() + file.name,
      file,
      name: file.name,
      path: file._relativePath || file.name,
      size: file.size,
      formattedSize: formatBytes(file.size),
      type: file.type,
      status: 'pending',
      progress: 0,
      error: null
    }));

    setLocalFiles(prev => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} file(s) selected`);
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

      const pathParts = fileData.path.split('/');
      const folderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
      
      const result = await uploadService.uploadFile(fileData.file, ({ progress }) => {
        setLocalFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, progress } : f
        ));
      }, folderPath);

      setLocalFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, progress: 100, status: 'completed' } : f
      ));

      return { success: true, file: result.file };
    } catch (error) {
      console.error('Upload error:', error);
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
    setUploadProgress(0);
    
    let completed = 0;
    const results = [];

    for (const file of files) {
      if (file.status === 'pending') {
        const result = await uploadFile(file);
        results.push(result);
        completed++;
        setUploadProgress(Math.round((completed / files.length) * 100));
      }
    }
    
    const successful = results.filter(r => r?.success).length;
    const failed = results.filter(r => r && !r.success).length;

    if (successful > 0) {
      toast.success(`${successful} file(s) uploaded successfully`);
      await fetchQuota();
    }
    if (failed > 0) {
      toast.error(`${failed} file(s) failed to upload`);
    }

    setLocalFiles(prev => prev.filter(file => 
      !results.some(r => r?.success && r.file?.name === file.name)
    ));

    setIsUploading(false);
    setUploadProgress(100);
  };

  const clearAll = () => {
    setLocalFiles([]);
    toast.info('All files cleared');
  };

  const getQuotaColor = () => {
    const percentage = quota.percentage || 0;
    if (percentage >= 95) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const canUploadAny = user?.role === 'admin' || user?.permissions?.upload === true;

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
              Upload Files & Folders
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Drag & drop files or folders, or click Browse Files
            </p>
          </div>
          
          {/* Quota Card */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-w-[300px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MdStorage className="text-blue-500 dark:text-blue-400 text-xl" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Storage
                </span>
              </div>
              {loadingQuota ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
              ) : quotaError ? (
                <span className="text-sm text-red-500">Error loading</span>
              ) : (
                <span className={`text-lg font-bold ${
                  quota.available <= 0 ? 'text-red-500' : 
                  quota.isNearLimit ? 'text-yellow-500' : 'text-green-500'
                }`}>
                  {formatBytes(quota.available)}
                </span>
              )}
            </div>
            
            {!quotaError && (
              <>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-1">
                  <div 
                    className={`${getQuotaColor()} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(quota.percentage || 0, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Used: {formatBytes(quota.used)}</span>
                  <span>Total: {formatBytes(quota.total)}</span>
                </div>

                {/* File count */}
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>Files: {quota.fileCount}/{quota.maxFiles}</span>
                  <span>{quota.maxFiles - quota.fileCount} remaining</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quota Warning Messages */}
        {!loadingQuota && !quotaError && (
          <>
            {quota.warnings?.storage && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ Storage almost full: {quota.percentage.toFixed(1)}% used ({formatBytes(quota.available)} remaining)
                </p>
              </div>
            )}
            
            {quota.warnings?.files && (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ Only {quota.maxFiles - quota.fileCount} file slots remaining
                </p>
              </div>
            )}
            
            {quota.warnings?.daily && (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ Daily upload limit: {formatBytes(quota.daily.remaining)} remaining today
                </p>
              </div>
            )}
            
            {quota.isOverLimit && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-300">
                  ❌ Storage full. Delete files to continue uploading.
                </p>
              </div>
            )}
          </>
        )}

        {/* Daily Usage Progress */}
        {!loadingQuota && !quotaError && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">Daily Upload</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {formatBytes(quota.daily.used)} / {formatBytes(quota.daily.limit)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all ${
                  (quota.daily.used / quota.daily.limit) > 0.9 ? 'bg-red-500' : 
                  (quota.daily.used / quota.daily.limit) > 0.7 ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min((quota.daily.used / quota.daily.limit) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
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
          Drag & drop files or folders here
        </p>
        <p className="text-gray-500 dark:text-gray-500 mb-6">
          or click to browse files
        </p>
        
        <input 
          type="file" 
          id="file-upload" 
          multiple 
          onChange={handleFileInput} 
          className="hidden" 
          disabled={isUploading || quota.available <= 0 || quota.fileCount >= quota.maxFiles}
        />
        
        <label
          htmlFor="file-upload"
          className={`inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg cursor-pointer transition-colors ${
            isUploading || quota.available <= 0 || quota.fileCount >= quota.maxFiles
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-orange-700'
          }`}
        >
          <MdUpload className="mr-2" /> Browse Files
        </label>
        
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
          Max file size: 100MB • Max files: {quota.maxFiles} • Daily limit: 1GB
        </p>
      </div>

      {/* Upload Progress Bar */}
      {isUploading && files.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Progress
            </span>
            <span className="text-sm text-gray-500">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-orange-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Uploading file {files.filter(f => f.status === 'uploading' || f.status === 'completed').length} of {files.length}
          </p>
        </div>
      )}

      {/* Files List */}
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
            
            <div className="flex gap-2">
              <button
                onClick={clearAll}
                disabled={isUploading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <MdUpload size={18} />
                    <span>Upload Files</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
            {files.map(file => (
              <div key={file.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                        {getFileIcon(file)}
                      </div>
                      <div>
                        <p className="text-gray-800 dark:text-white font-medium break-all">
                          {file.path}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                            {getFileTypeDisplay(file)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {file.formattedSize}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {file.status === 'uploading' && (
                      <div className="mt-2 ml-13">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="bg-orange-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{file.progress}% uploaded</p>
                      </div>
                    )}
                    
                    {file.status === 'failed' && (
                      <p className="mt-2 ml-13 text-sm text-red-600 dark:text-red-400">
                        Failed: {file.error || 'Upload failed'}
                      </p>
                    )}
                  </div>
                  
                  <div className="ml-4 flex items-center gap-2">
                    {file.status === 'completed' && (
                      <MdCheckCircle className="text-2xl text-green-500" />
                    )}
                    {file.status === 'failed' && (
                      <>
                        <button
                          onClick={() => uploadFile(file)}
                          className="p-1 text-orange-600 hover:text-orange-700"
                          title="Retry"
                        >
                          <MdRefresh size={20} />
                        </button>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <MdClose size={20} />
                        </button>
                      </>
                    )}
                    {file.status === 'pending' && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        disabled={isUploading}
                      >
                        <MdClose size={20} />
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