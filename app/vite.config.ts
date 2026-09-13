import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/ · https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Motor de cálculo é TS puro (sem DOM) — ambiente 'node' basta por enquanto.
    // Trocar para 'jsdom' (e adicionar a dependência) quando os testes de componente
    // do Épico 3 começarem.
    environment: 'node',
    globals: true,
    // e2e/ é do Playwright (test:e2e), não do Vitest.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
})
