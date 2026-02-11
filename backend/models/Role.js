import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, lowercase: true },
  displayName: { type: String, required: true },
  description: { type: String, default: '' },
  permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  permissionsUpdatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

roleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.isModified('permissions')) {
    this.permissionsUpdatedAt = new Date();
  }
  next();
});

export default mongoose.model('Role', roleSchema);
