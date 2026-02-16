import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FileTable from '../components/FileTable';
import { addFile } from '../redux/slices/fileSlice';
import { fileAPI } from '../redux/api/api';
import useToast from '../hooks/useToast';
import { MdUpload, MdCloud, MdWarning } from "react-icons/md";

const Upload = () => {
  const [files, setLocalFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const toast = useToast();

  const handleFileSelect = (selectedFiles) => {
    const newFiles = Array.from(selectedFiles).map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2),
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      progress: 0,
      status: 'pending'
    }));
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
    toast.info('File removed');
  };

  const uploadFile = async (fileData) => {
    const formData = new FormData();
    formData.append('file', fileData.file);

    try {
      // Update progress
      setLocalFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'uploading', progress: 50 } : f
      ));

      const response = await fileAPI.uploadToS3(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setLocalFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, progress: percentCompleted } : f
        ));
      });

      setLocalFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, progress: 100, status: 'completed' } : f
      ));

      dispatch(addFile(response.data.file));
      return { success: true, fileName: fileData.name };
    } catch (error) {
      setLocalFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'failed', progress: 0 } : f
      ));
      return { 
        success: false, 
        fileName: fileData.name, 
        error: error.response?.data?.error || error.message 
      };
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
    }
    if (failed > 0) {
      toast.error(`${failed} file(s) failed to upload`);
    }

    // Remove successful files from list
    setLocalFiles(prev => prev.filter(file => 
      !results.some(r => r.success && r.fileName === file.name)
    ));

    setIsUploading(false);
  };

  // Check if user has upload permission
  const canUpload = user?.role === 'superAdmin' || user?.permissions?.upload === true;

  if (!canUpload) {
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Upload Files to S3</h1>
        <p className="text-gray-600 dark:text-gray-400">Upload files to Amazon S3 cloud storage</p>
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
          disabled={isUploading}
        />
        
        <label
          htmlFor="file-upload"
          className={`inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg cursor-pointer transition-colors ${
            isUploading 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-orange-700'
          }`}
        >
          <MdUpload className="mr-2" /> Browse Files
        </label>
        
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
          Maximum file size: 100MB per file
        </p>
      </div>

      {/* File List Header */}
      {files.length > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            {files.length} file(s) selected
          </span>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setLocalFiles([]);
                toast.info('All files cleared');
              }}
              disabled={isUploading}
              className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              Clear All
            </button>
            
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center transition-colors"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <MdUpload className="mr-2" /> Upload to S3
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* File Table */}
      {files.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <FileTable 
            files={files} 
            onRemoveFile={removeFile} 
            isUploading={isUploading} 
          />
        </div>
      )}
    </div>
  );
};

export default Upload;