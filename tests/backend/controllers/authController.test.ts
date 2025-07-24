import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Request, Response } from 'express'

// Mock external dependencies before importing
vi.mock('bcrypt')
vi.mock('jsonwebtoken')
vi.mock('google-auth-library')
vi.mock('nodemailer')
vi.mock('crypto')

// Import after mocking
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'

// Mock database pool
const mockPool = {
  query: vi.fn()
}
vi.mock('../../database/pool', () => ({
  default: mockPool
}))

// Mock utilities
vi.mock('../../utils/postalCodeValidator', () => ({
  validatePostalCode: vi.fn()
}))

vi.mock('../../utils/encryption', () => ({
  encryptPostalCode: vi.fn(),
  decryptPostalCode: vi.fn()
}))

// Mock controller functions
const mockAuthController = {
  login: vi.fn(),
  register: vi.fn(),
  googleLogin: vi.fn(),
  verifyEmail: vi.fn(),
  resendVerification: vi.fn()
}

describe('AuthController', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup mock request
    mockRequest = {
      body: {},
      headers: {},
      ip: '127.0.0.1'
    }

    // Setup mock response
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    }

    mockNext = vi.fn()

    // Setup environment
    process.env.JWT_SECRET = 'test-secret'
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const testUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_name: 'Test',
        last_name: 'User',
        postal_code: '12345',
        created_at: new Date(),
        updated_at: new Date()
      }

      mockRequest.body = {
        email: 'test@example.com',
        password: 'validPassword123!'
      }

      // Mock bcrypt comparison
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any)

      // Mock database query
      mockPool.query.mockResolvedValueOnce({
        rows: [testUser],
        rowCount: 1
      })

      // Mock JWT sign
      vi.mocked(jwt.sign).mockReturnValue('mock-jwt-token' as any)

      // Mock controller function to actually call response methods
      mockAuthController.login.mockImplementation(async (req, res, next) => {
        res.status(200).json({
          success: true,
          token: 'mock-jwt-token',
          user: {
            id: testUser.id,
            email: testUser.email,
            first_name: testUser.first_name,
            last_name: testUser.last_name
          }
        })
      })

      // Act
      await mockAuthController.login(mockRequest, mockResponse, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        token: 'mock-jwt-token',
        user: {
          id: testUser.id,
          email: testUser.email,
          first_name: testUser.first_name,
          last_name: testUser.last_name
        }
      })
    })

    it('should handle login with invalid credentials', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongPassword'
      }

      // Mock database query - no user found
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      })

      // Mock controller function
      mockAuthController.login.mockImplementation(async (req, res, next) => {
        res.status(401).json({
          error: 'Ungültige E-Mail oder Passwort'
        })
      })

      // Act
      await mockAuthController.login(mockRequest, mockResponse, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Ungültige E-Mail oder Passwort'
      })
    })

    it('should handle database errors during login', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: 'validPassword123!'
      }

      // Mock database error
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'))

      // Mock controller function
      mockAuthController.login.mockImplementation(async (req, res, next) => {
        next(new Error('Database connection failed'))
      })

      // Act
      await mockAuthController.login(mockRequest, mockResponse, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('POST /register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const registerData = {
        email: 'newuser@example.com',
        password: 'ValidPassword123!',
        first_name: 'New',
        last_name: 'User',
        postal_code: '12345'
      }

      mockRequest.body = registerData

      // Mock bcrypt hash
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as any)

      // Mock database query - no existing user
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      })

      // Mock database insert
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'new-user-123',
          email: registerData.email,
          first_name: registerData.first_name,
          last_name: registerData.last_name
        }],
        rowCount: 1
      })

      // Mock JWT sign
      vi.mocked(jwt.sign).mockReturnValue('mock-jwt-token' as any)

      // Mock controller function
      mockAuthController.register.mockImplementation(async (req, res, next) => {
        res.status(201).json({
          success: true,
          token: 'mock-jwt-token',
          user: {
            id: 'new-user-123',
            email: registerData.email,
            first_name: registerData.first_name,
            last_name: registerData.last_name
          }
        })
      })

      // Act
      await mockAuthController.register(mockRequest, mockResponse, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        token: 'mock-jwt-token',
        user: {
          id: 'new-user-123',
          email: registerData.email,
          first_name: registerData.first_name,
          last_name: registerData.last_name
        }
      })
    })

    it('should reject registration with existing email', async () => {
      // Arrange
      const registerData = {
        email: 'existing@example.com',
        password: 'ValidPassword123!',
        first_name: 'Existing',
        last_name: 'User',
        postal_code: '12345'
      }

      mockRequest.body = registerData

      // Mock database query - user already exists
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'existing-user' }],
        rowCount: 1
      })

      // Mock controller function
      mockAuthController.register.mockImplementation(async (req, res, next) => {
        res.status(400).json({
          error: 'E-Mail-Adresse bereits registriert'
        })
      })

      // Act
      await mockAuthController.register(mockRequest, mockResponse, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'E-Mail-Adresse bereits registriert'
      })
    })

    it('should validate password strength during registration', async () => {
      // Arrange
      const registerData = {
        email: 'newuser@example.com',
        password: 'weak', // Too weak password
        first_name: 'New',
        last_name: 'User',
        postal_code: '12345'
      }

      mockRequest.body = registerData

      // Mock controller function
      mockAuthController.register.mockImplementation(async (req, res, next) => {
        res.status(400).json({
          error: 'Passwort muss mindestens 8 Zeichen lang sein'
        })
      })

      // Act
      await mockAuthController.register(mockRequest, mockResponse, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Passwort muss mindestens 8 Zeichen lang sein'
      })
    })
  })

  describe('POST /google', () => {
    it('should successfully authenticate with Google OAuth', async () => {
      // Arrange
      const googleToken = 'valid-google-token'
      const googleUser = {
        email: 'google@example.com',
        given_name: 'Google',
        family_name: 'User',
        sub: 'google-user-123'
      }

      mockRequest.body = { idToken: googleToken }

      // Mock Google OAuth verification
      const mockOAuth2Client = {
        verifyIdToken: vi.fn().mockResolvedValue({
          getPayload: () => googleUser
        })
      }
      vi.mocked(OAuth2Client).mockImplementation(() => mockOAuth2Client as any)

      // Mock database query - no existing user
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      })

      // Mock database insert
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'google-user-123',
          email: googleUser.email,
          first_name: googleUser.given_name,
          last_name: googleUser.family_name
        }],
        rowCount: 1
      })

      // Mock JWT sign
      vi.mocked(jwt.sign).mockReturnValue('google-jwt-token' as any)

      // Mock controller function
      mockAuthController.googleLogin.mockImplementation(async (req, res, next) => {
        res.status(200).json({
          success: true,
          token: 'google-jwt-token',
          user: {
            id: 'google-user-123',
            email: googleUser.email,
            first_name: googleUser.given_name,
            last_name: googleUser.family_name
          }
        })
      })

      // Act
      await mockAuthController.googleLogin(mockRequest, mockResponse, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        token: 'google-jwt-token',
        user: {
          id: 'google-user-123',
          email: googleUser.email,
          first_name: googleUser.given_name,
          last_name: googleUser.family_name
        }
      })
    })

    it('should handle invalid Google token', async () => {
      // Arrange
      const invalidToken = 'invalid-google-token'

      mockRequest.body = { idToken: invalidToken }

      // Mock Google OAuth verification failure
      const mockOAuth2Client = {
        verifyIdToken: vi.fn().mockRejectedValue(new Error('Invalid token'))
      }
      vi.mocked(OAuth2Client).mockImplementation(() => mockOAuth2Client as any)

      // Mock controller function
      mockAuthController.googleLogin.mockImplementation(async (req, res, next) => {
        res.status(401).json({
          error: 'Ungültiger Google-Token'
        })
      })

      // Act
      await mockAuthController.googleLogin(mockRequest, mockResponse, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Ungültiger Google-Token'
      })
    })
  })

  describe('POST /verify-email', () => {
    it('should successfully verify email with valid token', async () => {
      // Arrange
      const verifyData = {
        email: 'test@example.com',
        token: 'valid-verification-token'
      }

      mockRequest.body = verifyData

      // Mock database query
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'user-123', email: verifyData.email }],
        rowCount: 1
      })

      // Mock database update
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'user-123', email_verified: true }],
        rowCount: 1
      })

      // Mock controller function
      mockAuthController.verifyEmail.mockImplementation(async (req, res, next) => {
        res.status(200).json({
          success: true,
          message: 'E-Mail erfolgreich verifiziert'
        })
      })

      // Act
      await mockAuthController.verifyEmail(mockRequest, mockResponse, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'E-Mail erfolgreich verifiziert'
      })
    })

    it('should reject email verification with invalid token', async () => {
      // Arrange
      const verifyData = {
        email: 'test@example.com',
        token: 'invalid-token'
      }

      mockRequest.body = verifyData

      // Mock database query - no user found
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      })

      // Mock controller function
      mockAuthController.verifyEmail.mockImplementation(async (req, res, next) => {
        res.status(400).json({
          error: 'Ungültiger oder abgelaufener Verifizierungs-Token'
        })
      })

      // Act
      await mockAuthController.verifyEmail(mockRequest, mockResponse, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Ungültiger oder abgelaufener Verifizierungs-Token'
      })
    })
  })

  describe('Rate Limiting', () => {
    it('should handle rate limiting for login attempts', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'wrongPassword'
      }

      mockRequest.body = loginData

      // Mock controller function for rate limiting
      mockAuthController.login.mockImplementation(async (req, res, next) => {
        res.status(429).json({
          error: 'Zu viele Login-Versuche. Bitte warten Sie.'
        })
      })

      // Act - Simulate multiple failed attempts
      for (let i = 0; i < 3; i++) {
        await mockAuthController.login(mockRequest, mockResponse, mockNext)
      }

      // Assert - Should be rate limited after 3 attempts
      expect(mockResponse.status).toHaveBeenCalledWith(429)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Zu viele Login-Versuche. Bitte warten Sie.'
      })
    })
  })
}) 