import { defineConfig } from '@playwright/test'

// Testes de fluxo ponta a ponta (Épico 5, Task 5.1) — hoje só um smoke test
// básico; UC02 completo (arrasto no canvas) entra quando o Épico 3 estiver pronto.
export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  use: {
    baseURL: 'http://localhost:5173',
  },
})
