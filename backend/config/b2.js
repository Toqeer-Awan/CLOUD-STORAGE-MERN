import AWS from 'aws-sdk';
import crypto from 'crypto';

// Validate required environment variables
const requiredEnvVars = ['B2_KEY_ID', 'B2_APPLICATION_KEY', 'B2_BUCKET_NAME', 'B2_REGION'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

// Construct endpoint from region - MAKE SURE TO INCLUDE https://
const B2_ENDPOINT = process.env.B2_ENDPOINT || `https://s3.${process.env.B2_REGION}.backblazeb2.com`;

console.log('📡 B2 Configuration:', {
  endpoint: B2_ENDPOINT,
  region: process.env.B2_REGION,
  bucket: process.env.B2_BUCKET_NAME,
  keyId: process.env.B2_KEY_ID ? '✓ Set' : '✗ Missing'
});

const b2Client = new AWS.S3({
  endpoint: B2_ENDPOINT,
  region: process.env.B2_REGION,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY
  },
  signatureVersion: 'v4',
  s3ForcePathStyle: true,
  maxRetries: 3,
  httpOptions: {
    timeout: 30000,
    connectTimeout: 5000
  }
});

const BUCKET_NAME = process.env.B2_BUCKET_NAME;

// Test the connection - FIXED FUNCTION NAME
export const testConnection = async () => {
  try {
    // Try to list objects (limit 1) to test connection
    const params = {
      Bucket: BUCKET_NAME,
      MaxKeys: 1
    };
    await b2Client.listObjectsV2(params).promise();
    console.log('✅ Successfully connected to Backblaze B2');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Backblaze B2:', error.message);
    return false;
  }
};

// Generate presigned upload URL (PUT)
export const generatePresignedUploadUrl = async (key, contentType, expiresIn = 900) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Expires: expiresIn
    };
    
    console.log('🔑 Generating upload URL for:', { 
      key, 
      contentType,
      bucket: BUCKET_NAME,
      endpoint: B2_ENDPOINT
    });
    
    const url = await b2Client.getSignedUrlPromise('putObject', params);
    console.log('✅ Upload URL generated successfully');
    return url;
  } catch (error) {
    console.error('❌ Error generating presigned upload URL:', error);
    throw new Error(`Failed to generate upload URL: ${error.message}`);
  }
};

// Generate presigned download URL (GET)
export const generatePresignedDownloadUrl = async (key, expiresIn = 300) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn,
      ResponseContentDisposition: 'attachment'
    };
    
    const url = await b2Client.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('❌ Error generating presigned download URL:', error);
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }
};

// Generate presigned view URL (GET without download)
export const generatePresignedViewUrl = async (key, expiresIn = 300) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn
    };
    
    const url = await b2Client.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('❌ Error generating presigned view URL:', error);
    throw new Error(`Failed to generate view URL: ${error.message}`);
  }
};

// Generate unique storage key
export const generateStorageKey = (userId, originalName, folder = 'uploads') => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${folder}/user-${userId}/${timestamp}-${random}-${safeName}`;
};

// Get object metadata
export const getObjectMetadata = async (key) => {
  try {
    const params = { Bucket: BUCKET_NAME, Key: key };
    const result = await b2Client.headObject(params).promise();
    return {
      size: result.ContentLength,
      etag: result.ETag ? result.ETag.replace(/"/g, '') : null,
      contentType: result.ContentType,
      lastModified: result.LastModified
    };
  } catch (error) {
    if (error.code === 'NotFound') {
      return null;
    }
    console.error('❌ Error getting object metadata:', error);
    throw error;
  }
};

// Delete object
export const deleteObject = async (key) => {
  try {
    const params = { Bucket: BUCKET_NAME, Key: key };
    await b2Client.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('❌ Error deleting object:', error);
    throw error;
  }
};

// Export all functions
export default {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  generatePresignedViewUrl,
  generateStorageKey,
  getObjectMetadata,
  deleteObject,
  testConnection  // Make sure this is included
};