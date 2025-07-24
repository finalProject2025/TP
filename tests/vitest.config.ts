import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./setup.ts']
  },
  resolve: {
    alias: {
      // Ensure crypto is treated as a Node.js built-in module
      crypto: 'crypto'
    }
  }
})