import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUsers, updateUserRole, deleteUser } from '../redux/slices/userSlice';
import { userAPI } from '../redux/api/api';
import useToast from '../hooks/useToast';
import { 
  MdDelete, MdSearch, MdRefresh, MdPerson,
  MdEmail, MdAdminPanelSettings, MdCalendarToday,
  MdCheckCircle, MdFilterList
} from "react-icons/md";

const UserList = () => {
  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updating, setUpdating] = useState({});
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAllUsers();
      dispatch(setUsers(response.data));
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await userAPI.getAllPermissions();
      console.log('API Response for roles:', response.data);
      
      if (response.data) {
        const rolesList = [];
        
        // Get default roles from the roles object
        if (response.data.roles) {
          Object.keys(response.data.roles).forEach(roleName => {
            rolesList.push({
              id: `default-${roleName}`,
              name: roleName,
              displayName: formatRoleName(roleName),
              type: 'default'
            });
          });
        }
        
        // Get custom roles
        if (response.data.customRoles && Array.isArray(response.data.customRoles)) {
          response.data.customRoles.forEach(role => {
            // Check if this role name already exists
            const exists = rolesList.some(r => r.name === role.name);
            if (!exists) {
              rolesList.push({
                id: `custom-${role.name}`,
                name: role.name,
                displayName: role.displayName || role.name,
                type: 'custom'
              });
            }
          });
        }
        
        console.log('Final Roles List for UserList:', rolesList);
        setAvailableRoles(rolesList);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  const formatRoleName = (roleName) => {
    return roleName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase());
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(prev => ({ ...prev, [userId]: true }));
    try {
      await userAPI.updateRole(userId, { role: newRole });
      dispatch(updateUserRole({ userId, role: newRole }));
      const role = availableRoles.find(r => r.name === newRole);
      toast.info(`Role updated to ${role?.displayName || newRole}`);
    } catch (err) {
      toast.error('Failed to update role');
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    setUpdating(prev => ({ ...prev, [userId]: true }));
    try {
      await userAPI.deleteUser(userId);
      dispatch(deleteUser(userId));
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getRoleDisplayName = (roleName) => {
    const role = availableRoles.find(r => r.name === roleName);
    return role ? role.displayName : formatRoleName(roleName);
  };

  const getRoleBadgeColor = (roleName) => {
    const role = availableRoles.find(r => r.name === roleName);
    if (role?.type === 'default') {
      if (roleName === 'superAdmin') return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      if (roleName === 'admin') return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      if (roleName === 'user') return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
    }
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(search.toLowerCase()) ||
                         user.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <MdPerson className="text-orange-600 dark:text-orange-400 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">User Management</h1>
              <p className="text-gray-500 dark:text-gray-400">Total Users: {users.length}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              fetchUsers();
              fetchRoles();
            }} 
            disabled={loading} 
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            <MdRefresh className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Users
            </label>
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by username or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Role
            </label>
            <div className="relative">
              <MdFilterList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
                disabled={loadingRoles}
              >
                <option value="all">All Roles</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 dark:border-orange-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">User</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Email</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Role</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Joined</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Status</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            {user.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{user.username}</p>
                          {user._id === currentUser?._id && (
                            <span className="text-xs text-green-600 dark:text-green-400">(You)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MdEmail className="text-gray-400 dark:text-gray-500 text-sm" />
                        <span className="text-gray-600 dark:text-gray-400">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        disabled={updating[user._id] || user._id === currentUser?._id || loadingRoles}
                        className={`px-3 py-1 border rounded-full text-sm font-medium capitalize appearance-none cursor-pointer ${
                          getRoleBadgeColor(user.role)
                        } ${updating[user._id] ? 'opacity-50' : ''}`}
                      >
                        {availableRoles.map((role) => (
                          <option key={role.id} value={role.name}>
                            {role.displayName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MdCalendarToday className="text-gray-400 dark:text-gray-500 text-sm" />
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <MdCheckCircle className="text-sm" />
                        <span className="text-sm">Active</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        disabled={user._id === currentUser?._id || updating[user._id]}
                        className={`p-2 rounded-lg transition-colors ${
                          user._id === currentUser?._id 
                            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                            : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                        }`}
                        title="Delete user"
                      >
                        <MdDelete size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <MdPerson className="mx-auto text-5xl text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No users found</h3>
            <p className="text-gray-500 dark:text-gray-500">Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;