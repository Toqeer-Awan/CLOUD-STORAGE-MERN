import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/slices/authSlice';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userStr = params.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        dispatch(setCredentials({ user, token }));
        navigate('/');
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [location, dispatch, navigate]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Completing login...</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Please wait while we redirect you</p>
      </div>
    </div>
  );
};

export default OAuthCallback;