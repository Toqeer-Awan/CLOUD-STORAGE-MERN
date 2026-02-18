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
import AddUser from './pages/AddUser';
import UserList from './pages/UserList';
import RolesPermissions from './pages/RolePermissions';
import CompanyDashboard from './components/CompanyDashboard';
import AdminCompanies from './components/AdminCompanies';
// Remove this line: import UserDashboard from './components/UserDashboard';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// Only SuperAdmin can access these routes
const SuperAdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  
  if (!token) return <Navigate to="/login" />;
  if (user?.role !== 'superAdmin') return <Navigate to="/" />;
  
  return children;
};

// Admin and SuperAdmin can access these routes
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  
  if (!token) return <Navigate to="/login" />;
  if (user?.role !== 'admin' && user?.role !== 'superAdmin') return <Navigate to="/" />;
  
  return children;
};

// Remove this entire block
// const UserRoute = ({ children }) => {
//   const user = JSON.parse(localStorage.getItem('user'));
//   const token = localStorage.getItem('token');
//   
//   if (!token) return <Navigate to="/login" />;
//   if (user?.role !== 'user') return <Navigate to="/" />;
//   
//   return children;
// };

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <Provider store={store}>
      <GoogleOAuthProvider clientId={googleClientId || ''}>
        <ThemeProvider>
          <BrowserRouter>
            <ToasterProvider />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/oauth-callback" element={<OAuthCallback />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="upload" element={<Upload />} />
                <Route path="files" element={<AllFiles />} />
                
                {/* Remove this entire block */}
                {/* <Route path="my-storage" element={
                  <UserRoute>
                    <UserDashboard />
                  </UserRoute>
                /> */}
                
                <Route path="company" element={
                  <AdminRoute>
                    <CompanyDashboard />
                  </AdminRoute>
                } />
                
                <Route path="users/add" element={
                  <AdminRoute>
                    <AddUser />
                  </AdminRoute>
                } />
                
                <Route path="users/list" element={
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
                } />
              </Route>
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </Provider>
  );
}

export default App;