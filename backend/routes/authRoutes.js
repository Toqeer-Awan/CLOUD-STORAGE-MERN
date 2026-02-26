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

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account. First user becomes admin with their own company.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     username:
 *                       type: string
 *                       example: john_doe
 *                     email:
 *                       type: string
 *                       example: john@example.com
 *                     role:
 *                       type: string
 *                       example: admin
 *                     company:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c86
 *                     companyName:
 *                       type: string
 *                       example: john_doe's Company
 *                     storageAllocated:
 *                       type: number
 *                       example: 53687091200
 *                     storageUsed:
 *                       type: number
 *                       example: 0
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User already exists
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user and return JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     username:
 *                       type: string
 *                       example: john_doe
 *                     email:
 *                       type: string
 *                       example: john@example.com
 *                     role:
 *                       type: string
 *                       example: admin
 *                     company:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c86
 *                     companyName:
 *                       type: string
 *                       example: john_doe's Company
 *                     storageAllocated:
 *                       type: number
 *                       example: 53687091200
 *                     storageUsed:
 *                       type: number
 *                       example: 1048576
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid email or password
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     username:
 *                       type: string
 *                       example: john_doe
 *                     email:
 *                       type: string
 *                       example: john@example.com
 *                     role:
 *                       type: string
 *                       example: admin
 *                     company:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 60d21b4667d0d8992e610c86
 *                         name:
 *                           type: string
 *                           example: john_doe's Company
 *                         totalStorage:
 *                           type: number
 *                           example: 53687091200
 *                         usedStorage:
 *                           type: number
 *                           example: 1048576
 *                     permissions:
 *                       type: object
 *                       properties:
 *                         view:
 *                           type: boolean
 *                           example: true
 *                         upload:
 *                           type: boolean
 *                           example: true
 *                         download:
 *                           type: boolean
 *                           example: true
 *                         delete:
 *                           type: boolean
 *                           example: true
 *                         addUser:
 *                           type: boolean
 *                           example: true
 *                         removeUser:
 *                           type: boolean
 *                           example: true
 *                         changeRole:
 *                           type: boolean
 *                           example: true
 *                         manageFiles:
 *                           type: boolean
 *                           example: true
 *                         manageStorage:
 *                           type: boolean
 *                           example: true
 *                         assignStorage:
 *                           type: boolean
 *                           example: true
 *                     storage:
 *                       type: object
 *                       properties:
 *                         allocated:
 *                           type: number
 *                           example: 53687091200
 *                         used:
 *                           type: number
 *                           example: 1048576
 *                         available:
 *                           type: number
 *                           example: 52638515200
 *                         allocatedToUsers:
 *                           type: number
 *                           example: 0
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', protect, getProfile);

// ==================== GOOGLE OAUTH ====================

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Login with Google OAuth
 *     description: Authenticate using Google OAuth access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - access_token
 *             properties:
 *               access_token:
 *                 type: string
 *                 description: Google OAuth access token
 *                 example: ya29.a0AfH6SMC...
 *     responses:
 *       200:
 *         description: Google login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     username:
 *                       type: string
 *                       example: john_doe
 *                     email:
 *                       type: string
 *                       example: john@gmail.com
 *                     role:
 *                       type: string
 *                       example: admin
 *                     company:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c86
 *                     companyName:
 *                       type: string
 *                       example: john_doe's Company
 *       400:
 *         description: Missing token
 *       401:
 *         description: Invalid Google token
 */
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
      
      // SUPERADMIN COMMENTED START
      // // Check if this is first user (make superAdmin)
      // const userCount = await User.countDocuments();
      // const role = userCount === 0 ? 'superAdmin' : 'admin';
      // SUPERADMIN COMMENTED END
      
      // NEW: All users are admin
      const role = 'admin';
      
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
        // SUPERADMIN COMMENTED START
        // storageAllocated: role === 'admin' ? 5 * 1024 * 1024 * 1024 : 0,
        // SUPERADMIN COMMENTED END
        
        // NEW: All users get storage
        storageAllocated: 5 * 1024 * 1024 * 1024,
        storageUsed: 0
      });
      
      console.log('✅ User created with ID:', user._id);
      
      // SUPERADMIN COMMENTED START
      // // Only create company for admin users (not superAdmin)
      // if (role === 'admin') {
      // SUPERADMIN COMMENTED END
      
      // NEW: Always create company
      console.log('Creating company for user...');
      
      // Create company with owner set to user ID
      const company = await Company.create({
        name: `${username}'s Company`,
        owner: user._id,  // Now user._id exists
        totalStorage: 5 * 1024 * 1024 * 1024,
        usedStorage: 0,
        // SUPERADMIN COMMENTED: allocatedToUsers: 0,
        userCount: 1
      });
      
      console.log('✅ Company created with ID:', company._id);
      
      // Update user with company ID
      user.company = company._id;
      await user.save();
      
      // Populate company for response
      user = await User.findById(user._id).populate('company');
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

