import User from '../models/User.js';
import Role from '../models/Role.js';
import bcrypt from 'bcryptjs';

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create user
export const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.role = role;
    
    // Set permissions based on new role
    if (role === 'admin') {
      user.permissions = {
        view: true,
        upload: true,
        download: true,
        delete: true,
        addUser: true,
        removeUser: true,
        changeRole: true,
        manageFiles: true
      };
    } else if (role === 'moderator') {
      user.permissions = {
        view: true,
        upload: true,
        download: true,
        delete: true,
        addUser: false,
        removeUser: false,
        changeRole: false,
        manageFiles: true
      };
    } else if (role === 'user') {
      user.permissions = {
        view: true,
        upload: true,
        download: true,
        delete: false,
        addUser: false,
        removeUser: false,
        changeRole: false,
        manageFiles: false
      };
    } else {
      // For custom roles, check Role collection
      const customRole = await Role.findOne({ name: role });
      if (customRole) {
        user.permissions = customRole.permissions;
      }
    }

    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user._id.toString() === req.user.id)
      return res.status(400).json({ error: 'Cannot delete your own account' });

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all roles and permissions
export const getAllRolesPermissions = async (req, res) => {
  try {
    // Get custom roles from Role collection
    const customRoles = await Role.find();
    
    // Get default permissions from users
    const users = await User.find().select('role permissions');
    
    // Build roles object
    const roles = {
      admin: { view: true, upload: true, download: true, delete: true, addUser: true, removeUser: true, changeRole: true, manageFiles: true },
      moderator: { view: true, upload: true, download: true, delete: true, addUser: false, removeUser: false, changeRole: false, manageFiles: true },
      user: { view: true, upload: true, download: true, delete: false, addUser: false, removeUser: false, changeRole: false, manageFiles: false }
    };

    // Update with actual data from users
    users.forEach(user => {
      if (roles[user.role] && user.permissions) {
        roles[user.role] = user.permissions.toObject();
      }
    });

    res.json({ 
      roles, 
      customRoles: customRoles.map(role => ({
        name: role.name,
        displayName: role.displayName,
        permissions: role.permissions
      }))
    });
  } catch (error) {
    console.error('Get all roles & permissions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update all roles and permissions (MAKE SURE THIS IS ONLY ONCE IN FILE)
export const updateAllRolesPermissions = async (req, res) => {
  try {
    const { roles, customRoles } = req.body;

    if (!roles || typeof roles !== 'object') {
      return res.status(400).json({ error: 'Roles object is required' });
    }

    // Update default roles in users
    for (const [roleName, permissions] of Object.entries(roles)) {
      await User.updateMany(
        { role: roleName },
        { $set: { permissions: permissions } }
      );
    }

    // Save custom roles to Role collection
    if (Array.isArray(customRoles)) {
      for (const customRole of customRoles) {
        await Role.findOneAndUpdate(
          { name: customRole.name },
          {
            name: customRole.name,
            displayName: customRole.displayName || customRole.name,
            permissions: customRole.permissions
          },
          { upsert: true, new: true }
        );
        
        // Update users with this role
        await User.updateMany(
          { role: customRole.name },
          { $set: { permissions: customRole.permissions } }
        );
      }
    }

    res.json({ 
      message: 'Permissions updated successfully',
      roles,
      customRoles
    });
  } catch (error) {
    console.error('Update all roles & permissions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get current user permissions
export const getUserPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('permissions role');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      permissions: user.permissions,
      role: user.role
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete custom role
export const deleteCustomRole = async (req, res) => {
  try {
    const { roleName } = req.params;
    
    // Don't allow deleting default roles
    if (['admin', 'moderator', 'user'].includes(roleName)) {
      return res.status(400).json({ error: 'Cannot delete default roles' });
    }
    
    // Delete from Role collection
    await Role.deleteOne({ name: roleName });
    
    // Update users with this role to 'user' role
    await User.updateMany(
      { role: roleName },
      { $set: { role: 'user' } }
    );
    
    res.json({ message: `Role ${roleName} deleted successfully` });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};