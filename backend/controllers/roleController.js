// ROLE CONTROLLER - COMPLETELY COMMENTED OUT
// import Role from '../models/Role.js';
// 
// // @desc    Get all roles
// // @route   GET /api/roles
// // @access  Private/Admin
// export const getAllRoles = async (req, res) => {
//   try {
//     const roles = await Role.find();
//     res.json(roles);
//   } catch (error) {
//     console.error('❌ Get roles error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// };
// 
// // @desc    Get roles with permissions format for frontend
// // @route   GET /api/users/permissions
// // @access  Private/Admin
// export const getRolesPermissions = async (req, res) => {
//   try {
//     const allRoles = await Role.find();
//     
//     const defaultRoles = {};
//     const customRoles = [];
//     
//     allRoles.forEach(role => {
//       if (!role.isCustom) {
//         defaultRoles[role.name] = role.permissions;
//       } else {
//         customRoles.push({
//           name: role.name,
//           displayName: role.displayName,
//           permissions: role.permissions,
//           isCustom: true
//         });
//       }
//     });
//     
//     res.json({ 
//       roles: defaultRoles,
//       customRoles
//     });
//   } catch (error) {
//     console.error('❌ Get roles permissions error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// };
// 
// export default {
//   getAllRoles,
//   getRolesPermissions
// };