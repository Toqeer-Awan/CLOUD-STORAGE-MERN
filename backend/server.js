// ===== ABSOLUTE FIRST LINE =====
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
console.log('✅ DNS: IPv4 first order SET');

// ===== IMPORT MODULES =====
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import passport from 'passport';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import permissionsRoutes from './routes/permission.js';
import companyRoutes from './routes/companyRoutes.js';
import storageRoutes from './routes/storageRoutes.js'; // 👈 NEW
import './config/passport.js';
import b2 from './config/b2.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== LOAD ENVIRONMENT VARIABLES =====
dotenv.config();

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set! Using default secret. This is not secure for production!');
  process.env.JWT_SECRET = 'your-secret-key-change-this-in-production';
}

console.log('✅ Environment variables loaded');
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('📁 NODE_ENV:', process.env.NODE_ENV || 'development');

// ===== CONNECT TO DATABASE =====
connectDB();

// ===== CREATE EXPRESS APP =====
const app = express();

// Test B2 connection on startup
b2.testConnection().then(success => {
  if (success) {
    console.log('✅ Backblaze B2 connection verified');
  } else {
    console.warn('⚠️  Backblaze B2 connection failed - check your credentials');
  }
});

// ===== SESSION & PASSPORT MIDDLEWARE =====
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ===== CORS CONFIGURATION =====
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('⚠️  CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===== BODY PARSING MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== STATIC FILES =====
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/storage', storageRoutes); 

// ===== TEST ENDPOINTS =====
app.get('/api/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API is working',
    jwt: process.env.JWT_SECRET ? '✅ Configured' : '❌ Not Configured',
    mongo: '✅ Connected',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Cloud Storage API is running',
    timestamp: new Date().toISOString()
  });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error('📚 Stack:', err.stack);
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log('☁️  Cloud Storage API Ready!\n');
});