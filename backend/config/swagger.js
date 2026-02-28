import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cloud Storage API',
      version: '1.0.0',
      description: `
# Cloud Storage API Documentation

This API provides cloud storage functionality with Backblaze B2 integration.

## Authentication
All protected endpoints require a JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Response Format
All API responses follow this standard format:

### Success Response:
\`\`\`json
{
  "success": true,
  "status": 200,
  "message": "Operation successful",
  "responsedata": { ... }, // Response data (camelCase)
  "token": "jwt-token" // Only for auth endpoints
}
\`\`\`

### Error Response:
\`\`\`json
{
  "success": false,
  "status": 400,
  "message": "Error message describing what went wrong",
  "responsedata": null
}
\`\`\`
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://app.cloudverse.space/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        // ===== STANDARD ERROR RESPONSES =====
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            status: {
              type: 'integer',
              example: 400
            },
            message: {
              type: 'string',
              example: 'Invalid email or password'
            },
            responsedata: {
              type: 'object',
              nullable: true,
              example: null,
              default: null
            }
          }
        },
        
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            status: {
              type: 'integer',
              example: 400
            },
            message: {
              type: 'string',
              example: 'Please provide username, email and password'
            },
            responsedata: {
              type: 'object',
              nullable: true,
              example: null,
              default: null
            }
          }
        },
        
        NotFoundResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            status: {
              type: 'integer',
              example: 404
            },
            message: {
              type: 'string',
              example: 'User not found'
            },
            responsedata: {
              type: 'object',
              nullable: true,
              example: null,
              default: null
            }
          }
        },
        
        UnauthorizedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            status: {
              type: 'integer',
              example: 401
            },
            message: {
              type: 'string',
              example: 'Not authorized, no token'
            },
            responsedata: {
              type: 'object',
              nullable: true,
              example: null,
              default: null
            }
          }
        },
        
        ForbiddenResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            status: {
              type: 'integer',
              example: 403
            },
            message: {
              type: 'string',
              example: 'Access denied'
            },
            responsedata: {
              type: 'object',
              nullable: true,
              example: null,
              default: null
            }
          }
        },
        
        ServerErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            status: {
              type: 'integer',
              example: 500
            },
            message: {
              type: 'string',
              example: 'Internal server error'
            },
            responsedata: {
              type: 'object',
              nullable: true,
              example: null,
              default: null
            }
          }
        },
        
        // ===== AUTH REQUEST SCHEMAS =====
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Username for the new account',
              example: 'john_doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Password (min 6 characters)',
              example: 'password123'
            }
          }
        },
        
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Password',
              example: 'password123'
            }
          }
        },
        
        GoogleAuthRequest: {
          type: 'object',
          required: ['access_token'],
          properties: {
            access_token: {
              type: 'string',
              description: 'Google OAuth access token',
              example: 'ya29.a0AfH6SMC...'
            }
          }
        },
        
        FacebookAuthRequest: {
          type: 'object',
          required: ['access_token'],
          properties: {
            access_token: {
              type: 'string',
              description: 'Facebook OAuth access token',
              example: 'EAAJsm...'
            }
          }
        },
        
        MicrosoftAuthRequest: {
          type: 'object',
          required: ['access_token'],
          properties: {
            access_token: {
              type: 'string',
              description: 'Microsoft OAuth access token',
              example: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1Ni...'
            }
          }
        },
        
        // ===== RESPONSEDATA OBJECT (Reused in auth responses) =====
        ResponseDataObject: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
              example: '69a2b994fb6fdf09580bce76'
            },
            username: {
              type: 'string',
              description: 'Username',
              example: 'john_doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
              example: 'john@example.com'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user'],
              description: 'User role',
              example: 'admin'
            },
            company: {
              type: 'string',
              nullable: true,
              description: 'Company ID if user belongs to a company',
              example: null
            },
            companyName: {
              type: 'string',
              nullable: true,
              description: 'Company name',
              example: null
            },
            permissions: {
              type: 'object',
              description: 'User permissions',
              properties: {
                view: { type: 'boolean', example: true },
                upload: { type: 'boolean', example: true },
                download: { type: 'boolean', example: true },
                delete: { type: 'boolean', example: false },
                addUser: { type: 'boolean', example: false },
                removeUser: { type: 'boolean', example: false },
                changeRole: { type: 'boolean', example: false },
                manageFiles: { type: 'boolean', example: false },
                manageStorage: { type: 'boolean', example: false },
                assignStorage: { type: 'boolean', example: false }
              }
            },
            storageAllocated: {
              type: 'number',
              description: 'Storage allocated in bytes',
              example: 53687091200
            },
            storageUsed: {
              type: 'number',
              description: 'Storage used in bytes',
              example: 1048576
            },
            allocatedToUsers: {
              type: 'number',
              description: 'Storage allocated to team members',
              example: 0
            },
            authProvider: {
              type: 'string',
              enum: ['local', 'google', 'facebook', 'microsoft'],
              description: 'Authentication provider',
              example: 'local'
            },
            avatar: {
              type: 'string',
              nullable: true,
              description: 'Avatar URL',
              example: null
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date',
              example: '2025-03-22T10:30:00.000Z'
            }
          }
        },
        
        // ===== PROFILE RESPONSEDATA OBJECT =====
        ProfileResponseDataObject: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '69a2b994fb6fdf09580bce76'
            },
            username: {
              type: 'string',
              example: 'john_doe'
            },
            email: {
              type: 'string',
              example: 'john@example.com'
            },
            role: {
              type: 'string',
              example: 'admin'
            },
            company: {
              type: 'object',
              nullable: true,
              properties: {
                _id: {
                  type: 'string',
                  example: '67df7b3f9a1b2c3d4e5f6a7c'
                },
                name: {
                  type: 'string',
                  example: "john_doe's Company"
                },
                totalStorage: {
                  type: 'number',
                  example: 53687091200
                },
                usedStorage: {
                  type: 'number',
                  example: 1048576
                }
              }
            },
            permissions: {
              type: 'object',
              properties: {
                view: { type: 'boolean', example: true },
                upload: { type: 'boolean', example: true },
                download: { type: 'boolean', example: true },
                delete: { type: 'boolean', example: true },
                addUser: { type: 'boolean', example: true },
                removeUser: { type: 'boolean', example: true },
                changeRole: { type: 'boolean', example: true },
                manageFiles: { type: 'boolean', example: true },
                manageStorage: { type: 'boolean', example: true },
                assignStorage: { type: 'boolean', example: true }
              }
            },
            storage: {
              type: 'object',
              properties: {
                allocated: {
                  type: 'number',
                  example: 53687091200
                },
                used: {
                  type: 'number',
                  example: 1048576
                },
                available: {
                  type: 'number',
                  example: 52638515200
                },
                allocatedToUsers: {
                  type: 'number',
                  example: 0
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-03-22T10:30:00.000Z'
            }
          }
        },
        
        // ===== AUTH SUCCESS RESPONSES =====
        RegisterResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            status: {
              type: 'integer',
              example: 201
            },
            message: {
              type: 'string',
              example: 'User registered successfully'
            },
            responsedata: {
              $ref: '#/components/schemas/ResponseDataObject'
            },
            token: {
              type: 'string',
              description: 'JWT token for authentication',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YTJiOTk0ZmI2ZmRmMDk1ODBiY2U3NiIsInJvbGUiOiJhZG1pbiIsImNvbXBhbnkiOm51bGwsImlhdCI6MTc3MjI3NDA5MywiZXhwIjoxNzc0ODY2MDkzfQ.mCNWqZAjUcuu6XMBP4UavuIkuYPkIWqB8ZD0ymExEyQ'
            }
          }
        },
        
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            status: {
              type: 'integer',
              example: 200
            },
            message: {
              type: 'string',
              example: 'Login successful'
            },
            responsedata: {
              $ref: '#/components/schemas/ResponseDataObject'
            },
            token: {
              type: 'string',
              description: 'JWT token for authentication',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YTJiOTk0ZmI2ZmRmMDk1ODBiY2U3NiIsInJvbGUiOiJhZG1pbiIsImNvbXBhbnkiOm51bGwsImlhdCI6MTc3MjI3NTU2MiwiZXhwIjoxNzc0ODY3NTYyfQ.3KsH_tVhbpgnuDIEIwv1u4y8QXktXBpEVr79lZz0CzM'
            }
          }
        },
        
        GoogleLoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT token for authentication',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YTJiOTk0ZmI2ZmRmMDk1ODBiY2U3NiIsInJvbGUiOiJhZG1pbiIsImNvbXBhbnkiOm51bGwsImlhdCI6MTc3MjI3NDA5MywiZXhwIjoxNzc0ODY2MDkzfQ.mCNWqZAjUcuu6XMBP4UavuIkuYPkIWqB8ZD0ymExEyQ'
            },
            responsedata: {
              $ref: '#/components/schemas/ResponseDataObject'
            }
          }
        },
        
        ProfileResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            status: {
              type: 'integer',
              example: 200
            },
            responsedata: {
              $ref: '#/components/schemas/ProfileResponseDataObject'
            }
          }
        },
        
        LogoutResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            status: {
              type: 'integer',
              example: 200
            },
            message: {
              type: 'string',
              example: 'Logged out successfully'
            },
            responsedata: {
              type: 'object',
              nullable: true,
              example: null,
              default: null
            }
          }
        },
        
        // ===== QUOTA RESPONSE =====
        QuotaResponse: {
          type: 'object',
          properties: {
            used: {
              type: 'number',
              description: 'Storage used in bytes',
              example: 1048576
            },
            total: {
              type: 'number',
              description: 'Total storage allocated in bytes',
              example: 53687091200
            },
            available: {
              type: 'number',
              description: 'Available storage in bytes',
              example: 52638515200
            },
            percentage: {
              type: 'number',
              description: 'Percentage of storage used',
              example: 0.02
            },
            fileCount: {
              type: 'number',
              description: 'Number of files',
              example: 5
            },
            maxFiles: {
              type: 'number',
              description: 'Maximum files allowed',
              example: 100
            },
            daily: {
              type: 'object',
              description: 'Daily usage statistics',
              properties: {
                used: { type: 'number', example: 52428800 },
                limit: { type: 'number', example: 1073741824 },
                remaining: { type: 'number', example: 1021313024 },
                count: { type: 'number', example: 2 }
              }
            },
            plan: {
              type: 'string',
              description: 'Current plan',
              example: 'free'
            },
            isNearLimit: {
              type: 'boolean',
              description: 'Whether storage is near limit',
              example: false
            },
            isOverLimit: {
              type: 'boolean',
              description: 'Whether storage is over limit',
              example: false
            },
            byType: {
              type: 'object',
              description: 'Storage breakdown by file type',
              properties: {
                images: {
                  type: 'object',
                  properties: {
                    count: { type: 'number', example: 3 },
                    size: { type: 'number', example: 15728640 }
                  }
                },
                videos: {
                  type: 'object',
                  properties: {
                    count: { type: 'number', example: 1 },
                    size: { type: 'number', example: 20971520 }
                  }
                },
                pdfs: {
                  type: 'object',
                  properties: {
                    count: { type: 'number', example: 1 },
                    size: { type: 'number', example: 5242880 }
                  }
                },
                documents: {
                  type: 'object',
                  properties: {
                    count: { type: 'number', example: 0 },
                    size: { type: 'number', example: 0 }
                  }
                },
                others: {
                  type: 'object',
                  properties: {
                    count: { type: 'number', example: 0 },
                    size: { type: 'number', example: 0 }
                  }
                }
              }
            },
            limits: {
              type: 'object',
              description: 'Plan limits',
              properties: {
                maxFileSize: { type: 'number', example: 104857600 },
                maxFiles: { type: 'number', example: 100 },
                dailyUpload: { type: 'number', example: 1073741824 }
              }
            },
            warnings: {
              type: 'object',
              description: 'Warning flags',
              properties: {
                storage: { type: 'boolean', example: false },
                files: { type: 'boolean', example: false },
                daily: { type: 'boolean', example: false }
              }
            },
            accountAge: {
              type: 'string',
              description: 'Account age in hours',
              example: '72.5'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date',
              example: '2025-03-22T10:30:00.000Z'
            }
          }
        },
        
        // ===== FILE SCHEMAS =====
        FileObject: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'File ID',
              example: '67df7b3f9a1b2c3d4e5f6a7d'
            },
            filename: {
              type: 'string',
              description: 'Storage filename',
              example: '1742677800123-abc12345-document.pdf'
            },
            originalName: {
              type: 'string',
              description: 'Original filename',
              example: 'annual-report-2025.pdf'
            },
            size: {
              type: 'number',
              description: 'File size in bytes',
              example: 5242880
            },
            mimetype: {
              type: 'string',
              description: 'MIME type',
              example: 'application/pdf'
            },
            storageType: {
              type: 'string',
              description: 'Storage type',
              example: 'b2'
            },
            storageKey: {
              type: 'string',
              description: 'Storage key in B2',
              example: 'uploads/user-123/1742677800123-abc12345-annual-report-2025.pdf'
            },
            storageUrl: {
              type: 'string',
              description: 'Public URL',
              example: 'https://your-bucket.s3.us-west-002.backblazeb2.com/uploads/user-123/1742677800123-abc12345-annual-report-2025.pdf'
            },
            uploadStatus: {
              type: 'string',
              enum: ['pending', 'uploading', 'completed', 'failed'],
              description: 'Upload status',
              example: 'completed'
            },
            uploadedBy: {
              type: 'string',
              description: 'User ID who uploaded',
              example: '67df7b3f9a1b2c3d4e5f6a7b'
            },
            company: {
              type: 'string',
              nullable: true,
              description: 'Company ID',
              example: '67df7b3f9a1b2c3d4e5f6a7c'
            },
            isDeleted: {
              type: 'boolean',
              description: 'Soft delete flag',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Upload date',
              example: '2025-03-22T10:35:00.000Z'
            }
          }
        },
        
        FilesListResponse: {
          type: 'array',
          description: 'List of files',
          items: {
            $ref: '#/components/schemas/FileObject'
          }
        },
        
        InitUploadRequest: {
          type: 'object',
          required: ['filename', 'size', 'mimetype'],
          properties: {
            filename: {
              type: 'string',
              description: 'Full path including folders',
              example: 'documents/2025/annual-report.pdf'
            },
            size: {
              type: 'number',
              description: 'File size in bytes',
              example: 5242880
            },
            mimetype: {
              type: 'string',
              description: 'MIME type',
              example: 'application/pdf'
            },
            useMultipart: {
              type: 'boolean',
              description: 'Force multipart upload',
              example: false
            },
            folderPath: {
              type: 'string',
              description: 'Optional folder path',
              example: 'documents/2025'
            }
          }
        },
        
        InitUploadResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            fileId: {
              type: 'string',
              description: 'File ID',
              example: '67df7b3f9a1b2c3d4e5f6a7d'
            },
            storageKey: {
              type: 'string',
              description: 'Storage key',
              example: 'uploads/user-123/1742677800123-abc12345-annual-report-2025.pdf'
            },
            presignedUrl: {
              type: 'string',
              description: 'Presigned URL for direct upload',
              example: 'https://s3.us-west-002.backblazeb2.com/your-bucket/uploads/user-123/1742677800123-abc12345-annual-report-2025.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...'
            },
            uploadId: {
              type: 'string',
              description: 'Upload ID for multipart uploads',
              example: '~123456789'
            },
            partUrls: {
              type: 'array',
              description: 'Part URLs for multipart uploads',
              items: {
                type: 'object',
                properties: {
                  partNumber: { type: 'number', example: 1 },
                  url: { type: 'string', example: 'https://s3...' }
                }
              }
            },
            expiresIn: {
              type: 'number',
              description: 'URL expiration in seconds',
              example: 900
            },
            useMultipart: {
              type: 'boolean',
              description: 'Whether multipart upload is used',
              example: false
            },
            quota: {
              type: 'object',
              description: 'Updated quota information',
              properties: {
                storage: {
                  type: 'object',
                  properties: {
                    used: { type: 'number', example: 10485760 },
                    total: { type: 'number', example: 53687091200 },
                    available: { type: 'number', example: 53676605440 },
                    percentage: { type: 'string', example: '0.02' },
                    isNearLimit: { type: 'boolean', example: false },
                    isCritical: { type: 'boolean', example: false }
                  }
                },
                files: {
                  type: 'object',
                  properties: {
                    count: { type: 'number', example: 10 },
                    max: { type: 'number', example: 100 },
                    remaining: { type: 'number', example: 89 },
                    isNearLimit: { type: 'boolean', example: false }
                  }
                },
                daily: {
                  type: 'object',
                  properties: {
                    used: { type: 'number', example: 5242880 },
                    limit: { type: 'number', example: 1073741824 },
                    remaining: { type: 'number', example: 1068498944 },
                    percentage: { type: 'string', example: '0.49' },
                    isNearLimit: { type: 'boolean', example: false }
                  }
                }
              }
            }
          }
        },
        
        FinalizeUploadRequest: {
          type: 'object',
          required: ['fileId'],
          properties: {
            fileId: {
              type: 'string',
              description: 'File ID from init upload',
              example: '67df7b3f9a1b2c3d4e5f6a7d'
            },
            parts: {
              type: 'array',
              description: 'Required for multipart uploads',
              items: {
                type: 'object',
                properties: {
                  PartNumber: { type: 'number', example: 1 },
                  ETag: { type: 'string', example: '"5d41402abc4b2a76b9719d911017c592"' }
                }
              }
            }
          }
        },
        
        FinalizeUploadResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Upload finalized successfully'
            },
            file: {
              type: 'object',
              properties: {
                _id: {
                  type: 'string',
                  example: '67df7b3f9a1b2c3d4e5f6a7d'
                },
                name: {
                  type: 'string',
                  example: 'annual-report-2025.pdf'
                },
                size: {
                  type: 'number',
                  example: 5242880
                },
                storageUrl: {
                  type: 'string',
                  example: 'https://your-bucket.s3.us-west-002.backblazeb2.com/uploads/user-123/1742677800123-abc12345-annual-report-2025.pdf'
                },
                uploadedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-03-22T10:35:00.000Z'
                }
              }
            },
            quota: {
              type: 'object',
              properties: {
                storage: {
                  type: 'object',
                  properties: {
                    used: { type: 'number', example: 15728640 },
                    total: { type: 'number', example: 53687091200 },
                    available: { type: 'number', example: 53671362560 },
                    percentage: { type: 'string', example: '0.03' },
                    isNearLimit: { type: 'boolean', example: false },
                    isCritical: { type: 'boolean', example: false }
                  }
                },
                files: {
                  type: 'object',
                  properties: {
                    count: { type: 'number', example: 11 },
                    max: { type: 'number', example: 100 },
                    remaining: { type: 'number', example: 88 },
                    isNearLimit: { type: 'boolean', example: false }
                  }
                },
                daily: {
                  type: 'object',
                  properties: {
                    used: { type: 'number', example: 10485760 },
                    limit: { type: 'number', example: 1073741824 },
                    remaining: { type: 'number', example: 1063256064 },
                    percentage: { type: 'string', example: '0.98' },
                    isNearLimit: { type: 'boolean', example: false }
                  }
                },
                byType: {
                  type: 'object',
                  properties: {
                    images: {
                      type: 'object',
                      properties: {
                        count: { type: 'number', example: 3 },
                        size: { type: 'number', example: 15728640 }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        
        DownloadUrlResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            downloadUrl: {
              type: 'string',
              description: 'Presigned download URL',
              example: 'https://s3.us-west-002.backblazeb2.com/your-bucket/uploads/user-123/1742677800123-abc12345-annual-report-2025.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...'
            },
            filename: {
              type: 'string',
              description: 'Original filename',
              example: 'annual-report-2025.pdf'
            },
            fileId: {
              type: 'string',
              description: 'File ID',
              example: '67df7b3f9a1b2c3d4e5f6a7d'
            },
            size: {
              type: 'number',
              description: 'File size in bytes',
              example: 5242880
            },
            expiresIn: {
              type: 'number',
              description: 'URL expiration in seconds',
              example: 300
            }
          }
        },
        
        ViewUrlResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            viewUrl: {
              type: 'string',
              description: 'Presigned view URL',
              example: 'https://s3.us-west-002.backblazeb2.com/your-bucket/uploads/user-123/1742677800123-abc12345-annual-report-2025.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...'
            },
            filename: {
              type: 'string',
              description: 'Original filename',
              example: 'annual-report-2025.pdf'
            },
            fileId: {
              type: 'string',
              description: 'File ID',
              example: '67df7b3f9a1b2c3d4e5f6a7d'
            },
            expiresIn: {
              type: 'number',
              description: 'URL expiration in seconds',
              example: 600
            }
          }
        },
        
        DeleteFileResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'File deleted successfully'
            },
            fileId: {
              type: 'string',
              description: 'Deleted file ID',
              example: '67df7b3f9a1b2c3d4e5f6a7d'
            }
          }
        },
        
        FileStatsResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            stats: {
              type: 'object',
              properties: {
                totalFiles: { type: 'number', example: 10 },
                totalSize: { type: 'number', example: 52428800 },
                allocated: { type: 'number', example: 53687091200 },
                used: { type: 'number', example: 52428800 },
                available: { type: 'number', example: 53634662400 },
                byType: {
                  type: 'object',
                  properties: {
                    images: {
                      type: 'object',
                      properties: {
                        count: { type: 'number', example: 3 },
                        size: { type: 'number', example: 15728640 }
                      }
                    },
                    videos: {
                      type: 'object',
                      properties: {
                        count: { type: 'number', example: 1 },
                        size: { type: 'number', example: 20971520 }
                      }
                    },
                    pdfs: {
                      type: 'object',
                      properties: {
                        count: { type: 'number', example: 2 },
                        size: { type: 'number', example: 10485760 }
                      }
                    },
                    documents: {
                      type: 'object',
                      properties: {
                        count: { type: 'number', example: 3 },
                        size: { type: 'number', example: 3145728 }
                      }
                    },
                    others: {
                      type: 'object',
                      properties: {
                        count: { type: 'number', example: 1 },
                        size: { type: 'number', example: 2097152 }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        
        SearchFilesResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            files: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/FileObject'
              }
            },
            count: {
              type: 'number',
              example: 2
            }
          }
        },
        
        FilesByTypeResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            files: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/FileObject'
              }
            },
            count: {
              type: 'number',
              example: 3
            },
            type: {
              type: 'string',
              example: 'images'
            }
          }
        },
        
        PendingUploadsResponse: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/FileObject'
          }
        },
        
        FileMetadataResponse: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '67df7b3f9a1b2c3d4e5f6a7d'
            },
            name: {
              type: 'string',
              example: 'annual-report-2025.pdf'
            },
            size: {
              type: 'number',
              example: 5242880
            },
            type: {
              type: 'string',
              example: 'application/pdf'
            },
            uploadedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-03-22T10:35:00.000Z'
            },
            uploadedBy: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '67df7b3f9a1b2c3d4e5f6a7b' },
                username: { type: 'string', example: 'john_doe' }
              }
            },
            storageUrl: {
              type: 'string',
              example: 'https://your-bucket.s3.us-west-002.backblazeb2.com/uploads/user-123/1742677800123-abc12345-annual-report-2025.pdf'
            },
            etag: {
              type: 'string',
              example: '5d41402abc4b2a76b9719d911017c592'
            }
          }
        },
        
        // ===== STORAGE SCHEMAS =====
        AllocateStorageRequest: {
          type: 'object',
          required: ['userId', 'storageInGB'],
          properties: {
            userId: {
              type: 'string',
              description: 'User ID to allocate storage to',
              example: '67df7b3f9a1b2c3d4e5f6a7e'
            },
            storageInGB: {
              type: 'number',
              minimum: 0.1,
              description: 'Storage amount in gigabytes',
              example: 10
            }
          }
        },
        
        AllocateStorageResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: '10GB storage allocated to jane_smith'
            },
            responsedata: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    _id: {
                      type: 'string',
                      example: '67df7b3f9a1b2c3d4e5f6a7e'
                    },
                    username: {
                      type: 'string',
                      example: 'jane_smith'
                    },
                    storageAllocated: {
                      type: 'number',
                      example: 10737418240
                    },
                    storageUsed: {
                      type: 'number',
                      example: 5242880
                    },
                    availableStorage: {
                      type: 'number',
                      example: 10732175360
                    }
                  }
                },
                admin: {
                  type: 'object',
                  properties: {
                    allocatedToUsers: {
                      type: 'number',
                      example: 10737418240
                    },
                    available: {
                      type: 'number',
                      example: 41875931136
                    }
                  }
                }
              }
            }
          }
        },
        
        UserStorageResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            responsedata: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string', example: '67df7b3f9a1b2c3d4e5f6a7e' },
                    username: { type: 'string', example: 'jane_smith' },
                    email: { type: 'string', example: 'jane@company.com' },
                    role: { type: 'string', example: 'user' }
                  }
                },
                storage: {
                  type: 'object',
                  properties: {
                    allocated: { type: 'number', example: 10737418240 },
                    used: { type: 'number', example: 5242880 },
                    available: { type: 'number', example: 10732175360 },
                    allocatedToUsers: { type: 'number', example: 0 },
                    percentage: { type: 'string', example: '0.05' },
                    fileCount: { type: 'number', example: 2 }
                  }
                }
              }
            }
          }
        },
        
        MyStorageResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            responsedata: {
              type: 'object',
              properties: {
                allocated: { type: 'number', example: 53687091200 },
                used: { type: 'number', example: 1048576 },
                available: { type: 'number', example: 52638515200 },
                allocatedToUsers: { type: 'number', example: 10737418240 },
                percentage: { type: 'string', example: '0.02' },
                fileCount: { type: 'number', example: 5 }
              }
            }
          }
        }
      }
    },
    tags: [
      { 
        name: 'Auth', 
        description: '🔐 **WORKING** - Authentication endpoints (Register, Login, Profile, OAuth)'
      },
      { 
        name: 'Users', 
        description: '👤 **WORKING** - User quota and permissions'
      },
      { 
        name: 'Files', 
        description: '📁 **WORKING** - File operations (Upload, Download, Delete, Search, Filter)'
      },
      { 
        name: 'Storage', 
        description: '💾 **WORKING** - Storage allocation and management'
      },
      { 
        name: 'Companies', 
        description: '🏢 **DISABLED** - Company management (currently commented out)'
      },
      { 
        name: 'Roles', 
        description: '🔑 **DISABLED** - Role management (currently commented out)'
      },
      { 
        name: 'Permissions', 
        description: '🔒 **DISABLED** - Permission management (currently commented out)'
      }
    ]
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);
export default specs;