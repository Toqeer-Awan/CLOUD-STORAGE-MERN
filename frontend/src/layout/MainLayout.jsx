import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { FaBars, FaTimes } from "react-icons/fa";
import {
  MdDashboard, MdCloudUpload, MdFolder, MdPeople, MdSettings,
  MdLogout, MdAdd, MdList, MdLock
} from "react-icons/md";
import { RiCloudLine } from "react-icons/ri";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

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
  ];

  const adminItems = [
    { path: "/users/add", icon: <MdAdd />, label: "Add User", show: isAdmin },
    { path: "/users/list", icon: <MdList />, label: "Users List", show: isAdmin },
    { path: "/roles", icon: <MdLock />, label: "Roles & Permissions", show: isAdmin },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex items-center justify-between h-16 px-4 bg-gray-900 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <RiCloudLine className="text-orange-500 text-2xl" />
            <span className="text-xl font-bold text-white">Cloud Storage</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <FaTimes size={20} />
          </button>
        </div>
        <div className="px-4 py-6 space-y-2">
          {navigationItems.map((item) => item.show && (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path ? "bg-orange-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon} <span>{item.label}</span>
            </Link>
          ))}
          {isAdmin && (
            <>
              <div className="pt-4 mt-4 border-t border-gray-700">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Administration</p>
              </div>
              {adminItems.map((item) => item.show && (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path ? "bg-orange-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon} <span>{item.label}</span>
                </Link>
              ))}
            </>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
          >
            <MdLogout /> <span>Logout</span>
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900">
                <FaBars size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">{currentTitle}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <span>Welcome,</span>
                <span className="font-medium">{user?.username}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;