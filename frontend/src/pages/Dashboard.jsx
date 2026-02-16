import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Cards from '../components/Cards';
import FileTypeCards from '../components/FileTypeCards';
import FileTable from '../components/FileTable';
import { setFiles } from '../redux/slices/fileSlice';
import { fileAPI, userAPI, companyAPI } from '../redux/api/api';
import useToast from '../hooks/useToast';
import {
  MdStorage, MdFolder, MdPeople,
  MdCloudUpload, MdRefresh, MdImage, MdVideoLibrary,
  MdPictureAsPdf, MdDescription, MdInsertDriveFile, MdDashboard
} from "react-icons/md";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state) => state.auth);
  const { files } = useSelector((state) => state.files);

  const [users, setUsers] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [fileStats, setFileStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    imageCount: 0,
    imageSize: 0,
    imagePercentage: 0,
    videoCount: 0,
    videoSize: 0,
    videoPercentage: 0,
    pdfCount: 0,
    pdfSize: 0,
    pdfPercentage: 0,
    documentCount: 0,
    documentSize: 0,
    documentPercentage: 0,
    otherCount: 0,
    otherSize: 0,
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
      
      dispatch(setFiles(userFiles));

      if (user?.role !== 'superAdmin') {
        try {
          const companyRes = await companyAPI.getMyCompany();
          setCompany(companyRes.data);
        } catch (error) {
          console.log('No company data available');
        }
      }

      if (user?.role === 'superAdmin' || user?.role === 'admin') {
        try {
          const usersRes = await userAPI.getAllUsers();
          setUsers(usersRes.data);
        } catch (error) {
          console.log('No users data available');
        }
      }

      calculateStats(userFiles);
      generateChartData(userFiles);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (allFiles) => {
    let imageCount = 0, imageSize = 0;
    let videoCount = 0, videoSize = 0;
    let pdfCount = 0, pdfSize = 0;
    let documentCount = 0, documentSize = 0;
    let otherCount = 0, otherSize = 0;
    
    allFiles.forEach(file => {
      const size = file.size || 0;
      const type = file.mimetype || '';
      
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
      imageCount,
      imageSize,
      imagePercentage,
      videoCount,
      videoSize,
      videoPercentage,
      pdfCount,
      pdfSize,
      pdfPercentage,
      documentCount,
      documentSize,
      documentPercentage,
      otherCount,
      otherSize,
      otherPercentage
    });
  };

  const generateChartData = (allFiles) => {
    let images = 0, videos = 0, pdfs = 0, documents = 0, others = 0;

    allFiles.forEach(file => {
      const sizeInMB = (file.size || 0) / (1024 * 1024);
      const type = file.mimetype || '';

      if (type.startsWith('image/')) {
        images += sizeInMB;
      } else if (type.startsWith('video/')) {
        videos += sizeInMB;
      } else if (type === 'application/pdf') {
        pdfs += sizeInMB;
      } else if (type.includes('document') || type.includes('word') || type.includes('text')) {
        documents += sizeInMB;
      } else {
        others += sizeInMB;
      }
    });

    setChartData({
      id: 1,
      title: "Storage Usage",
      description: "Distribution of your storage by file type",
      chartData: {
        labels: ['Images', 'Videos', 'PDFs', 'Documents', 'Others'],
        datasets: [{
          label: 'Storage (MB)',
          data: [images, videos, pdfs, documents, others],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
          borderWidth: 1,
        }],
      },
    });
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await fileAPI.deleteFile(fileId);
      toast.success('File deleted successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const handleTypeClick = (type) => {
    navigate(`/files?type=${type}`);
  };

  const getRecentFiles = () => {
    return [...files]
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      .slice(0, 5)
      .map(file => ({
        id: file._id,
        name: file.originalName || file.name,
        size: (file.size || 0) / (1024 * 1024),
        type: file.mimetype,
        storageUrl: file.storageUrl,
        uploadedAt: file.uploadDate
      }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 dark:border-orange-500"></div>
      </div>
    );
  }

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
                You have {fileStats.totalFiles} files using {(fileStats.totalSize / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <MdRefresh size={20} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-full">
          {chartData && <Cards cardsData={[chartData]} />}
        </div>
        
        <div className="h-full">
          <FileTypeCards 
            stats={fileStats} 
            onTypeClick={handleTypeClick}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Files</h3>
        </div>

        {getRecentFiles().length > 0 ? (
          <FileTable files={getRecentFiles()} onRemoveFile={handleDeleteFile} />
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