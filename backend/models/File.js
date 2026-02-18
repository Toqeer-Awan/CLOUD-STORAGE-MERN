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
    enum: ['b2'],
    default: 'b2'
  },
  storageKey: {
    type: String,
    required: true,
    unique: true  // This creates an index automatically
  },
  storageUrl: String,
  
  // Upload tracking
  uploadId: String,
  uploadStatus: {
    type: String,
    enum: ['pending', 'uploading', 'completed', 'failed'],
    default: 'pending'
  },
  uploadInitiatedAt: Date,
  uploadCompletedAt: Date,
  
  // Verification
  etag: String,
  
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
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, { timestamps: true });

// Indexes for performance - REMOVE the duplicate storageKey index
// Keep only these indexes:
fileSchema.index({ company: 1, uploadStatus: 1 });
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ uploadId: 1 });
fileSchema.index({ isDeleted: 1 });

// Virtual for file URL
fileSchema.virtual('url').get(function() {
  if (this.storageUrl) return this.storageUrl;
  return `https://${process.env.B2_BUCKET_NAME}.s3.${process.env.B2_REGION}.backblazeb2.com/${this.storageKey}`;
});

const File = mongoose.model('File', fileSchema);
export default File;