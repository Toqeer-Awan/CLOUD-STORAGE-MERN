import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from 'dns'
dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      family: 4, // 🚀 YEH LINE ADD KARO — IPv4 force karta hai
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Connected`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
