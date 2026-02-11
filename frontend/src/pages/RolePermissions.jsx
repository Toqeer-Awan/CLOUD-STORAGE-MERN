import React, { useState, useEffect } from 'react';
import { userAPI } from '../redux/api/api';
import { MdAccessTime, MdCalendarToday, MdUpdate, MdPerson } from 'react-icons/md';

const RolesPermissions = () => {
  const [roles, setRoles] = useState({
    admin: {
      view: true, upload: true, download: true, delete: true,
      addUser: true, removeUser: true, changeRole: true, manageFiles: true
    },
    moderator: {
      view: true, upload: true, download: true, delete: true,
      addUser: false, removeUser: false, changeRole: false, manageFiles: true
    },
    user: {
      view: true, upload: true, download: true, delete: false,
      addUser: false, removeUser: false, changeRole: false, manageFiles: false
    }
  });

  const [customRoles, setCustomRoles] = useState([]);
  const [roleTimestamps, setRoleTimestamps] = useState({
    admin: { createdAt: null, updatedAt: null, permissionsUpdatedAt: null },
    moderator: { createdAt: null, updatedAt: null, permissionsUpdatedAt: null },
    user: { createdAt: null, updatedAt: null, permissionsUpdatedAt: null }
  });
  const [loading, setLoading] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newPermissionName, setNewPermissionName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const defaultPermissions = [
    'view', 'upload', 'download', 'delete', 
    'addUser', 'removeUser', 'changeRole', 'manageFiles'
  ];

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await userAPI.getAllPermissions();
      if (response.data) {
        const { roles: backendRoles, customRoles: backendCustomRoles, roleTimestamps: backendTimestamps } = response.data;
        
        setRoles({
          admin: backendRoles.admin || roles.admin,
          moderator: backendRoles.moderator || roles.moderator,
          user: backendRoles.user || roles.user,
        });
        
        if (backendTimestamps) {
          setRoleTimestamps(backendTimestamps);
        }
        
        if (backendCustomRoles) {
          setCustomRoles(backendCustomRoles);
        }
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const timeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
    return formatDate(dateString);
  };

  const togglePermission = (role, permission) => {
    if (['admin', 'moderator', 'user'].includes(role)) {
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
            ? { ...r, permissions: { ...r.permissions, [permission]: !r.permissions[permission] } }
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
      const response = await userAPI.updatePermissions({ roles, customRoles });
      setSuccess(`✅ Permissions saved successfully at ${new Date().toLocaleTimeString()}`);
      setTimeout(() => fetchPermissions(), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save permissions');
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

    if (['admin', 'moderator', 'user'].includes(roleName)) {
      setError('Cannot create default role');
      return;
    }

    if (customRoles.find(r => r.name === roleName)) {
      setError('Role already exists');
      return;
    }

    const permissionsObj = {};
    defaultPermissions.forEach(perm => {
      permissionsObj[perm] = false;
    });

    const newRole = {
      name: roleName,
      displayName: newRoleName,
      permissions: permissionsObj,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCustomRoles(prev => [...prev, newRole]);
    setNewRoleName('');
    setError('');
    setSuccess(`Role "${newRoleName}" added`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAddPermission = () => {
    if (!newPermissionName.trim()) {
      setError('Permission name is required');
      return;
    }

    const permKey = newPermissionName.toLowerCase().replace(/\s+/g, '_');

    if (defaultPermissions.includes(permKey)) {
      setError('Permission already exists');
      return;
    }

    const allRolesCombined = { ...roles };
    customRoles.forEach(cr => {
      allRolesCombined[cr.name] = cr.permissions;
    });

    for (const roleName in allRolesCombined) {
      if (allRolesCombined[roleName][permKey] !== undefined) {
        setError('Permission already exists in some role');
        return;
      }
    }

    setRoles(prev => ({
      ...prev,
      admin: { ...prev.admin, [permKey]: true },
      moderator: { ...prev.moderator, [permKey]: false },
      user: { ...prev.user, [permKey]: false }
    }));

    setCustomRoles(prev =>
      prev.map(role => ({
        ...role,
        permissions: { ...role.permissions, [permKey]: false }
      }))
    );

    setNewPermissionName('');
    setError('');
    setSuccess(`Permission "${newPermissionName}" added`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteRole = async (roleName) => {
    if (['admin', 'moderator', 'user'].includes(roleName)) {
      setError('Cannot delete default roles');
      return;
    }

    try {
      await userAPI.deleteCustomRole(roleName);
      setCustomRoles(prev => prev.filter(r => r.name !== roleName));
      setSuccess(`Role "${roleName}" deleted`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete role');
    }
  };

  const getAllPermissions = () => {
    const allPermissions = new Set();
    defaultPermissions.forEach(p => allPermissions.add(p));
    Object.values(roles).forEach(rolePerms => {
      Object.keys(rolePerms).forEach(p => allPermissions.add(p));
    });
    customRoles.forEach(cr => {
      Object.keys(cr.permissions).forEach(p => allPermissions.add(p));
    });
    return Array.from(allPermissions).sort();
  };

  const getPermissionValue = (role, permission) => {
    if (['admin', 'moderator', 'user'].includes(role)) {
      return !!roles[role]?.[permission];
    }
    const customRole = customRoles.find(r => r.name === role);
    return !!customRole?.permissions?.[permission];
  };

  const formatPermission = (permission) => {
    return permission.replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  };

  const allRoles = [...['admin', 'moderator', 'user'], ...customRoles.map(r => r.name)];
  const allPermissionsList = getAllPermissions();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Roles & Permissions</h2>
              <p className="text-gray-600 text-sm mt-1">Manage user permissions with timestamps</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
              >
                List View
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">{success}</div>
        )}

        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Role</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Enter role name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  onClick={handleAddRole}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Role
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Example: editor, manager, viewer</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Permission</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPermissionName}
                  onChange={(e) => setNewPermissionName(e.target.value)}
                  placeholder="Enter permission name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  onClick={handleAddPermission}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Permission
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Example: export_data, view_reports</p>
            </div>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="p-6">
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Permission</th>
                    {allRoles.map(role => {
                      const isCustom = !['admin', 'moderator', 'user'].includes(role);
                      const roleData = isCustom 
                        ? customRoles.find(r => r.name === role)
                        : roleTimestamps[role];
                      
                      return (
                        <th key={role} className="py-3 px-4 text-center text-sm font-medium text-gray-700">
                          <div className="flex flex-col items-center">
                            <span className="capitalize font-semibold">{role.replace(/_/g, ' ')}</span>
                            <div className="mt-1 space-y-1">
                              {roleData?.updatedAt && (
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <MdUpdate className="w-3 h-3" />
                                  {timeAgo(roleData.updatedAt)}
                                </div>
                              )}
                              {isCustom && (
                                <button
                                  onClick={() => handleDeleteRole(role)}
                                  className="mt-1 text-xs text-red-600 hover:text-red-800"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allPermissionsList.map(permission => (
                    <tr key={permission} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-700">{formatPermission(permission)}</span>
                      </td>
                      {allRoles.map(role => (
                        <td key={role} className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={getPermissionValue(role, permission)}
                            onChange={() => togglePermission(role, permission)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allRoles.map(role => {
                const isCustom = !['admin', 'moderator', 'user'].includes(role);
                const rolePermissions = isCustom 
                  ? customRoles.find(r => r.name === role)?.permissions || {}
                  : roles[role];
                const roleData = isCustom 
                  ? customRoles.find(r => r.name === role)
                  : roleTimestamps[role];
                
                return (
                  <div key={role} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 capitalize">
                          {role.replace(/_/g, ' ')}
                          <span className={`ml-2 text-xs px-2 py-1 rounded ${isCustom ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {isCustom ? 'Custom' : 'Default'}
                          </span>
                        </h3>
                        <div className="mt-2 space-y-1">
                          {roleData?.createdAt && (
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <MdCalendarToday className="w-3 h-3" />
                              Created: {formatDate(roleData.createdAt)}
                            </div>
                          )}
                          {roleData?.updatedAt && (
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <MdUpdate className="w-3 h-3" />
                              Updated: {timeAgo(roleData.updatedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                      {isCustom && (
                        <button
                          onClick={() => handleDeleteRole(role)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {Object.entries(rolePermissions).map(([perm, value]) => (
                        <div key={perm} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{formatPermission(perm)}</span>
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={() => togglePermission(role, perm)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Total: {allRoles.length} roles • {allPermissionsList.length} permissions
              </p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <MdAccessTime className="w-3 h-3" />
                Last save will update all timestamps
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MdAccessTime className="text-blue-500" />
          Activity Timeline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Default Roles</h4>
            {['admin', 'moderator', 'user'].map(role => (
              <div key={role} className="mb-2">
                <p className="text-sm font-medium text-gray-800 capitalize">{role}</p>
                {roleTimestamps[role]?.updatedAt && (
                  <p className="text-xs text-gray-600">Updated: {timeAgo(roleTimestamps[role].updatedAt)}</p>
                )}
              </div>
            ))}
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Custom Roles</h4>
            {customRoles.length === 0 ? (
              <p className="text-sm text-gray-600">No custom roles</p>
            ) : (
              customRoles.slice(0, 3).map(role => (
                <div key={role.name} className="mb-2">
                  <p className="text-sm font-medium text-gray-800 capitalize">{role.displayName}</p>
                  <p className="text-xs text-gray-600">Created: {timeAgo(role.createdAt)}</p>
                </div>
              ))
            )}
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">System Status</h4>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Total Permissions:</span> {allPermissionsList.length}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Last Fetch:</span> {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolesPermissions;