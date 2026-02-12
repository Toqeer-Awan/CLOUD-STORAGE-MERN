import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  permissions: {
    view: { type: Boolean, default: false },
    upload: { type: Boolean, default: false },
    download: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    addUser: { type: Boolean, default: false },
    removeUser: { type: Boolean, default: false },
    changeRole: { type: Boolean, default: false },
    manageFiles: { type: Boolean, default: false }
  },
  permissionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isCustom: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 999
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

// NO PRE-SAVE HOOK AT ALL - completely remove it

const Role = mongoose.model('Role', roleSchema);
export default Role;