import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  MdDelete, MdImage, MdPictureAsPdf, MdDescription, MdVideoLibrary,
  MdInsertDriveFile, MdStorage, MdDownload, MdVisibility, MdLock,
} from 'react-icons/md';

const FileTable = ({ files = [], onRemoveFile, isUploading = false }) => {
  const { user } = useSelector((state) => state.auth || {});
  const [downloadingId, setDownloadingId] = useState(null);

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <MdImage className="text-blue-500 text-2xl" />;
    if (type === 'application/pdf') return <MdPictureAsPdf className="text-red-500 text-2xl" />;
    if (type?.startsWith('video/')) return <MdVideoLibrary className="text-purple-500 text-2xl" />;
    if (type?.includes('document') || type?.includes('word') || type?.includes('text'))
      return <MdDescription className="text-green-500 text-2xl" />;
    return <MdInsertDriveFile className="text-gray-500 text-2xl" />;
  };

  const getFileType = (type) => {
    if (type?.startsWith('image/')) return 'Image';
    if (type === 'application/pdf') return 'PDF';
    if (type?.startsWith('video/')) return 'Video';
    if (type?.includes('document')) return 'Document';
    return 'Other';
  };

  const canDeleteFile = (file) => {
    if (!user) return false;
    const isOwner = file.uploadedById === user?._id || file.uploadedBy?._id === user?._id;
    if (user?.role === 'admin') return true;
    if (user?.permissions?.delete) return true;
    return false;
  };

  const canDownload = user?.role === 'admin' || user?.permissions?.download;
  const canView = user?.role === 'admin' || user?.permissions?.view;

  const handleDownload = async (file) => {
    if (!canDownload) {
      alert('No download permission');
      return;
    }
    const fileId = file.id || file._id;
    setDownloadingId(fileId);
    try {
      const fileUrl = file.downloadUrl || file.storageUrl || file.preview;
      if (!fileUrl) {
        alert('URL not available');
        return;
      }
      let downloadUrl = fileUrl;
      if (fileUrl.includes('cloudinary.com') && !fileUrl.includes('fl_attachment')) {
        downloadUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
      }
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name || 'download';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setTimeout(() => setDownloadingId(null), 800);
    }
  };

  const handleView = (file) => {
    if (!canView) {
      alert('No view permission');
      return;
    }
    const viewUrl = file.storageUrl || file.preview;
    if (viewUrl) window.open(viewUrl, '_blank');
  };

  if (!files.length) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <MdInsertDriveFile className="mx-auto text-5xl text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No files available</h3>
        <p className="text-gray-500">No files have been uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">File</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Type</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Size</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {files.map((file, index) => {
            const fileId = file.id || file._id || `${file.name}-${index}`;
            const userCanDelete = canDeleteFile(file);
            return (
              <tr key={fileId} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded mr-3">
                      {getFileIcon(file.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 truncate max-w-xs">{file.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MdStorage className="text-xs text-blue-600" />
                        <p className="text-xs text-gray-500">
                          {file.storageUrl?.includes('cloudinary.com') ? 'Cloudinary' : 'S3'}
                        </p>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {getFileType(file.type)}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {typeof file.size === 'number' ? `${file.size.toFixed(2)} MB` : `${file.size || '0.00'} MB`}
                </td>
                <td className="py-3 px-4">
                  {downloadingId === fileId ? (
                    <span className="text-yellow-600 text-sm font-medium">Downloading...</span>
                  ) : (
                    <span className="text-green-600 text-sm font-medium">Ready</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(file)}
                      disabled={!canView}
                      className={`px-3 py-1.5 text-sm rounded flex items-center gap-1 ${
                        !canView ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      <MdVisibility /> {!canView ? 'Locked' : 'View'}
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={isUploading || downloadingId === fileId || !canDownload}
                      className={`px-3 py-1.5 text-sm rounded flex items-center gap-1 ${
                        isUploading || downloadingId === fileId || !canDownload
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {!canDownload ? <><MdLock /> Locked</> : <><MdDownload /> Download</>}
                    </button>
                    {userCanDelete ? (
                      <button
                        onClick={() => onRemoveFile?.(fileId)}
                        disabled={isUploading || downloadingId === fileId}
                        className="text-red-600 hover:bg-red-50 p-1.5 rounded-full"
                      >
                        <MdDelete className="text-xl" />
                      </button>
                    ) : (
                      <MdLock className="text-gray-400 text-xl" />
                    )}
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