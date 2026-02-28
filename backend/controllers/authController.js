import User from '../models/User.js';
import Company from '../models/Company.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    console.log('📝 Registration attempt:', { 
      username: req.body.username, 
      email: req.body.email 
    });
    
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        status: 400,
        message: 'Please provide username, email and password',
        responsedata: null
      });
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        status: 400,
        message: 'Please provide a valid email address',
        responsedata: null
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        status: 400,
        message: 'Password must be at least 6 characters long',
        responsedata: null
      });
    }

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined');
      return res.status(500).json({ 
        success: false,
        status: 500,
        message: 'Server configuration error - contact administrator',
        responsedata: null
      });
    }
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ 
        success: false,
        status: 400,
        message: 'User already exists',
        responsedata: null
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const userCount = await User.countDocuments();
    let role = 'admin';
    
    console.log(`👑 Setting role: ${role} for user: ${email}`);
    
    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role,
      company: null,
      addedBy: null,
      storageAllocated: 50 * 1024 * 1024 * 1024,
      storageUsed: 0,
      allocatedToUsers: 0
    });
    
    console.log(`✅ User created with ID: ${user._id}`);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        role: user.role, 
        company: null
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Prepare response data
    const responsedata = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      company: null,
      companyName: null,
      permissions: user.permissions,
      storageAllocated: user.storageAllocated,
      storageUsed: user.storageUsed,
      allocatedToUsers: user.allocatedToUsers
    };
    
    res.status(201).json({
      success: true,
      status: 201,
      message: 'User registered successfully',
      responsedata: responsedata,  // Changed from 'user' to 'responsedata'
      token
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        status: 400,
        message: `${field} already exists`,
        responsedata: null
      });
    }
    
    res.status(500).json({ 
      success: false,
      status: 500,
      message: 'Registration failed. Please try again.',
      responsedata: null
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body.email);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        status: 400,
        message: 'Please provide email and password',
        responsedata: null
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined');
      return res.status(500).json({ 
        success: false,
        status: 500,
        message: 'Server configuration error',
        responsedata: null
      });
    }
    
    // Find user by email and include password field
    const user = await User.findOne({ email })
      .select('+password')
      .populate('company');
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ 
        success: false,
        status: 401,
        message: 'Invalid email or password',
        responsedata: null
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ 
        success: false,
        status: 401,
        message: 'Invalid email or password',
        responsedata: null
      });
    }
    
    console.log(`✅ Login successful for: ${email}, Role: ${user.role}`);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        role: user.role, 
        company: user.company?._id?.toString() || null 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Prepare response data
    const responsedata = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      company: user.company?._id || null,
      companyName: user.company?.name || null,
      permissions: user.permissions,
      storageAllocated: user.storageAllocated || 0,
      storageUsed: user.storageUsed || 0,
      allocatedToUsers: user.allocatedToUsers || 0,
      avatar: user.avatar,
      authProvider: user.authProvider
    };
    
    console.log(`📊 User storage: ${(user.storageAllocated / (1024*1024*1024)).toFixed(2)}GB allocated, ${(user.storageUsed / (1024*1024*1024)).toFixed(2)}GB used`);
    
    res.json({
      success: true,
      status: 200,
      message: 'Login successful',
      responsedata: responsedata,  // Changed from 'user' to 'responsedata'
      token
    });
    
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ 
      success: false,
      status: 500,
      message: 'Login failed. Please try again.',
      responsedata: null
    });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('company', 'name totalStorage usedStorage');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        status: 404,
        message: 'User not found',
        responsedata: null
      });
    }
    
    // Calculate available storage
    const availableStorage = user.getAvailableQuota ? user.getAvailableQuota() : 
      (user.storageAllocated - user.storageUsed);
    
    // Prepare profile data
    const responsedata = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      company: user.company ? {
        _id: user.company._id,
        name: user.company.name,
        totalStorage: user.company.totalStorage,
        usedStorage: user.company.usedStorage
      } : null,
      permissions: user.permissions,
      storage: {
        allocated: user.storageAllocated,
        used: user.storageUsed,
        available: availableStorage,
        allocatedToUsers: user.allocatedToUsers || 0
      },
      createdAt: user.createdAt
    };
    
    res.json({
      success: true,
      status: 200,
      responsedata: responsedata  // Changed from 'user' to 'responsedata'
    });
    
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ 
      success: false,
      status: 500,
      message: 'Server error: ' + error.message,
      responsedata: null
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    res.json({ 
      success: true,
      status: 200,
      message: 'Logged out successfully',
      responsedata: null
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ 
      success: false,
      status: 500,
      message: 'Logout failed',
      responsedata: null
    });
  }
};

// Export all functions
export default {
  register,
  login,
  getProfile,
  logout
};