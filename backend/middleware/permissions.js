// PERMISSIONS MIDDLEWARE - COMPLETELY COMMENTED OUT
// export const checkPermission = (permission) => {
//   return (req, res, next) => {
//     if (!req.user) {
//       return res.status(401).json({ error: 'Login required' });
//     }
// 
//     if (req.user.role === 'admin') {
//       return next();
//     }
// 
//     if (req.user.permissions && req.user.permissions[permission]) {
//       return next();
//     }
// 
//     return res.status(403).json({ error: 'Access denied' });
//   };
// };