import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { companyAPI, storageAPI } from '../redux/api/api';
import useToast from '../hooks/useToast';
import UserStorageManager from '../components/UserStoreManager';
import { 
  MdStorage, MdPeople, MdFolder, MdBusiness,
  MdWarning, MdCheckCircle, MdPerson, MdEmail,
  MdCalendarToday, MdAddCircle, MdEdit
} from "react-icons/md";

const CompanyDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const toast = useToast();

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getMyCompany();
      console.log('Company Data:', response.data);
      setCompanyData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load company data');
      toast.error('Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateStorage = (user) => {
    setSelectedUser(user);
    setShowStorageModal(true);
  };

  const handleStorageSuccess = () => {
    fetchCompanyData();
  };

  const formatBytes = (bytes) => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 GB';
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 dark:border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!companyData) return null;

  // Calculate total allocated storage from all users
  const totalAllocated = companyData.users?.reduce((sum, user) => sum + (user.storageAllocated || 0), 0) || 0;
  
  // 🔥 SIMPLE: Available to allocate = Total Storage - Total Allocated
  const availableToAllocate = (companyData.totalStorage || 0) - totalAllocated;
  
  // Ensure number is valid
  const safeAvailableToAllocate = isNaN(availableToAllocate) ? 0 : Math.max(0, availableToAllocate);

  const userCount = companyData.users?.length || 0;
  const fileCount = companyData.recentFiles?.length || 0;

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <MdBusiness className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">{companyData.name}</h1>
              <p className="text-orange-100 flex items-center gap-1">
                <MdPerson className="text-sm" />
                Owned by {companyData.owner?.username || 'Admin'}
              </p>
            </div>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <span className="text-sm flex items-center gap-1">
              <MdCheckCircle className="text-green-300" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Storage Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Storage</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {formatBytes(companyData.totalStorage || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <MdStorage className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Team Members</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{userCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Including you</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <MdPeople className="text-green-600 dark:text-green-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Files</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{fileCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Across all users</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <MdFolder className="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
          </div>
        </div>

        {/* 🔥 ONLY SHOW AVAILABLE TO ALLOCATE */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Available to Allocate</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatBytes(safeAvailableToAllocate)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {((totalAllocated / (companyData.totalStorage || 1)) * 100).toFixed(1)}% allocated
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <MdAddCircle className="text-orange-600 dark:text-orange-400 text-xl" />
            </div>
          </div>
          {/* Allocation progress bar */}
          <div className="mt-3">
            <div className="overflow-hidden h-1.5 bg-gray-200 dark:bg-gray-700 rounded">
              <div
                style={{ width: `${Math.min((totalAllocated / (companyData.totalStorage || 1)) * 100, 100)}%` }}
                className="h-full bg-orange-500 dark:bg-orange-400 rounded"
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Table with Storage Management */}
      {companyData.users && companyData.users.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Team Members</h3>
            {isAdmin && (
              <div className="text-sm bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full">
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  Available to allocate: {formatBytes(safeAvailableToAllocate)}
                </span>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">User</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Email</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Role</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Storage Allocated</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Storage Used</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Usage %</th>
                  {isAdmin && <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {companyData.users.map((member) => {
                  const usagePercentage = member.storageAllocated > 0 
                    ? ((member.storageUsed / member.storageAllocated) * 100).toFixed(1) 
                    : '0.0';
                  
                  return (
                    <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                              {member.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800 dark:text-white">{member.username}</span>
                          {member._id === companyData.owner?._id && (
                            <span className="ml-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 text-xs rounded-full">
                              Owner
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{member.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                          member.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                          member.role === 'user' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {formatBytes(member.storageAllocated || 0)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {formatBytes(member.storageUsed || 0)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{usagePercentage}%</span>
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                parseFloat(usagePercentage) > 90 ? 'bg-red-500' :
                                parseFloat(usagePercentage) > 70 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(parseFloat(usagePercentage), 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      {isAdmin && member._id !== user?._id && (
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleAllocateStorage(member)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Allocate Storage"
                            disabled={safeAvailableToAllocate <= 0}
                          >
                            <MdEdit size={18} />
                          </button>
                        </td>
                      )}
                      {isAdmin && member._id === user?._id && (
                        <td className="py-3 px-4 text-xs text-gray-400">(You)</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Storage Allocation Modal */}
      {showStorageModal && selectedUser && companyData && (
        <UserStorageManager
          user={selectedUser}
          company={{
            ...companyData,
            availableToAllocate: safeAvailableToAllocate
          }}
          onClose={() => {
            setShowStorageModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleStorageSuccess}
        />
      )}
    </div>
  );
};

export default CompanyDashboard;