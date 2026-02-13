import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { ThemeProvider } from './context/ThemeContext';
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

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  if (user?.role !== 'admin') return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Provider store={store}>
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
              <Route path="company" element={<CompanyDashboard />} />
              <Route path="users/add" element={
                <AdminRoute>
                  <AddUser />
                </AdminRoute>
              } />
              <Route path="users/list" element={
                <AdminRoute>
                  <UserList />
                </AdminRoute>
              } />
              <Route path="roles" element={
                <AdminRoute>
                  <RolesPermissions />
                </AdminRoute>
              } />
              <Route path="admin/companies" element={
                <AdminRoute>
                  <AdminCompanies />
                </AdminRoute>
              } />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;