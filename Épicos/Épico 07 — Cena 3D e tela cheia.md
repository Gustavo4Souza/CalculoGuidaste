---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 7
concluido_em: 2026-09-13
---

# Épico 7 — Redesenho de layout: visualização 3D (WebGL) e tela cheia ✅ Concluído (13/09/2026)

*Pedido do Gustavo:* o layout estava "muito simples" e precisava de uma "terceira dimensão", usando a tela inteira sem scroll de página (abas só quando um fluxo secundário precisar sair da tela principal), e o JIB (RF12) precisava aparecer melhor visualmente, já que adicionar lanças aumenta o alcance mas reduz a capacidade — e essa capacidade muda conforme o ângulo.

**Status: concluído.** Confirmado com o Gustavo (3 perguntas de esclarecimento) que: (1) "terceira dimensão" = WebGL real navegável, não só estilo 2D com sombra; (2) o fluxo principal (guindaste + cena 3D + peso/resultado) fica sempre visível numa tela só, e a busca reversa por peso (RF05/RF15) vira uma aba separada; (3) "adicionar lanças" é o **JIB que já existe** (RF12/Task 3.3) — só precisava ficar mais visível na nova UI, sem mudar o motor de cálculo, o schema de dados ou as regras de negócio.

## Task 7.1 — Migrar a cena para WebGL real (react-three-fiber) ✅ Concluído
- [x] Substituído `app/src/components/CanvasLanca.tsx` (react-konva, 2D) por `app/src/components/CenaGuindaste3D.tsx` (`@react-three/fiber` + `@react-three/drei` + `three`) — câmera em perspectiva fixa, `OrbitControls` para girar/aproximar, chão com grid para dar noção de profundidade
- [x] Mantida a mesma física/interação da Task 3.1: o gancho continua só num plano vertical fixo (RF08 — sem simulação de giro/azimute), arrastável só no ângulo de elevação; comprimento de lança continua um controle discreto à parte (Task 3.4)
- [x] Geometria pura extraída para `app/src/components/geometriaCanvas.ts` (agora em metros, não mais pixels), com testes unitários próprios (`geometriaCanvas.test.ts`)
- [x] `package.json`: removidas `react-konva`/`konva`, adicionadas `@react-three/fiber`, `@react-three/drei`, `three` (React fixado em `19.2.8` — restrição de peer dependency do `@react-three/fiber`)

## Task 7.2 — Layout em tela cheia, sem scroll de página, com abas ✅ Concluído
- [x] `App.tsx` reescrito: cabeçalho compacto + duas abas (`role="tablist"`) — "Simulação" (fluxo principal sempre visível) e "Buscar por peso" (RF05/RF15, isolada por não precisar aparecer ao mesmo tempo)
- [x] `index.css`/`App.css`: `100vh`/`100vw` sem scroll de página (`overflow: hidden` no `html/body/#root`), dashboard em grid (cena 3D + painel lateral), com fallback de rolagem interna só em telas pequenas (`@media max-width: 980px`)

## Task 7.3 — Expor o JIB (RF12) visualmente na cena 3D ✅ Concluído
- [x] Quando o JIB está ativo, a cena desenha um segundo segmento (cor distinta, laranja) preso na ponta da lança principal, com ângulo absoluto próprio (independente do ângulo da lança principal, batendo com o motor de cálculo)
- [x] Rótulos in-scene (comprimento e ângulo do JIB) e nota explicativa no painel lateral sobre o tradeoff (mais alcance, menos capacidade, capacidade também varia com o ângulo do JIB — tabela própria já existente desde a Task 3.3)
- [x] **Nenhuma mudança no motor de cálculo, no schema de dados ou nas regras de negócio** — confirmado explicitamente com o Gustavo que este épico é só de apresentação/visualização

## Task 7.4 — Testes ✅ Concluído
- [x] `e2e/simulador.spec.ts` reescrito: os dois testes de arrasto (UC02, MD-300L e TM-130) agora projetam pontos 3D exatos em pixels de tela usando a mesma câmera fixa exportada por `CenaGuindaste3D.tsx` (`three.js` + `PerspectiveCamera.project()`), em vez de assumir uma projeção 2D linear
- [x] `playwright.config.ts`: Chromium headless precisa de flags de software rendering (`--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist`) para expor WebGL nos testes
- [x] 44 testes unitários (Vitest) + 7 specs e2e (Playwright) passando, typecheck limpo, `npm run build` ok

**Pendência de limpeza manual — ✅ resolvida (13/09/2026, sessão seguinte):** `app/src/components/CanvasLanca.tsx` foi apagado (estava órfão, confirmado por busca em todo o `src/` e `e2e/` antes de remover).

**Bug real encontrado e corrigido na mesma sessão:** `playwright.config.ts` tinha um caminho de executável do Chromium **fixo e específico de Linux** (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, do ambiente onde o Claude Desktop rodou os testes) — quebrava 100% dos testes e2e no Windows do Gustavo com "executable doesn't exist". Corrigido removendo o `executablePath` fixo (Playwright resolve o binário certo por SO sozinho, desde que `npx playwright install chromium` tenha sido rodado), mantendo as flags de renderização por software (`--use-gl=swiftshader` etc.) que a cena WebGL precisa em modo headless. De quebra, o cold-start de otimização de dependências do Vite (three.js/fiber/drei são pesados) causava timeout intermitente na primeira navegação — aumentados os timeouts do Playwright (`expect: 15s`, teste: 45s) para absorver isso sem mascarar falhas reais depois. Reconfirmado: 44 testes unitários + 7 e2e passando, com a cena 3D de fato renderizando e sendo arrastada num Chromium real.

## Verificação final

**Verificado em 13/09/2026 (Épico 7):** typecheck limpo, 44 testes unitários (Vitest) e 7 specs e2e (Playwright) passando, `npm run build` ok.

## Sprint (visão do backlog)

### Sprint 5 — Redesenho de layout: 3D (WebGL) e tela cheia (Épico 7) ✅ Concluída (13/09/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S5-01 | ✅ Substituir o canvas 2D (react-konva) por uma cena WebGL real (react-three-fiber/three.js), mantendo a mesma física de arrasto (só ângulo, plano vertical fixo) | Alta | Task 7.1 |
| S5-02 | ✅ Layout em tela cheia (100vh/100vw), sem scroll de página, com abas: "Simulação" (fluxo principal sempre visível) e "Buscar por peso" (RF05/RF15, isolada) | Alta | Task 7.2 |
| S5-03 | ✅ Expor o JIB (RF12) visualmente na cena 3D — segmento com cor/ângulo próprios, rótulos, nota do tradeoff alcance×capacidade×ângulo | Média | Task 7.3 |
| S5-04 | ✅ Reescrever os testes de arrasto (e2e) para a cena 3D, com projeção exata via `three.js` | Alta | Task 7.4 |

**Pronto quando**: a tela de simulação usa toda a viewport sem scroll, tem uma visualização 3D navegável do guindaste, e o JIB aparece claramente destacado — tudo sem alterar o motor de cálculo. ✅ Atingido — 44 testes unitários + 7 e2e passando, build de produção verificado. Pedido explicitamente pelo Gustavo (layout "muito simples"), não fazia parte do roadmap original.

**Pendência de limpeza manual (fora do alcance do assistente):** apagar `app/src/components/CanvasLanca.tsx`, órfão desde a S5-01.

## Relacionado

- [[🗺️ Roadmap]]
- Anterior: [[Épico 06 — Melhorias futuras]]
- Próximo: [[Épico 08 — UI industrial e arrasto do comprimento]]
