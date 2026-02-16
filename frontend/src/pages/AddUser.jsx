import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addUser } from '../redux/slices/userSlice';
import { userAPI } from '../redux/api/api';
import useToast from '../hooks/useToast';
import { MdPersonAdd, MdEmail, MdLock, MdAdminPanelSettings, MdClear, MdInfo } from 'react-icons/md';

const AddUser = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '', role: 'user' // Default to 'user'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const dispatch = useDispatch();
  const toast = useToast();

  useEffect(() => {
    fetchRoles();
  }, []);

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
            // Check if this role name already exists (shouldn't, but just in case)
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
        
        console.log('Final Roles List for dropdown:', rolesList);
        setAvailableRoles(rolesList);
        
        // For admin users, always set role to 'user' and disable selection
        if (currentUser?.role === 'admin') {
          setFormData(prev => ({ ...prev, role: 'user' }));
        } 
        // For superAdmin, set default to first role if available
        else if (rolesList.length > 0 && !formData.role) {
          setFormData(prev => ({ ...prev, role: rolesList[0].name }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles');
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username required';
    if (!formData.email.trim()) newErrors.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.password) newErrors.password = 'Password required';
    else if (formData.password.length < 6) newErrors.password = 'Min 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.role) newErrors.role = 'Please select a role';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await userAPI.createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      dispatch(addUser(response.data.user));
      toast.userAdded('User created successfully!');
      
      // Reset form - keep role as 'user' for admin
      if (currentUser?.role === 'admin') {
        setFormData({ username: '', email: '', password: '', confirmPassword: '', role: 'user' });
      } else {
        setFormData({ username: '', email: '', password: '', confirmPassword: '', role: availableRoles[0]?.name || '' });
      }
      setErrors({});
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <MdPersonAdd className="text-orange-600 dark:text-orange-400 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Add New User</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {isAdmin ? 'Add a new team member (user role only)' : 'Create a new user account'}
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                    errors.username ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter username"
                />
              </div>
              {errors.username && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                    errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter email address"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MdAdminPanelSettings className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                
                {isAdmin ? (
                  // 🔒 Admin: Show disabled select with only 'user' option
                  <>
                    <select
                      value="user"
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed appearance-none"
                    >
                      <option value="user">User</option>
                    </select>
                    <input type="hidden" name="role" value="user" />
                  </>
                ) : (
                  // SuperAdmin: Show all roles
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none ${
                      errors.role ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={loadingRoles}
                  >
                    <option value="">Select a role</option>
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.displayName} {role.type === 'default' ? '(Default)' : '(Custom)'}
                      </option>
                    ))}
                  </select>
                )}
                
                {loadingRoles && (
                  <p className="text-xs text-gray-500 mt-1">Loading roles...</p>
                )}
              </div>
              
              {/* 🔒 Info message for admin */}
              {isAdmin && (
                <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                  <MdInfo size={14} />
                  <span>As an admin, you can only assign the 'User' role to new team members</span>
                </div>
              )}
              
              {errors.role && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MdLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                    errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter password"
                />
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MdLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                    errors.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Confirm password"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isAdmin) {
                    setFormData({ username: '', email: '', password: '', confirmPassword: '', role: 'user' });
                  } else if (availableRoles.length > 0) {
                    setFormData({ username: '', email: '', password: '', confirmPassword: '', role: availableRoles[0].name });
                  } else {
                    setFormData({ username: '', email: '', password: '', confirmPassword: '', role: '' });
                  }
                  setErrors({});
                }}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <MdClear size={18} />
                Clear
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUser;