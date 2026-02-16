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
    default: 5 * 1024 * 1024 * 1024, // 5GB default
    min: 100 * 1024 * 1024 // 100MB min
  },
  usedStorage: {
    type: Number,
    default: 0
  },
  allocatedToUsers: {
    type: Number,
    default: 0
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

// Update timestamps
companySchema.pre('save', function() {
  this.updatedAt = Date.now();
});

const Company = mongoose.model('Company', companySchema);
export default Company;