---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 9
concluido_em: 2026-09-14
---

# Épico 9 — Guindaste 3D mais realista + campos de posição da lança embutidos na cena ✅ Concluído (14/09/2026)

*Pedido do Gustavo:* o modelo 3D do guindaste (Épicos 7/8) ainda é simples demais — não parece um guindaste de verdade (referências visuais enviadas: caminhão-guindaste com cabine, rodas, base/sapatas, lança em seções e moitão/gancho com padrão de risca/chevron). Além disso, os campos numéricos do painel "Posição da lança" (comprimento exato e raio de trabalho) devem sair do painel lateral e aparecer como rótulos/campos diretamente sobre o próprio desenho 3D, no ponto onde fazem sentido fisicamente.

Confirmado com o Gustavo (3 perguntas de esclarecimento, nesta sessão do Claude Desktop):
1. **Direção visual**: estilo técnico/linha (não o estilo "cartoon" laranja de outras duas referências enviadas) — paleta amarelo/preto/cinza de traço técnico, para continuar combinando com o tema HUD escuro + acentos âmbar já implementado no Épico 8, em vez de um visual ilustrativo/lúdico.
2. **Escopo**: o modelo 3D mais detalhado (cabine, rodas, base, lança em seções) vale para os **dois guindastes** (MD-300L e TM-130), ajustando as proporções conforme os dados reais de cada um.
3. **Painel "Posição da lança"**: o dropdown "Comprimento de lança — pontos reais da tabela (m)" também sai do painel lateral (não só os campos numéricos) — os 7 comprimentos reais da tabela do MD-300L passam a ser acessíveis diretamente a partir do próprio desenho 3D, não mais por um seletor separado.

## Task 9.1 — Modelo 3D mais detalhado do guindaste (linha técnica, amarelo/preto/cinza) ✅
- [x] Substituir a geometria simplificada atual (blocos/cilindros abstratos) por um modelo que pareça de fato um guindaste: cabine, chassi/base, rodas, sapatas de apoio, lança em seções visíveis (telescópica), moitão/gancho com o padrão de risca (chevron) das referências — `Caminhao`, `ParDeRodas`, `Sapata` (novos componentes) + `SegmentoLanca` com faixas de seção e chevrons no moitão, em `CenaGuindaste3D.tsx`
- [x] Paleta técnica em linha (amarelo/preto/cinza) — `COR_LANCA`, `COR_JIB`, `COR_BASE`, `COR_CHASSI`, `COR_CABINE`, `COR_RODA`, `COR_FAIXA`, mantendo os acentos âmbar de segurança e a legibilidade do tema HUD escuro do Épico 8
- [x] Aplicado aos dois guindastes (MD-300L e TM-130) — o caminhão/base fica sempre posicionado no lado -X do giro (atrás do pivot), fora do quadrante de operação da lança (+X), então nunca sobrepõe o arrasto em nenhum dos dois
- [x] Física de arrasto e câmera fixa (`CAMERA_POSICAO`/`CAMERA_ALVO`/`CAMERA_FOV`) preservadas — nenhuma mudança de interação, só visual
- [x] Confirmado que o raycasting da lança não foi afetado pelos novos detalhes visuais (rodas/cabine/chassi não têm handlers de pointer, então nunca competem no raycasting — ver nota de robustez na Task 9.2)

## Task 9.2 — Campos de posição da lança embutidos no desenho 3D (remove o painel "Posição da lança") ✅
- [x] Removido o painel lateral "Posição da lança" (dropdown de comprimento + campo de comprimento exato + campo de raio de trabalho) do MD-300L sem JIB e do TM-130 — `Simulador.tsx`. O sub-painel "Posição da lança (JIB)" continua (fora do escopo desta task: só 3 comprimentos × 3 ângulos discretos, sem arrasto contínuo).
- [x] "Comprimento (m)" agora é um campo `<Html>` sobreposto no meio da lança, girando junto com ela
- [x] "Raio de trabalho (m)" (MD-300L) / "Ângulo da lança (°)" (TM-130) agora é um campo `<Html>` sobreposto no pé da lança, sem girar com o ângulo (raio é sempre horizontal)
- [x] **Decisão de interação confirmada com o Gustavo (`AskUserQuestion`)**: marcas de encaixe visuais ao longo da lança, uma para cada um dos 7 comprimentos reais do MD-300L — arrastar longe de uma marca dá um valor livre/contínuo (decisão já tomada no Épico 8); arrastar perto de uma marca "gruda" nela (ímã, tolerância de 0,35 m); clicar direto em cima de uma marca pula exatamente para aquele valor. Implementado em `geometriaCanvas.ts` (`aplicarSnapComprimento`, testado com 5 casos reais) + `MarcaDeEncaixe` (componente visual, sem handler de pointer próprio — de propósito, para não competir no raycasting com a alça de arrasto maior por baixo) + `onPointerDownEstrutura` (clique direto já confirma o valor, com o ímã aplicado).
- [x] TM-130 não tem eixo de comprimento real (só zona×ângulo) — o campo embutido nele é só o ângulo da lança, sem marcas de encaixe (não existe uma tabela de pontos discretos de ângulo para "magnetizar").
- [x] Nenhuma mudança no motor de cálculo, no schema de dados ou nas regras de negócio — confirmado; só reposicionamento de UI, mesmos limites (`clamp`) do Épico 8.

