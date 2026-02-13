import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (filePath) => {
  try {
    console.log('📤 Uploading to Cloudinary...');
    
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
      folder: 'cloud-storage',
      use_filename: true,
      unique_filename: false
    });
    
    console.log('✅ Cloudinary upload successful:', result.secure_url);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('publicId is required');
    }
    
    console.log(`🗑️ Deleting ${publicId} from Cloudinary...`);
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    console.log('✅ Cloudinary delete result:', result);
    
    if (result.result === 'ok') {
      return { success: true, message: 'File deleted from Cloudinary' };
    } else {
      throw new Error(`Cloudinary delete failed: ${result.result}`);
    }
    
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error.message);
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary
};