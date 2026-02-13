// backend/controllers/authController.js
import User from '../models/User.js';
import Company from '../models/Company.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// @desc    Register a new user (creates their own company)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    console.log('📝 Registration attempt:', { 
      username: req.body.username, 
      email: req.body.email 
    });
    
    const { username, email, password } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Please provide username, email and password' 
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error - contact administrator' 
      });
    }
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 🔥 FIX 1: Create user FIRST with temporary company ID (null)
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'user',
      company: null, // Temporary, will update after company creation
      addedBy: null,
      permissions: {
        view: true,
        upload: true,
        download: true,
        delete: true,
        addUser: true,
        removeUser: true,
        changeRole: false,
        manageFiles: true,
        manageStorage: false
      }
    });
    
    // 🔥 FIX 2: Create company with owner set to user ID
    const companyName = `${username.toLowerCase().replace(/\s+/g, '_')}_company`;
    
    const company = await Company.create({
      name: companyName,
      owner: user._id, // Set owner immediately
      totalStorage: 5 * 1024 * 1024 * 1024, // 5GB default
      usedStorage: 0,
      userCount: 1
    });
    
    // 🔥 FIX 3: Update user with company ID
    user.company = company._id;
    await user.save();
    
    console.log('✅ User created successfully:', user._id);
    console.log('✅ Company created successfully:', company._id);
    
    // Generate token
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        role: user.role, 
        company: company._id.toString() 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        company: company._id,
        companyName: company.name,
        permissions: user.permissions
      },
      company: {
        _id: company._id,
        name: company.name,
        totalStorage: company.totalStorage,
        usedStorage: company.usedStorage,
        availableStorage: company.totalStorage - company.usedStorage
      },
      token
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        error: `${field} already exists` 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        error: messages.join(', ') 
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
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        role: user.role, 
        company: user.company?._id.toString() 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      message: 'Login successful',
      user: {
        _id: userResponse._id,
        username: userResponse.username,
        email: userResponse.email,
        role: userResponse.role,
        company: userResponse.company?._id,
        companyName: userResponse.company?.name,
        permissions: userResponse.permissions
      },
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
    
    res.json(user);
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};