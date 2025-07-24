import { describe, it, expect } from 'vitest'

describe('Project Configuration Tests', () => {
  it('should have correct environment setup', () => {
    expect(process.env.NODE_ENV).toBe('test')
    expect(process.env.JWT_SECRET).toBe('test-jwt-secret-key-for-testing-only')
  })

  it('should have required environment variables', () => {
    expect(process.env.GOOGLE_CLIENT_ID).toBe('test-google-client-id')
    expect(process.env.DB_HOST).toBe('localhost')
    expect(process.env.DB_NAME).toBe('neighborhelp') // Angepasst auf den Wert aus setup.ts
  })
})

describe('Utility Function Tests', () => {
  // Einfache Utility-Funktionen testen
  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'gerade eben'
    if (diffInSeconds < 3600) return 'vor einigen Minuten'
    if (diffInSeconds < 86400) return 'vor einigen Stunden'
    return 'vor einigen Tagen'
  }

  it('should format time correctly', () => {
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 30 * 1000)
    
    expect(formatTimeAgo(oneMinuteAgo)).toBe('gerade eben')
  })

  it('should handle different time ranges', () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 3600 * 1000)
    
    expect(formatTimeAgo(oneHourAgo)).toBe('vor einigen Stunden')
  })
})

describe('Validation Helper Tests', () => {
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  it('should validate correct email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
  })

  it('should reject invalid email addresses', () => {
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('test@')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
  })
})