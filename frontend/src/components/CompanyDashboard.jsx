// frontend/src/components/CompanyDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { companyAPI } from '../redux/api/api';
import { 
  MdStorage, MdPeople, MdFolder, MdCloud, 
  MdWarning, MdCheckCircle, MdBarChart 
} from "react-icons/md";

const CompanyDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getMyCompany();
      setCompanyData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!companyData) return null;

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">{companyData.name}</h1>
            <p className="text-orange-100">Owned by {companyData.owner?.username || 'Admin'}</p>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <span className="text-sm">Active</span>
          </div>
        </div>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Storage</p>
              <p className="text-2xl font-bold text-gray-800">{formatBytes(companyData.totalStorage)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MdStorage className="text-blue-600 text-xl" />
            </div>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-blue-600">
                  Used: {formatBytes(companyData.storageUsed)}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {companyData.storagePercentage}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div
                style={{ width: `${Math.min(companyData.storagePercentage, 100)}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-gray-800">{companyData.users?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Including you</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <MdPeople className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Files</p>
              <p className="text-2xl font-bold text-gray-800">{companyData.recentFiles?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Across all users</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <MdFolder className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Storage Alert */}
      {companyData.storagePercentage > 80 && (
        <div className={`rounded-lg p-4 ${
          companyData.storagePercentage > 90 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            <MdWarning className={`text-xl mr-3 ${
              companyData.storagePercentage > 90 ? 'text-red-500' : 'text-yellow-500'
            }`} />
            <div>
              <p className={`font-medium ${
                companyData.storagePercentage > 90 ? 'text-red-800' : 'text-yellow-800'
              }`}>
                Storage {companyData.storagePercentage > 90 ? 'Critical' : 'Warning'}
              </p>
              <p className={`text-sm ${
                companyData.storagePercentage > 90 ? 'text-red-600' : 'text-yellow-600'
              }`}>
                Your company has used {companyData.storagePercentage}% of storage.
                {companyData.storagePercentage > 90 
                  ? ' Please free up space or contact admin for more storage.' 
                  : ' Consider managing your files.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Table */}
      {companyData.users && companyData.users.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Team Members</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">User</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Role</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Files</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Storage Used</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {companyData.users.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold text-sm">
                            {member.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-800">{member.username}</span>
                        {member._id === companyData.owner?._id && (
                          <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full">
                            Owner
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{member.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                        member.role === 'admin' ? 'bg-red-100 text-red-800' :
                        member.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{member.fileCount || 0}</td>
                    <td className="py-3 px-4 text-gray-600">{formatBytes(member.storageUsed || 0)}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;