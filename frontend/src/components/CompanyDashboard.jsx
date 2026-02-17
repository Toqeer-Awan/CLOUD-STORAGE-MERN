import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { companyAPI, storageAPI, userAPI } from '../redux/api/api';
import useToast from '../hooks/useToast';
import UserStorageManager from '../components/UserStoreManager';
import { 
  MdStorage, MdPeople, MdFolder, MdBusiness,
  MdWarning, MdCheckCircle, MdPerson, MdEmail,
  MdCalendarToday, MdEdit, MdDelete, MdRefresh
} from "react-icons/md";

const CompanyDashboard = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getMyCompany();
      console.log('Company Data from Backend:', response.data);
      setCompanyData(response.data);
    } catch (err) {
      console.error('Fetch company error:', err);
      setError(err.response?.data?.error || 'Failed to load company data');
      toast.error('Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateStorage = (user) => {
    console.log('Opening storage modal for user:', user);
    setSelectedUser(user);
    setShowStorageModal(true);
  };

  const handleStorageSuccess = () => {
    console.log('Storage allocation successful, refreshing data...');
    fetchCompanyData();
    setShowStorageModal(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async (userId, username) => {
    console.log('Delete attempt for user:', { userId, username });
    
    if (!window.confirm(`Are you sure you want to delete ${username}? This action cannot be undone.`)) {
      return;
    }

    setDeletingUserId(userId);
    setActionLoading(true);
    
    try {
      console.log('Sending delete request for user:', userId);
      const response = await userAPI.deleteUser(userId);
      console.log('Delete response:', response.data);
      
      toast.success(`User ${username} deleted successfully`);
      await fetchCompanyData();
    } catch (err) {
      console.error('Delete user error:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to delete user';
      toast.error(errorMessage);
    } finally {
      setDeletingUserId(null);
      setActionLoading(false);
    }
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

  // Get values from backend
  const totalStorage = companyData.totalStorage || 0;
  const totalAllocated = companyData.allocatedToUsers || 0;
  const availableToAllocate = totalStorage - totalAllocated;

  console.log('Company Stats:', {
    totalStorage: formatBytes(totalStorage),
    totalAllocated: formatBytes(totalAllocated),
    availableToAllocate: formatBytes(availableToAllocate),
    userCount: companyData.users?.length,
    fileCount: companyData.recentFiles?.length
  });

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

      {/* Storage Stats Cards - 3 Cards Only */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Storage Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Storage</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{formatBytes(totalStorage)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <MdStorage className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
          </div>
          {/* <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Allocated: {formatBytes(totalAllocated)}</span>
              <span>{((totalAllocated / totalStorage) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-orange-500 dark:bg-orange-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(totalAllocated / totalStorage) * 100}%` }}
              ></div>
            </div>
          </div> */}
        </div>

        {/* Team Members Card */}
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

        {/* Total Files Card */}
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
      </div>

      {/* Storage Warning if needed */}
      {/* {totalAllocated > totalStorage * 0.8 && (
        <div className={`rounded-lg p-4 ${
          totalAllocated > totalStorage * 0.9 
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center">
            <MdWarning className={`text-xl mr-3 ${
              totalAllocated > totalStorage * 0.9 ? 'text-red-500 dark:text-red-400' : 'text-yellow-500 dark:text-yellow-400'
            }`} />
            <div>
              <p className={`font-medium ${
                totalAllocated > totalStorage * 0.9 ? 'text-red-800 dark:text-red-400' : 'text-yellow-800 dark:text-yellow-400'
              }`}>
                Storage {totalAllocated > totalStorage * 0.9 ? 'Critical' : 'Warning'}
              </p>
              <p className={`text-sm ${
                totalAllocated > totalStorage * 0.9 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                Your company has allocated {((totalAllocated / totalStorage) * 100).toFixed(1)}% of total storage.
                {totalAllocated > totalStorage * 0.9 
                  ? ' Consider freeing up space or contact super admin.' 
                  : ' Plan your storage allocation carefully.'}
              </p>
            </div>
          </div>
        </div>
      )} */}

      {/* Team Members Table */}
      {companyData.users && companyData.users.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Team Members</h3>
            <button
              onClick={fetchCompanyData}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <MdRefresh size={18} />
            </button>
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
                  const memberStorageAllocated = member.storageAllocated || 0;
                  const memberStorageUsed = member.storageUsed || 0;
                  
                  const usagePercentage = memberStorageAllocated > 0 
                    ? ((memberStorageUsed / memberStorageAllocated) * 100).toFixed(1) 
                    : '0.0';
                  
                  const isOwner = member._id === companyData.owner?._id;
                  const isCurrentUser = member._id === currentUser?._id;
                  
                  // Only show actions for non-owner, non-current users
                  const showActions = isAdmin && !isOwner && !isCurrentUser;
                  
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
                          {isOwner && (
                            <span className="ml-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 text-xs rounded-full">
                              Owner
                            </span>
                          )}
                          {isCurrentUser && !isOwner && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs rounded-full">
                              You
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
                        {formatBytes(memberStorageAllocated)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {formatBytes(memberStorageUsed)}
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
                      {showActions && (
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                console.log('Edit button clicked for user:', member);
                                handleAllocateStorage(member);
                              }}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Allocate Storage"
                              disabled={availableToAllocate <= 0 || actionLoading}
                            >
                              <MdEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(member._id, member.username)}
                              disabled={deletingUserId === member._id || actionLoading}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete User"
                            >
                              {deletingUserId === member._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <MdDelete size={18} />
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                      {!showActions && (isOwner || isCurrentUser) && (
                        <td className="py-3 px-4 text-xs text-gray-400">
                          {isOwner ? 'Owner' : ''}
                        </td>
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
            availableToAllocate: availableToAllocate
          }}
          onClose={() => {
            console.log('Closing storage modal');
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