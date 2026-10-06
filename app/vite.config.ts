import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/ · https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Pré-empacota TODAS as dependências de runtime já na partida do dev server.
    // Sem isso, uma dependência "descoberta" no meio da sessão (foi o caso do
    // `idb`, Épico 15) faz o Vite refazer o pré-empacotamento e responder
    // "504 (Outdated Optimize Dep)" para as abas já abertas — que só se
    // recuperam se o WebSocket do HMR estiver funcionando (bug de 06/10/2026).
    // Dependência nova de runtime no package.json? Acrescente aqui também.
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-dev-runtime',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'zustand',
      'idb',
      'jspdf',
      'jspdf-autotable',
    ],
  },
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
