import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { ThemeProvider } from './context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ToasterProvider from './components/ToasterProvider';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import AllFiles from './pages/AllFiles';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OAuthCallback from './pages/OAuthCallback';
import UpgradePlan from './pages/UpgradePlan';
// COMPANY DASHBOARD COMMENTED: import CompanyDashboard from './components/CompanyDashboard';
// SIMPLE USER CREATION PAGE COMMENTED: import AddUser from './pages/AddUser';
// SUPERADMIN COMMENTED START
// import UserList from './pages/UserList';
// import RolesPermissions from './pages/RolePermissions';
// import AdminCompanies from './components/AdminCompanies';
// SUPERADMIN COMMENTED END

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// SUPERADMIN COMMENTED START
// const SuperAdminRoute = ({ children }) => {
//   const user = JSON.parse(localStorage.getItem('user'));
//   const token = localStorage.getItem('token');
//   
//   if (!token) return <Navigate to="/login" />;
//   if (user?.role !== 'superAdmin') return <Navigate to="/" />;
//   
//   return children;
// };
// SUPERADMIN COMMENTED END

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  
  if (!token) return <Navigate to="/login" />;
  if (user?.role !== 'admin') return <Navigate to="/" />;
  
  return children;
};

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <Provider store={store}>
      <GoogleOAuthProvider clientId={googleClientId || ''}>
        <ThemeProvider>
          <BrowserRouter>
            <ToasterProvider />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/oauth-callback" element={<OAuthCallback />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="upload" element={<Upload />} />
                <Route path="files" element={<AllFiles />} />
                <Route path="upgrade" element={<UpgradePlan />} />
                
                {/* COMPANY ROUTE COMMENTED START */}
                {/* <Route path="company" element={
                  <AdminRoute>
                    <CompanyDashboard />
                  </AdminRoute>
                } /> */}
                {/* COMPANY ROUTE COMMENTED END */}
                
                {/* SIMPLE USER CREATION ROUTE COMMENTED START */}
                {/* <Route path="users/add" element={
                  <AdminRoute>
                    <AddUser />
                  </AdminRoute>
                } /> */}
                {/* SIMPLE USER CREATION ROUTE COMMENTED END */}
                
                {/* SUPERADMIN COMMENTED START */}
                {/* <Route path="users/list" element={
                  <SuperAdminRoute>
                    <UserList />
                  </SuperAdminRoute>
                } />
                
                <Route path="roles" element={
                  <SuperAdminRoute>
                    <RolesPermissions />
                  </SuperAdminRoute>
                } />
                
                <Route path="admin/companies" element={
                  <SuperAdminRoute>
                    <AdminCompanies />
                  </SuperAdminRoute>
                } /> */}
                {/* SUPERADMIN COMMENTED END */}
              </Route>
              
              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </Provider>
  );
}

export default App;