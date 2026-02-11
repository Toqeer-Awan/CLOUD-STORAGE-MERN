import mongoose from 'mongoose';

const permissionsSchema = new mongoose.Schema({
  view: { type: Boolean, default: true },
  upload: { type: Boolean, default: true },
  download: { type: Boolean, default: true },
  delete: { type: Boolean, default: false },
  addUser: { type: Boolean, default: false },
  removeUser: { type: Boolean, default: false },
  changeRole: { type: Boolean, default: false },
  manageFiles: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  permissions: { type: permissionsSchema, default: () => ({}) },
  permissionsUpdatedAt: { type: Date, default: null }
}, { timestamps: true });

userSchema.pre('save', function(next) {
  if (this.isNew) {
    if (this.role === 'admin') {
      this.permissions = {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: true, manageFiles: true
      };
    } else if (this.role === 'moderator') {
      this.permissions = {
        view: true, upload: true, download: true, delete: true,
        addUser: false, removeUser: false, changeRole: false, manageFiles: true
      };
    } else {
      this.permissions = {
        view: true, upload: true, download: true, delete: false,
        addUser: false, removeUser: false, changeRole: false, manageFiles: false
      };
    }
  }
  if (this.isModified('permissions')) {
    this.permissionsUpdatedAt = new Date();
  }
  next();
});

export default mongoose.model('User', userSchema);