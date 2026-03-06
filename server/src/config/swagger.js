// Phase 6.9: Swagger/OpenAPI Configuration
import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ILM Learning Center API',
      version: '1.0.0',
      description: 'API documentation for ILM Learning Center - University Management System',
      contact: {
        name: 'ILM Support',
        email: 'admin@ilm.edu.ph'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string', example: 'STU-20250001' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['SUPER_ADMIN', 'REGISTRAR', 'TEACHER', 'STUDENT'] },
            mustChangePassword: { type: 'boolean' },
            profileComplete: { type: 'boolean' }
          }
        },
        Profile: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            middleName: { type: 'string' },
            gender: { type: 'string', enum: ['MALE', 'FEMALE'] },
            phone: { type: 'string' },
            address: { type: 'string' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['userId', 'password'],
          properties: {
            userId: { type: 'string', example: 'STU-20250001' },
            password: { type: 'string', format: 'password' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'integer', example: 900 },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        PaymentProof: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            enrollmentType: { type: 'string', enum: ['course', 'program'] },
            enrollmentId: { type: 'string' },
            imageUrl: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        ProgressOverview: {
          type: 'object',
          properties: {
            totalCourses: { type: 'integer' },
            completedCourses: { type: 'integer' },
            courseCompletionRate: { type: 'number' },
            totalPrograms: { type: 'integer' },
            completedPrograms: { type: 'integer' },
            attendanceRate: { type: 'number' },
            averageGPA: { type: 'number' },
            certificatesEarned: { type: 'integer' },
            currentStreak: { type: 'integer' },
            longestStreak: { type: 'integer' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Notifications', description: 'Notification system' },
      { name: 'Payments', description: 'Payment proof uploads' },
      { name: 'Progress', description: 'Student progress tracking' },
      { name: 'Reports', description: 'PDF report generation' },
      { name: 'Health', description: 'System health checks' }
    ]
  },
  apis: ['./src/routes/*.js', './src/index.js']
}

export const swaggerSpec = swaggerJsdoc(options)
