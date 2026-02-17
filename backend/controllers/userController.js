import User from '../models/User.js';
import Company from '../models/Company.js';
import Role from '../models/Role.js';
import bcrypt from 'bcryptjs';

const DEFAULT_ADMIN_STORAGE = 50 * 1024 * 1024 * 1024; // 50GB for admins
const DEFAULT_USER_STORAGE = 10 * 1024 * 1024 * 1024; // 10GB for regular users

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('company', 'name totalStorage')
      .populate('addedBy', 'username email');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get users by company (For company owners)
export const getCompanyUsers = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    if (req.user.role !== 'admin' && req.user.company.toString() !== companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const users = await User.find({ company: companyId })
      .select('-password')
      .populate('addedBy', 'username email');
    
    res.json(users);
  } catch (error) {
    console.error('Get company users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create user
export const createUser = async (req, res) => {
  try {
    const { username, email, password, role, storageAllocated } = req.body;
    
    console.log('Creating user with data:', { username, email, role, storageAllocated });
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    let companyId;
    let company;
    
    if (req.user.role === 'superAdmin') {
      if (req.body.companyId) {
        companyId = req.body.companyId;
        company = await Company.findById(companyId);
        if (!company) {
          return res.status(404).json({ error: 'Company not found' });
        }
      } else {
        companyId = null;
      }
    } else {
      companyId = req.user.company;
      company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const roleDoc = await Role.findOne({ name: role });
    let permissions = {};
    
    if (roleDoc) {
      permissions = roleDoc.permissions;
    } else {
      permissions = {
        view: true, upload: true, download: true, delete: false,
        addUser: false, removeUser: false, changeRole: false,
        manageFiles: false, manageStorage: false, assignStorage: false
      };
    }

    let userStorageAllocated = 0;
    
    if (storageAllocated) {
      userStorageAllocated = storageAllocated;
    } else if (role === 'admin') {
      userStorageAllocated = DEFAULT_ADMIN_STORAGE; // 50GB
      console.log(`✅ Setting admin storage to 50GB: ${DEFAULT_ADMIN_STORAGE / (1024*1024*1024)}GB`);
    } else {
      userStorageAllocated = DEFAULT_USER_STORAGE; // 10GB
      console.log(`✅ Setting user storage to 10GB: ${DEFAULT_USER_STORAGE / (1024*1024*1024)}GB`);
    }

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
      company: null,
      addedBy: req.user.id,
      permissions,
      storageAllocated: userStorageAllocated,
      storageUsed: 0
    });

    console.log('✅ User created with ID:', user._id);
    console.log(`✅ User storage allocated: ${userStorageAllocated / (1024*1024*1024)}GB`);

    if (req.user.role === 'superAdmin' && !req.body.companyId) {
      console.log('Creating new company for user...');
      
      const companyName = `${username.toLowerCase().replace(/\s+/g, '_')}_company`;
      
      company = await Company.create({
        name: companyName,
        owner: user._id,
        totalStorage: 50 * 1024 * 1024 * 1024,
        usedStorage: 0,
        allocatedToUsers: userStorageAllocated,
        userCount: 1,
        createdBy: req.user.id
      });
      
      user.company = company._id;
      await user.save();
      
      companyId = company._id;
    } 
    else if (company) {
      user.company = company._id;
      await user.save();
      
      company.allocatedToUsers = (company.allocatedToUsers || 0) + userStorageAllocated;
      company.userCount = await User.countDocuments({ company: company._id });
      await company.save();
    }

    if (company && !company.owner && req.user.role === 'admin') {
      company.owner = user._id;
      await company.save();
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        company: company?._id || null,
        companyName: company?.name || null,
        permissions: user.permissions,
        storageAllocated: user.storageAllocated,
        storageUsed: user.storageUsed
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id).populate('company');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user.role !== 'superAdmin') {
      if (req.user.company.toString() !== user.company._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const roleDoc = await Role.findOne({ name: role });
    let permissions = {};
    
    if (roleDoc) {
      permissions = roleDoc.permissions;
    }

    if (role === 'admin' && user.role !== 'admin') {
      user.storageAllocated = DEFAULT_ADMIN_STORAGE; // 50GB
      console.log(`✅ User ${user.username} became admin, storage updated to 50GB`);
    } else if (role === 'user' && user.role === 'admin') {
      user.storageAllocated = DEFAULT_USER_STORAGE; // 10GB
      console.log(`✅ User ${user.username} became regular user, storage updated to 10GB`);
    }

    user.role = role;
    user.permissions = permissions;
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        storageAllocated: user.storageAllocated,
        storageUsed: user.storageUsed
      }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 🔥 FIXED: Delete user from company
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Delete user request for ID:', id);
    console.log('Requesting user:', {
      id: req.user.id,
      role: req.user.role,
      company: req.user.company
    });

    // Find the user to delete
    const userToDelete = await User.findById(id).populate('company');
    
    if (!userToDelete) {
      console.log('User not found with ID:', id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User to delete:', {
      id: userToDelete._id,
      username: userToDelete.username,
      role: userToDelete.role,
      company: userToDelete.company?._id,
      isOwner: userToDelete.company?.owner?.toString() === userToDelete._id.toString()
    });

    // Check if user is trying to delete themselves
    if (userToDelete._id.toString() === req.user.id.toString()) {
      console.log('Cannot delete yourself');
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user has a company
    if (!userToDelete.company) {
      console.log('User has no company');
      return res.status(400).json({ error: 'User has no company assigned' });
    }

    // 🔥 FIX: Get admin's company ID properly
    const adminCompanyId = req.user.company?._id?.toString() || req.user.company?.toString();
    const userCompanyId = userToDelete.company._id?.toString();

    console.log('Company comparison:', {
      adminCompanyId,
      userCompanyId,
      match: adminCompanyId === userCompanyId
    });

    // Check if user belongs to admin's company
    if (adminCompanyId !== userCompanyId) {
      console.log('User does not belong to admin company');
      return res.status(403).json({ 
        error: 'User does not belong to your company',
        message: 'You can only delete users from your own company'
      });
    }

    // Check if user is the company owner
    const company = await Company.findById(userCompanyId);
    if (company && company.owner?.toString() === userToDelete._id.toString()) {
      console.log('Cannot delete company owner');
      return res.status(403).json({ 
        error: 'Cannot delete company owner',
        message: 'The company owner cannot be deleted'
      });
    }

    // Update company stats before deletion
    if (company) {
      company.allocatedToUsers = (company.allocatedToUsers || 0) - (userToDelete.storageAllocated || 0);
      company.userCount = Math.max(0, (company.userCount || 1) - 1);
      await company.save();
      console.log('Updated company stats:', {
        allocatedToUsers: company.allocatedToUsers,
        userCount: company.userCount
      });
    }

    // Delete the user
    await User.findByIdAndDelete(id);
    console.log('✅ User deleted successfully:', userToDelete.username);

    res.json({ 
      success: true,
      message: `User ${userToDelete.username} deleted successfully`,
      deletedUser: {
        id: userToDelete._id,
        username: userToDelete.username,
        email: userToDelete.email
      }
    });

  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({ 
      error: 'Failed to delete user',
      message: error.message 
    });
  }
};

// Sync admin storage with company storage
export const syncAdminStorage = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const admins = await User.find({ 
      company: companyId, 
      role: 'admin' 
    });
    
    console.log(`Syncing ${admins.length} admins for company ${company.name}`);
    
    for (const admin of admins) {
      admin.storageAllocated = company.totalStorage;
      await admin.save();
      console.log(`✅ Updated admin ${admin.username} storage to ${company.totalStorage / (1024*1024*1024)}GB`);
    }
    
    res.json({
      message: `Synced ${admins.length} admin(s) storage with company total`,
      company: {
        _id: company._id,
        name: company.name,
        totalStorage: company.totalStorage
      },
      updatedAdmins: admins.length
    });
  } catch (error) {
    console.error('Sync admin storage error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get current user permissions
export const getUserPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('permissions role company');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      permissions: user.permissions,
      role: user.role,
      company: user.company
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all roles and permissions
export const getAllRolesPermissions = async (req, res) => {
  try {
    const allRoles = await Role.find();
    
    const defaultRoles = {};
    const customRoles = [];
    
    allRoles.forEach(role => {
      if (!role.isCustom) {
        defaultRoles[role.name] = role.permissions;
      } else {
        customRoles.push({
          name: role.name,
          displayName: role.displayName,
          permissions: role.permissions,
          isCustom: true
        });
      }
    });
    
    res.json({ 
      roles: defaultRoles,
      customRoles
    });
  } catch (error) {
    console.error('Get all roles & permissions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update all roles and permissions
export const updateAllRolesPermissions = async (req, res) => {
  try {
    const { roles, customRoles } = req.body;

    if (!roles || typeof roles !== 'object') {
      return res.status(400).json({ error: 'Roles object is required' });
    }

    console.log('Updating permissions:', { roles, customRoles });

    for (const [roleName, permissions] of Object.entries(roles)) {
      await Role.findOneAndUpdate(
        { name: roleName, isCustom: false },
        { 
          name: roleName,
          displayName: formatRoleName(roleName),
          permissions: permissions,
          isCustom: false
        },
        { upsert: true, new: true }
      );
      
      await User.updateMany(
        { role: roleName },
        { $set: { permissions: permissions } }
      );
    }

    if (Array.isArray(customRoles)) {
      for (const customRole of customRoles) {
        await Role.findOneAndUpdate(
          { name: customRole.name, isCustom: true },
          {
            name: customRole.name,
            displayName: customRole.displayName || customRole.name,
            permissions: customRole.permissions,
            isCustom: true
          },
          { upsert: true, new: true }
        );
        
        await User.updateMany(
          { role: customRole.name },
          { $set: { permissions: customRole.permissions } }
        );
      }
    }

    if (Array.isArray(customRoles)) {
      const customRoleNames = customRoles.map(r => r.name);
      await Role.deleteMany({ 
        isCustom: true,
        name: { $nin: customRoleNames }
      });
    }

    res.json({ 
      message: 'Permissions updated successfully',
      roles,
      customRoles
    });
  } catch (error) {
    console.error('Update all roles & permissions error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

const formatRoleName = (roleName) => {
  return roleName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

// Delete custom role
export const deleteCustomRole = async (req, res) => {
  try {
    const { roleName } = req.params;
    
    const role = await Role.findOne({ name: roleName });
    if (role && !role.isCustom) {
      return res.status(400).json({ error: 'Cannot delete default roles' });
    }
    
    await Role.deleteOne({ name: roleName, isCustom: true });
    
    const defaultUserRole = await Role.findOne({ name: 'user', isCustom: false });
    await User.updateMany(
      { role: roleName },
      { 
        $set: { 
          role: 'user',
          permissions: defaultUserRole?.permissions || {},
          storageAllocated: DEFAULT_USER_STORAGE
        } 
      }
    );
    
    res.json({ message: `Role ${roleName} deleted successfully` });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};