import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  MdDelete, MdImage, MdPictureAsPdf, MdDescription, MdVideoLibrary,
  MdInsertDriveFile, MdDownload, MdVisibility, MdCloud
} from 'react-icons/md';
import useToast from '../hooks/useToast';
import downloadService from '../services/downloadService';

const FileTable = ({ files = [], onRemoveFile, isUploading = false }) => {
  const { user } = useSelector((state) => state.auth);
  const [downloadingId, setDownloadingId] = useState(null);
  const toast = useToast();

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <MdImage className="text-blue-500 dark:text-blue-400 text-2xl" />;
    if (type === 'application/pdf') return <MdPictureAsPdf className="text-red-500 dark:text-red-400 text-2xl" />;
    if (type?.startsWith('video/')) return <MdVideoLibrary className="text-purple-500 dark:text-purple-400 text-2xl" />;
    if (type?.includes('document') || type?.includes('word') || type?.includes('text'))
      return <MdDescription className="text-green-500 dark:text-green-400 text-2xl" />;
    return <MdInsertDriveFile className="text-gray-500 dark:text-gray-400 text-2xl" />;
  };

  const getFileType = (type) => {
    if (type?.startsWith('image/')) return 'Image';
    if (type === 'application/pdf') return 'PDF';
    if (type?.startsWith('video/')) return 'Video';
    if (type?.includes('document') || type?.includes('word') || type?.includes('text')) return 'Document';
    return 'Other';
  };

  // 🔥 FIXED: Convert bytes to MB for display
  const formatSize = (bytes) => {
    if (bytes === 0 || !bytes || isNaN(bytes)) return '0 MB';
    
    const mb = bytes / (1024 * 1024);
    if (mb < 0.01) return '< 0.01 MB';
    return mb.toFixed(2) + ' MB';
  };

  // 🔥 FIXED: Proper date formatting
  const formatDate = (dateInput) => {
    if (!dateInput) return 'Unknown date';
    
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return 'Unknown date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const handleView = async (file) => {
    const fileId = file.id || file._id;
    try {
      await downloadService.viewFile(fileId, file.displayName || file.name);
    } catch (error) {
      toast.error('Failed to open file');
    }
  };

  const handleDownload = async (file) => {
    const fileId = file.id || file._id;
    setDownloadingId(fileId);
    
    try {
      await downloadService.downloadFile(fileId, file.displayName || file.name || 'download');
      toast.success(`Downloading ${file.displayName || file.name}`);
    } catch (error) {
      toast.error('Download failed');
    } finally {
      setTimeout(() => setDownloadingId(null), 800);
    }
  };

  if (!files || files.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
        <MdInsertDriveFile className="mx-auto text-5xl text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          No files found
        </h3>
        <p className="text-gray-500 dark:text-gray-500">
          Upload your first file to get started
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">File</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Type</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Size</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Uploaded</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {files.map((file, index) => {
            const fileId = file.id || file._id || `${file.name}-${index}`;
            
            // Use displayName if available (without path), otherwise use name
            const displayName = file.displayName || file.name || 'Unnamed file';
            const fullPath = file.path || file.name || '';
            
            return (
              <tr key={fileId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded mr-3">
                      {getFileIcon(file.type)}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800 dark:text-white block max-w-xs truncate" title={fullPath}>
                        {displayName}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <MdCloud className="text-xs text-orange-500 dark:text-orange-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-500">Backblaze B2</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                    {getFileType(file.type)}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-sm">
                  {formatSize(file.size)}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                  {formatDate(file.uploadedAt)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(file)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="View"
                    >
                      <MdVisibility size={18} />
                    </button>
                    
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={downloadingId === fileId}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Download"
                    >
                      {downloadingId === fileId ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 dark:border-green-400"></div>
                      ) : (
                        <MdDownload size={18} />
                      )}
                    </button>
                    
                    <button
                      onClick={() => onRemoveFile?.(fileId)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <MdDelete size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FileTable;