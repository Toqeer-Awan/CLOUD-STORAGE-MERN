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
        error: 'Please provide username, email and password' 
      });
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined');
      return res.status(500).json({ 
        error: 'Server configuration error - contact administrator' 
      });
    }
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Determine role (first user is superAdmin, others are admin)
    const userCount = await User.countDocuments();
    let role = userCount === 0 ? 'superAdmin' : 'admin';
    
    console.log(`👑 Setting role: ${role} for user: ${email}`);
    
    // Create user
    // Admin gets 50GB, superAdmin gets 0
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role,
      company: null,
      addedBy: null,
      storageAllocated: role === 'admin' ? 50 * 1024 * 1024 * 1024 : 0, // Admin gets 50GB
      storageUsed: 0,
      allocatedToUsers: 0 // Admin starts with 0 allocated to users
    });
    
    console.log(`✅ User created with ID: ${user._id}`);
    
    let company = null;
    
    // Create company for admin users (not for superAdmin)
    if (role === 'admin') {
      const companyName = `${username}'s Company`;
      
      console.log(`🏢 Creating company: ${companyName} for admin: ${username}`);
      
      company = await Company.create({
        name: companyName,
        owner: user._id,
        totalStorage: 50 * 1024 * 1024 * 1024, // 50GB for company
        usedStorage: 0,
        userCount: 1,
        createdBy: null
      });
      
      // Update user with company ID
      user.company = company._id;
      await user.save();
      
      console.log(`✅ Company created with ID: ${company._id}`);
    }
    
    console.log(`📊 Storage summary:`);
    console.log(`   - Role: ${role}`);
    console.log(`   - User storage allocated: ${(user.storageAllocated / (1024*1024*1024)).toFixed(2)}GB`);
    if (company) {
      console.log(`   - Company total storage: ${(company.totalStorage / (1024*1024*1024)).toFixed(2)}GB`);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        role: user.role, 
        company: company?._id?.toString() || null 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Prepare user response (exclude sensitive data)
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      company: company?._id || null,
      companyName: company?.name || null,
      permissions: user.permissions,
      storageAllocated: user.storageAllocated,
      storageUsed: user.storageUsed,
      allocatedToUsers: user.allocatedToUsers
    };
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse,
      company: company,
      token
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        error: `${field} already exists` 
      });
    }
    
    res.status(500).json({ 
      error: 'Registration failed. Please try again.' 
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
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined');
      return res.status(500).json({ 
        error: 'Server configuration error' 
      });
    }
    
    // Find user by email and include password field
    const user = await User.findOne({ email })
      .select('+password')
      .populate('company');
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
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
    
    // Prepare user response
    const userResponse = {
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
      message: 'Login successful',
      user: userResponse,
      token
    });
    
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ 
      error: 'Login failed. Please try again.' 
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
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Calculate available storage
    const availableStorage = user.getAvailableQuota ? user.getAvailableQuota() : 
      (user.storageAllocated - user.storageUsed);
    
    res.json({
      success: true,
      user: {
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
      }
    });
    
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // Since we're using JWT, we just need to tell client to remove token
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Export all functions
export default {
  register,
  login,
  getProfile,
  logout
};