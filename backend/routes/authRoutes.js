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

// Google OAuth redirect route
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

// Google OAuth callback route
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
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

// Google OAuth token endpoint
router.post('/google', async (req, res) => {
  try {
    const { access_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    // Fetch user info from Google
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google API error:', errorData);
      return res.status(401).json({ error: 'Invalid Google token' });
    }
    
    const profile = await response.json();
    
    if (!profile.email) {
      return res.status(400).json({ error: 'Failed to get user email from Google' });
    }
    
    console.log('Google profile:', { email: profile.email, name: profile.name });
    
    // Check if user already exists
    let user = await User.findOne({ email: profile.email }).populate('company');
    
    if (!user) {
      console.log('Creating new user from Google login');
      
      const username = profile.name?.replace(/\s+/g, '_').toLowerCase() || 
                      profile.email.split('@')[0];
      
      // Check if this is first user (make superAdmin)
      const userCount = await User.countDocuments();
      const role = userCount === 0 ? 'superAdmin' : 'admin';
      
      // 🔥 FIX: Create user FIRST (with null company)
      user = await User.create({
        username: username,
        email: profile.email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        role: role,
        company: null,  // Temporary null
        authProvider: 'google',
        authProviderId: profile.sub,
        avatar: profile.picture,
        storageAllocated: role === 'admin' ? 5 * 1024 * 1024 * 1024 : 0,
        storageUsed: 0
      });
      
      console.log('✅ User created with ID:', user._id);
      
      // Only create company for admin users (not superAdmin)
      if (role === 'admin') {
        console.log('Creating company for admin user...');
        
        // Create company with owner set to user ID
        const company = await Company.create({
          name: `${username}'s Company`,
          owner: user._id,  // Now user._id exists
          totalStorage: 5 * 1024 * 1024 * 1024,
          usedStorage: 0,
          allocatedToUsers: 0,
          userCount: 1
        });
        
        console.log('✅ Company created with ID:', company._id);
        
        // Update user with company ID
        user.company = company._id;
        await user.save();
        
        // Populate company for response
        user = await User.findById(user._id).populate('company');
      }
    }
    
    // Generate JWT
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        role: user.role, 
        company: user.company?._id?.toString() || null 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      company: user.company?._id || null,
      companyName: user.company?.name || null,
      permissions: user.permissions,
      avatar: user.avatar,
      authProvider: user.authProvider,
      storageAllocated: user.storageAllocated,
      storageUsed: user.storageUsed
    };
    
    console.log('✅ Google login successful for:', profile.email);
    
    res.json({
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('❌ Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed: ' + error.message });
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

// Facebook OAuth token endpoint
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
    
    console.log('Facebook profile:', { email: profile.email, name: profile.name });
    
    // Check if user already exists
    let user = await User.findOne({ email: profile.email }).populate('company');
    
    if (!user) {
      console.log('Creating new user from Facebook login');
      
      const username = profile.name?.replace(/\s+/g, '_').toLowerCase() || 
                      profile.email.split('@')[0];
      
      const userCount = await User.countDocuments();
      const role = userCount === 0 ? 'superAdmin' : 'admin';
      
      // 🔥 FIX: Create user FIRST
      user = await User.create({
        username: username,
        email: profile.email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        role: role,
        company: null,
        authProvider: 'facebook',
        authProviderId: profile.id,
        avatar: profile.picture?.data?.url,
        storageAllocated: role === 'admin' ? 5 * 1024 * 1024 * 1024 : 0,
        storageUsed: 0
      });
      
      console.log('✅ User created with ID:', user._id);
      
      // Create company for admin
      if (role === 'admin') {
        console.log('Creating company for admin user...');
        
        const company = await Company.create({
          name: `${username}'s Company`,
          owner: user._id,
          totalStorage: 5 * 1024 * 1024 * 1024,
          usedStorage: 0,
          allocatedToUsers: 0,
          userCount: 1
        });
        
        console.log('✅ Company created with ID:', company._id);
        
        user.company = company._id;
        await user.save();
        user = await User.findById(user._id).populate('company');
      }
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
      authProvider: user.authProvider,
      storageAllocated: user.storageAllocated,
      storageUsed: user.storageUsed
    };
    
    console.log('✅ Facebook login successful for:', profile.email);
    
    res.json({
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('❌ Facebook auth error:', error);
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

// Microsoft OAuth token endpoint
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
    
    console.log('Microsoft profile:', { email, name: profile.displayName });
    
    // Check if user already exists
    let user = await User.findOne({ email }).populate('company');
    
    if (!user) {
      console.log('Creating new user from Microsoft login');
      
      const username = profile.displayName?.replace(/\s+/g, '_').toLowerCase() || 
                      email.split('@')[0];
      
      const userCount = await User.countDocuments();
      const role = userCount === 0 ? 'superAdmin' : 'admin';
      
      // 🔥 FIX: Create user FIRST
      user = await User.create({
        username: username,
        email: email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        role: role,
        company: null,
        authProvider: 'microsoft',
        authProviderId: profile.id,
        avatar: null,
        storageAllocated: role === 'admin' ? 5 * 1024 * 1024 * 1024 : 0,
        storageUsed: 0
      });
      
      console.log('✅ User created with ID:', user._id);
      
      // Create company for admin
      if (role === 'admin') {
        console.log('Creating company for admin user...');
        
        const company = await Company.create({
          name: `${username}'s Company`,
          owner: user._id,
          totalStorage: 5 * 1024 * 1024 * 1024,
          usedStorage: 0,
          allocatedToUsers: 0,
          userCount: 1
        });
        
        console.log('✅ Company created with ID:', company._id);
        
        user.company = company._id;
        await user.save();
        user = await User.findById(user._id).populate('company');
      }
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
      authProvider: user.authProvider,
      storageAllocated: user.storageAllocated,
      storageUsed: user.storageUsed
    };
    
    console.log('✅ Microsoft login successful for:', email);
    
    res.json({
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('❌ Microsoft auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ==================== LOGOUT ====================

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;