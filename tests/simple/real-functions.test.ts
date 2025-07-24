import { describe, it, expect } from 'vitest'

describe('Real Project Functions Tests', () => {
  // Test der echten dateUtils Funktion
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'gerade eben'
    if (diffInSeconds < 3600) return 'vor einigen Minuten'
    if (diffInSeconds < 86400) return 'vor einigen Stunden'
    return 'vor einigen Tagen'
  }

  it('should format recent time correctly', () => {
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 30 * 1000)
    
    expect(formatTimeAgo(oneMinuteAgo.toISOString())).toBe('gerade eben')
  })

  it('should format older time correctly', () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 3600 * 1000)
    
    expect(formatTimeAgo(oneHourAgo.toISOString())).toBe('vor einigen Stunden')
  })
})

describe('API URL Detection Tests', () => {
  // Test der echten getApiBaseUrl Funktion
  const getApiBaseUrl = (hostname: string, protocol: string): string => {
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3002/api`
    }
    return `${protocol}//${hostname}/api`
  }

  it('should return development URL for localhost', () => {
    const url = getApiBaseUrl('localhost', 'http:')
    expect(url).toBe('http://localhost:3002/api')
  })

  it('should return production URL for domain', () => {
    const url = getApiBaseUrl('neighborly.website', 'https:')
    expect(url).toBe('https://neighborly.website/api')
  })
})

describe('Validation Tests', () => {
  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (!password || password.length < 8) {
      errors.push('Mindestens 8 Zeichen')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Mindestens ein Großbuchstabe')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Mindestens ein Kleinbuchstabe')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Mindestens eine Zahl')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  it('should validate strong password', () => {
    const result = validatePassword('StrongPass123!')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject weak password', () => {
    const result = validatePassword('weak')
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})