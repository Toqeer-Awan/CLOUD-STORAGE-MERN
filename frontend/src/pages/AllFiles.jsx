import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import FileTable from '../components/FileTable';
import { setFiles, removeFile } from '../redux/slices/fileSlice';
import { fileAPI } from '../redux/api/api';
import useToast from '../hooks/useToast';
import { MdSearch, MdFilterList, MdSort, MdRefresh } from "react-icons/md";

const AllFiles = () => {
  const dispatch = useDispatch();
  const { files } = useSelector((state) => state.files);
  const { user } = useSelector((state) => state.auth);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fileAPI.getAllFiles();
      const formattedFiles = response.data.map(file => ({
        id: file._id,
        _id: file._id,
        name: file.originalName,
        size: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        type: file.mimetype,
        storageUrl: file.storageUrl,
        uploadedAt: file.uploadDate,
        uploadedBy: file.uploadedBy
      }));
      dispatch(setFiles(formattedFiles));
      toast.success('Files refreshed');
    } catch (error) {
      toast.error('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    const file = files.find(f => f._id === fileId || f.id === fileId);
    if (!file) return;
    
    const loadingToast = toast.loading(`Deleting ${file.name}...`);
    
    try {
      await fileAPI.deleteFile(fileId);
      dispatch(removeFile(fileId));
      toast.dismiss(loadingToast);
      toast.deleteSuccess('File deleted successfully');
      fetchFiles();
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to delete file');
    }
  };

  const getVisibleFiles = () => {
    return files.filter(file => {
      if (user?.role === 'admin' || user?.permissions?.manageFiles) return true;
      return file.uploadedById === user?._id || file.uploadedBy?._id === user?._id;
    });
  };

  const visibleFiles = getVisibleFiles();
  
  const filteredFiles = visibleFiles.filter(file => {
    const matchesSearch = file.name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || 
      (filterType === 'image' && file.type?.startsWith('image/')) ||
      (filterType === 'pdf' && file.type === 'application/pdf');
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name?.localeCompare(b.name);
    if (sortBy === 'size') return b.size - a.size;
    return new Date(b.uploadedAt) - new Date(a.uploadedAt);
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">All Files</h1>
            <p className="text-gray-600">{visibleFiles.length} files • Role: {user?.role}</p>
          </div>
          <button 
            onClick={fetchFiles} 
            disabled={loading} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <MdRefresh className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Files</label>
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by filename..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">File Type</label>
            <div className="relative">
              <MdFilterList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="all">All Files</option>
                <option value="image">Images</option>
                <option value="pdf">PDFs</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <div className="relative">
              <MdSort className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="date">Date Uploaded</option>
                <option value="name">File Name</option>
                <option value="size">File Size</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No files found</h3>
            <p className="text-gray-500">Upload some files to get started</p>
          </div>
        ) : (
          <FileTable files={filteredFiles} onRemoveFile={handleDeleteFile} />
        )}
      </div>
    </div>
  );
};

export default AllFiles;