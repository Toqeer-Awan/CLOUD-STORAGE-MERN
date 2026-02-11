import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    await User.deleteMany({});
    console.log('Cleared users');
    
    const admin = await User.create({
      username: 'Admin User',
      email: 'admin@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'admin'
    });
    
    const moderator = await User.create({
      username: 'Moderator User',
      email: 'moderator@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'moderator'
    });
    
    const user = await User.create({
      username: 'Regular User',
      email: 'user@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'user'
    });
    
    console.log('\n✅ Users seeded!');
    console.log('Admin: admin@example.com / password123');
    console.log('Moderator: moderator@example.com / password123');
    console.log('User: user@example.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedUsers();