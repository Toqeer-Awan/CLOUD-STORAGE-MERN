import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import FileTable from '../components/FileTable';
import { setFiles, removeFile } from '../redux/slices/fileSlice';
import { fileAPI } from '../redux/api/api';
import useToast from '../hooks/useToast';
import { 
  MdSearch, MdFilterList, MdSort, MdRefresh, 
  MdStorage, MdImage, MdVideoLibrary,
  MdPictureAsPdf, MdDescription, MdInsertDriveFile
} from "react-icons/md";

const AllFiles = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { files } = useSelector((state) => state.files);
  const { user } = useSelector((state) => state.auth);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Parse URL query parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type');
    if (typeParam && ['image', 'video', 'pdf', 'document', 'other'].includes(typeParam)) {
      setFilterType(typeParam);
    }
  }, [location]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fileAPI.getAllFiles();
      console.log('📁 Fetched files:', response.data);
      
      // Format the files for display
      const formattedFiles = response.data.map(file => ({
        id: file._id,
        _id: file._id,
        name: file.originalName || file.filename || 'Unnamed file',
        // Extract just the filename without path for display
        displayName: (file.originalName || file.filename || '').split('/').pop(),
        path: file.originalName || file.filename || '',
        size: file.size || 0,
        type: file.mimetype || '',
        storageUrl: file.storageUrl,
        downloadUrl: file.downloadUrl,
        uploadedAt: file.uploadDate || file.createdAt || new Date(),
      }));
      
      dispatch(setFiles(formattedFiles));
      toast.success('Files refreshed');
    } catch (error) {
      console.error('❌ Fetch files error:', error);
      toast.error('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!fileId) return;
    
    const file = files.find(f => f._id === fileId || f.id === fileId);
    if (!file) return;
    
    if (!window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }
    
    const loadingToast = toast.loading(`Deleting ${file.name}...`);
    
    try {
      await fileAPI.deleteFile(fileId);
      toast.dismiss(loadingToast);
      dispatch(removeFile(fileId));
      toast.success('File deleted successfully');
    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = error.response?.data?.error || 'Failed to delete file';
      toast.error(errorMessage);
      console.error('❌ Delete error:', error.response?.data || error);
    }
  };

  const getFileCategory = (type) => {
    if (type?.startsWith('image/')) return 'image';
    if (type?.startsWith('video/')) return 'video';
    if (type === 'application/pdf') return 'pdf';
    if (type?.includes('document') || type?.includes('word') || type?.includes('text')) return 'document';
    return 'other';
  };

  // Filter and sort files
  const filteredFiles = files.filter(file => {
    const category = getFileCategory(file.type);
    const fileName = file.displayName || file.name || '';
    
    // Search filter
    const matchesSearch = fileName.toLowerCase().includes(search.toLowerCase());
    
    // Type filter
    const matchesType = filterType === 'all' || category === filterType;
    
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = (a.displayName || a.name || '').toLowerCase();
      const nameB = (b.displayName || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    }
    if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
    // Default sort by date (newest first)
    return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0);
  });

  // Calculate stats for filtered files
  const totalSize = filteredFiles.reduce((acc, file) => acc + (file.size || 0), 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  const imageCount = filteredFiles.filter(f => getFileCategory(f.type) === 'image').length;
  const videoCount = filteredFiles.filter(f => getFileCategory(f.type) === 'video').length;
  const pdfCount = filteredFiles.filter(f => getFileCategory(f.type) === 'pdf').length;
  const documentCount = filteredFiles.filter(f => getFileCategory(f.type) === 'document').length;
  const otherCount = filteredFiles.filter(f => getFileCategory(f.type) === 'other').length;

  const handleFilterChange = (type) => {
    setFilterType(type);
    if (type === 'all') {
      navigate('/files');
    } else {
      navigate(`/files?type=${type}`);
    }
  };

  const filterButtons = [
    { id: 'all', label: 'All Files', icon: MdStorage, color: 'gray' },
    { id: 'image', label: 'Images', icon: MdImage, color: 'blue' },
    { id: 'video', label: 'Videos', icon: MdVideoLibrary, color: 'purple' },
    { id: 'pdf', label: 'PDFs', icon: MdPictureAsPdf, color: 'red' },
    { id: 'document', label: 'Documents', icon: MdDescription, color: 'green' },
    { id: 'other', label: 'Others', icon: MdInsertDriveFile, color: 'gray' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              My Files
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-gray-600 dark:text-gray-400">
                {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'} • {totalSizeMB} MB
              </p>
              {filterType !== 'all' && (
                <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 text-sm rounded-full">
                  Filtered by: {filterType}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={fetchFiles} 
            disabled={loading} 
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            <MdRefresh className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {filterButtons.map(button => {
            const Icon = button.icon;
            const isActive = filterType === button.id;
            const colorClasses = {
              gray: isActive ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300',
              blue: isActive ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
              purple: isActive ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
              red: isActive ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400',
              green: isActive ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400',
            };

            return (
              <button
                key={button.id}
                onClick={() => handleFilterChange(button.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  colorClasses[button.color]
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{button.label}</span>
                {button.id !== 'all' && (
                  <span className="ml-1 text-xs">
                    ({button.id === 'image' ? imageCount :
                      button.id === 'video' ? videoCount :
                      button.id === 'pdf' ? pdfCount :
                      button.id === 'document' ? documentCount :
                      otherCount})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Sort */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Your Files
            </label>
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by filename..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <div className="relative">
              <MdSort className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
              >
                <option value="date">Date Uploaded</option>
                <option value="name">File Name</option>
                <option value="size">File Size</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              {search || filterType !== 'all'
                ? `No ${filterType !== 'all' ? filterType : ''} files found matching "${search}"`
                : "You haven't uploaded any files yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              {search || filterType !== 'all'
                ? 'Try adjusting your filters' 
                : 'Upload your first file to get started'}
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Upload Files
            </button>
          </div>
        ) : (
          <FileTable 
            files={filteredFiles} 
            onRemoveFile={handleDeleteFile} 
          />
        )}
      </div>
    </div>
  );
};

export default AllFiles;