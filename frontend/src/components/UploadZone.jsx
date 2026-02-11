import React from 'react';
import { MdUpload, MdCloud, MdStorage } from "react-icons/md";

const UploadZone = ({ isDragging, onDragOver, onDragLeave, onDrop, onFileSelect, uploadType }) => {
  const handleFileInput = (e) => {
    if (e.target.files.length > 0) onFileSelect(e.target.files);
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="mb-4">
        {uploadType === 'cloudinary' ? (
          <MdCloud className="mx-auto text-5xl text-green-400 mb-4" />
        ) : (
          <MdCloud className="mx-auto text-5xl text-orange-400 mb-4" />
        )}
        <p className="text-lg font-medium text-gray-700 mb-2">Drag & drop files here</p>
        <p className="text-gray-500 mb-4">or click to browse files from your computer</p>
      </div>
      <input type="file" id="file-upload" multiple onChange={handleFileInput} className="hidden" />
      <label
        htmlFor="file-upload"
        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
      >
        <MdUpload className="mr-2" /> Browse Files
      </label>
      <p className="text-sm text-gray-500 mt-4">Maximum file size: 100MB per file</p>
    </div>
  );
};

export default UploadZone;