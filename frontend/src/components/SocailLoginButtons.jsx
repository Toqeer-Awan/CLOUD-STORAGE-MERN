import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaMicrosoft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/slices/authSlice';
import useToast from '../hooks/useToast';

const SocialLoginButtons = ({ mode = 'login' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

  // Google Login
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        toast.loading('Logging in with Google...');
        
        const res = await fetch(`${API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Google login failed');
        }
        
        if (data.token) {
          dispatch(setCredentials(data));
          toast.success('Google login successful!');
          navigate('/');
        }
      } catch (error) {
        console.error('Google login error:', error);
        toast.error(error.message || 'Google login failed');
      }
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      toast.error('Google login failed. Please check your configuration.');
    },
    flow: 'implicit',
    enabled: !!googleClientId
  });

  // Facebook Login
  const handleFacebookLogin = () => {
    if (!facebookAppId) {
      toast.error('Facebook App ID is not configured');
      return;
    }
    
    const redirectUri = `${window.location.origin}/oauth-callback`;
    const scope = 'email,public_profile';
    
    window.location.href = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${facebookAppId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token`;
  };

  // Microsoft Login
  const handleMicrosoftLogin = () => {
    window.location.href = `${API_URL}/auth/microsoft`;
  };

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {/* Google Button */}
        <button
          onClick={() => googleLogin()}
          disabled={!googleClientId}
          className={`w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium transition-colors ${
            googleClientId 
              ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
          title={!googleClientId ? 'Google login not configured' : 'Login with Google'}
        >
          <FcGoogle className="w-5 h-5" />
          <span className="ml-2 hidden sm:inline">Google</span>
        </button>

        {/* Facebook Button */}
        <button
          onClick={handleFacebookLogin}
          disabled={!facebookAppId}
          className={`w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium transition-colors ${
            facebookAppId 
              ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
          title={!facebookAppId ? 'Facebook login not configured' : 'Login with Facebook'}
        >
          <FaFacebook className="w-5 h-5 text-blue-600" />
          <span className="ml-2 hidden sm:inline">Facebook</span>
        </button>

        {/* Microsoft Button */}
        <button
          onClick={handleMicrosoftLogin}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <FaMicrosoft className="w-5 h-5 text-blue-500" />
          <span className="ml-2 hidden sm:inline">Outlook</span>
        </button>
      </div>
    </div>
  );
};

export default SocialLoginButtons;