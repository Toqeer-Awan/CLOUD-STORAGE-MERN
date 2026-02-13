import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { register, login, getProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ==================== REGULAR AUTH ROUTES ====================
router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);

// ==================== GOOGLE OAUTH ====================

// Google OAuth redirect route (for traditional OAuth flow)
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

// Google OAuth callback route (for traditional OAuth flow)
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: req.user._id.toString(), 
        role: req.user.role, 
        company: req.user.company?._id?.toString() 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Redirect to frontend with token
    const userData = encodeURIComponent(JSON.stringify(req.user));
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-callback?token=${token}&user=${userData}`);
  }
);

// Google OAuth token endpoint (for frontend token-based login)
router.post('/google', async (req, res) => {
  try {
    const { access_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    // Fetch user info from Google
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
    
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }
    
    const profile = await response.json();
    
    if (!profile.email) {
      return res.status(400).json({ error: 'Failed to get user email from Google' });
    }
    
    // Find or create user
    let user = await User.findOne({ email: profile.email }).populate('company');
    
    if (!user) {
      // Create new user and company
      const username = profile.name?.replace(/\s+/g, '_').toLowerCase() || `user_${Date.now()}`;
      
      // Create company first
      const company = await Company.create({
        name: `${username}_company`,
        owner: null, // Will set after user creation
        totalStorage: 5 * 1024 * 1024 * 1024, // 5GB
        usedStorage: 0,
        userCount: 1
      });
      
      // Set permissions for new user
      const permissions = {
        view: true, 
        upload: true, 
        download: true, 
        delete: true,
        addUser: true, 
        removeUser: true, 
        changeRole: false,
        manageFiles: true, 
        manageStorage: false
      };
      
      // Create user
      user = await User.create({
        username: username,
        email: profile.email,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
        role: 'user',
        company: company._id,
        authProvider: 'google',
        authProviderId: profile.sub,
        avatar: profile.picture,
        permissions: permissions
      });
      
      // Update company with owner
      company.owner = user._id;
      await company.save();
      
      // Populate company for response
      user = await User.findById(user._id).populate('company');
    }
    
    // Generate JWT
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        role: user.role, 
        company: user.company?._id?.toString() 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Prepare user response (remove sensitive data)
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      company: user.company?._id,
      companyName: user.company?.name,
      permissions: user.permissions,
      avatar: user.avatar,
      authProvider: user.authProvider
    };
    
    res.json({
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ==================== FACEBOOK OAUTH ====================

// Facebook OAuth redirect route
router.get('/facebook', passport.authenticate('facebook', { 
  scope: ['email', 'public_profile'] 
}));

// Facebook OAuth callback route
router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign(
      { 
        id: req.user._id.toString(), 
        role: req.user.role, 
        company: req.user.company?._id?.toString() 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    const userData = encodeURIComponent(JSON.stringify(req.user));
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-callback?token=${token}&user=${userData}`);
  }
);

// Facebook OAuth token endpoint (for frontend token-based login)
router.post('/facebook', async (req, res) => {
  try {
    const { access_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    // Fetch user info from Facebook
    const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`);
    
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Facebook token' });
    }
    
    const profile = await response.json();
    
    if (!profile.email) {
      return res.status(400).json({ error: 'Failed to get user email from Facebook. Please make sure your Facebook email is verified.' });
    }
    
    // Find or create user
    let user = await User.findOne({ email: profile.email }).populate('company');
    
    if (!user) {
      // Create new user and company
      const username = profile.name?.replace(/\s+/g, '_').toLowerCase() || `user_${Date.now()}`;
      
      // Create company
      const company = await Company.create({
        name: `${username}_company`,
        owner: null,
        totalStorage: 5 * 1024 * 1024 * 1024,
        usedStorage: 0,
        userCount: 1
      });
      
      // Set permissions
      const permissions = {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: false,
        manageFiles: true, manageStorage: false
      };
      
      // Create user
      user = await User.create({
        username: username,
        email: profile.email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        role: 'user',
        company: company._id,
        authProvider: 'facebook',
        authProviderId: profile.id,
        avatar: profile.picture?.data?.url,
        permissions: permissions
      });
      
      // Update company with owner
      company.owner = user._id;
      await company.save();
      
      user = await User.findById(user._id).populate('company');
    }
    
    // Generate JWT
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        role: user.role, 
        company: user.company?._id?.toString() 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      company: user.company?._id,
      companyName: user.company?.name,
      permissions: user.permissions,
      avatar: user.avatar,
      authProvider: user.authProvider
    };
    
    res.json({
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Facebook auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ==================== MICROSOFT OUTLOOK OAUTH ====================

// Microsoft OAuth redirect route
router.get('/microsoft', passport.authenticate('microsoft', { 
  scope: ['user.read', 'offline_access']
}));

// Microsoft OAuth callback route
router.get('/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign(
      { 
        id: req.user._id.toString(), 
        role: req.user.role, 
        company: req.user.company?._id?.toString() 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    const userData = encodeURIComponent(JSON.stringify(req.user));
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-callback?token=${token}&user=${userData}`);
  }
);

// Microsoft OAuth token endpoint (for frontend token-based login)
router.post('/microsoft', async (req, res) => {
  try {
    const { access_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    // Fetch user info from Microsoft Graph API
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Microsoft token' });
    }
    
    const profile = await response.json();
    const email = profile.mail || profile.userPrincipalName;
    
    if (!email) {
      return res.status(400).json({ error: 'Failed to get user email from Microsoft' });
    }
    
    // Find or create user
    let user = await User.findOne({ email }).populate('company');
    
    if (!user) {
      // Create new user and company
      const username = profile.displayName?.replace(/\s+/g, '_').toLowerCase() || `user_${Date.now()}`;
      
      // Create company
      const company = await Company.create({
        name: `${username}_company`,
        owner: null,
        totalStorage: 5 * 1024 * 1024 * 1024,
        usedStorage: 0,
        userCount: 1
      });
      
      // Set permissions
      const permissions = {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: false,
        manageFiles: true, manageStorage: false
      };
      
      // Create user
      user = await User.create({
        username: username,
        email: email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        role: 'user',
        company: company._id,
        authProvider: 'microsoft',
        authProviderId: profile.id,
        avatar: null, // Microsoft doesn't provide picture in basic profile
        permissions: permissions
      });
      
      // Update company with owner
      company.owner = user._id;
      await company.save();
      
      user = await User.findById(user._id).populate('company');
    }
    
    // Generate JWT
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        role: user.role, 
        company: user.company?._id?.toString() 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      company: user.company?._id,
      companyName: user.company?.name,
      permissions: user.permissions,
      avatar: user.avatar,
      authProvider: user.authProvider
    };
    
    res.json({
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Microsoft auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ==================== LOGOUT ====================

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;