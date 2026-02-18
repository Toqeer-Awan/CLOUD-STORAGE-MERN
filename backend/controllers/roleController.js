import Role from '../models/Role.js';

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private/Admin
export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (error) {
    console.error('❌ Get roles error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
// @desc    Get roles with permissions format for frontend
// @route   GET /api/users/permissions
// @access  Private/Admin
export const getRolesPermissions = async (req, res) => {
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
    console.error('❌ Get roles permissions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Create a new role
// @route   POST /api/roles
// @access  Private/SuperAdmin
export const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    // Check if role exists
    const roleExists = await Role.findOne({ name });
    if (roleExists) {
      return res.status(400).json({ error: 'Role already exists' });
    }
    
    const role = await Role.create({
      name,
      displayName: name.charAt(0).toUpperCase() + name.slice(1),
      description,
      permissions,
      isCustom: true
    });
    
    res.status(201).json({
      message: 'Role created successfully',
      role
    });
  } catch (error) {
    console.error('❌ Create role error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// @desc    Update a role
// @route   PUT /api/roles/:id
// @access  Private/SuperAdmin
export const updateRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Don't allow updating default roles if they're not custom
    if (!role.isCustom && req.user.role !== 'superAdmin') {
      return res.status(403).json({ error: 'Cannot update default roles' });
    }
    
    if (name) role.name = name;
    if (description) role.description = description;
    if (permissions) role.permissions = permissions;
    
    await role.save();
    
    res.json({
      message: 'Role updated successfully',
      role
    });
  } catch (error) {
    console.error('❌ Update role error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// @desc    Delete a role
// @route   DELETE /api/roles/:id
// @access  Private/SuperAdmin
export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Don't allow deleting default roles
    if (!role.isCustom) {
      return res.status(403).json({ error: 'Cannot delete default roles' });
    }
    
    await role.deleteOne();
    
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('❌ Delete role error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};