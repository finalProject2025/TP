import { describe, it, expect } from 'vitest'

describe('Basic Tests', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle strings', () => {
    expect('hello').toBe('hello')
  })

  it('should handle arrays', () => {
    expect([1, 2, 3]).toHaveLength(3)
  })

  it('should handle objects', () => {
    const obj = { name: 'test', value: 42 }
    expect(obj.name).toBe('test')
    expect(obj.value).toBe(42)
  })
})

describe('Math Tests', () => {
  it('should add numbers correctly', () => {
    expect(2 + 3).toBe(5)
  })

  it('should multiply numbers correctly', () => {
    expect(4 * 5).toBe(20)
  })
})