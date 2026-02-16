import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import useToast from '../hooks/useToast';
import { useTheme } from '../context/ThemeContext';
import {
  MdDashboard, MdUpload, MdFolder, MdPeople,
  MdBusiness, MdLogout, MdMenu,
  MdClose, MdPersonAdd, MdList, MdSecurity,
  MdStorage, MdDarkMode, MdLightMode
} from 'react-icons/md';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { darkMode, toggleDarkMode } = useTheme();

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // 🔒 Menu items with role-based visibility - My Company removed from superAdmin
  const menuItems = [
    { path: '/', icon: MdDashboard, label: 'Dashboard', roles: ['superAdmin', 'admin', 'user'] },
    { path: '/upload', icon: MdUpload, label: 'Upload Files', roles: ['admin', 'user'] },
    { path: '/files', icon: MdFolder, label: 'All Files', roles: ['superAdmin', 'admin', 'user'] },
    // 🔒 My Company - Only visible to admin (not superAdmin)
    { path: '/company', icon: MdBusiness, label: 'My Company', roles: ['admin'] },
    // 🔒 Add User - Visible to admin and superAdmin
    { path: '/users/add', icon: MdPersonAdd, label: 'Add User', roles: ['admin', 'superAdmin'] },
    // 🔒 These are ONLY visible to superAdmin
    { path: '/users/list', icon: MdList, label: 'User List', roles: ['superAdmin'] },
    { path: '/roles', icon: MdSecurity, label: 'Roles & Permissions', roles: ['superAdmin'] },
    { path: '/admin/companies', icon: MdStorage, label: 'Manage Companies', roles: ['superAdmin'] },
  ];

  // Filter menu items based on user role
  const filteredMenu = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 fixed h-full z-30`}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
            {sidebarOpen ? (
              <span className="text-xl font-bold text-orange-600 dark:text-orange-500">
                CloudStore
              </span>
            ) : (
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-500 mx-auto">C</span>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              {sidebarOpen ? <MdClose size={20} /> : <MdMenu size={20} />}
            </button>
          </div>

          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-500 font-bold text-lg">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate max-w-[140px]">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role === 'superAdmin' ? 'Super Admin' : user?.role}
                  </p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            {filteredMenu.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 mb-1 transition-colors ${
                    isActive(item.path)
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 border-r-4 border-orange-600'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={20} className={sidebarOpen ? 'mr-3' : 'mx-auto'} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleDarkMode}
              className={`flex items-center w-full px-4 py-2 mb-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                !sidebarOpen && 'justify-center'
              }`}
            >
              {darkMode ? (
                <MdLightMode size={20} className={sidebarOpen ? 'mr-3' : ''} />
              ) : (
                <MdDarkMode size={20} className={sidebarOpen ? 'mr-3' : ''} />
              )}
              {sidebarOpen && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
            
            <button
              onClick={handleLogout}
              className={`flex items-center w-full px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${
                !sidebarOpen && 'justify-center'
              }`}
            >
              <MdLogout size={20} className={sidebarOpen ? 'mr-3' : ''} />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;