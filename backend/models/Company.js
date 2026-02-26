import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalStorage: {
    type: Number,
    default: 5 * 1024 * 1024, // 50GB default
    min: [100 * 1024 * 1024, 'Minimum storage is 100MB'],
    required: true
  },
  usedStorage: {
    type: Number,
    default: 0,
    min: [0, 'Used storage cannot be negative'],
    required: true
  },
  userCount: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Company doesn't track allocations anymore - admin does
companySchema.methods.getAvailableStorage = function() {
  return Math.max(0, (this.totalStorage || 0) - (this.usedStorage || 0));
};

companySchema.methods.addUsage = function(bytes) {
  if (bytes < 0) throw new Error('Cannot add negative usage');
  const newTotal = (this.usedStorage || 0) + bytes;
  if (newTotal > this.totalStorage) {
    throw new Error('Usage would exceed company total');
  }
  this.usedStorage = newTotal;
  return this.usedStorage;
};

companySchema.methods.removeUsage = function(bytes) {
  if (bytes < 0) throw new Error('Cannot remove negative usage');
  const newTotal = (this.usedStorage || 0) - bytes;
  if (newTotal < 0) throw new Error('Usage cannot go negative');
  this.usedStorage = newTotal;
  return this.usedStorage;
};

const Company = mongoose.model('Company', companySchema);
export default Company;