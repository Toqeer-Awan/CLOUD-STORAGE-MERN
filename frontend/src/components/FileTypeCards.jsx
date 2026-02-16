import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdImage,
  MdVideoLibrary,
  MdPictureAsPdf,
  MdDescription,
  MdInsertDriveFile,
  MdStorage
} from 'react-icons/md';

const FileTypeCards = ({ stats, onTypeClick }) => {
  const navigate = useNavigate();

  const handleCardClick = (type) => {
    if (onTypeClick) {
      onTypeClick(type);
    } else {
      navigate(`/files?type=${type}`);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + ' MB';
  };

  const cards = [
    {
      id: 'image',
      title: 'Images',
      icon: MdImage,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconBg: 'bg-blue-500 dark:bg-blue-600',
      textColor: 'text-blue-600 dark:text-blue-400',
      progressColor: 'bg-blue-500 dark:bg-blue-400',
      count: stats.imageCount || 0,
      size: stats.imageSize || 0,
      percentage: stats.imagePercentage || 0
    },
    {
      id: 'video',
      title: 'Videos',
      icon: MdVideoLibrary,
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconBg: 'bg-purple-500 dark:bg-purple-600',
      textColor: 'text-purple-600 dark:text-purple-400',
      progressColor: 'bg-purple-500 dark:bg-purple-400',
      count: stats.videoCount || 0,
      size: stats.videoSize || 0,
      percentage: stats.videoPercentage || 0
    },
    {
      id: 'pdf',
      title: 'PDFs',
      icon: MdPictureAsPdf,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      iconBg: 'bg-red-500 dark:bg-red-600',
      textColor: 'text-red-600 dark:text-red-400',
      progressColor: 'bg-red-500 dark:bg-red-400',
      count: stats.pdfCount || 0,
      size: stats.pdfSize || 0,
      percentage: stats.pdfPercentage || 0
    },
    {
      id: 'document',
      title: 'Documents',
      icon: MdDescription,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconBg: 'bg-green-500 dark:bg-green-600',
      textColor: 'text-green-600 dark:text-green-400',
      progressColor: 'bg-green-500 dark:bg-green-400',
      count: stats.documentCount || 0,
      size: stats.documentSize || 0,
      percentage: stats.documentPercentage || 0
    },
    {
      id: 'other',
      title: 'Other Files',
      icon: MdInsertDriveFile,
      bgColor: 'bg-gray-50 dark:bg-gray-800',
      iconBg: 'bg-gray-500 dark:bg-gray-600',
      textColor: 'text-gray-600 dark:text-gray-400',
      progressColor: 'bg-gray-500 dark:bg-gray-400',
      count: stats.otherCount || 0,
      size: stats.otherSize || 0,
      percentage: stats.otherPercentage || 0
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 h-full overflow-y-auto">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-2">
          Files by Category
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {cards.map((card) => {
            const Icon = card.icon;
            
            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`${card.bgColor} rounded-lg p-2 cursor-pointer transform transition-all duration-200 hover:scale-[1.02] hover:shadow-md dark:hover:shadow-gray-900`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 ${card.iconBg} rounded-lg flex items-center justify-center mr-2 shadow-sm`}>
                      <Icon className="text-white text-sm" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-white">{card.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {card.count} files
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-base font-bold ${card.textColor}`}>
                      {card.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mb-1">
                  <div 
                    className={`${card.progressColor} h-1 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(card.percentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 text-right">
                  {formatBytes(card.size)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 mt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-orange-500 dark:bg-orange-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                <MdStorage className="text-white text-sm" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Total Storage</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.totalFiles} files
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-orange-600 dark:text-orange-400">
                100%
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {formatBytes(stats.totalSize)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileTypeCards;