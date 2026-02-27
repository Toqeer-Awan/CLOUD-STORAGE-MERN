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
  
  // Storage fields
  storageAllocated: {
    type: Number,
    default: 5 * 1024 * 1024 * 1024 // 5GB default for free plan
  },
  storageUsed: {
    type: Number,
    default: 0
  },
  allocatedToUsers: {
    type: Number,
    default: 0
  },
  
  // NEW: Quota tracking fields
  quota: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    maxStorage: {
      type: Number,
      default: 5 * 1024 * 1024 * 1024 // 5GB
    },
    maxFiles: {
      type: Number,
      default: 100
    },
    maxFileSize: {
      type: Number,
      default: 100 * 1024 * 1024 // 100MB
    },
    dailyUploadLimit: {
      type: Number,
      default: 1 * 1024 * 1024 * 1024 // 1GB per day
    },
    fileCount: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  
  // NEW: Daily usage tracking
  dailyUsage: [{
    date: {
      type: Date,
      required: true
    },
    uploadSize: {
      type: Number,
      default: 0
    },
    uploadCount: {
      type: Number,
      default: 0
    },
    downloadSize: {
      type: Number,
      default: 0
    },
    downloadCount: {
      type: Number,
      default: 0
    }
  }],
  
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

// Method to check if user can upload
userSchema.methods.canUpload = function(fileSize) {
  return (
    this.storageUsed + fileSize <= this.storageAllocated &&
    this.quota.fileCount + 1 <= this.quota.maxFiles &&
    fileSize <= this.quota.maxFileSize
  );
};

// Method to get available storage
userSchema.methods.getAvailableStorage = function() {
  return Math.max(0, this.storageAllocated - this.storageUsed);
};

// Method to get usage percentage
userSchema.methods.getUsagePercentage = function() {
  return ((this.storageUsed / this.storageAllocated) * 100).toFixed(2);
};

// Method to update daily usage
userSchema.methods.updateDailyUsage = async function(size, type = 'upload') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let dailyRecord = this.dailyUsage.find(d => d.date.getTime() === today.getTime());
  
  if (!dailyRecord) {
    dailyRecord = {
      date: today,
      uploadSize: 0,
      uploadCount: 0,
      downloadSize: 0,
      downloadCount: 0
    };
    this.dailyUsage.push(dailyRecord);
  }
  
  if (type === 'upload') {
    dailyRecord.uploadSize += size;
    dailyRecord.uploadCount += 1;
  } else if (type === 'download') {
    dailyRecord.downloadSize += size;
    dailyRecord.downloadCount += 1;
  }
  
  // Keep only last 30 days
  this.dailyUsage = this.dailyUsage
    .sort((a, b) => b.date - a.date)
    .slice(0, 30);
  
  await this.save();
};

const User = mongoose.model('User', userSchema);
export default User;