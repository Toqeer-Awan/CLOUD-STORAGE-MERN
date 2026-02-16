import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { companyAPI, storageAPI } from '../redux/api/api';
import useToast from '../hooks/useToast';
import { 
  MdStorage, MdPeople, MdFolder, MdDelete, 
  MdAddCircle, MdBusiness, MdWarning,
  MdPerson, MdEmail, MdCalendarToday
} from "react-icons/md";

const AdminCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [storageAmount, setStorageAmount] = useState('');
  const { user } = useSelector((state) => state.auth);
  const toast = useToast();

  useEffect(() => {
    if (user?.role === 'superAdmin') {
      fetchCompanies();
    }
  }, [user]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getAllCompanies();
      setCompanies(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load companies');
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateStorage = async () => {
    if (!selectedCompany) return;
    if (!storageAmount || storageAmount < 0.1) {
      toast.error('Storage must be at least 0.1 GB');
      return;
    }

    try {
      await storageAPI.allocateToCompany({
        companyId: selectedCompany._id,
        storageInGB: parseFloat(storageAmount)
      });
      toast.success(`Allocated ${storageAmount}GB to ${selectedCompany.name}`);
      setSelectedCompany(null);
      setStorageAmount('');
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to allocate storage');
    }
  };

  const handleDeleteCompany = async (companyId, companyName) => {
    if (!window.confirm(`Delete ${companyName}? This will delete ALL users and files!`)) return;
    try {
      await companyAPI.deleteCompany(companyId);
      toast.success(`Company deleted successfully`);
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete company');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  if (user?.role !== 'superAdmin') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center border border-gray-100 dark:border-gray-700">
        <MdWarning className="mx-auto text-5xl text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400">Only Super Admin can access this page</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 dark:border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <MdBusiness className="text-orange-600 dark:text-orange-400 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Companies Management</h1>
              <p className="text-gray-500 dark:text-gray-400">Total Companies: {companies.length}</p>
            </div>
          </div>
          <button
            onClick={fetchCompanies}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Storage Allocation Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Allocate Storage to {selectedCompany.name}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Storage: {formatBytes(selectedCompany.totalStorage)}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={storageAmount}
                onChange={(e) => setStorageAmount(e.target.value)}
                placeholder="Enter storage in GB"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAllocateStorage}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                Allocate
              </button>
              <button
                onClick={() => {
                  setSelectedCompany(null);
                  setStorageAmount('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Companies Grid */}
      <div className="grid grid-cols-1 gap-6">
        {companies.map((company) => (
          <div key={company._id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{company.name}</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Owner: {company.owner?.username || 'Unknown'} • Created: {new Date(company.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCompany(company)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Allocate Storage"
                  >
                    <MdAddCircle size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteCompany(company._id, company.name)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete Company"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Storage</p>
                      <p className="text-lg font-bold text-gray-800 dark:text-white">
                        {formatBytes(company.totalStorage)}
                      </p>
                    </div>
                    <MdStorage className="text-blue-600 dark:text-blue-400 text-xl" />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Used Storage</p>
                      <p className="text-lg font-bold text-gray-800 dark:text-white">
                        {formatBytes(company.usedStorage || 0)}
                      </p>
                    </div>
                    <MdFolder className="text-green-600 dark:text-green-400 text-xl" />
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min(company.storagePercentage || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Users</p>
                      <p className="text-lg font-bold text-gray-800 dark:text-white">
                        {company.users?.length || 0}
                      </p>
                    </div>
                    <MdPeople className="text-purple-600 dark:text-purple-400 text-xl" />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Files</p>
                      <p className="text-lg font-bold text-gray-800 dark:text-white">
                        {company.totalFiles || 0}
                      </p>
                    </div>
                    <MdFolder className="text-orange-600 dark:text-orange-400 text-xl" />
                  </div>
                </div>
              </div>

              {/* Users Table */}
              {company.users && company.users.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Team Members</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">User</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Role</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Email</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {company.users.slice(0, 5).map((user) => (
                          <tr key={user._id}>
                            <td className="py-2 px-3">
                              <div className="flex items-center">
                                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                                    {user.username?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-800 dark:text-white">{user.username}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                                user.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                                user.role === 'moderator' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                                'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                            <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {company.users.length > 5 && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        +{company.users.length - 5} more users
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {companies.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center border border-gray-100 dark:border-gray-700">
            <MdBusiness className="mx-auto text-5xl text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No companies found</h3>
            <p className="text-gray-500 dark:text-gray-500">Companies will appear when users register</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCompanies;