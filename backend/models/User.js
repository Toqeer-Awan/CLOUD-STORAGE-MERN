import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true
  },
  password: { 
    type: String, 
    required: true,
    select: false
  },
  role: {
    type: String,
    // SUPERADMIN COMMENTED START
    // enum: ['superAdmin', 'admin', 'user'],
    // SUPERADMIN COMMENTED END
    
    // NEW: Only admin and user roles
    enum: ['admin', 'user'],
    default: 'user',
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  storageAllocated: {
    type: Number,
    default: 0
  },
  storageUsed: {
    type: Number,
    default: 0
  },
  allocatedToUsers: {
    type: Number,
    default: 0
  },
  permissions: {
    type: Object,
    default: {
      view: true, upload: true, download: true, delete: false,
      addUser: false, removeUser: false, changeRole: false,
      manageFiles: false, manageStorage: false, assignStorage: false
    }
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'facebook', 'microsoft'],
    default: 'local'
  },
  authProviderId: String,
  avatar: String
}, { 
  timestamps: true // This creates createdAt and updatedAt automatically
});

const User = mongoose.model('User', userSchema);
export default User;