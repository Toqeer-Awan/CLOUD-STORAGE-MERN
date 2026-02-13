import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  storageType: {
    type: String,
    enum: ['local', 'cloudinary', 's3'],
    default: 'local'
  },
  storageUrl: {
    type: String,
    required: true
  },
  downloadUrl: {
    type: String
  },
  publicId: {
    type: String
  },
  s3Key: {
    type: String
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }]
});

// Index for faster queries
fileSchema.index({ company: 1, uploadDate: -1 });

const File = mongoose.model('File', fileSchema);
export default File;