import User from '../models/User.js';
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
    
    // Validate required fields
    if (!username || !email || !password) {
      console.log('❌ Missing fields:', { 
        username: !!username, 
        email: !!email, 
        password: !!password 
      });
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
    
    // Set default permissions for new user
    const defaultPermissions = {
      view: true,
      upload: true,
      download: true,
      delete: false,
      addUser: false,
      removeUser: false,
      changeRole: false,
      manageFiles: false
    };
    
    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'user',
      permissions: defaultPermissions
    });
    
    console.log('✅ User created successfully:', user._id);
    
    // Generate token
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
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
        permissions: user.permissions
      },
      token
    });
  } catch (error) {
    console.error('❌ Registration error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    
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
    
    // Validate required fields
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error - contact administrator' 
      });
    }
    
    // Check if user exists - MUST include password field for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('✅ User found:', user._id);
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    console.log('✅ Password valid');
    
    // Generate token
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      message: 'Login successful',
      user: {
        _id: userResponse._id,
        username: userResponse.username,
        email: userResponse.email,
        role: userResponse.role,
        permissions: userResponse.permissions
      },
      token
    });
  } catch (error) {
    console.error('❌ Login error details:', {
      message: error.message,
      stack: error.stack
    });
    
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
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};