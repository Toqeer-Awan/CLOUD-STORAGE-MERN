import React from 'react';
import { 
  MdImage, MdVideoLibrary, MdPictureAsPdf, 
  MdDescription, MdInsertDriveFile, MdAudioFile,
  MdArchive
} from 'react-icons/md';
import { formatBytes } from '../config/quotaConfig';

const FileTypeStats = ({ byType, totalSize, className = '' }) => {
  const getIcon = (type) => {
    switch(type) {
      case 'images': return <MdImage className="text-blue-500" />;
      case 'videos': return <MdVideoLibrary className="text-purple-500" />;
      case 'pdfs': return <MdPictureAsPdf className="text-red-500" />;
      case 'documents': return <MdDescription className="text-green-500" />;
      case 'audio': return <MdAudioFile className="text-pink-500" />;
      case 'archives': return <MdArchive className="text-yellow-500" />;
      default: return <MdInsertDriveFile className="text-gray-500" />;
    }
  };

  const getDisplayName = (type) => {
    const names = {
      images: 'Images',
      videos: 'Videos',
      pdfs: 'PDFs',
      documents: 'Documents',
      audio: 'Audio',
      archives: 'Archives',
      others: 'Others'
    };
    return names[type] || type;
  };

  const types = Object.entries(byType)
    .filter(([_, data]) => data.count > 0)
    .sort((a, b) => b[1].size - a[1].size);

  if (types.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 text-center ${className}`}>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Storage by File Type
      </h3>
      
      <div className="space-y-3">
        {types.map(([type, data]) => {
          const percentage = totalSize > 0 ? (data.size / totalSize) * 100 : 0;
          
          return (
            <div key={type}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {getIcon(type)}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {getDisplayName(type)}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mb-1">
                <span>{data.count} files</span>
                <span>{formatBytes(data.size)}</span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total</span>
          <span className="font-medium text-gray-800 dark:text-white">
            {formatBytes(totalSize)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FileTypeStats;