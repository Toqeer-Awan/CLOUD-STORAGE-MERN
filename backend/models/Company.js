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
    required: false
  },
  totalStorage: {
    type: Number,
    default: 5 * 1024 * 1024 * 1024,
    min: 100 * 1024 * 1024
  },
  usedStorage: {
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 🔥 CORRECT: Async function, no next parameter
companySchema.pre('save', async function() {
  this.updatedAt = Date.now();
});

const Company = mongoose.model('Company', companySchema);
export default Company;