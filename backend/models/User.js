import mongoose from 'mongoose';

const permissionsSchema = new mongoose.Schema({
  view: { type: Boolean, default: true },
  upload: { type: Boolean, default: true },
  download: { type: Boolean, default: true },
  delete: { type: Boolean, default: false },
  addUser: { type: Boolean, default: false },
  removeUser: { type: Boolean, default: false },
  changeRole: { type: Boolean, default: false },
  manageFiles: { type: Boolean, default: false },
  manageStorage: { type: Boolean, default: false },
  assignStorage: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, 'Username is required'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
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
    required: false
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  storageAllocated: {
    type: Number,
    default: 0
  },
  storageUsed: {
    type: Number,
    default: 0
  },
  permissions: {
    type: permissionsSchema,
    default: () => ({})
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'facebook', 'microsoft'],
    default: 'local'
  },
  authProviderId: String,
  avatar: String
}, { timestamps: true });

// Set permissions based on role
userSchema.pre('save', function() {
  if (this.role === 'superAdmin') {
    this.permissions = {
      view: true, upload: true, download: true, delete: true,
      addUser: true, removeUser: true, changeRole: true, 
      manageFiles: true, manageStorage: true, assignStorage: true
    };
  } else if (this.role === 'admin') {
    this.permissions = {
      view: true, upload: true, download: true, delete: true,
      addUser: true, removeUser: true, changeRole: true,
      manageFiles: true, manageStorage: true, assignStorage: true
    };
  } else {
    this.permissions = {
      view: true, upload: true, download: true, delete: false,
      addUser: false, removeUser: false, changeRole: false,
      manageFiles: false, manageStorage: false, assignStorage: false
    };
  }
});

const User = mongoose.model('User', userSchema);
export default User;