// ==================== FACEBOOK OAUTH ====================

/**
 * @swagger
 * /auth/facebook:
 *   post:
 *     summary: Login with Facebook OAuth
 *     description: Authenticate using Facebook OAuth access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - access_token
 *             properties:
 *               access_token:
 *                 type: string
 *                 description: Facebook OAuth access token
 *                 example: EAAJsm...
 *     responses:
 *       200:
 *         description: Facebook login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     username:
 *                       type: string
 *                       example: john_doe
 *                     email:
 *                       type: string
 *                       example: john@facebook.com
 *                     role:
 *                       type: string
 *                       example: admin
 *       400:
 *         description: Missing token or email not provided
 *       401:
 *         description: Invalid Facebook token
 */
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
      
      // SUPERADMIN COMMENTED START
      // const userCount = await User.countDocuments();
      // const role = userCount === 0 ? 'superAdmin' : 'admin';
      // SUPERADMIN COMMENTED END
      
      // NEW: All users are admin
      const role = 'admin';
      
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
        // SUPERADMIN COMMENTED START
        // storageAllocated: role === 'admin' ? 5 * 1024 * 1024 * 1024 : 0,
        // SUPERADMIN COMMENTED END
        
        // NEW: All users get storage
        storageAllocated: 5 * 1024 * 1024 * 1024,
        storageUsed: 0
      });
      
      console.log('✅ User created with ID:', user._id);
      
      // SUPERADMIN COMMENTED START
      // // Create company for admin
      // if (role === 'admin') {
      // SUPERADMIN COMMENTED END
      
      // NEW: Always create company
      console.log('Creating company for user...');
      
      const company = await Company.create({
        name: `${username}'s Company`,
        owner: user._id,
        totalStorage: 5 * 1024 * 1024 * 1024,
        usedStorage: 0,
        // SUPERADMIN COMMENTED: allocatedToUsers: 0,
        userCount: 1
      });
      
      console.log('✅ Company created with ID:', company._id);
      
      user.company = company._id;
      await user.save();
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

// ==================== MICROSOFT OUTLOOK OAUTH ====================

/**
 * @swagger
 * /auth/microsoft:
 *   post:
 *     summary: Login with Microsoft OAuth
 *     description: Authenticate using Microsoft OAuth access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - access_token
 *             properties:
 *               access_token:
 *                 type: string
 *                 description: Microsoft OAuth access token
 *                 example: eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1Ni...
 *     responses:
 *       200:
 *         description: Microsoft login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     username:
 *                       type: string
 *                       example: john_doe
 *                     email:
 *                       type: string
 *                       example: john@outlook.com
 *                     role:
 *                       type: string
 *                       example: admin
 *       400:
 *         description: Missing token or email not provided
 *       401:
 *         description: Invalid Microsoft token
 */
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
      
      // SUPERADMIN COMMENTED START
      // const userCount = await User.countDocuments();
      // const role = userCount === 0 ? 'superAdmin' : 'admin';
      // SUPERADMIN COMMENTED END
      
      // NEW: All users are admin
      const role = 'admin';
      
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
        // SUPERADMIN COMMENTED START
        // storageAllocated: role === 'admin' ? 5 * 1024 * 1024 * 1024 : 0,
        // SUPERADMIN COMMENTED END
        
        // NEW: All users get storage
        storageAllocated: 5 * 1024 * 1024 * 1024,
        storageUsed: 0
      });
      
      console.log('✅ User created with ID:', user._id);
      
      // SUPERADMIN COMMENTED START
      // // Create company for admin
      // if (role === 'admin') {
      // SUPERADMIN COMMENTED END
      
      // NEW: Always create company
      console.log('Creating company for user...');
      
      const company = await Company.create({
        name: `${username}'s Company`,
        owner: user._id,
        totalStorage: 5 * 1024 * 1024 * 1024,
        usedStorage: 0,
        // SUPERADMIN COMMENTED: allocatedToUsers: 0,
        userCount: 1
      });
      
      console.log('✅ Company created with ID:', company._id);
      
      user.company = company._id;
      await user.save();
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

// ==================== LOGOUT ====================

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidates the current session (client should remove token)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 */
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;