import User from '../models/User.js';
import Company from '../models/Company.js';
import Role from '../models/Role.js';
import bcrypt from 'bcryptjs';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('company', 'name totalStorage')
      .populate('addedBy', 'username email');
    res.json(users);
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get users by company
// @route   GET /api/users/company/:companyId
// @access  Private/Admin
export const getCompanyUsers = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    if (req.user.role !== 'admin' && req.user.role !== 'superAdmin' && req.user.company?.toString() !== companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const users = await User.find({ company: companyId })
      .select('-password')
      .populate('addedBy', 'username email');
    
    res.json(users);
  } catch (error) {
    console.error('❌ Get company users error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    console.log('📝 Creating user with data:', { username, email, role });
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide username, email and password' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    let companyId = null;
    let company = null;
    
    if (req.user.role === 'superAdmin') {
      if (req.body.companyId) {
        companyId = req.body.companyId;
        company = await Company.findById(companyId);
        if (!company) {
          return res.status(404).json({ error: 'Company not found' });
        }
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

    let permissions = {
      view: true, upload: true, download: true, delete: false,
      addUser: false, removeUser: false, changeRole: false,
      manageFiles: false, manageStorage: false, assignStorage: false
    };

    if (role === 'admin') {
      permissions = {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: true,
        manageFiles: true, manageStorage: true, assignStorage: true
      };
    }

    let storageAllocated = 0;
    if (role === 'admin' && company) {
      storageAllocated = company.totalStorage || 50 * 1024 * 1024 * 1024;
    }

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
      company: companyId,
      addedBy: req.user.id,
      storageAllocated,
      storageUsed: 0,
      allocatedToUsers: 0,
      permissions
    });

    await user.save();
    console.log('✅ User created with ID:', user._id);

    if (req.user.role === 'superAdmin' && !req.body.companyId && role === 'admin') {
      console.log('🏢 Creating new company for user...');
      
      const companyName = `${username.toLowerCase().replace(/\s+/g, '_')}_company`;
      
      company = new Company({
        name: companyName,
        owner: user._id,
        totalStorage: 50 * 1024 * 1024 * 1024,
        usedStorage: 0,
        userCount: 1,
        createdBy: req.user.id
      });
      
      await company.save();
      
      user.company = company._id;
      user.storageAllocated = 50 * 1024 * 1024 * 1024;
      await user.save();
    } 
    else if (company) {
      company.userCount = await User.countDocuments({ company: company._id });
      await company.save();
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Create user error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let permissions = {
      view: true, upload: true, download: true, delete: false,
      addUser: false, removeUser: false, changeRole: false,
      manageFiles: false, manageStorage: false, assignStorage: false
    };

    if (role === 'admin' || role === 'superAdmin') {
      permissions = {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: true,
        manageFiles: true, manageStorage: true, assignStorage: true
      };
    }

    if (role === 'admin' && user.role !== 'admin') {
      const company = await Company.findById(user.company);
      if (company) {
        user.storageAllocated = company.totalStorage;
      }
    }

    user.role = role;
    user.permissions = permissions;
    await user.save();

    res.json({ 
      message: 'User role updated',
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
        storageAllocated: user.storageAllocated
      }
    });
  } catch (error) {
    console.error('❌ Update role error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    if (user.role === 'user' && user.storageAllocated > 0) {
      const admin = await User.findOne({ 
        company: user.company, 
        role: 'admin' 
      });
      
      if (admin) {
        admin.allocatedToUsers = (admin.allocatedToUsers || 0) - user.storageAllocated;
        await admin.save();
        console.log(`✅ Updated admin ${admin.username} allocatedToUsers: -${(user.storageAllocated / (1024*1024*1024)).toFixed(2)}GB`);
      }
    }

    if (user.company) {
      const company = await Company.findById(user.company);
      if (company) {
        company.userCount = Math.max(0, (company.userCount || 1) - 1);
        await company.save();
      }
    }

    await User.findByIdAndDelete(req.params.id);
    console.log('✅ User deleted successfully:', user.username);
    
    res.json({ 
      success: true,
      message: 'User deleted successfully' 
    });
    
  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get current user permissions
// @route   GET /api/users/permissions/me
// @access  Private
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
    console.error('❌ Get permissions error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all roles and permissions
// @route   GET /api/users/permissions
// @access  Private/Admin
export const getAllRolesPermissions = async (req, res) => {
  try {
    const roles = {
      superAdmin: {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: true, 
        manageFiles: true, manageStorage: true, assignStorage: true
      },
      admin: {
        view: true, upload: true, download: true, delete: true,
        addUser: true, removeUser: true, changeRole: true,
        manageFiles: true, manageStorage: true, assignStorage: true
      },
      user: {
        view: true, upload: true, download: true, delete: false,
        addUser: false, removeUser: false, changeRole: false,
        manageFiles: false, manageStorage: false, assignStorage: false
      }
    };
    
    let customRoles = [];
    try {
      const dbRoles = await Role.find({ isCustom: true });
      customRoles = dbRoles.map(role => ({
        name: role.name,
        displayName: role.displayName,
        permissions: role.permissions,
        isCustom: true
      }));
    } catch (err) {
      console.log('ℹ️ Role model not found, using default roles only');
    }
    
    res.json({ 
      roles,
      customRoles
    });
  } catch (error) {
    console.error('❌ Get roles permissions error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get user quota
// @route   GET /api/users/quota
// @access  Private
export const getQuota = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('storageAllocated storageUsed allocatedToUsers username role');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let available = 0;
    let total = user.storageAllocated || 0;
    let used = user.storageUsed || 0;
    
    // For admin users, available storage = total - used - allocatedToUsers
    if (user.role === 'admin') {
      const allocatedToUsers = user.allocatedToUsers || 0;
      // This is the correct calculation: total minus what admin has used minus what admin has given to users
      available = Math.max(0, total - used - allocatedToUsers);
      
      console.log('👑 Admin quota calculation:', {
        username: user.username,
        total: (total / (1024*1024*1024)).toFixed(2) + 'GB',
        usedBySelf: (used / (1024*1024*1024)).toFixed(2) + 'GB',
        givenToUsers: (allocatedToUsers / (1024*1024*1024)).toFixed(2) + 'GB',
        available: (available / (1024*1024*1024)).toFixed(2) + 'GB'
      });
    } else {
      // For regular users, available = total - used
      available = Math.max(0, total - used);
    }
    
    // Calculate percentage of used storage (excluding allocations to users)
    // For admin, this should be (used / total) * 100
    const percentage = total > 0 ? ((used / total) * 100).toFixed(1) : 0;
    
    res.json({
      used: used,
      total: total,
      available: available,
      percentage: parseFloat(percentage)
    });
  } catch (error) {
    console.error('❌ Get quota error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update all roles permissions
// @route   PUT /api/users/permissions
// @access  Private/SuperAdmin
export const updateAllRolesPermissions = async (req, res) => {
  try {
    const { roles, customRoles } = req.body;

    if (!roles || typeof roles !== 'object') {
      return res.status(400).json({ error: 'Roles object is required' });
    }

    console.log('🔄 Updating permissions');

    for (const [roleName, permissions] of Object.entries(roles)) {
      await User.updateMany(
        { role: roleName },
        { $set: { permissions: permissions } }
      );
    }

    try {
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
        }
      }
    } catch (err) {
      console.log('ℹ️ Role model not found, skipping custom role save');
    }

    res.json({ 
      message: 'Permissions updated successfully',
      roles,
      customRoles
    });
  } catch (error) {
    console.error('❌ Update permissions error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete custom role
// @route   DELETE /api/users/permissions/role/:roleName
// @access  Private/SuperAdmin
export const deleteCustomRole = async (req, res) => {
  try {
    const { roleName } = req.params;
    
    try {
      await Role.deleteOne({ name: roleName, isCustom: true });
    } catch (err) {
      console.log('ℹ️ Role model not found');
    }
    
    await User.updateMany(
      { role: roleName },
      { 
        $set: { 
          role: 'user',
          storageAllocated: 0,
          allocatedToUsers: 0
        } 
      }
    );
    
    res.json({ message: `Role ${roleName} deleted successfully` });
  } catch (error) {
    console.error('❌ Delete role error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Sync admin storage with company storage
// @route   POST /api/users/sync-admin-storage/:companyId
// @access  Private/Admin
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
    
    console.log(`🔄 Syncing ${admins.length} admins for company ${company.name}`);
    
    for (const admin of admins) {
      admin.storageAllocated = company.totalStorage;
      await admin.save();
      console.log(`✅ Updated admin ${admin.username} storage to ${(company.totalStorage / (1024*1024*1024)).toFixed(2)}GB`);
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
    console.error('❌ Sync admin storage error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Export all functions
export default {
  getAllUsers,
  getCompanyUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getUserPermissions,
  getAllRolesPermissions,
  updateAllRolesPermissions,
  deleteCustomRole,
  syncAdminStorage,
  getQuota
};