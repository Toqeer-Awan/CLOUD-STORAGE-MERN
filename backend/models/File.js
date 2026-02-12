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
  publicId: {
    type: String // For Cloudinary
  },
  s3Key: {
    type: String // For AWS S3
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

const File = mongoose.model('File', fileSchema);

export default File;