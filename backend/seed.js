import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Role from './models/Role.js';
import File from './models/File.js';
import Permission from './models/Permission.js';
import Company from './models/Company.js';

dotenv.config();

const DEFAULT_COMPANY_STORAGE = 50 * 1024 * 1024 * 1024; // 50GB default for companies
const DEFAULT_USER_STORAGE = 10 * 1024 * 1024 * 1024; // 10GB default for users

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
      { name: 'manage_files', displayName: 'Manage All Files', category: 'files' },
      { name: 'view_users', displayName: 'View Users', category: 'users' },
      { name: 'add_users', displayName: 'Add Users', category: 'users' },
      { name: 'remove_users', displayName: 'Remove Users', category: 'users' },
      { name: 'change_roles', displayName: 'Change User Roles', category: 'users' },
      { name: 'manage_storage', displayName: 'Manage Storage', category: 'system' },
      { name: 'assign_storage', displayName: 'Assign Storage', category: 'system' },
    ];

    const createdPermissions = await Permission.insertMany(permissionsData);
    console.log(`✅ Created ${createdPermissions.length} permissions`);

    // ===== 2. CREATE ROLES =====
    console.log('\n👥 Creating roles...');

    // SUPERADMIN COMMENTED START
    // // Super Admin Role
    // await Role.create({
    //   name: 'superAdmin',
    //   displayName: 'Super Administrator',
    //   permissions: {
    //     view: true, upload: true, download: true, delete: true,
    //     addUser: true, removeUser: true, changeRole: true, 
    //     manageFiles: true, manageStorage: true, assignStorage: true
    //   },
    //   permissionIds: createdPermissions.map(p => p._id),
    //   isCustom: false,
    //   priority: 1
    // });
    // SUPERADMIN COMMENTED END

    // Admin Role
    await Role.create({
      name: 'admin',
      displayName: 'Company Administrator',
      permissions: {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: true,
        manageFiles: true, manageStorage: true, assignStorage: true
      },
      isCustom: false,
      priority: 1 // Changed from 2 to 1 since no superAdmin
    });

    // User Role
    await Role.create({
      name: 'user',
      displayName: 'Team Member',
      permissions: {
        view: true, upload: true, download: true, delete: false,
        addUser: false, removeUser: false, changeRole: false,
        manageFiles: false, manageStorage: false, assignStorage: false
      },
      isCustom: false,
      priority: 2 // Changed from 3 to 2
    });

    console.log(`✅ Created ${await Role.countDocuments()} roles`);

    // SUPERADMIN COMMENTED START
    // // ===== 3. CREATE SUPER ADMIN =====
    // console.log('\n👑 Creating Super Admin...');
    // 
    // const salt = await bcrypt.genSalt(10);
    // const superAdminPassword = await bcrypt.hash('superadmin123', salt);
    // const userPassword = await bcrypt.hash('password123', salt);
    // 
    // const superAdmin = await User.create({
    //   username: 'superadmin',
    //   email: 'superadmin@example.com',
    //   password: superAdminPassword,
    //   role: 'superAdmin',
    //   company: null,
    //   addedBy: null,
    //   storageAllocated: 0,
    //   storageUsed: 0
    // });
    // 
    // console.log('✅ Super Admin created:', superAdmin.email);
    // SUPERADMIN COMMENTED END

    // ===== 3. CREATE COMPANIES AND ADMINS =====
    console.log('\n🏢 Creating companies and admins...');
    
    const salt = await bcrypt.genSalt(10);
    const userPassword = await bcrypt.hash('password123', salt);

    // TechCorp Company
    const techCorpAdmin = await User.create({
      username: 'john_doe',
      email: 'john@techcorp.com',
      password: userPassword,
      role: 'admin',
      company: null,
      addedBy: null, // Changed from superAdmin._id
      storageAllocated: DEFAULT_COMPANY_STORAGE, // Admin gets 50GB
      storageUsed: 0
    });

    const techCorpCompany = await Company.create({
      name: 'TechCorp Solutions',
      owner: techCorpAdmin._id,
      totalStorage: DEFAULT_COMPANY_STORAGE, // 50GB default
      usedStorage: 0,
      // SUPERADMIN COMMENTED: allocatedToUsers: DEFAULT_COMPANY_STORAGE, // All 50GB allocated to admin
      userCount: 1,
      createdBy: null // Changed from superAdmin._id
    });

    techCorpAdmin.company = techCorpCompany._id;
    await techCorpAdmin.save();

    // TechCorp Team Members
    const techCorpUser1 = await User.create({
      username: 'jane_smith',
      email: 'jane@techcorp.com',
      password: userPassword,
      role: 'user',
      company: techCorpCompany._id,
      addedBy: techCorpAdmin._id,
      storageAllocated: DEFAULT_USER_STORAGE, // 10GB
      storageUsed: 0
    });

    const techCorpUser2 = await User.create({
      username: 'bob_wilson',
      email: 'bob@techcorp.com',
      password: userPassword,
      role: 'user',
      company: techCorpCompany._id,
      addedBy: techCorpAdmin._id,
      storageAllocated: DEFAULT_USER_STORAGE, // 10GB
      storageUsed: 0
    });

    // Update TechCorp company allocated storage
    // SUPERADMIN COMMENTED: techCorpCompany.allocatedToUsers = techCorpAdmin.storageAllocated + 
    // SUPERADMIN COMMENTED:                        techCorpUser1.storageAllocated + 
    // SUPERADMIN COMMENTED:                        techCorpUser2.storageAllocated;
    techCorpCompany.userCount = await User.countDocuments({ company: techCorpCompany._id });
    await techCorpCompany.save();

    // DesignStudio Company
    const designStudioAdmin = await User.create({
      username: 'alice_designer',
      email: 'alice@designstudio.com',
      password: userPassword,
      role: 'admin',
      company: null,
      addedBy: null, // Changed from superAdmin._id
      storageAllocated: DEFAULT_COMPANY_STORAGE, // 50GB
      storageUsed: 0
    });

    const designStudioCompany = await Company.create({
      name: 'Design Studio Creative',
      owner: designStudioAdmin._id,
      totalStorage: DEFAULT_COMPANY_STORAGE, // 50GB default
      usedStorage: 0,
      // SUPERADMIN COMMENTED: allocatedToUsers: DEFAULT_COMPANY_STORAGE, // All 50GB allocated to admin
      userCount: 1,
      createdBy: null // Changed from superAdmin._id
    });

    designStudioAdmin.company = designStudioCompany._id;
    await designStudioAdmin.save();

    const designStudioUser = await User.create({
      username: 'charlie_artist',
      email: 'charlie@designstudio.com',
      password: userPassword,
      role: 'user',
      company: designStudioCompany._id,
      addedBy: designStudioAdmin._id,
      storageAllocated: DEFAULT_USER_STORAGE, // 10GB
      storageUsed: 0
    });

    // Update DesignStudio company allocated storage
    // SUPERADMIN COMMENTED: designStudioCompany.allocatedToUsers = designStudioAdmin.storageAllocated + 
    // SUPERADMIN COMMENTED:                       designStudioUser.storageAllocated;
    designStudioCompany.userCount = await User.countDocuments({ company: designStudioCompany._id });
    await designStudioCompany.save();

    console.log(`✅ Created ${await Company.countDocuments()} companies`);
    console.log(`✅ Created ${await User.countDocuments()} users`);

    // ===== 4. CREATE SAMPLE FILES =====
    console.log('\n📁 Creating sample files...');

    const now = new Date();
    
    // TechCorp Files
    await File.insertMany([
      {
        filename: 'q4-project-proposal.pdf',
        originalName: 'Q4 Project Proposal.pdf',
        size: 2.5 * 1024 * 1024, // 2.5 MB
        mimetype: 'application/pdf',
        storageType: 'b2',
        storageUrl: 'https://techcorp-bucket.s3.amazonaws.com/proposal.pdf',
        downloadUrl: 'https://techcorp-bucket.s3.amazonaws.com/proposal.pdf',
        storageKey: 'techcorp/proposals/q4-proposal.pdf',
        uploadedBy: techCorpAdmin._id,
        company: techCorpCompany._id,
        uploadDate: new Date(now - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        // tags: ['proposal', 'pdf', 'quarterly']
      },
      {
        filename: 'ui-mockups.zip',
        originalName: 'UI Mockups.zip',
        size: 15.2 * 1024 * 1024, // 15.2 MB
        mimetype: 'application/zip',
        storageType: 'b2',
        storageUrl: 'https://techcorp-bucket.s3.amazonaws.com/mockups.zip',
        downloadUrl: 'https://techcorp-bucket.s3.amazonaws.com/mockups.zip',
        storageKey: 'techcorp/design/ui-mockups.zip',
        uploadedBy: techCorpUser1._id,
        company: techCorpCompany._id,
        uploadDate: new Date(now - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        // tags: ['design', 'mockups', 'ui']
      }
    ]);

    // DesignStudio Files
    await File.insertMany([
      {
        filename: 'company-logo.png',
        originalName: 'Company Logo.png',
        size: 1.2 * 1024 * 1024, // 1.2 MB
        mimetype: 'image/png',
        storageType: 'b2',
        storageUrl: 'https://designstudio-bucket.s3.amazonaws.com/logo.png',
        downloadUrl: 'https://designstudio-bucket.s3.amazonaws.com/logo.png',
        storageKey: 'designstudio/branding/logo.png',
        uploadedBy: designStudioAdmin._id,
        company: designStudioCompany._id,
        uploadDate: new Date(now - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        // tags: ['logo', 'branding', 'image']
      },
      {
        filename: 'portfolio.pdf',
        originalName: 'Design Portfolio.pdf',
        size: 8.7 * 1024 * 1024, // 8.7 MB
        mimetype: 'application/pdf',
        storageType: 'b2',
        storageUrl: 'https://designstudio-bucket.s3.amazonaws.com/portfolio.pdf',
        downloadUrl: 'https://designstudio-bucket.s3.amazonaws.com/portfolio.pdf',
        storageKey: 'designstudio/portfolio/portfolio.pdf',
        uploadedBy: designStudioUser._id,
        company: designStudioCompany._id,
        uploadDate: new Date(now - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        // tags: ['portfolio', 'pdf', 'design']
      }
    ]);

    console.log(`✅ Created ${await File.countDocuments()} sample files`);

    // ===== 5. UPDATE STORAGE USAGE =====
    console.log('\n💾 Updating storage usage...');

    // Update all users' storage used
    const allUsers = await User.find();
    for (const user of allUsers) {
      const userFiles = await File.find({ uploadedBy: user._id });
      const totalUsed = userFiles.reduce((acc, file) => acc + file.size, 0);
      user.storageUsed = totalUsed;
      await user.save();
    }

    // Update all companies' storage used
    const allCompanies = await Company.find();
    for (const company of allCompanies) {
      const companyFiles = await File.find({ company: company._id });
      const totalUsed = companyFiles.reduce((acc, file) => acc + file.size, 0);
      company.usedStorage = totalUsed;
      await company.save();
    }

    console.log('✅ Storage usage updated');

    // ===== FINAL SUMMARY =====
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    
    console.log('\n📊 DATABASE SUMMARY:');
    console.log(`   Permissions: ${await Permission.countDocuments()}`);
    console.log(`   Roles: ${await Role.countDocuments()}`);
    console.log(`   Companies: ${await Company.countDocuments()}`);
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Files: ${await File.countDocuments()}`);
    
    console.log('\n👑 ROLES CREATED:');
    const roles = await Role.find().sort({ priority: 1 });
    roles.forEach(role => {
      console.log(`   ├─ ${role.displayName} (${role.name}) ${role.isCustom ? '📝 Custom' : '⭐ Default'}`);
    });
    
    console.log('\n🏢 COMPANIES:');
    const companies = await Company.find().populate('owner', 'username');
    companies.forEach(company => {
      const totalStorageGB = (company.totalStorage / (1024 * 1024 * 1024)).toFixed(1);
      const usedStorageGB = (company.usedStorage / (1024 * 1024 * 1024)).toFixed(2);
      // SUPERADMIN COMMENTED: const allocatedGB = (company.allocatedToUsers / (1024 * 1024 * 1024)).toFixed(2);
      
      console.log(`   ├─ ${company.name}`);
      console.log(`   │  Owner: ${company.owner?.username}`);
      console.log(`   │  Total Storage: ${totalStorageGB}GB`);
      console.log(`   │  Used: ${usedStorageGB}GB`);
      // SUPERADMIN COMMENTED: console.log(`   │  Allocated: ${allocatedGB}GB`);
      console.log(`   │  Users: ${company.userCount}`);
    });
    
    console.log('\n👥 USER ACCOUNTS:');
    // SUPERADMIN COMMENTED: console.log('   ├─ SuperAdmin: superadmin@example.com / superadmin123');
    console.log('   ├─ TechCorp Admin: john@techcorp.com / password123');
    console.log('   ├─ TechCorp User: jane@techcorp.com / password123');
    console.log('   ├─ TechCorp User: bob@techcorp.com / password123');
    console.log('   ├─ DesignStudio Admin: alice@designstudio.com / password123');
    console.log('   └─ DesignStudio User: charlie@designstudio.com / password123');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Seed completed successfully!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ SEED ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
};

seedDatabase();