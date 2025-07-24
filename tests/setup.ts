import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import dotenv from 'dotenv'
import { vi } from 'vitest'

// Load test environment variables
dotenv.config({ path: '.env.test' })

// Mock environment variables for tests
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
process.env.DB_HOST = 'localhost'
process.env.DB_USER = 'postgres'
process.env.DB_NAME = 'neighborhelp'
process.env.DB_PASSWORD = 'password'
process.env.DB_PORT = '5432'

// Mock crypto module globally
vi.mock('crypto', () => ({
  createCipher: vi.fn(),
  createDecipher: vi.fn(),
  randomBytes: vi.fn(),
  createHash: vi.fn()
}))

// Mock other Node.js modules that might cause issues
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn()
}))

vi.mock('path', () => ({
  join: vi.fn(),
  resolve: vi.fn(),
  dirname: vi.fn(),
  basename: vi.fn()
}))

// Setup global test environment
global.console = {
  ...console,
  // Suppress console.log during tests unless needed
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
}

// Global test setup
beforeAll(async () => {
  // Setup test database connection if needed
  console.log('🧪 Test Suite Setup Started')
})

// Global test teardown
afterAll(async () => {
  // Cleanup test database connection if needed
  console.log('🧹 Test Suite Cleanup Completed')
})

// Before each test
beforeEach(async () => {
  // Reset mocks and test data
  vi.clearAllMocks()
})

// After each test
afterEach(async () => {
  // Cleanup after each test
}) 