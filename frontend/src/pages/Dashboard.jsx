import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import Cards from '../components/Cards';
import FileTable from '../components/FileTable';
import { chartData } from '../assets/Chartsdata';
import { setFiles } from '../redux/slices/fileSlice';
import { fileAPI, userAPI } from '../redux/api/api';

import {
  MdStorage,
  MdUpload,
  MdFolder,
  MdCloud,
  MdCloudUpload
} from "react-icons/md";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { files } = useSelector((state) => state.files);

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalStorage: 50,
    usedStorage: 0,
    availableStorage: 50,
    totalFiles: 0,
    totalUsers: 0,
    recentUploads: 0,
    imageCount: 0,
    pdfCount: 0,
    documentCount: 0,
    videoCount: 0,
    otherCount: 0
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
    const usedStorage = allFiles.reduce(
      (total, file) => total + (file.size / (1024 * 1024 * 1024)),
      0
    );

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentUploads = allFiles.filter(
      f => new Date(f.uploadDate) > weekAgo
    ).length;

    const imageCount = allFiles.filter(f => f.mimetype?.startsWith('image/')).length;
    const pdfCount = allFiles.filter(f => f.mimetype === 'application/pdf').length;
    const documentCount = allFiles.filter(
      f => f.mimetype?.includes('document') || f.mimetype?.includes('word')
    ).length;
    const videoCount = allFiles.filter(f => f.mimetype?.startsWith('video/')).length;

    const otherCount = allFiles.length - (imageCount + pdfCount + documentCount + videoCount);

    setStats({
      totalStorage: 50,
      usedStorage,
      availableStorage: 50 - usedStorage,
      totalFiles: allFiles.length,
      totalUsers: users.length,
      recentUploads,
      imageCount,
      pdfCount,
      documentCount,
      videoCount,
      otherCount
    });
  };

  const generateChartData = (allFiles) => {
    const storageByType = { images: 0, documents: 0, videos: 0, pdfs: 0, others: 0 };
    let adminUploads = 0;
    let userUploads = 0;

    allFiles.forEach(file => {
      const sizeInGB = file.size / (1024 * 1024 * 1024);

      if (file.mimetype?.startsWith('image/')) storageByType.images += sizeInGB;
      else if (file.mimetype === 'application/pdf') storageByType.pdfs += sizeInGB;
      else if (file.mimetype?.startsWith('video/')) storageByType.videos += sizeInGB;
      else if (file.mimetype?.includes('document') || file.mimetype?.includes('word'))
        storageByType.documents += sizeInGB;
      else storageByType.others += sizeInGB;

      // Count uploads by role
      if (file.uploadedBy?.role === 'admin') adminUploads++;
      else userUploads++;
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
            data: [
              storageByType.images,
              storageByType.documents,
              storageByType.videos,
              storageByType.pdfs,
              storageByType.others
            ],
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
          labels: ['Admins', 'Users'],
          datasets: [{
            label: 'Uploads Count',
            data: [adminUploads, userUploads],
            backgroundColor: ['#FF9F40', '#FF6384'],
            borderWidth: 1,
          }],
        },
      }
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
        id: file._id,
        name: file.originalName || file.name,
        size: file.size / (1024 * 1024),
        type: file.mimetype,
        storageUrl: file.storageUrl,
        uploadedAt: file.uploadDate,
        uploadedBy: file.uploadedBy
      }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.username}!
          </h2>
          <p className="text-gray-600">
            You have {stats.totalFiles} files using {stats.usedStorage.toFixed(2)} GB of {stats.totalStorage} GB
          </p>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => navigate('/upload')}
          className="flex gap-1 items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500"
        >
          <MdCloudUpload /> Upload
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Cards cardsData={chartDataState} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatBox title="Total Storage" value={`${stats.totalStorage} GB`} icon={<MdStorage className="text-blue-600" />} />
        <StatBox title="Files Uploaded" value={stats.totalFiles} icon={<MdUpload className="text-green-600" />} />
        <StatBox title="Total Users" value={users.length} icon={<MdCloud className="text-purple-600" />} />
        <StatBox title="Your Role" value={user?.role} icon={<MdCloud className="text-orange-600" />} />
      </div>

      {/* Recent Files */}
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

const StatBox = ({ title, value, icon }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
      {icon}
    </div>
  </div>
);

export default Dashboard;
