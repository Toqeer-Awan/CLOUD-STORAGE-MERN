// frontend/src/layout/MainLayout.jsx
import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { FaBars, FaTimes } from "react-icons/fa";
import { 
  MdDashboard, MdCloudUpload, MdFolder, MdLogout, 
  MdAdd, MdList, MdLock,
  MdBusiness, MdBusinessCenter 
} from "react-icons/md";
import { RiCloudLine } from "react-icons/ri";
import { IoSunny, IoMoon } from "react-icons/io5";
import { useTheme } from "../context/ThemeContext";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { darkMode, toggleDarkMode } = useTheme();

  const pageTitles = {
    "/": "Dashboard",
    "/upload": "Upload Files",
    "/files": "All Files",
    "/users/add": "Add User",
    "/users/list": "Users List",
    "/roles": "Roles & Permissions",
  };

  const currentTitle = pageTitles[location.pathname] || "Dashboard";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";

  const navigationItems = [
    { path: "/", icon: <MdDashboard />, label: "Dashboard", show: true },
    { path: "/upload", icon: <MdCloudUpload />, label: "Upload", show: true },
    { path: "/files", icon: <MdFolder />, label: "All Files", show: true },
    { path: "/company", icon: <MdBusiness />, label: "My Company", show: true }, // NEW
  ];


  const adminItems = [
    { path: "/users/add", icon: <MdAdd />, label: "Add User", show: isAdmin },
    { path: "/users/list", icon: <MdList />, label: "Users List", show: isAdmin },
    { path: "/roles", icon: <MdLock />, label: "Roles & Permissions", show: isAdmin },
    { path: "/admin/companies", icon: <MdBusinessCenter />, label: "Companies", show: isAdmin }, // NEW
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700">
          <div className="flex items-center space-x-3">
            <RiCloudLine className="text-white text-2xl" />
            <span className="text-xl font-bold text-white">Cloud Storage</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white hover:text-gray-200">
            <FaTimes size={20} />
          </button>
        </div>
        
        <div className="px-4 py-6 space-y-2 bg-white dark:bg-gray-800 h-[calc(100vh-64px)] overflow-y-auto">
          {navigationItems.map((item) => item.show && (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path 
                  ? "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon} <span>{item.label}</span>
            </Link>
          ))}
          
          {isAdmin && (
            <>
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Administration
                </p>
              </div>
              {adminItems.map((item) => item.show && (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path 
                      ? "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon} <span>{item.label}</span>
                </Link>
              ))}
            </>
          )}
          
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MdLogout /> <span>Logout</span>
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - ONLY ONE TOGGLE BUTTON */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="lg:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <FaBars size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {currentTitle}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* SINGLE DARK MODE TOGGLE BUTTON - CLEAN DESIGN */}
              <button
                onClick={toggleDarkMode}
                className="relative w-12 h-6 rounded-full bg-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-300"
                aria-label="Toggle dark mode"
              >
                <div 
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white dark:bg-gray-900 shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                    darkMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                >
                  {darkMode ? (
                    <IoMoon className="w-2.5 h-2.5 text-yellow-400" />
                  ) : (
                    <IoSunny className="w-2.5 h-2.5 text-yellow-500" />
                  )}
                </div>
              </button>
              
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Welcome,</span>
                <span className="font-medium text-gray-900 dark:text-white">{user?.username}</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;