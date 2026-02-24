import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import FileTable from '../components/FileTable';
import { setFiles, removeFile, removeMultipleFiles } from '../redux/slices/fileSlice';
import { fileAPI } from '../redux/api/api';
import useToast from '../hooks/useToast';
import { 
  MdSearch, MdFilterList, MdSort, MdRefresh, 
  MdStorage, MdImage, MdVideoLibrary,
  MdPictureAsPdf, MdDescription, MdInsertDriveFile,
  MdDeleteSweep, MdCheckBox, MdCheckBoxOutlineBlank,
  MdArrowUpward, MdArrowDownward
} from "react-icons/md";

const AllFiles = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { files } = useSelector((state) => state.files);
  const { user } = useSelector((state) => state.auth);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // NEW: Combined sort option
  const [sortOption, setSortOption] = useState('date-desc'); // Format: field-direction
  
  // Selection state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  
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

  // Reset selection when files change
  useEffect(() => {
    setSelectedFiles([]);
    setSelectAll(false);
  }, [files]);

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

  // Handle single file selection
  const handleSelectFile = (fileId) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(f => f.id || f._id));
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedFiles([]);
  };

  // Bulk delete
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
    
    if (!window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }
    
    const loadingToast = toast.loading(`Deleting ${file.name}...`);
    
    try {
      await fileAPI.deleteFile(fileId);
      toast.dismiss(loadingToast);
      dispatch(removeFile(fileId));
      toast.success('File deleted successfully');
      
      // Remove from selected if it was selected
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
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

  // NEW: Parse sort option and apply sorting
  const getSortedFiles = () => {
    const [field, direction] = sortOption.split('-');
    
    return [...filteredFiles].sort((a, b) => {
      let comparison = 0;
      
      if (field === 'name') {
        const nameA = (a.displayName || a.name || '').toLowerCase();
        const nameB = (b.displayName || b.name || '').toLowerCase();
        comparison = nameA.localeCompare(nameB);
      }
      else if (field === 'size') {
        comparison = (a.size || 0) - (b.size || 0);
      }
      else { // date
        comparison = new Date(a.uploadedAt || 0) - new Date(b.uploadedAt || 0);
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  // Filter files
  const filteredFiles = files.filter(file => {
    const category = getFileCategory(file.type);
    const fileName = file.displayName || file.name || '';
    
    // Search filter
    const matchesSearch = fileName.toLowerCase().includes(search.toLowerCase());
    
    // Type filter
    const matchesType = filterType === 'all' || category === filterType;
    
    return matchesSearch && matchesType;
  });

  // Get sorted files
  const sortedFiles = getSortedFiles();

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

  // NEW: Sort options with icons
  const sortOptions = [
    { value: 'date-desc', label: 'Upload Date (Newest First)', icon: MdArrowDownward },
    { value: 'date-asc', label: 'Upload Date (Oldest First)', icon: MdArrowUpward },
    { value: 'name-asc', label: 'File Name (A to Z)', icon: MdArrowUpward },
    { value: 'name-desc', label: 'File Name (Z to A)', icon: MdArrowDownward },
    { value: 'size-desc', label: 'File Size (Largest First)', icon: MdArrowDownward },
    { value: 'size-asc', label: 'File Size (Smallest First)', icon: MdArrowUpward },
  ];

  // Get current sort option display
  const currentSortOption = sortOptions.find(option => option.value === sortOption) || sortOptions[0];
  const CurrentSortIcon = currentSortOption.icon;

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
              {selectedFiles.length > 0 && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-sm rounded-full">
                  {selectedFiles.length} selected
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {selectedFiles.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {bulkLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <MdDeleteSweep size={18} />
                )}
                {bulkLoading ? 'Deleting...' : `Delete (${selectedFiles.length})`}
              </button>
            )}
            <button 
              onClick={fetchFiles} 
              disabled={loading} 
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              <MdRefresh className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
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

        {/* Selection Info Bar */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
              >
                {selectedFiles.length === filteredFiles.length ? (
                  <MdCheckBox className="text-xl" />
                ) : (
                  <MdCheckBoxOutlineBlank className="text-xl" />
                )}
                <span className="text-sm font-medium">
                  {selectedFiles.length === filteredFiles.length ? 'Deselect All' : 'Select All'}
                </span>
              </button>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {selectedFiles.length} of {filteredFiles.length} selected
              </span>
            </div>
            <button
              onClick={handleClearSelection}
              className="text-sm text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 underline"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Search and Sort - UPDATED with combined dropdown */}
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
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
              >
                {sortOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  );
                })}
              </select>
            </div>
            
            {/* Current sort indicator */}
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <CurrentSortIcon size={14} />
              <span>Currently: {currentSortOption.label}</span>
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
            files={sortedFiles} 
            onRemoveFile={handleDeleteFile}
            showCheckboxes={true}
            selectedFiles={selectedFiles}
            onSelectFile={handleSelectFile}
            onSelectAll={handleSelectAll}
            onBulkDelete={handleBulkDelete}
          />
        )}
      </div>
    </div>
  );
};

export default AllFiles;