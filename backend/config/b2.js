import { S3Client, PutObjectCommand, GetObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Backblaze B2 is S3-compatible
const B2_ENDPOINT = process.env.B2_ENDPOINT || 'https://s3.us-west-002.backblazeb2.com';

// Validate required environment variables
const requiredEnvVars = ['B2_KEY_ID', 'B2_APPLICATION_KEY', 'B2_BUCKET_NAME'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

const b2Client = new S3Client({
  endpoint: B2_ENDPOINT,
  region: process.env.B2_REGION || 'us-west-002',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY
  },
  forcePathStyle: true,
  maxAttempts: 3
});

const BUCKET_NAME = process.env.B2_BUCKET_NAME;

// Generate presigned upload URL (PUT)
export const generatePresignedUploadUrl = async (key, contentType, expiresIn = 900) => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });
    
    const url = await getSignedUrl(b2Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating presigned upload URL:', error);
    throw new Error(`Failed to generate upload URL: ${error.message}`);
  }
};

// Generate presigned download URL (GET)
export const generatePresignedDownloadUrl = async (key, expiresIn = 300) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: 'attachment'
    });
    
    const url = await getSignedUrl(b2Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating presigned download URL:', error);
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }
};

// Generate presigned view URL (GET without download)
export const generatePresignedViewUrl = async (key, expiresIn = 300) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    
    const url = await getSignedUrl(b2Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating presigned view URL:', error);
    throw new Error(`Failed to generate view URL: ${error.message}`);
  }
};

// Initiate multipart upload
export const initiateMultipartUpload = async (key, contentType) => {
  try {
    const command = new CreateMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });
    
    const response = await b2Client.send(command);
    return response.UploadId;
  } catch (error) {
    console.error('Error initiating multipart upload:', error);
    throw new Error(`Failed to initiate multipart upload: ${error.message}`);
  }
};

// Generate presigned URL for multipart part
export const generatePresignedPartUrl = async (key, uploadId, partNumber, expiresIn = 900) => {
  try {
    const command = new UploadPartCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber
    });
    
    const url = await getSignedUrl(b2Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating presigned part URL:', error);
    throw new Error(`Failed to generate part URL: ${error.message}`);
  }
};

// Complete multipart upload
export const completeMultipartUpload = async (key, uploadId, parts) => {
  try {
    const command = new CompleteMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map(p => ({
          ETag: p.ETag,
          PartNumber: p.PartNumber
        }))
      }
    });
    
    const response = await b2Client.send(command);
    return response.Location;
  } catch (error) {
    console.error('Error completing multipart upload:', error);
    throw new Error(`Failed to complete multipart upload: ${error.message}`);
  }
};

// Abort multipart upload
export const abortMultipartUpload = async (key, uploadId) => {
  try {
    const command = new AbortMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId
    });
    
    await b2Client.send(command);
    return true;
  } catch (error) {
    console.error('Error aborting multipart upload:', error);
    throw new Error(`Failed to abort multipart upload: ${error.message}`);
  }
};

// Get object metadata (HEAD)
export const getObjectMetadata = async (key) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    
    const response = await b2Client.send(command);
    return {
      size: response.ContentLength,
      etag: response.ETag ? response.ETag.replace(/"/g, '') : null,
      contentType: response.ContentType,
      lastModified: response.LastModified,
      metadata: response.Metadata
    };
  } catch (error) {
    if (error.name === 'NotFound') return null;
    console.error('Error getting object metadata:', error);
    throw new Error(`Failed to get object metadata: ${error.message}`);
  }
};

// Delete object
export const deleteObject = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    
    await b2Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting object:', error);
    throw new Error(`Failed to delete object: ${error.message}`);
  }
};

// Generate unique storage key
export const generateStorageKey = (userId, originalName, folder = 'uploads') => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${folder}/user-${userId}/${timestamp}-${random}-${safeName}`;
};

// Test connection
export const testConnection = async () => {
  try {
    // Try to list buckets (or just head the bucket)
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: 'test-connection.txt'
    });
    
    await b2Client.send(command).catch(() => {
      // It's fine if the file doesn't exist, we just want to test the connection
      console.log('✅ Successfully connected to Backblaze B2');
      return true;
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Backblaze B2:', error);
    return false;
  }
};

export default {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  generatePresignedViewUrl,
  initiateMultipartUpload,
  generatePresignedPartUrl,
  completeMultipartUpload,
  abortMultipartUpload,
  getObjectMetadata,
  deleteObject,
  generateStorageKey,
  testConnection
};