// In Dashboard.jsx - find the Recent Files section (around line 350-400)

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Cards from '../components/Cards';
import FileTypeCards from '../components/FileTypeCards';
import FileTable from '../components/FileTable';
import { setFiles, removeFile, removeMultipleFiles } from '../redux/slices/fileSlice';
import { fileAPI } from '../redux/api/api'; // ✅ REMOVED userAPI
import useToast from '../hooks/useToast';
import {
  MdStorage, MdFolder, MdPeople,
  MdCloudUpload, MdRefresh, MdImage, MdVideoLibrary,
  MdPictureAsPdf, MdDescription, MdInsertDriveFile, MdDashboard,
  MdUpload, MdDeleteSweep
} from "react-icons/md";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state) => state.auth);
  const { files } = useSelector((state) => state.files);

  // SIMPLE USER STATE COMMENTED START
  // const [users, setUsers] = useState([]);
  // SIMPLE USER STATE COMMENTED END
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  
  // NEW: Selection state for dashboard
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  const [fileStats, setFileStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    totalSizeMB: 0,
    imageCount: 0,
    imageSize: 0,
    imageSizeMB: 0,
    imagePercentage: 0,
    videoCount: 0,
    videoSize: 0,
    videoSizeMB: 0,
    videoPercentage: 0,
    pdfCount: 0,
    pdfSize: 0,
    pdfSizeMB: 0,
    pdfPercentage: 0,
    documentCount: 0,
    documentSize: 0,
    documentSizeMB: 0,
    documentPercentage: 0,
    otherCount: 0,
    otherSize: 0,
    otherSizeMB: 0,
    otherPercentage: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const filesRes = await fileAPI.getAllFiles();
      const userFiles = filesRes.data;
      
      // Format files for display
      const formattedFiles = userFiles.map(file => ({
        id: file._id,
        _id: file._id,
        name: file.originalName || file.filename || 'Unnamed file',
        displayName: (file.originalName || file.filename || '').split('/').pop(),
        path: file.originalName || file.filename || '',
        size: file.size || 0,
        sizeMB: (file.size || 0) / (1024 * 1024),
        type: file.mimetype || '',
        storageUrl: file.storageUrl,
        downloadUrl: file.downloadUrl,
        uploadedAt: file.uploadDate || file.createdAt || new Date(),
      }));
      
      dispatch(setFiles(formattedFiles));

      // COMPANY API CALL COMMENTED START
      // if (user?.company) {
      //   try {
      //     const companyRes = await companyAPI.getMyCompany();
      //     setCompany(companyRes.data);
      //   } catch (error) {
      //     console.log('ℹ️ No company data available');
      //   }
      // }
      // COMPANY API CALL COMMENTED END

      // SIMPLE USER API CALL COMMENTED START
      // if (user?.role === 'admin') {
      //   try {
      //     if (user?.company) {
      //       const usersRes = await userAPI.getCompanyUsers(user.company);
      //       setUsers(usersRes.data);
      //     }
      //   } catch (error) {
      //     console.log('ℹ️ No users data available');
      //   }
      // }
      // SIMPLE USER API CALL COMMENTED END

      calculateStats(formattedFiles);
      
      // Generate both charts
      const charts = generateChartData(formattedFiles);
      setChartData(charts);
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Convert bytes to MB
  const bytesToMB = (bytes) => {
    if (!bytes || isNaN(bytes)) return 0;
    return bytes / (1024 * 1024);
  };

  // Format size for display
  const formatSize = (bytes) => {
    if (bytes === 0 || !bytes || isNaN(bytes)) return '0 MB';
    
    const mb = bytes / (1024 * 1024);
    if (mb < 0.01) return '< 0.01 MB';
    return mb.toFixed(2) + ' MB';
  };

  const calculateStats = (allFiles) => {
    let imageCount = 0, imageSize = 0;
    let videoCount = 0, videoSize = 0;
    let pdfCount = 0, pdfSize = 0;
    let documentCount = 0, documentSize = 0;
    let otherCount = 0, otherSize = 0;
    
    allFiles.forEach(file => {
      const size = file.size || 0;
      const type = file.type || '';
      
      if (type.startsWith('image/')) {
        imageCount++;
        imageSize += size;
      } else if (type.startsWith('video/')) {
        videoCount++;
        videoSize += size;
      } else if (type === 'application/pdf') {
        pdfCount++;
        pdfSize += size;
      } else if (type.includes('document') || type.includes('word') || type.includes('text')) {
        documentCount++;
        documentSize += size;
      } else {
        otherCount++;
        otherSize += size;
      }
    });

    const totalSize = imageSize + videoSize + pdfSize + documentSize + otherSize;
    const totalFiles = allFiles.length;

    const imagePercentage = totalSize > 0 ? (imageSize / totalSize) * 100 : 0;
    const videoPercentage = totalSize > 0 ? (videoSize / totalSize) * 100 : 0;
    const pdfPercentage = totalSize > 0 ? (pdfSize / totalSize) * 100 : 0;
    const documentPercentage = totalSize > 0 ? (documentSize / totalSize) * 100 : 0;
    const otherPercentage = totalSize > 0 ? (otherSize / totalSize) * 100 : 0;

    setFileStats({
      totalFiles,
      totalSize,
      totalSizeMB: bytesToMB(totalSize),
      imageCount,
      imageSize,
      imageSizeMB: bytesToMB(imageSize),
      imagePercentage,
      videoCount,
      videoSize,
      videoSizeMB: bytesToMB(videoSize),
      videoPercentage,
      pdfCount,
      pdfSize,
      pdfSizeMB: bytesToMB(pdfSize),
      pdfPercentage,
      documentCount,
      documentSize,
      documentSizeMB: bytesToMB(documentSize),
      documentPercentage,
      otherCount,
      otherSize,
      otherSizeMB: bytesToMB(otherSize),
      otherPercentage
    });
  };

  // Updated to return multiple charts
  const generateChartData = (allFiles) => {
    // Chart 1: Storage by File Type
    let images = 0, videos = 0, pdfs = 0, documents = 0, others = 0;

    allFiles.forEach(file => {
      const sizeInBytes = file.size || 0;
      const type = file.type || '';

      if (type.startsWith('image/')) {
        images += sizeInBytes;
      } else if (type.startsWith('video/')) {
        videos += sizeInBytes;
      } else if (type === 'application/pdf') {
        pdfs += sizeInBytes;
      } else if (type.includes('document') || type.includes('word') || type.includes('text')) {
        documents += sizeInBytes;
      } else {
        others += sizeInBytes;
      }
    });

    // Chart 2: Storage Overview (Total vs Used)
    let totalStorage = 5 * 1024 * 1024 * 1024; // Default 5GB
    let usedStorage = fileStats.totalSize || 0;
    
    if (user?.storageAllocated) {
      totalStorage = user.storageAllocated;
    }

    const totalGB = totalStorage / (1024 * 1024 * 1024);
    const usedGB = usedStorage / (1024 * 1024 * 1024);
    const availableGB = Math.max(0, totalGB - usedGB);

    return [
      {
        id: 1,
        title: "Storage Usage by Type",
        description: "Distribution of your storage by file type",
        chartData: {
          labels: ['Images', 'Videos', 'PDFs', 'Documents', 'Others'],
          datasets: [{
            label: 'Storage (MB)',
            data: [
              images / (1024 * 1024), 
              videos / (1024 * 1024), 
              pdfs / (1024 * 1024), 
              documents / (1024 * 1024), 
              others / (1024 * 1024)
            ],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            borderWidth: 1,
          }],
        },
      },
      {
        id: 3,
        title: "Storage Overview",
        description: `Total: ${totalGB.toFixed(2)}GB | Used: ${usedGB.toFixed(2)}GB | Available: ${availableGB.toFixed(2)}GB`,
        chartData: {
          labels: ['Used Storage', 'Available Storage'],
          datasets: [{
            label: 'Storage (GB)',
            data: [usedGB, availableGB],
            backgroundColor: ['#fc1403', '#03fc45'],
            borderWidth: 1,
          }],
        },
      }
    ];
  };

  // NEW: Handle single file selection
  const handleSelectFile = (fileId) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  // NEW: Handle select all for recent files
  const handleSelectAll = () => {
    const recentFileIds = getRecentFiles().map(f => f.id || f._id);
    if (selectedFiles.length === recentFileIds.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(recentFileIds);
    }
  };

  // NEW: Clear selection
  const handleClearSelection = () => {
    setSelectedFiles([]);
  };

  // NEW: Bulk delete for dashboard
  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    
    const confirmMessage = selectedFiles.length === 1 
      ? 'Are you sure you want to delete this file?' 
      : `Are you sure you want to delete ${selectedFiles.length} files?`;
    
    if (!window.confirm(confirmMessage)) return;
    
    setBulkLoading(true);
    const loadingToast = toast.loading(`Deleting ${selectedFiles.length} file(s)...`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const fileId of selectedFiles) {
      try {
        await fileAPI.deleteFile(fileId);
        dispatch(removeFile(fileId));
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to delete file ${fileId}:`, error);
        failCount++;
      }
    }
    
    toast.dismiss(loadingToast);
    
    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} file(s)`);
      // Refresh dashboard data
      fetchDashboardData();
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} file(s)`);
    }
    
    setSelectedFiles([]);
    setBulkLoading(false);
  };

  const handleDeleteFile = async (fileId) => {
    const file = files.find(f => f._id === fileId || f.id === fileId);
    if (!file) return;
    
    if (!window.confirm(`Are you sure you want to delete "${file.name}"?`)) return;
    
    const loadingToast = toast.loading(`Deleting ${file.name}...`);
    
    try {
      await fileAPI.deleteFile(fileId);
      toast.dismiss(loadingToast);
      dispatch(removeFile(fileId));
      toast.success('File deleted successfully');
      
      // Remove from selected if it was selected
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = error.response?.data?.error || 'Failed to delete file';
      toast.error(errorMessage);
    }
  };

  const handleTypeClick = (type) => {
    navigate(`/files?type=${type}`);
  };

  const getRecentFiles = () => {
    return [...files]
      .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0))
      .slice(0, 5)
      .map(file => ({
        id: file._id,
        _id: file._id,
        name: file.displayName || file.name,
        displayName: file.displayName || file.name,
        size: file.size || 0,
        type: file.type,
        storageUrl: file.storageUrl,
        uploadedAt: file.uploadedAt
      }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 dark:border-orange-500"></div>
      </div>
    );
  }

  const recentFiles = getRecentFiles();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <MdDashboard className="text-orange-600 dark:text-orange-400 text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Welcome back, {user?.username}!
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                You have {fileStats.totalFiles} files using {fileStats.totalSizeMB.toFixed(2)} MB
              </p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <MdUpload size={20} />
            Upload Files
          </button>
        </div>
      </div>

      {/* Three-column layout with both charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {chartData.length > 1 && (
          <div className="lg:col-span-1 h-full">
            <Cards cardsData={[chartData[1]]} />
          </div>
        )}
        
        {chartData.length > 0 && (
          <div className="lg:col-span-1 h-full">
            <Cards cardsData={[chartData[0]]} />
          </div>
        )}
        
        <div className="lg:col-span-1 h-full">
          <FileTypeCards 
            stats={fileStats} 
            onTypeClick={handleTypeClick}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Files</h3>
          
          {/* NEW: Bulk delete button for selected files */}
          {selectedFiles.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {bulkLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <MdDeleteSweep size={18} />
              )}
              {bulkLoading ? 'Deleting...' : `Delete (${selectedFiles.length})`}
            </button>
          )}
        </div>

        {/* NEW: Selection info bar */}
        {selectedFiles.length > 0 && (
          <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedFiles.length} file(s) selected
            </span>
            <button
              onClick={handleClearSelection}
              className="text-sm text-blue-700 dark:text-blue-300 hover:underline"
            >
              Clear Selection
            </button>
          </div>
        )}

        {recentFiles.length > 0 ? (
          <FileTable 
            files={recentFiles} 
            onRemoveFile={handleDeleteFile}
            showCheckboxes={true}
            selectedFiles={selectedFiles}
            onSelectFile={handleSelectFile}
            onSelectAll={handleSelectAll}
            onBulkDelete={handleBulkDelete}
          />
        ) : (
          <div className="p-12 text-center">
            <MdFolder className="mx-auto text-5xl text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No recent files</p>
            <button
              onClick={() => navigate('/upload')}
              className="inline-flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <MdCloudUpload size={20} />
              Upload Your First File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;