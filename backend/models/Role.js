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
  permissions: {
    view: { type: Boolean, default: false },
    upload: { type: Boolean, default: false },
    download: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    addUser: { type: Boolean, default: false },
    removeUser: { type: Boolean, default: false },
    changeRole: { type: Boolean, default: false },
    manageFiles: { type: Boolean, default: false },
    manageStorage: { type: Boolean, default: false },
    assignStorage: { type: Boolean, default: false }
  },
  isCustom: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Role = mongoose.model('Role', roleSchema);
export default Role;