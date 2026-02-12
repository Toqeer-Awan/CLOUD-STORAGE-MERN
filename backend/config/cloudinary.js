import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary with validation
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
};

console.log('Cloudinary Config:', {
  cloud_name: cloudinaryConfig.cloud_name ? 'Set' : 'Not set',
  api_key: cloudinaryConfig.api_key ? 'Set' : 'Not set',
  api_secret: cloudinaryConfig.api_secret ? 'Set' : 'Not set'
});

if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
  console.warn('Cloudinary credentials missing. Cloudinary uploads will fail.');
}

cloudinary.config(cloudinaryConfig);

export default cloudinary;