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
      // File permissions
      { name: 'view_files', displayName: 'View Files', description: 'Can view files', category: 'files' },
      { name: 'upload_files', displayName: 'Upload Files', description: 'Can upload files', category: 'files' },
      { name: 'download_files', displayName: 'Download Files', description: 'Can download files', category: 'files' },
      { name: 'delete_files', displayName: 'Delete Files', description: 'Can delete files', category: 'files' },
      { name: 'manage_all_files', displayName: 'Manage All Files', description: 'Can manage any file', category: 'files' },
      
      // User management permissions
      { name: 'view_users', displayName: 'View Users', description: 'Can view user list', category: 'users' },
      { name: 'create_users', displayName: 'Create Users', description: 'Can create new users', category: 'users' },
      { name: 'edit_users', displayName: 'Edit Users', description: 'Can edit user details', category: 'users' },
      { name: 'delete_users', displayName: 'Delete Users', description: 'Can delete users', category: 'users' },
      { name: 'change_user_role', displayName: 'Change User Role', description: 'Can change user roles', category: 'users' },
      
      // Role management permissions
      { name: 'view_roles', displayName: 'View Roles', description: 'Can view roles', category: 'roles' },
      { name: 'create_roles', displayName: 'Create Roles', description: 'Can create custom roles', category: 'roles' },
      { name: 'edit_roles', displayName: 'Edit Roles', description: 'Can edit role permissions', category: 'roles' },
      { name: 'delete_roles', displayName: 'Delete Roles', description: 'Can delete custom roles', category: 'roles' },
      
      // Company management permissions
      { name: 'manage_company', displayName: 'Manage Company', description: 'Can manage company settings', category: 'system' },
      { name: 'view_company_stats', displayName: 'View Company Stats', description: 'Can view company statistics', category: 'system' },
      { name: 'manage_storage', displayName: 'Manage Storage', description: 'Can manage storage limits', category: 'system' },
    ];

    const createdPermissions = await Permission.insertMany(permissionsData);
    console.log(`✅ Created ${createdPermissions.length} permissions`);

    // ===== 2. CREATE ROLES =====
    console.log('\n👥 Creating roles...');

    // Admin Role - Full access
    const adminRole = await Role.create({
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full system access with all permissions',
      permissions: {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: true, manageFiles: true,
        manageStorage: true
      },
      permissionIds: createdPermissions.map(p => p._id),
      isCustom: false,
      priority: 1
    });

    // Moderator Role
    const moderatorRole = await Role.create({
      name: 'moderator',
      displayName: 'Moderator',
      description: 'Can manage files and content, but cannot manage users',
      permissions: {
        view: true, upload: true, download: true, delete: true,
        addUser: false, removeUser: false, changeRole: false, manageFiles: true,
        manageStorage: false
      },
      isCustom: false,
      priority: 2
    });

    // User Role (Company Owner)
    const userRole = await Role.create({
      name: 'user',
      displayName: 'Company Owner',
      description: 'Can manage their company and upload files',
      permissions: {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: false, manageFiles: true,
        manageStorage: false
      },
      isCustom: false,
      priority: 3
    });

    console.log(`✅ Created ${await Role.countDocuments()} roles`);

    // ===== 3. CREATE COMPANIES AND USERS =====
    console.log('\n🏢 Creating companies and users...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // --- ADMIN ---
    // Create admin user first (with null company - allowed now)
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      company: null, // ✅ Now allowed because required: false
      addedBy: null,
      permissions: adminRole.permissions
    });

    // Create admin company with owner set
    const adminCompany = await Company.create({
      name: 'admin_company',
      owner: adminUser._id,
      totalStorage: 20 * 1024 * 1024 * 1024,
      userCount: 1
    });

    // Update admin user with company ID
    adminUser.company = adminCompany._id;
    await adminUser.save();

    // --- TECHCORP ---
    // Create TechCorp owner first
    const techCorpOwner = await User.create({
      username: 'john_doe',
      email: 'john@techcorp.com',
      password: hashedPassword,
      role: 'user',
      company: null, // ✅ Now allowed
      addedBy: null,
      permissions: userRole.permissions
    });

    // Create TechCorp company with owner set
    const techCorpCompany = await Company.create({
      name: 'techcorp_company',
      owner: techCorpOwner._id,
      totalStorage: 10 * 1024 * 1024 * 1024,
      userCount: 1
    });

    // Update owner with company ID
    techCorpOwner.company = techCorpCompany._id;
    await techCorpOwner.save();

    // Add team members to TechCorp
    const techCorpMember1 = await User.create({
      username: 'jane_smith',
      email: 'jane@techcorp.com',
      password: hashedPassword,
      role: 'moderator',
      company: techCorpCompany._id, // ✅ Now has company ID
      addedBy: techCorpOwner._id,
      permissions: moderatorRole.permissions
    });

    const techCorpMember2 = await User.create({
      username: 'bob_wilson',
      email: 'bob@techcorp.com',
      password: hashedPassword,
      role: 'user',
      company: techCorpCompany._id, // ✅ Now has company ID
      addedBy: techCorpOwner._id,
      permissions: userRole.permissions
    });

    // Update company user count
    techCorpCompany.userCount = await User.countDocuments({ company: techCorpCompany._id });
    await techCorpCompany.save();

    // --- DESIGNSTUDIO ---
    // Create DesignStudio owner first
    const designStudioOwner = await User.create({
      username: 'alice_designer',
      email: 'alice@designstudio.com',
      password: hashedPassword,
      role: 'user',
      company: null, // ✅ Now allowed
      addedBy: null,
      permissions: userRole.permissions
    });

    // Create DesignStudio company with owner set
    const designStudioCompany = await Company.create({
      name: 'designstudio_company',
      owner: designStudioOwner._id,
      totalStorage: 5 * 1024 * 1024 * 1024,
      userCount: 1
    });

    // Update owner with company ID
    designStudioOwner.company = designStudioCompany._id;
    await designStudioOwner.save();

    // Add team member to DesignStudio
    const designStudioMember = await User.create({
      username: 'charlie_artist',
      email: 'charlie@designstudio.com',
      password: hashedPassword,
      role: 'user',
      company: designStudioCompany._id, // ✅ Now has company ID
      addedBy: designStudioOwner._id,
      permissions: userRole.permissions
    });

    designStudioCompany.userCount = await User.countDocuments({ company: designStudioCompany._id });
    await designStudioCompany.save();

    console.log(`✅ Created ${await Company.countDocuments()} companies`);
    console.log(`✅ Created ${await User.countDocuments()} users`);

    // ===== 4. CREATE SAMPLE FILES =====
    console.log('\n📁 Creating sample files...');

    const now = new Date();
    const filesData = [
      // TechCorp files
      {
        filename: 'project-proposal.pdf',
        originalName: 'Q4 Project Proposal.pdf',
        size: 2.5 * 1024 * 1024,
        mimetype: 'application/pdf',
        storageType: 'cloudinary',
        storageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/proposal.pdf',
        downloadUrl: 'https://res.cloudinary.com/demo/image/upload/fl_attachment/v1/proposal.pdf',
        publicId: 'techcorp/proposal',
        uploadedBy: techCorpOwner._id,
        company: techCorpCompany._id,
        uploadDate: new Date(now - 2 * 24 * 60 * 60 * 1000),
        tags: ['proposal', 'pdf']
      },
      {
        filename: 'mockups.zip',
        originalName: 'UI Mockups.zip',
        size: 15.2 * 1024 * 1024,
        mimetype: 'application/zip',
        storageType: 's3',
        storageUrl: 'https://techcorp-bucket.s3.amazonaws.com/mockups.zip',
        downloadUrl: 'https://techcorp-bucket.s3.amazonaws.com/mockups.zip',
        s3Key: 'design/mockups.zip',
        uploadedBy: techCorpMember1._id,
        company: techCorpCompany._id,
        uploadDate: new Date(now - 5 * 24 * 60 * 60 * 1000),
        tags: ['design', 'mockups']
      },
      // DesignStudio files
      {
        filename: 'logo-design.png',
        originalName: 'Company Logo.png',
        size: 1.2 * 1024 * 1024,
        mimetype: 'image/png',
        storageType: 'cloudinary',
        storageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/logo.png',
        downloadUrl: 'https://res.cloudinary.com/demo/image/upload/fl_attachment/v1/logo.png',
        publicId: 'designstudio/logo',
        uploadedBy: designStudioOwner._id,
        company: designStudioCompany._id,
        uploadDate: new Date(now - 1 * 24 * 60 * 60 * 1000),
        tags: ['logo', 'branding']
      }
    ];

    await File.insertMany(filesData);

    // Update company used storage
    for (const company of [techCorpCompany, designStudioCompany]) {
      const files = await File.find({ company: company._id });
      const totalStorageUsed = files.reduce((acc, file) => acc + file.size, 0);
      company.usedStorage = totalStorageUsed;
      await company.save();
    }

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
    
    console.log('\n🏢 COMPANIES:');
    const companies = await Company.find().populate('owner', 'username');
    companies.forEach(company => {
      console.log(`   ├─ ${company.name}`);
      console.log(`   │  Owner: ${company.owner?.username || 'Admin'}`);
      console.log(`   │  Storage: ${(company.totalStorage / (1024 * 1024 * 1024)).toFixed(1)}GB`);
      console.log(`   │  Users: ${company.userCount}`);
    });
    
    console.log('\n👥 USER ACCOUNTS:');
    console.log('   ├─ Admin: admin@example.com / password123');
    console.log('   ├─ TechCorp: john@techcorp.com / password123 (Owner)');
    console.log('   ├─ TechCorp: jane@techcorp.com / password123 (Moderator)');
    console.log('   ├─ TechCorp: bob@techcorp.com / password123 (User)');
    console.log('   ├─ DesignStudio: alice@designstudio.com / password123 (Owner)');
    console.log('   └─ DesignStudio: charlie@designstudio.com / password123 (User)');
    
    console.log('\n' + '='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ SEED ERROR:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    
    if (error.code === 11000) {
      console.error('   Duplicate key error. Please check your data.');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
};

seedDatabase();