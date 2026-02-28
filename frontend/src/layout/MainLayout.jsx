import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import useToast from '../hooks/useToast';
import { useTheme } from '../context/ThemeContext';
import useQuota from '../hooks/useQuota';
import QuotaDashboard from '../components/QuotaDashboard';
import {
  MdDashboard, MdUpload, MdFolder, MdPeople,
  MdBusiness, MdLogout, MdMenu,
  MdClose, MdPersonAdd, MdList, MdSecurity,
  MdStorage, MdDarkMode, MdLightMode,
  MdAdminPanelSettings, MdUpgrade
} from 'react-icons/md';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { darkMode, toggleDarkMode } = useTheme();
  const quota = useQuota();

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/', icon: MdDashboard, label: 'Dashboard', roles: ['admin', 'user'] },
    { path: '/upload', icon: MdUpload, label: 'Upload Files', roles: ['admin', 'user'] },
    { path: '/files', icon: MdFolder, label: 'All Files', roles: ['admin', 'user'] },
    // COMPANY MENU ITEM COMMENTED START
    // { path: '/company', icon: MdBusiness, label: 'My Company', roles: ['admin'] },
    // COMPANY MENU ITEM COMMENTED END
    // SIMPLE USER CREATION MENU ITEM COMMENTED START
    // { path: '/users/add', icon: MdPersonAdd, label: 'Add User', roles: ['admin'] },
    // SIMPLE USER CREATION MENU ITEM COMMENTED END
    // SUPERADMIN COMMENTED START
    // { path: '/users/list', icon: MdList, label: 'User List', roles: ['superAdmin'] },
    // { path: '/roles', icon: MdSecurity, label: 'Roles & Permissions', roles: ['superAdmin'] },
    // { path: '/admin/companies', icon: MdStorage, label: 'Manage Companies', roles: ['superAdmin'] },
    // SUPERADMIN COMMENTED END
  ];

  const filteredMenu = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const getUserDisplay = () => {
    if (!user) return { initial: '?', name: 'Guest', role: '' };
    return {
      initial: user.username?.charAt(0).toUpperCase() || '?',
      name: user.username || 'User',
      role: user.role === 'admin' ? 'Admin' : 'User'
    };
  };

  const userDisplay = getUserDisplay();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-20'} bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 fixed h-full z-30 flex flex-col overflow-y-auto`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
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

          {/* User Info */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 dark:text-orange-500 font-bold text-lg">
                  {userDisplay.initial}
                </span>
              </div>
              {sidebarOpen && (
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                    {userDisplay.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize flex items-center gap-1">
                    {userDisplay.role}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quota Dashboard - Compact Version */}
          {sidebarOpen && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <QuotaDashboard showDetails={false} />
            </div>
          )}

          {/* Upgrade Banner - Show when on free plan and sidebar is open */}
          {sidebarOpen && quota.plan === 'free' && !quota.loading && (
            <div className="mx-4 my-2 p-3 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-2">
                <MdUpgrade className="text-orange-600 dark:text-orange-400 text-lg" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                  Need more space?
                </span>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-400 mb-2">
                Get 50GB storage, 1000 files, and more.
              </p>
              <Link
                to="/upgrade"
                className="block w-full text-center px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                Upgrade to Pro
              </Link>
            </div>
          )}

          {/* Navigation Menu */}
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

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
            {/* Dark Mode Toggle */}
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
            
            {/* Logout Button */}
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

      {/* Main Content */}
      <main className={`flex-1 ${sidebarOpen ? 'ml-80' : 'ml-20'} transition-all duration-300`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;