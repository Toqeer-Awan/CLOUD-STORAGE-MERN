import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Cards from '../components/Cards';
import FileTable from '../components/FileTable';
import { chartData } from '../assets/Chartsdata';
import { setFiles } from '../redux/slices/fileSlice';
import { fileAPI, userAPI } from '../redux/api/api';
import { MdStorage, MdUpload, MdDownload, MdDelete, MdFolder, MdCloud, MdLock } from "react-icons/md";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { files } = useSelector((state) => state.files);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalStorage: 50, usedStorage: 0, availableStorage: 50,
    totalFiles: 0, totalUsers: 0, recentUploads: 0,
    imageCount: 0, pdfCount: 0, documentCount: 0, videoCount: 0, otherCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartDataState, setChartDataState] = useState(chartData);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const filesRes = await fileAPI.getAllFiles();
      const allFiles = filesRes.data;
      dispatch(setFiles(allFiles));
      
      if (user?.role === 'admin') {
        const usersRes = await userAPI.getAllUsers();
        setUsers(usersRes.data || []);
      }
      
      calculateStats(allFiles);
      generateChartData(allFiles);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (allFiles) => {
    const usedStorage = allFiles.reduce((total, file) => total + (file.size / (1024 * 1024 * 1024)), 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUploads = allFiles.filter(f => new Date(f.uploadDate) > weekAgo).length;
    
    const imageCount = allFiles.filter(f => f.mimetype?.startsWith('image/')).length;
    const pdfCount = allFiles.filter(f => f.mimetype === 'application/pdf').length;
    const documentCount = allFiles.filter(f => f.mimetype?.includes('document') || f.mimetype?.includes('word')).length;
    const videoCount = allFiles.filter(f => f.mimetype?.startsWith('video/')).length;
    const otherCount = allFiles.length - (imageCount + pdfCount + documentCount + videoCount);

    setStats({
      totalStorage: 50, usedStorage, availableStorage: 50 - usedStorage,
      totalFiles: allFiles.length, totalUsers: users.length, recentUploads,
      imageCount, pdfCount, documentCount, videoCount, otherCount
    });
  };

  const generateChartData = (allFiles) => {
    const storageByType = { images: 0, documents: 0, videos: 0, pdfs: 0, others: 0 };
    
    allFiles.forEach(file => {
      const sizeInGB = file.size / (1024 * 1024 * 1024);
      if (file.mimetype?.startsWith('image/')) storageByType.images += sizeInGB;
      else if (file.mimetype === 'application/pdf') storageByType.pdfs += sizeInGB;
      else if (file.mimetype?.startsWith('video/')) storageByType.videos += sizeInGB;
      else if (file.mimetype?.includes('document') || file.mimetype?.includes('word')) storageByType.documents += sizeInGB;
      else storageByType.others += sizeInGB;
    });

    setChartDataState([
      {
        id: 1,
        title: "Storage Usage",
        description: "Distribution of used storage by file type",
        chartData: {
          labels: ['Images', 'Documents', 'Videos', 'PDFs', 'Others'],
          datasets: [{
            label: 'Storage (GB)',
            data: [storageByType.images, storageByType.documents, storageByType.videos, storageByType.pdfs, storageByType.others],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            borderWidth: 1,
          }],
        },
      },
      {
        id: 2,
        title: "User Activity",
        description: "Upload activity by user role",
        chartData: {
          labels: ['Admins', 'Users', 'Guests'],
          datasets: [{
            label: 'Uploads Count',
            data: [42, 30, 10],
            backgroundColor: ['#FF9F40', '#FF6384', '#36A2EB'],
            borderWidth: 1,
          }],
        },
      },
    ]);
  };

  const handleDeleteFile = async (fileId) => {
    if (!user) return alert('Please login first');
    if (window.confirm('Delete this file?')) {
      try {
        await fileAPI.deleteFile(fileId);
        fetchDashboardData();
      } catch (error) {
        alert('Delete failed: ' + error.message);
      }
    }
  };

  const getRecentFiles = () => {
    return [...files]
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      .slice(0, 5)
      .map(file => ({
        id: file._id, name: file.originalName || file.name,
        size: file.size / (1024 * 1024), type: file.mimetype,
        storageUrl: file.storageUrl, uploadedAt: file.uploadDate,
        uploadedBy: file.uploadedBy
      }));
  };

  const canDeleteFiles = user?.role === 'admin' || user?.permissions?.delete;
  const canUploadFiles = user?.role === 'admin' || user?.permissions?.upload;
  const canDownloadFiles = user?.role === 'admin' || user?.permissions?.download;

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome back, {user?.username}!</h2>
            <p className="text-gray-600">
              You have {stats.totalFiles} files using {stats.usedStorage.toFixed(2)} GB of {stats.totalStorage} GB
            </p>
          </div>
          <button onClick={fetchDashboardData} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Cards cardsData={chartDataState} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Storage</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalStorage} GB</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MdStorage className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Files Uploaded</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalFiles}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <MdUpload className="text-green-600 text-xl" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-800">{users.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Your Permissions</p>
              <p className="text-2xl font-bold text-gray-800">{user?.role}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <MdCloud className="text-orange-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Recent Files</h3>
        </div>
        {getRecentFiles().length > 0 ? (
          <FileTable files={getRecentFiles()} onRemoveFile={handleDeleteFile} />
        ) : (
          <div className="p-8 text-center">
            <MdFolder className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500">No recent files</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;