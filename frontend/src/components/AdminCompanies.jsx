// frontend/src/components/AdminCompanies.jsx
import React, { useEffect, useState } from 'react';
import { companyAPI } from '../redux/api/api';
import { 
  MdStorage, MdPeople, MdFolder, MdDelete, 
  MdEdit, MdWarning, MdCheckCircle 
} from "react-icons/md";

const AdminCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingCompany, setEditingCompany] = useState(null);
  const [newStorage, setNewStorage] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getAllCompanies();
      setCompanies(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStorage = async (companyId) => {
    if (!newStorage || newStorage < 0.1) {
      setError('Storage must be at least 0.1 GB');
      return;
    }

    try {
      const storageInBytes = parseFloat(newStorage) * 1024 * 1024 * 1024;
      await companyAPI.updateCompanyStorage(companyId, { totalStorage: storageInBytes });
      setSuccess(`Storage updated to ${newStorage}GB`);
      setEditingCompany(null);
      setNewStorage('');
      fetchCompanies();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update storage');
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('Are you sure? This will delete ALL users and files in this company!')) {
      return;
    }

    try {
      await companyAPI.deleteCompany(companyId);
      setSuccess('Company deleted successfully');
      fetchCompanies();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete company');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Companies Management</h1>
            <p className="text-gray-600">Total Companies: {companies.length}</p>
          </div>
          <button
            onClick={fetchCompanies}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-center">
          <MdCheckCircle className="mr-2" /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {companies.map((company) => (
          <div key={company._id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{company.name}</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Owner: {company.owner?.username || 'System'} • Created: {new Date(company.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCompany(company._id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <MdEdit size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteCompany(company._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
            </div>

            {editingCompany === company._id && (
              <div className="p-4 bg-blue-50 border-b border-blue-200">
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newStorage}
                    onChange={(e) => setNewStorage(e.target.value)}
                    placeholder="Storage in GB"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={() => handleUpdateStorage(company._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Storage
                  </button>
                  <button
                    onClick={() => setEditingCompany(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Storage</p>
                      <p className="text-lg font-bold text-gray-800">{formatBytes(company.totalStorage)}</p>
                    </div>
                    <MdStorage className="text-blue-600 text-xl" />
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Used: {formatBytes(company.storageUsed || 0)}</span>
                      <span>{company.storagePercentage || 0}%</span>
                    </div>
                    <div className="overflow-hidden h-1.5 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${Math.min(company.storagePercentage || 0, 100)}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Users</p>
                      <p className="text-lg font-bold text-gray-800">{company.users?.length || 0}</p>
                    </div>
                    <MdPeople className="text-green-600 text-xl" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Files</p>
                      <p className="text-lg font-bold text-gray-800">{company.totalFiles || 0}</p>
                    </div>
                    <MdFolder className="text-purple-600 text-xl" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className={`text-lg font-bold ${company.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {company.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${company.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                </div>
              </div>

              {company.users && company.users.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Team Members</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-600">Username</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-600">Email</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-600">Role</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-600">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {company.users.slice(0, 5).map((user) => (
                          <tr key={user._id}>
                            <td className="py-2 px-3 text-sm text-gray-700">{user.username}</td>
                            <td className="py-2 px-3 text-sm text-gray-600">{user.email}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                user.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-sm text-gray-600">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {company.users.length > 5 && (
                      <p className="text-xs text-gray-500 mt-2">
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
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <MdStorage className="mx-auto text-5xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No companies found</h3>
            <p className="text-gray-500">Companies will appear when users register</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCompanies;