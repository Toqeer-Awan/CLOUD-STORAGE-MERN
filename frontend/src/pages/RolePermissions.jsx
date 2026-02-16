import React, { useState, useEffect } from 'react';
import { userAPI } from '../redux/api/api';
import useToast from '../hooks/useToast';
import { 
  MdSecurity, MdSave, MdAdd, MdDelete, 
  MdAdminPanelSettings, MdPerson, 
  MdVisibility, MdUpload, MdDownload, 
  MdPersonAdd, MdPersonRemove, MdSwitchAccount, MdFolder,
  MdStorage, MdAssignment, MdClose, MdCheck,
  MdVerifiedUser
} from 'react-icons/md';

const RolesPermissions = () => {
  const [roles, setRoles] = useState({});
  const [customRoles, setCustomRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [newRoleName, setNewRoleName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const toast = useToast();

  const permissionCategories = {
    files: {
      title: 'File Permissions',
      icon: MdFolder,
      permissions: ['view', 'upload', 'download', 'delete', 'manageFiles']
    },
    users: {
      title: 'User Management',
      icon: MdPerson,
      permissions: ['addUser', 'removeUser', 'changeRole']
    },
    storage: {
      title: 'Storage Management',
      icon: MdStorage,
      permissions: ['manageStorage', 'assignStorage']
    }
  };

  const permissionIcons = {
    view: MdVisibility,
    upload: MdUpload,
    download: MdDownload,
    delete: MdDelete,
    manageFiles: MdFolder,
    addUser: MdPersonAdd,
    removeUser: MdPersonRemove,
    changeRole: MdSwitchAccount,
    manageStorage: MdStorage,
    assignStorage: MdAssignment
  };

  const permissionLabels = {
    view: 'View Files',
    upload: 'Upload Files',
    download: 'Download Files',
    delete: 'Delete Files',
    manageFiles: 'Manage All Files',
    addUser: 'Add Users',
    removeUser: 'Remove Users',
    changeRole: 'Change User Roles',
    manageStorage: 'Manage Storage',
    assignStorage: 'Assign Storage to Users'
  };

  const formatRoleName = (roleName) => {
    return roleName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  const getRoleIcon = (role) => {
    if (role === 'superAdmin') return <MdVerifiedUser className="text-purple-500 dark:text-purple-400" size={20} />;
    if (role === 'admin') return <MdAdminPanelSettings className="text-red-500 dark:text-red-400" size={20} />;
    if (role === 'user') return <MdPerson className="text-green-500 dark:text-green-400" size={20} />;
    return <MdSecurity className="text-blue-500 dark:text-blue-400" size={20} />;
  };

  const getRoleBadgeColor = (role) => {
    if (role === 'superAdmin') return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    if (role === 'admin') return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800';
    if (role === 'user') return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800';
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800';
  };

  const formatPermission = (permission) => {
    return permissionLabels[permission] || permission
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setInitialLoading(true);
      const response = await userAPI.getAllPermissions();
      console.log('API Response:', response.data);
      
      if (response.data) {
        // Set default roles
        if (response.data.roles) {
          setRoles(response.data.roles);
        }
        
        // Set custom roles
        if (response.data.customRoles && Array.isArray(response.data.customRoles)) {
          setCustomRoles(response.data.customRoles);
        }
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
      toast.error('Failed to load permissions');
    } finally {
      setInitialLoading(false);
    }
  };

  const togglePermission = (role, permission) => {
    if (roles.hasOwnProperty(role)) {
      setRoles(prev => ({
        ...prev,
        [role]: {
          ...prev[role],
          [permission]: !prev[role][permission]
        }
      }));
    } else {
      setCustomRoles(prev =>
        prev.map(r =>
          r.name === role
            ? { 
                ...r, 
                permissions: { 
                  ...r.permissions, 
                  [permission]: !r.permissions[permission] 
                } 
              }
            : r
        )
      );
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = { 
        roles, 
        customRoles: customRoles.map(role => ({
          name: role.name,
          displayName: role.displayName || role.name,
          permissions: role.permissions,
          isCustom: true
        }))
      };
      
      console.log('Saving permissions:', payload);
      
      // Send to backend
      const response = await userAPI.updatePermissions(payload);
      
      console.log('Save response:', response.data);
      
      setSuccess('Permissions saved successfully');
      toast.success('Permissions updated');
      
      // Fetch fresh data from backend
      await fetchPermissions();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.error || 'Failed to save permissions');
      toast.error('Failed to save permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = () => {
    if (!newRoleName.trim()) {
      setError('Role name is required');
      return;
    }

    const roleName = newRoleName.toLowerCase().replace(/\s+/g, '_');

    // Check if role already exists
    if (roles.hasOwnProperty(roleName) || customRoles.find(r => r.name === roleName)) {
      setError('Role already exists');
      return;
    }

    // Create permissions object with all permissions set to false
    const permissions = {};
    Object.values(permissionCategories).forEach(category => {
      category.permissions.forEach(perm => {
        permissions[perm] = false;
      });
    });

    const newRole = {
      name: roleName,
      displayName: newRoleName,
      permissions,
      isCustom: true
    };

    setCustomRoles(prev => [...prev, newRole]);
    setNewRoleName('');
    setError('');
    setSuccess(`Role "${newRoleName}" added`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteRole = async (roleName) => {
    // Check if it's a default role
    if (roles.hasOwnProperty(roleName)) {
      setError('Cannot delete default roles');
      return;
    }

    try {
      await userAPI.deleteCustomRole(roleName);
      setCustomRoles(prev => prev.filter(r => r.name !== roleName));
      setSuccess(`Role "${roleName}" deleted`);
      toast.success('Role deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete role');
      toast.error('Failed to delete role');
    }
  };

  // Create lists for display with unique IDs
  const defaultRolesList = Object.keys(roles).map(roleName => ({
    id: `default-${roleName}`,
    name: roleName,
    displayName: formatRoleName(roleName),
    isCustom: false,
    permissions: roles[roleName]
  }));

  const customRolesList = customRoles.map((role, index) => ({
    id: `custom-${role.name}-${index}`,
    name: role.name,
    displayName: role.displayName || role.name,
    isCustom: true,
    permissions: role.permissions
  }));

  const allRoles = [...defaultRolesList, ...customRolesList];

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 dark:border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
            <MdSecurity className="text-orange-600 dark:text-orange-400 text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Roles & Permissions</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage user roles and permissions</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Create New Custom Role</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Enter role name (e.g., Editor, Viewer, Manager)"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAddRole}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <MdAdd size={20} />
            Add Role
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
          <MdClose className="text-lg" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-lg flex items-center gap-2">
          <MdCheck className="text-lg" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {allRoles.map((role) => (
          <div key={role.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    role.name === 'superAdmin' ? 'bg-purple-100 dark:bg-purple-900/30' :
                    role.name === 'admin' ? 'bg-red-100 dark:bg-red-900/30' :
                    role.name === 'user' ? 'bg-green-100 dark:bg-green-900/30' :
                    'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {getRoleIcon(role.name)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {role.displayName}
                    </h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full border ${getRoleBadgeColor(role.name)}`}>
                      {role.isCustom ? 'Custom Role' : 'Default Role'}
                    </span>
                  </div>
                </div>
                {role.isCustom && (
                  <button
                    onClick={() => handleDeleteRole(role.name)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete Role"
                  >
                    <MdDelete size={20} />
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 space-y-4">
              {Object.entries(permissionCategories).map(([key, category]) => {
                const Icon = category.icon;
                const rolePermissions = role.permissions;

                return (
                  <div key={`${role.id}-${key}`} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Icon className="text-gray-500 dark:text-gray-400" size={16} />
                      <span>{category.title}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {category.permissions.map(permission => {
                        const PermissionIcon = permissionIcons[permission] || MdSecurity;
                        return (
                          <label
                            key={`${role.id}-${permission}`}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <PermissionIcon className="text-gray-500 dark:text-gray-400" size={14} />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {formatPermission(permission)}
                              </span>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={rolePermissions?.[permission] || false}
                                onChange={() => togglePermission(role.name, permission)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600 dark:peer-checked:bg-orange-500"></div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-3 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <MdSave size={20} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolesPermissions;