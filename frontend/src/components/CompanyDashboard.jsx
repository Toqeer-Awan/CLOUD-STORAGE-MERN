import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { companyAPI, userAPI } from '../redux/api/api';
import useToast from '../hooks/useToast';
import UserStorageManager from '../components/UserStoreManager';
import { 
  MdStorage, MdPeople, MdFolder, MdBusiness,
  MdWarning, MdCheckCircle, MdPerson, 
  MdEdit, MdDelete, MdRefresh
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
  console.log('🔍 Current User:', { id: currentUser?._id, role: currentUser?.role, isAdmin });

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getMyCompany();
      console.log('📊 Company Data from API:', response.data);
      setCompanyData(response.data);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load company data');
      toast.error('Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const handleStorageSuccess = () => {
    console.log('✅ Storage allocation successful, refreshing data...');
    fetchCompanyData(); // This will refresh all data including cards
    setShowStorageModal(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete ${username}?`)) return;

    setDeletingUserId(userId);
    setActionLoading(true);
    
    try {
      await userAPI.deleteUser(userId);
      toast.success(`User ${username} deleted successfully`);
      await fetchCompanyData(); // Refresh after delete
    } catch (err) {
      console.error('❌ Delete error:', err);
      toast.error(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
      setActionLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 GB';
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
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-700 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!companyData) return null;

  // Extract data from companyData
  const totalStorage = companyData.totalStorage || 0;
  const usedStorage = companyData.usedStorage || 0;
  const users = companyData.users || [];
  
  // Find admin from users list
  const adminUser = users.find(u => u.role === 'admin') || {};
  
  // Calculate admin storage info from actual user data
  const adminAllocated = adminUser.storageAllocated || 0;
  const adminUsed = adminUser.storageUsed || 0;
  
  // Calculate total allocated to all users (excluding admin)
  const regularUsers = users.filter(u => u.role !== 'admin');
  const totalAllocatedToUsers = regularUsers.reduce((sum, user) => sum + (user.storageAllocated || 0), 0);
  
  // Calculate available to allocate (admin's remaining storage)
  const availableToAllocate = Math.max(0, adminAllocated - adminUsed - totalAllocatedToUsers);

  // Calculate percentages
  const usedPercentage = totalStorage > 0 ? ((usedStorage / totalStorage) * 100).toFixed(1) : '0';
  const allocatedPercentage = totalStorage > 0 ? ((totalAllocatedToUsers / totalStorage) * 100).toFixed(1) : '0';

  console.log('📊 Calculated Storage Values:', {
    totalStorage: formatBytes(totalStorage),
    usedStorage: formatBytes(usedStorage),
    adminAllocated: formatBytes(adminAllocated),
    adminUsed: formatBytes(adminUsed),
    totalAllocatedToUsers: formatBytes(totalAllocatedToUsers),
    availableToAllocate: formatBytes(availableToAllocate),
    usedPercentage,
    allocatedPercentage
  });

  // Combine admin and regular users for display
  const allUsers = [adminUser, ...regularUsers].filter(u => u && u._id);

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-1">{companyData.name}</h1>
            <p className="text-orange-100 dark:text-orange-200">
              Owned by {companyData.owner?.username}
            </p>
          </div>
          <div className="bg-white/20 dark:bg-black/20 rounded-lg px-4 py-2">
            <span className="text-sm flex items-center gap-1">
              <MdCheckCircle className="text-green-300 dark:text-green-400" />
              <span>Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Storage Stats Cards - Now Fully Dynamic */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Storage Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Storage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatBytes(totalStorage)}</p>
            </div>
            <MdStorage className="text-blue-500 dark:text-blue-400 text-2xl" />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Company limit</p>
        </div>

        {/* Used Storage Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Used Storage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatBytes(usedStorage)}</p>
            </div>
            <MdFolder className="text-green-500 dark:text-green-400 text-2xl" />
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 dark:bg-green-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${usedPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{usedPercentage}% of total</p>
          </div>
        </div>

        {/* Admin Given to Users Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Admin Given to Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatBytes(totalAllocatedToUsers)}</p>
            </div>
            <MdPeople className="text-purple-500 dark:text-purple-400 text-2xl" />
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-500 dark:bg-purple-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${allocatedPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{allocatedPercentage}% of total</p>
          </div>
        </div>

        {/* Admin Available Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Admin Available</p>
              <p className={`text-2xl font-bold ${
                availableToAllocate <= 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-900 dark:text-white'
              }`}>{formatBytes(availableToAllocate)}</p>
            </div>
            <MdStorage className="text-orange-500 dark:text-orange-400 text-2xl" />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {availableToAllocate <= 0 ? 'No storage left' : 'Remaining from admin\'s 50GB'}
          </p>
        </div>
      </div>

      {/* Admin Storage Info */}
      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
            <MdPerson className="text-blue-600 dark:text-blue-400 text-xl" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-blue-800 dark:text-blue-300">Admin Storage: {adminUser.username}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm">
              <div>
                <span className="text-blue-600 dark:text-blue-400">Allocated:</span>{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatBytes(adminAllocated)}</span>
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400">Used by self:</span>{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatBytes(adminUsed)}</span>
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400">Given to users:</span>{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatBytes(totalAllocatedToUsers)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h3>
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
              {allUsers.map((member) => {
                if (!member || !member._id) return null;
                
                const isOwner = member.role === 'admin' && member._id === companyData.owner?._id;
                const isCurrentUser = member._id === currentUser?._id;
                
                const usagePercentage = member.storageAllocated > 0 
                  ? ((member.storageUsed / member.storageAllocated) * 100).toFixed(1) 
                  : '0.0';
                
                return (
                  <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            {member.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{member.username}</span>
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
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{member.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                        member.role === 'admin' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {formatBytes(member.storageAllocated)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {formatBytes(member.storageUsed)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{usagePercentage}%</span>
                        {member.storageAllocated > 0 && (
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
                        )}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4">
                        {member.role !== 'admin' ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                console.log('📝 Edit clicked for:', member.username);
                                setSelectedUser(member);
                                setShowStorageModal(true);
                              }}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer"
                              title="Allocate Storage"
                            >
                              <MdEdit size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete ${member.username}?`)) {
                                  handleDeleteUser(member._id, member.username);
                                }
                              }}
                              disabled={deletingUserId === member._id}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                              title="Delete User"
                            >
                              {deletingUserId === member._id ? (
                                <div className="animate-spin h-4 w-4 border-2 border-red-600 dark:border-red-400 border-t-transparent rounded-full"></div>
                              ) : (
                                <MdDelete size={18} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Company Owner</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Storage Allocation Modal */}
      {showStorageModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowStorageModal(false)}></div>
            <div className="relative z-50 w-full max-w-md">
              <UserStorageManager
                user={selectedUser}
                admin={{
                  id: companyData.owner?._id,
                  username: companyData.owner?.username,
                  availableToAllocate: availableToAllocate
                }}
                onClose={() => {
                  console.log('Closing storage modal');
                  setShowStorageModal(false);
                  setSelectedUser(null);
                }}
                onSuccess={handleStorageSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;