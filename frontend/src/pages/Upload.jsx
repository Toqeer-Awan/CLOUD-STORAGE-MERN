import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FileTable from '../components/FileTable';
import { addFile } from '../redux/slices/fileSlice';
import { fileAPI } from '../redux/api/api';
import useToast from '../hooks/useToast';
import { MdUpload, MdCloud } from "react-icons/md";

const Upload = () => {
  const [files, setLocalFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadType, setUploadType] = useState('cloudinary');
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
      status: 'pending',
      uploadedBy: user?.username,
      uploadedAt: new Date().toISOString()
    }));
    setLocalFiles(prev => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} file(s) selected`);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files); };
  const handleFileInput = (e) => { handleFileSelect(e.target.files); e.target.value = ''; };
  
  const removeFile = (fileId) => {
    setLocalFiles(prev => prev.filter(file => file.id !== fileId));
    toast.info('File removed');
  };

  const uploadFile = async (fileData) => {
    const formData = new FormData();
    formData.append('file', fileData.file);
    try {
      const response = uploadType === 'cloudinary'
        ? await fileAPI.uploadToCloudinary(formData)
        : await fileAPI.uploadToS3(formData);
      
      setLocalFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, progress: 100 } : f));
      dispatch(addFile(response.data.file));
      return { success: true, fileName: fileData.name };
    } catch (error) {
      return { success: false, fileName: fileData.name, error: error.message };
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
      toast.uploadSuccess(`${successful} file(s) uploaded successfully`);
    }
    if (failed > 0) {
      toast.error(`${failed} file(s) failed to upload`);
    }

    setLocalFiles(prev => prev.filter(file => 
      !results.some(r => r.success && r.fileName === file.name)
    ));
    setIsUploading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Upload Files</h1>
        <p className="text-gray-600">Upload files to your preferred cloud storage</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Cloud Storage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setUploadType('cloudinary')}
            className={`flex items-center p-4 border-2 rounded-lg ${
              uploadType === 'cloudinary' ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}
          >
            <MdCloud className={`text-2xl ${uploadType === 'cloudinary' ? 'text-green-600' : 'text-gray-600'} mr-3`} />
            <div className="text-left">
              <p className="font-medium text-gray-800">Cloudinary</p>
              <p className="text-sm text-gray-500">Best for images & videos</p>
            </div>
          </button>
          <button
            onClick={() => setUploadType('s3')}
            className={`flex items-center p-4 border-2 rounded-lg ${
              uploadType === 's3' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
            }`}
          >
            <MdCloud className={`text-2xl ${uploadType === 's3' ? 'text-orange-600' : 'text-gray-600'} mr-3`} />
            <div className="text-left">
              <p className="font-medium text-gray-800">Amazon S3</p>
              <p className="text-sm text-gray-500">Secure cloud storage</p>
            </div>
          </button>
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <MdUpload className="mx-auto text-5xl text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">Drag & drop files here</p>
        <p className="text-gray-500 mb-6">or click to browse files from your computer</p>
        <input type="file" id="file-upload" multiple onChange={handleFileInput} className="hidden" />
        <label
          htmlFor="file-upload"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          <MdUpload className="mr-2" /> Browse Files
        </label>
        <p className="text-sm text-gray-500 mt-4">Maximum file size: 100MB per file</p>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-gray-700 font-medium">{files.length} file(s) selected</span>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setLocalFiles([]);
              toast.info('All files cleared');
            }}
            disabled={files.length === 0 || isUploading}
            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Clear All
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <MdUpload className="mr-2" /> Upload
              </>
            )}
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <FileTable files={files} onRemoveFile={removeFile} isUploading={isUploading} />
        </div>
      )}
    </div>
  );
};

export default Upload;