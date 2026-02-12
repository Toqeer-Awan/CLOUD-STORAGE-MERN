import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Role from './models/Role.js';
import File from './models/File.js';
import Permission from './models/Permission.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      File.deleteMany({}),
      Permission.deleteMany({})
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
      
      // System permissions
      { name: 'view_analytics', displayName: 'View Analytics', description: 'Can view dashboard analytics', category: 'system' },
      { name: 'manage_settings', displayName: 'Manage Settings', description: 'Can manage system settings', category: 'system' },
      { name: 'view_logs', displayName: 'View Logs', description: 'Can view system logs', category: 'system' },
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
        view: true,
        upload: true,
        download: true,
        delete: true,
        addUser: true,
        removeUser: true,
        changeRole: true,
        manageFiles: true,
        viewAnalytics: true,
        manageSettings: true,
        viewLogs: true
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
        view: true,
        upload: true,
        download: true,
        delete: true,
        addUser: false,
        removeUser: false,
        changeRole: false,
        manageFiles: true,
        viewAnalytics: true,
        manageSettings: false,
        viewLogs: false
      },
      isCustom: false,
      priority: 2
    });

    // User Role
    const userRole = await Role.create({
      name: 'user',
      displayName: 'Regular User',
      description: 'Can upload and manage their own files',
      permissions: {
        view: true,
        upload: true,
        download: true,
        delete: false,
        addUser: false,
        removeUser: false,
        changeRole: false,
        manageFiles: false,
        viewAnalytics: false,
        manageSettings: false,
        viewLogs: false
      },
      isCustom: false,
      priority: 3
    });

    // Editor Role (Custom)
    const editorRole = await Role.create({
      name: 'editor',
      displayName: 'Content Editor',
      description: 'Can upload and edit files, but cannot delete',
      permissions: {
        view: true,
        upload: true,
        download: true,
        delete: false,
        addUser: false,
        removeUser: false,
        changeRole: false,
        manageFiles: true,
        viewAnalytics: false,
        manageSettings: false,
        viewLogs: false
      },
      isCustom: true,
      priority: 4
    });

    // Viewer Role (Custom)
    const viewerRole = await Role.create({
      name: 'viewer',
      displayName: 'Viewer',
      description: 'Can only view and download files',
      permissions: {
        view: true,
        upload: false,
        download: true,
        delete: false,
        addUser: false,
        removeUser: false,
        changeRole: false,
        manageFiles: false,
        viewAnalytics: false,
        manageSettings: false,
        viewLogs: false
      },
      isCustom: true,
      priority: 5
    });

    console.log(`✅ Created ${await Role.countDocuments()} roles`);

    // ===== 3. CREATE USERS =====
    console.log('\n👤 Creating users...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Admin User
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      permissions: adminRole.permissions
    });

    // Moderator User
    const moderatorUser = await User.create({
      username: 'moderator',
      email: 'moderator@example.com',
      password: hashedPassword,
      role: 'moderator',
      permissions: moderatorRole.permissions
    });

    // Regular User 1
    const regularUser1 = await User.create({
      username: 'john_doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'user',
      permissions: userRole.permissions
    });

    // Regular User 2
    const regularUser2 = await User.create({
      username: 'jane_smith',
      email: 'jane@example.com',
      password: hashedPassword,
      role: 'user',
      permissions: userRole.permissions
    });

    // Editor User
    const editorUser = await User.create({
      username: 'editor',
      email: 'editor@example.com',
      password: hashedPassword,
      role: 'editor',
      permissions: editorRole.permissions
    });

    // Viewer User
    const viewerUser = await User.create({
      username: 'viewer',
      email: 'viewer@example.com',
      password: hashedPassword,
      role: 'viewer',
      permissions: viewerRole.permissions
    });

    console.log(`✅ Created ${await User.countDocuments()} users`);

    // ===== 4. CREATE SAMPLE FILES =====
    console.log('\n📁 Creating sample files...');

    const now = new Date();
    const filesData = [
      {
        filename: 'profile-image-123.jpg',
        originalName: 'profile-picture.jpg',
        size: 2.5 * 1024 * 1024,
        mimetype: 'image/jpeg',
        storageType: 'cloudinary',
        storageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
        downloadUrl: 'https://res.cloudinary.com/demo/image/upload/fl_attachment/v1/sample.jpg',
        publicId: 'samples/profile-picture',
        uploadedBy: regularUser1._id,
        uploadDate: new Date(now - 2 * 24 * 60 * 60 * 1000),
        isPublic: true,
        tags: ['profile', 'image']
      },
      {
        filename: 'annual-report-2024.pdf',
        originalName: 'Annual Report 2024.pdf',
        size: 5.8 * 1024 * 1024,
        mimetype: 'application/pdf',
        storageType: 's3',
        storageUrl: 'https://my-bucket.s3.amazonaws.com/reports/annual-2024.pdf',
        downloadUrl: 'https://my-bucket.s3.amazonaws.com/reports/annual-2024.pdf',
        s3Key: 'reports/annual-2024.pdf',
        uploadedBy: adminUser._id,
        uploadDate: new Date(now - 5 * 24 * 60 * 60 * 1000),
        isPublic: true,
        tags: ['report', 'annual', 'pdf']
      },
      {
        filename: 'vacation-photo.jpg',
        originalName: 'beach-vacation.jpg',
        size: 3.2 * 1024 * 1024,
        mimetype: 'image/jpeg',
        storageType: 'cloudinary',
        storageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/beach.jpg',
        downloadUrl: 'https://res.cloudinary.com/demo/image/upload/fl_attachment/v1/beach.jpg',
        publicId: 'samples/beach',
        uploadedBy: regularUser2._id,
        uploadDate: new Date(now - 7 * 24 * 60 * 60 * 1000),
        isPublic: true,
        tags: ['vacation', 'beach', 'summer']
      },
      {
        filename: 'product-catalog.pdf',
        originalName: 'Summer Collection 2024.pdf',
        size: 8.4 * 1024 * 1024,
        mimetype: 'application/pdf',
        storageType: 's3',
        storageUrl: 'https://my-bucket.s3.amazonaws.com/catalogs/summer-2024.pdf',
        downloadUrl: 'https://my-bucket.s3.amazonaws.com/catalogs/summer-2024.pdf',
        s3Key: 'catalogs/summer-2024.pdf',
        uploadedBy: editorUser._id,
        uploadDate: new Date(now - 1 * 24 * 60 * 60 * 1000),
        isPublic: true,
        tags: ['catalog', 'products', 'summer-2024']
      }
    ];

    await File.insertMany(filesData);
    console.log(`✅ Created ${await File.countDocuments()} sample files`);

    // ===== FINAL SUMMARY =====
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    
    console.log('\n📊 DATABASE SUMMARY:');
    console.log(`   Permissions: ${await Permission.countDocuments()}`);
    console.log(`   Roles: ${await Role.countDocuments()}`);
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Files: ${await File.countDocuments()}`);
    
    console.log('\n👥 USER ACCOUNTS:');
    console.log('   ├─ Admin: admin@example.com / password123');
    console.log('   ├─ Moderator: moderator@example.com / password123');
    console.log('   ├─ Editor: editor@example.com / password123');
    console.log('   ├─ Viewer: viewer@example.com / password123');
    console.log('   ├─ John: john@example.com / password123');
    console.log('   └─ Jane: jane@example.com / password123');
    
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