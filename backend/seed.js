import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Role from './models/Role.js';
import File from './models/File.js';
import Permission from './models/Permission.js';
import Company from './models/Company.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      File.deleteMany({}),
      Permission.deleteMany({}),
      Company.deleteMany({})
    ]);
    console.log('🗑️  Cleared all collections');

    // ===== 1. CREATE PERMISSIONS =====
    console.log('\n📋 Creating permissions...');
    
    const permissionsData = [
      { name: 'view_files', displayName: 'View Files', category: 'files' },
      { name: 'upload_files', displayName: 'Upload Files', category: 'files' },
      { name: 'download_files', displayName: 'Download Files', category: 'files' },
      { name: 'delete_files', displayName: 'Delete Files', category: 'files' },
      { name: 'view_users', displayName: 'View Users', category: 'users' },
      { name: 'create_users', displayName: 'Create Users', category: 'users' },
      { name: 'edit_users', displayName: 'Edit Users', category: 'users' },
      { name: 'delete_users', displayName: 'Delete Users', category: 'users' },
      { name: 'manage_storage', displayName: 'Manage Storage', category: 'system' },
      { name: 'assign_storage', displayName: 'Assign Storage', category: 'system' },
    ];

    const createdPermissions = await Permission.insertMany(permissionsData);
    console.log(`✅ Created ${createdPermissions.length} permissions`);

    // ===== 2. CREATE ROLES =====
    console.log('\n👥 Creating roles...');

    await Role.create([
      {
        name: 'superAdmin',
        displayName: 'Super Administrator',
        permissions: {
          view: true, upload: true, download: true, delete: true,
          addUser: true, removeUser: true, changeRole: true, 
          manageFiles: true, manageStorage: true, assignStorage: true
        },
        isCustom: false,
        priority: 1
      },
      {
        name: 'admin',
        displayName: 'Company Administrator',
        permissions: {
          view: true, upload: true, download: true, delete: true,
          addUser: true, removeUser: true, changeRole: true,
          manageFiles: true, manageStorage: true, assignStorage: true
        },
        isCustom: false,
        priority: 2
      },
      {
        name: 'user',
        displayName: 'Team Member',
        permissions: {
          view: true, upload: true, download: true, delete: false,
          addUser: false, removeUser: false, changeRole: false,
          manageFiles: false, manageStorage: false, assignStorage: false
        },
        isCustom: false,
        priority: 3
      }
    ]);

    console.log(`✅ Created ${await Role.countDocuments()} roles`);

    // ===== 3. CREATE SUPER ADMIN =====
    console.log('\n👑 Creating Super Admin...');
    
    const salt = await bcrypt.genSalt(10);
    const superAdminPassword = await bcrypt.hash('superadmin123', salt);
    const userPassword = await bcrypt.hash('password123', salt);

    const superAdmin = await User.create({
      username: 'superadmin',
      email: 'superadmin@example.com',
      password: superAdminPassword,
      role: 'superAdmin',
      company: null,
      addedBy: null,
      storageAllocated: 0,
      storageUsed: 0
    });

    console.log('✅ Super Admin created:', superAdmin.email);

    // ===== 4. CREATE COMPANIES AND ADMINS =====
    console.log('\n🏢 Creating companies and admins...');

    // TechCorp
    const techCorpAdmin = await User.create({
      username: 'john_doe',
      email: 'john@techcorp.com',
      password: userPassword,
      role: 'admin',
      company: null,
      addedBy: superAdmin._id,
      storageAllocated: 10 * 1024 * 1024 * 1024,
      storageUsed: 0
    });

    const techCorpCompany = await Company.create({
      name: 'TechCorp Solutions',
      owner: techCorpAdmin._id,
      totalStorage: 10 * 1024 * 1024 * 1024,
      usedStorage: 0,
      allocatedToUsers: 0,
      userCount: 1,
      createdBy: superAdmin._id
    });

    techCorpAdmin.company = techCorpCompany._id;
    await techCorpAdmin.save();

    // Team members
    await User.create([
      {
        username: 'jane_smith',
        email: 'jane@techcorp.com',
        password: userPassword,
        role: 'user',
        company: techCorpCompany._id,
        addedBy: techCorpAdmin._id,
        storageAllocated: 2 * 1024 * 1024 * 1024,
        storageUsed: 0
      },
      {
        username: 'bob_wilson',
        email: 'bob@techcorp.com',
        password: userPassword,
        role: 'user',
        company: techCorpCompany._id,
        addedBy: techCorpAdmin._id,
        storageAllocated: 1 * 1024 * 1024 * 1024,
        storageUsed: 0
      }
    ]);

    techCorpCompany.userCount = await User.countDocuments({ company: techCorpCompany._id });
    await techCorpCompany.save();

    // DesignStudio
    const designStudioAdmin = await User.create({
      username: 'alice_designer',
      email: 'alice@designstudio.com',
      password: userPassword,
      role: 'admin',
      company: null,
      addedBy: superAdmin._id,
      storageAllocated: 5 * 1024 * 1024 * 1024,
      storageUsed: 0
    });

    const designStudioCompany = await Company.create({
      name: 'Design Studio',
      owner: designStudioAdmin._id,
      totalStorage: 5 * 1024 * 1024 * 1024,
      usedStorage: 0,
      allocatedToUsers: 0,
      userCount: 1,
      createdBy: superAdmin._id
    });

    designStudioAdmin.company = designStudioCompany._id;
    await designStudioAdmin.save();

    await User.create({
      username: 'charlie_artist',
      email: 'charlie@designstudio.com',
      password: userPassword,
      role: 'user',
      company: designStudioCompany._id,
      addedBy: designStudioAdmin._id,
      storageAllocated: 1 * 1024 * 1024 * 1024,
      storageUsed: 0
    });

    designStudioCompany.userCount = await User.countDocuments({ company: designStudioCompany._id });
    await designStudioCompany.save();

    console.log(`✅ Created ${await Company.countDocuments()} companies`);
    console.log(`✅ Created ${await User.countDocuments()} users`);

    // ===== 5. CREATE SAMPLE FILES =====
    console.log('\n📁 Creating sample files...');

    const now = new Date();
    await File.insertMany([
      {
        filename: 'project-proposal.pdf',
        originalName: 'Q4 Project Proposal.pdf',
        size: 2.5 * 1024 * 1024,
        mimetype: 'application/pdf',
        storageType: 's3',
        storageUrl: 'https://techcorp-bucket.s3.amazonaws.com/proposal.pdf',
        downloadUrl: 'https://techcorp-bucket.s3.amazonaws.com/proposal.pdf',
        s3Key: 'techcorp/proposal.pdf',
        uploadedBy: techCorpAdmin._id,
        company: techCorpCompany._id,
        uploadDate: new Date(now - 2 * 24 * 60 * 60 * 1000)
      },
      {
        filename: 'logo-design.png',
        originalName: 'Company Logo.png',
        size: 1.2 * 1024 * 1024,
        mimetype: 'image/png',
        storageType: 's3',
        storageUrl: 'https://designstudio-bucket.s3.amazonaws.com/logo.png',
        downloadUrl: 'https://designstudio-bucket.s3.amazonaws.com/logo.png',
        s3Key: 'branding/logo.png',
        uploadedBy: designStudioAdmin._id,
        company: designStudioCompany._id,
        uploadDate: new Date(now - 1 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.log(`✅ Created ${await File.countDocuments()} sample files`);

    // ===== FINAL SUMMARY =====
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    
    console.log('\n📊 DATABASE SUMMARY:');
    console.log(`   Permissions: ${await Permission.countDocuments()}`);
    console.log(`   Roles: ${await Role.countDocuments()}`);
    console.log(`   Companies: ${await Company.countDocuments()}`);
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Files: ${await File.countDocuments()}`);
    
    console.log('\n👑 SUPER ADMIN:');
    console.log(`   superadmin@example.com / superadmin123`);
    
    console.log('\n👥 USER ACCOUNTS:');
    console.log('   ├─ SuperAdmin: superadmin@example.com / superadmin123');
    console.log('   ├─ TechCorp Admin: john@techcorp.com / password123');
    console.log('   ├─ TechCorp User: jane@techcorp.com / password123');
    console.log('   ├─ TechCorp User: bob@techcorp.com / password123');
    console.log('   ├─ DesignStudio Admin: alice@designstudio.com / password123');
    console.log('   └─ DesignStudio User: charlie@designstudio.com / password123');
    
  } catch (error) {
    console.error('\n❌ SEED ERROR:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
};

seedDatabase();