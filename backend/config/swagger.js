import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cloud Storage API',
      version: '1.0.0',
      description: `This API provides cloud storage functionality with Backblaze B2 integration.`,},
    // servers: [
    //   {
    //     url: 'http://localhost:5000/api',
    //     description: 'Development server'
    //   },
    //   {
    //     url: 'https://your-production-domain.com/api',
    //     description: 'Production server'
    //   }
    // ],
    // components: {
    //   securitySchemes: {
    //     bearerAuth: {
    //       type: 'http',
    //       scheme: 'bearer',
    //       bearerFormat: 'JWT',
    //       description: 'Enter your JWT token in the format: Bearer <token>'
    //     }
    //   }
    // },
//     tags: [
//       { 
//         name: 'Auth', 
//         description: '🔐 Authentication endpoints - Register, login, OAuth (Google/Facebook/Microsoft)'
//       },
//       { 
//         name: 'Users', 
//         description: '👥 User management - Quota, permissions, user lists'
//       },
//       { 
//         name: 'Files', 
//         description: '📁 File operations - Upload, download, delete, search, filter'
//       },
//       { 
//         name: 'Storage', 
//         description: '💾 Storage management - Allocate storage to users, check quotas'
//       },
//       { 
//         name: 'Companies', 
//         description: '🏢 Company management - Company details, team members, storage'
//       },
//       { 
//         name: 'Roles', 
//         description: '🔑 Role management - View roles and their permissions'
//       },
//       { 
//         name: 'Permissions', 
//         description: '🔓 Permission management - Update role permissions'
//       }
//     ]
  },
  apis: ['./routes/*.js'], // Scan all route files for JSDoc comments
};

const specs = swaggerJsdoc(options);
export default specs;