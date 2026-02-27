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
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // ===== AUTH SCHEMAS =====
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              example: 'john_doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
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
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123'
            }
          }
        },
        
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'User registered successfully'
            },
            user: {
              type: 'object',
              properties: {
                _id: {
                  type: 'string',
                  example: '67df7b3f9a1b2c3d4e5f6a7b'
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
                  type: 'string',
                  example: '67df7b3f9a1b2c3d4e5f6a7c',
                  nullable: true
                },
                companyName: {
                  type: 'string',
                  example: "john_doe's Company",
                  nullable: true
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
                storageAllocated: {
                  type: 'number',
                  example: 53687091200
                },
                storageUsed: {
                  type: 'number',
                  example: 0
                },
                allocatedToUsers: {
                  type: 'number',
                  example: 0
                },
                authProvider: {
                  type: 'string',
                  example: 'local'
                },
                avatar: {
                  type: 'string',
                  nullable: true,
                  example: null
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-03-22T10:30:00.000Z'
                }
              }
            },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZGY3YjNmOWExYjJjM2Q0ZTVmNmE3YiIsInJvbGUiOiJhZG1pbiIsImNvbXBhbnkiOiI2N2RmN2IzZjlhMWIyYzNkNGU1ZjZhN2MiLCJpYXQiOjE3NDI2Nzc4MDAsImV4cCI6MTc0NTI2OTgwMH0.signature'
            }
          }
        },
        
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'User already exists'
            }
          }
        },
        
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Please provide username, email and password'
            }
          }
        },
        
        // ===== USER SCHEMAS =====
        UserProfileResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            user: {
              type: 'object',
              properties: {
                _id: {
                  type: 'string',
                  example: '67df7b3f9a1b2c3d4e5f6a7b'
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
                  },
                  nullable: true
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
            }
          }
        },
        
        QuotaResponse: {
          type: 'object',
          properties: {
            used: {
              type: 'number',
              example: 1048576
            },
            total: {
              type: 'number',
              example: 53687091200
            },
            available: {
              type: 'number',
              example: 52638515200
            },
            percentage: {
              type: 'number',
              example: 0.02
            },
            accountAge: {
              type: 'string',
              example: '72.5'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-03-22T10:30:00.000Z'
            }
          }
        },
        
        // ===== FILE SCHEMAS =====
        File: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '67df7b3f9a1b2c3d4e5f6a7d'
            },
            filename: {
              type: 'string',
              example: '1742677800123-abc12345-document.pdf'
            },
            originalName: {
              type: 'string',
              example: 'annual-report-2025.pdf'
            },
            size: {
              type: 'number',
              example: 5242880
            },
            mimetype: {
              type: 'string',
              example: 'application/pdf'
            },
            storageType: {
              type: 'string',
              example: 'b2'
            },
            storageKey: {
              type: 'string',
              example: 'uploads/user-123/1742677800123-abc12345-annual-report-2025.pdf'
            },
            storageUrl: {
              type: 'string',
              example: 'https://your-bucket.s3.us-west-002.backblazeb2.com/uploads/user-123/1742677800123-abc12345-annual-report-2025.pdf'
            },
            uploadStatus: {
              type: 'string',
              example: 'completed'
            },
            uploadedBy: {
              type: 'string',
              example: '67df7b3f9a1b2c3d4e5f6a7b'
            },
            company: {
              type: 'string',
              example: '67df7b3f9a1b2c3d4e5f6a7c'
            },
            isDeleted: {
              type: 'boolean',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-03-22T10:35:00.000Z'
            }
          }
        },
        
        InitUploadRequest: {
          type: 'object',
          required: ['filename', 'size', 'mimetype'],
          properties: {
            filename: {
              type: 'string',
              example: 'documents/2025/annual-report.pdf'
            },
            size: {
              type: 'number',
              example: 5242880
            },
            mimetype: {
              type: 'string',
              example: 'application/pdf'
            },
            folderPath: {
              type: 'string',
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
              example: '67df7b3f9a1b2c3d4e5f6a7d'
            },
            storageKey: {
              type: 'string',
              example: 'uploads/user-123/1742677800123-abc12345-annual-report-2025.pdf'
            },
            presignedUrl: {
              type: 'string',
              example: 'https://s3.us-west-002.backblazeb2.com/your-bucket/uploads/user-123/1742677800123-abc12345-annual-report-2025.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...'
            },
            expiresIn: {
              type: 'number',
              example: 900
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
              example: 'https://s3.us-west-002.backblazeb2.com/your-bucket/uploads/user-123/1742677800123-abc12345-annual-report-2025.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...'
            },
            filename: {
              type: 'string',
              example: 'annual-report-2025.pdf'
            },
            fileId: {
              type: 'string',
              example: '67df7b3f9a1b2c3d4e5f6a7d'
            },
            size: {
              type: 'number',
              example: 5242880
            },
            expiresIn: {
              type: 'number',
              example: 300
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
              example: '67df7b3f9a1b2c3d4e5f6a7e'
            },
            storageInGB: {
              type: 'number',
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
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Files', description: 'File upload and management endpoints' },
      { name: 'Storage', description: 'Storage allocation endpoints' },
      { name: 'Companies', description: 'Company management endpoints' },
      { name: 'Roles', description: 'Role management endpoints' }
    ]
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);
export default specs;