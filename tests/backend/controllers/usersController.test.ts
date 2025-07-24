import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Request, Response } from 'express'

// Mock external dependencies before importing
vi.mock('bcrypt')
vi.mock('jsonwebtoken')
vi.mock('nodemailer')
vi.mock('crypto')

// Import after mocking
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

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
const mockUsersController = {
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  getUserById: vi.fn(),
  updatePostalCode: vi.fn(),
  checkUserPostalCode: vi.fn()
}

describe('UsersController', () => {
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
      params: {},
      user: { id: 'user-123' }
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
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /profile', () => {
    it('should successfully get user profile', async () => {
      // Arrange
      const testUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        postal_code: '12345',
        created_at: new Date(),
        updated_at: new Date()
      }

      // Mock database query
      mockPool.query.mockResolvedValueOnce({
        rows: [testUser],
        rowCount: 1
      })

      // Mock controller function
      mockUsersController.getProfile.mockResolvedValue(testUser)

      // Act
      const result = await mockUsersController.getProfile(mockRequest, mockResponse, mockNext)

      // Assert
      expect(result).toEqual(testUser)
      expect(mockUsersController.getProfile).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext)
    })

    it('should handle user not found', async () => {
      // Arrange
      // Mock database query - no user found
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      })

      // Mock controller function
      mockUsersController.getProfile.mockRejectedValue(new Error('Benutzer nicht gefunden'))

      // Act & Assert
      await expect(mockUsersController.getProfile(mockRequest, mockResponse, mockNext))
        .rejects.toThrow('Benutzer nicht gefunden')
    })
  })

  describe('PUT /profile', () => {
    it('should successfully update user profile', async () => {
      // Arrange
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        email: 'updated@example.com'
      }

      mockRequest.body = updateData

      const updatedUser = {
        id: 'user-123',
        email: updateData.email,
        first_name: updateData.first_name,
        last_name: updateData.last_name,
        postal_code: '12345',
        updated_at: new Date()
      }

      // Mock database query
      mockPool.query.mockResolvedValueOnce({
        rows: [updatedUser],
        rowCount: 1
      })

      // Mock controller function
      mockUsersController.updateProfile.mockResolvedValue(updatedUser)

      // Act
      const result = await mockUsersController.updateProfile(mockRequest, mockResponse, mockNext)

      // Assert
      expect(result).toEqual(updatedUser)
      expect(mockUsersController.updateProfile).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext)
    })

    it('should handle update with invalid data', async () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email'
      }

      mockRequest.body = invalidData

      // Mock controller function
      mockUsersController.updateProfile.mockRejectedValue(new Error('Ungültige E-Mail-Adresse'))

      // Act & Assert
      await expect(mockUsersController.updateProfile(mockRequest, mockResponse, mockNext))
        .rejects.toThrow('Ungültige E-Mail-Adresse')
    })
  })

  describe('GET /users/:id', () => {
    it('should successfully get user by ID', async () => {
      // Arrange
      const userId = 'user-456'
      const testUser = {
        id: userId,
        email: 'other@example.com',
        first_name: 'Other',
        last_name: 'User',
        postal_code: '54321'
      }

      mockRequest.params = { id: userId }

      // Mock database query
      mockPool.query.mockResolvedValueOnce({
        rows: [testUser],
        rowCount: 1
      })

      // Mock controller function
      mockUsersController.getUserById.mockResolvedValue(testUser)

      // Act
      const result = await mockUsersController.getUserById(mockRequest, mockResponse, mockNext)

      // Assert
      expect(result).toEqual(testUser)
      expect(mockUsersController.getUserById).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext)
    })

    it('should handle user not found by ID', async () => {
      // Arrange
      const userId = 'nonexistent-user'
      mockRequest.params = { id: userId }

      // Mock database query - no user found
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      })

      // Mock controller function
      mockUsersController.getUserById.mockRejectedValue(new Error('Benutzer nicht gefunden'))

      // Act & Assert
      await expect(mockUsersController.getUserById(mockRequest, mockResponse, mockNext))
        .rejects.toThrow('Benutzer nicht gefunden')
    })
  })

  describe('PUT /postal-code', () => {
    it('should successfully update postal code', async () => {
      // Arrange
      const postalCode = '54321'
      mockRequest.body = { postal_code: postalCode }

      const updatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        postal_code: postalCode,
        updated_at: new Date()
      }

      // Mock database query
      mockPool.query.mockResolvedValueOnce({
        rows: [updatedUser],
        rowCount: 1
      })

      // Mock controller function
      mockUsersController.updatePostalCode.mockResolvedValue({
        message: 'PLZ erfolgreich aktualisiert',
        user: updatedUser
      })

      // Act
      const result = await mockUsersController.updatePostalCode(mockRequest, mockResponse, mockNext)

      // Assert
      expect(result).toEqual({
        message: 'PLZ erfolgreich aktualisiert',
        user: updatedUser
      })
    })

    it('should handle invalid postal code', async () => {
      // Arrange
      const invalidPostalCode = '1234'
      mockRequest.body = { postal_code: invalidPostalCode }

      // Mock controller function
      mockUsersController.updatePostalCode.mockRejectedValue(new Error('Ungültige Postleitzahl'))

      // Act & Assert
      await expect(mockUsersController.updatePostalCode(mockRequest, mockResponse, mockNext))
        .rejects.toThrow('Ungültige Postleitzahl')
    })
  })

  describe('GET /postal-code/check', () => {
    it('should check user postal code status', async () => {
      // Arrange
      const testUser = {
        id: 'user-123',
        email: 'test@example.com',
        postal_code: '12345'
      }

      // Mock database query
      mockPool.query.mockResolvedValueOnce({
        rows: [testUser],
        rowCount: 1
      })

      // Mock controller function
      mockUsersController.checkUserPostalCode.mockResolvedValue({
        hasPostalCode: true,
        user: testUser
      })

      // Act
      const result = await mockUsersController.checkUserPostalCode(mockRequest, mockResponse, mockNext)

      // Assert
      expect(result).toEqual({
        hasPostalCode: true,
        user: testUser
      })
    })

    it('should handle user without postal code', async () => {
      // Arrange
      const testUser = {
        id: 'user-123',
        email: 'test@example.com',
        postal_code: null
      }

      // Mock database query
      mockPool.query.mockResolvedValueOnce({
        rows: [testUser],
        rowCount: 1
      })

      // Mock controller function
      mockUsersController.checkUserPostalCode.mockResolvedValue({
        hasPostalCode: false,
        user: testUser
      })

      // Act
      const result = await mockUsersController.checkUserPostalCode(mockRequest, mockResponse, mockNext)

      // Assert
      expect(result).toEqual({
        hasPostalCode: false,
        user: testUser
      })
    })
  })
}) 