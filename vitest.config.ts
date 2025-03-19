import { vi } from 'vitest'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"]
  },
})