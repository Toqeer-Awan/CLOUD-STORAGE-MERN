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
    enum: ['superAdmin', 'admin', 'user'],
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
  timestamps: true 
});

// NO PRE-SAVE HOOK AT ALL - Let's remove it completely
// We'll handle permissions in the controller instead

const User = mongoose.model('User', userSchema);
export default User;