**Bugs reais encontrados e corrigidos durante a implementação (não eram do enunciado, apareceram testando):**
1. **Digitação corrompida nos campos numéricos embutidos**: um `<input type="number">` dentro de um `<Html>` do drei sofre uma sanitização nativa do navegador — ao React reaplicar um valor intermediário inválido (ex.: `"8."`, no meio de digitar `"8.5"`) via a propriedade `.value`, o próprio input zera para `""`. Corrigido trocando para `type="text" inputMode="decimal"` nos 3 campos embutidos (Comprimento, Raio de trabalho, Ângulo) e usando `Number(e.target.value)` em vez de `e.target.valueAsNumber` no parsing (`useCampoNumericoSincronizado.ts`) — fica registrado ali como referência para qualquer campo numérico futuro dentro de uma cena 3D neste projeto.
2. **Câmera "pulava" sozinha ao arrastar o gancho ou a lança**: o objeto de config `camera={{...}}` passado ao `<Canvas>` era um literal novo a cada render — qualquer tecla digitada num campo (ou o próprio arrasto, que atualiza o estado a cada frame) fazia o R3F reaplicar posição/fov "por cima" do que o `OrbitControls` vinha calculando sozinho, os dois brigando pela câmera. Corrigido memoizando esse objeto (`useMemo`, dependências vazias) em `CenaGuindaste3D.tsx`.
3. **`OrbitControls` podia orbitar durante um arrasto da lança/gancho**: o listener nativo de pointerdown/pointermove do `OrbitControls` fica no mesmo `<canvas>` do R3F — `e.stopPropagation()` nos handlers da lança/gancho só vale dentro da árvore de eventos do R3F, não impede o listener nativo do `OrbitControls` de também reagir ao mesmo gesto (o prop `enabled` só reflete a mudança de estado no próximo render, tarde demais). Corrigido desligando `.enabled` direto via `ref` (síncrono) no `onPointerDown`/`onPointerUp` da lança e do gancho, além do prop reativo já existente.
4. **Campos embutidos podem sobrepor a área clicável da lança na tela**: dependendo do ângulo/raio, os `<Html>` de "Comprimento"/"Raio de trabalho" (DOM real, sobreposto ao canvas) podem cobrir uma faixa da lança perto do pé — um clique ali acerta o campo, não o WebGL. Não é um bug de aplicação (um usuário real vê visualmente o campo e clica ao lado, na barra amarela visível), mas exigiu ajustar os pontos de arrasto usados nos testes e2e para longe dessa faixa.

**Verificação:** 54 testes unitários (Vitest, +5 novos de `aplicarSnapComprimento`), typecheck limpo, `oxlint` sem regressões (só 2 avisos pré-existentes de `only-export-components`/`exhaustive-deps`, já presentes antes deste épico), `npm run build` ok, e os 9 specs e2e (Playwright) passando de forma estável — suíte completa rodada 2x seguidas (18/18) e os 2 testes novos/mais sensíveis a raycasting (Task 8.2 e Task 9.2) rodados 3x seguidas isoladamente (6/6) sem flakiness.

**Status:** ✅ concluído (14/09/2026, Claude Code) — modelo 3D redesenhado para os dois guindastes, painel "Posição da lança" embutido na cena com marcas de encaixe magnéticas, e 3 bugs reais de integração R3F/drei/OrbitControls corrigidos ao longo do caminho.

## Verificação final

