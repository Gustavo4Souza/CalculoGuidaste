import { defineConfig } from '@playwright/test'

// Testes de fluxo ponta a ponta (Épico 5, Task 5.1) — cobrem UC01/UC02/UC03
// para os dois guindastes, JIB (RF12) e busca reversa (RF15).
export default defineConfig({
  testDir: './e2e',
  // A primeira navegação após `npm install`/reinício do dev server paga o
  // custo do Vite pré-otimizar a dependência pesada de three.js/fiber/drei
  // (pode passar de 5s no cold start) — timeouts maiores evitam flakiness
  // nessa primeira carga, sem mascarar uma falha real depois.
  timeout: 45_000,
  expect: { timeout: 15_000 },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  use: {
    baseURL: 'http://localhost:5173',
    // A cena do guindaste agora é WebGL real (react-three-fiber/three.js,
    // Épico 3 → layout 3D). O "chromium_headless_shell" (padrão do
    // Playwright para performance) não tem suporte WebGL confiável — por
    // isso forçamos o Chromium completo (channel "chromium", instalado via
    // `npx playwright install chromium`), com renderizador de software.
    // Sem caminho de executável fixo: o binário certo para o SO de quem
    // rodar os testes é resolvido pelo próprio Playwright (chromium, o
    // browser padrão do projeto — instalar com `npx playwright install
    // chromium` caso ainda não esteja em cache).
    launchOptions: {
      args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
    },
  },
})
