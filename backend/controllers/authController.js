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

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined');
      return res.status(500).json({ 
        error: 'Server configuration error - contact administrator' 
      });
    }
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const userCount = await User.countDocuments();
    let role = userCount === 0 ? 'superAdmin' : 'admin';
    
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role,
      company: null,
      addedBy: null,
      storageAllocated: role === 'superAdmin' ? 0 : 5 * 1024 * 1024 * 1024,
      storageUsed: 0
    });
    
    let company = null;
    if (role === 'admin') {
      const companyName = `${username}'s Company`;
      
      company = await Company.create({
        name: companyName,
        owner: user._id,
        totalStorage: 5 * 1024 * 1024 * 1024,
        usedStorage: 0,
        allocatedToUsers: 0,
        userCount: 1,
        createdBy: null
      });
      
      user.company = company._id;
      await user.save();
    }
    
    console.log(`✅ ${role} created successfully:`, user._id);
    
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        role: user.role, 
        company: company?._id?.toString() || null 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      company: company?._id || null,
      companyName: company?.name || null,
      permissions: user.permissions,
      storageAllocated: user.storageAllocated,
      storageUsed: user.storageUsed
    };
    
    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
      company: company,
      token
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    
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
    
    const user = await User.findOne({ email })
      .select('+password')
      .populate('company');
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
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
      storageAllocated: user.storageAllocated || 0,
      storageUsed: user.storageUsed || 0,
      avatar: user.avatar,
      authProvider: user.authProvider
    };
    
    console.log('✅ Login successful for:', email, 'Role:', user.role);
    
    res.json({
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
      .populate('company', 'name totalStorage usedStorage allocatedToUsers');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      company: user.company ? {
        _id: user.company._id,
        name: user.company.name,
        totalStorage: user.company.totalStorage,
        usedStorage: user.company.usedStorage,
        allocatedToUsers: user.company.allocatedToUsers
      } : null,
      permissions: user.permissions,
      storageAllocated: user.storageAllocated,
      storageUsed: user.storageUsed,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};