**Verificado em 14/09/2026 (Épico 9, Claude Code):** typecheck limpo, 54 testes unitários (Vitest) e 9 specs e2e (Playwright) passando (suíte completa 2x seguidas, os 2 testes de arrasto/marca de encaixe 3x seguidas isoladas), `npm run build` e `oxlint` limpos (mesmos 2 avisos pré-existentes de antes do épico). Ver notas de bugs reais corrigidos no Épico 9 acima (digitação em campo numérico dentro de `<Html>`, câmera R3F/OrbitControls brigando pela posição, `OrbitControls` orbitando durante um arrasto customizado).

**Validado de forma independente em 14/09/2026 (Épico 9, Claude Desktop):** o Gustavo pediu para validar as atualizações do Épico 9 e atualizar a documentação. Esta sessão do Claude Desktop revisou o código (sem alterá-lo) e reexecutou a suíte completa numa cópia isolada, confirmando os números que o Claude Code já tinha registrado acima: typecheck limpo, 54/54 testes unitários, `npm run build` ok, `oxlint` com os mesmos 2 tipos de aviso pré-existentes (`only-export-components` em `CenaGuindaste3D.tsx`, e `exhaustive-deps` no `useMemo` de `posicaoJIB` — nenhum dos dois é novo nem bloqueia). Os 9 specs e2e passaram (precisou contornar, só na cópia de verificação, o mesmo achado do Chromium do Épico 8 — `channel: 'chromium'` ainda não está presente em `app/playwright.config.ts`, ver abaixo). Revisão de código confirmou, ponto a ponto: o caminhão/base fica sempre no lado -X do pivot (nunca interfere no raycasting da lança, nos dois guindastes); `aplicarSnapComprimento()` mantém o valor livre longe das marcas e só "gruda" dentro da tolerância de 0,35 m documentada; o TM-130 recebe um campo de ângulo embutido (não de comprimento/raio), coerente com não ter esse eixo na tabela real; nenhuma mudança no motor de cálculo (`engine/`) ou no schema de dados.

## Sprint (visão do backlog)

### Sprint 7 — Guindaste 3D mais realista + campos embutidos na cena (Épico 9) ✅ Concluída (14/09/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S7-01 | ✅ Modelo 3D mais detalhado do guindaste (cabine, rodas, base, lança em seções, moitão com risca), estilo técnico/linha amarelo/preto/cinza, para os dois guindastes (MD-300L e TM-130) | Alta | Task 9.1 |
| S7-02 | ✅ Remover o painel "Posição da lança" (incluindo o dropdown de comprimento) e embutir os campos de comprimento exato e raio de trabalho como rótulos sobre a própria lança, dentro do desenho 3D | Alta | Task 9.2 |

**Pronto quando**: o guindaste 3D parece de fato um guindaste (não uma forma abstrata), no estilo técnico/linha combinando com o tema HUD já existente (Épico 8), e os campos de comprimento/raio ficam embutidos no próprio desenho — sem alterar o motor de cálculo, o schema de dados ou as regras de negócio. Pedido explicitamente pelo Gustavo, com referências visuais anexadas e 3 decisões confirmadas nesta sessão do Claude Desktop (ver [[🗺️ Roadmap]], Épico 9). ✅ Atingido — 54 testes unitários + 9 e2e passando, typecheck/lint/build limpos (ver [[🗺️ Roadmap]], Épico 9).

**Ponto em aberto resolvido:** os 7 comprimentos reais da tabela do MD-300L viraram marcas de encaixe visuais ao longo da lança — decisão confirmada com o Gustavo via `AskUserQuestion` antes de codar (arrasto livre longe de uma marca, ímã perto dela, pulo exato ao clicar em cima).

**Nota de processo:** esta sprint foi levantada e esclarecida no Claude Desktop (14/09/2026) e implementada numa sessão do Claude Code no mesmo dia. Três bugs reais de integração R3F/drei/OrbitControls foram encontrados e corrigidos durante a implementação (digitação corrompida num `<input type="number">` dentro de `<Html>`, a câmera do `<Canvas>` brigando com o `OrbitControls` por um objeto de config recriado a cada render, e o `OrbitControls` podendo orbitar durante um arrasto customizado da lança/gancho) — ver [[🗺️ Roadmap]], Épico 9, para o detalhe de cada um.

## Relacionado

- [[🗺️ Roadmap]]
- Anterior: [[Épico 08 — UI industrial e arrasto do comprimento]]
- Próximo: [[Épico 10 — Dados corrigidos e motor v3]]
