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
  const [viewingId, setViewingId] = useState(null);
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
    if (type?.includes('document')) return 'Document';
    return 'Other';
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (file) => {
    const fileId = file.id || file._id;
    setDownloadingId(fileId);
    
    try {
      await downloadService.downloadFile(fileId, file.name || file.originalName);
      toast.success(`Downloading ${file.name || file.originalName}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.message || 'Download failed');
    } finally {
      setTimeout(() => setDownloadingId(null), 800);
    }
  };

  const handleView = async (file) => {
    const fileId = file.id || file._id;
    setViewingId(fileId);
    
    try {
      await downloadService.viewFile(fileId, file.name || file.originalName);
    } catch (error) {
      console.error('View error:', error);
      toast.error(error.message || 'Failed to open file');
    } finally {
      setTimeout(() => setViewingId(null), 800);
    }
  };

  if (!files.length) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
        <MdInsertDriveFile className="mx-auto text-5xl text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          You have no files
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
            
            return (
              <tr key={fileId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded mr-3">
                      {getFileIcon(file.type || file.mimetype)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white truncate max-w-xs">
                        {file.name || file.originalName}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <MdCloud className="text-xs text-orange-500 dark:text-orange-400" />
                        <p className="text-xs text-gray-500 dark:text-gray-500">Backblaze B2</p>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                    {getFileType(file.type || file.mimetype)}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {formatBytes(file.size)}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                  {new Date(file.uploadedAt || file.uploadDate).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(file)}
                      disabled={isUploading || viewingId === fileId}
                      className={`p-2 rounded-lg transition-colors ${
                        isUploading || viewingId === fileId
                          ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      }`}
                      title="View"
                    >
                      {viewingId === fileId ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <MdVisibility size={18} />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={isUploading || downloadingId === fileId}
                      className={`p-2 rounded-lg transition-colors ${
                        isUploading || downloadingId === fileId
                          ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
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
                      disabled={isUploading || downloadingId === fileId}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete file"
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