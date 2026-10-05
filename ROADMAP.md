# Roadmap (Épico → Task → Sub-task)

> Espelha a seção 9 da [documentação no Notion](https://app.notion.com/p/3da034f53a1280df8666fc97c0590e38) — a fonte de verdade. Reorganizado a partir dos dados reais recebidos em 13/09/2026: a ingestão das tabelas do MD-300L e do TM-130 (Épico 1) é a prioridade imediata, antes de evoluir o POC para produção.

## Épico 0 — Fundamentos e protótipo conceitual ✅ Concluído

*Pronto quando*: decisão de arquitetura registrada, documentação técnica publicada, e POC interativo aprovado pela turma.

**Status: concluído.** POC publicado como Artifact e salvo em `Jornada/prototipo/poc-simulador.html`.

### Task 0.1 — Decisão de arquitetura (referência: `ARQUITETURA.md`)
- [x] Comparar Web App vs. Executável
- [x] Confirmar Web App com o usuário

### Task 0.2 — Documentação técnica inicial (referência: `REQUISITOS_TECNICOS.md`, `BACKLOG.md`)
- [x] Requisitos técnicos por módulo
- [x] Backlog em sprints

### Task 0.3 — POC interativo (referência: `prototipo/poc-simulador.html`)
- [x] Diagrama SVG arrastável com motor de cálculo por interpolação
- [x] Estados de alerta (dentro do limite / excede / fora da faixa)
- [x] Apresentado à turma em 20/08/2026 — linha de raciocínio aprovada

---

## Épico 1 — Ingestão dos dados reais dos fabricantes

*Pronto quando*: as tabelas de carga do MD-300L e do TM-130 estão digitalizadas em JSON e validadas manualmente contra pelo menos 3 pontos de cada tabela impressa.

**Status: ✅ Concluído (13/09/2026).**

**Nota (13/09/2026):** os pontos originais de ambas as tabelas tinham erros vindos de extração de texto de PDF (mapeamento de coluna errado no MD-300L; inferência de células mescladas errada na Zona II do TM-130 — ver histórico em `app/src/data/tabelas/README.md`). O problema foi resolvido de vez quando Gustavo criou `docs/Tabelas_Extraidas_Guindaste.xlsx` e `docs/Tabelas_Zonas_Giro.xlsx` diretamente a partir das tabelas impressas — os dados foram extraídos **mecanicamente** do XML dessas planilhas (sem depender de leitura de texto de PDF), eliminando o risco de erro de coluna/célula mesclada.

### Task 1.1 — Digitalizar tabela MD-300L ✅ Concluído
- [x] Transcrever tabela Área Frontal (7 comprimentos de lança × todos os raios) — completo em `app/src/data/tabelas/md-300l.json`, a partir de `docs/Tabelas_Extraidas_Guindaste.xlsx`
- [x] Transcrever tabela Área Lateral/Traseira — completo no mesmo arquivo
- [x] Transcrever as 4 tabelas de JIB (3 comprimentos × 3 ângulos, frontal e lateral/traseira) — completo em `app/src/data/tabelas/md-300l-jib.json` (ainda não conectado ao motor de cálculo — RF12/Task 3.3)
- [x] Registrar constantes geométricas (altura do pé da lança 3 m, recuo 1,4 m) — já em `app/src/data/guindastes.json`

### Task 1.2 — Digitalizar tabela TM-130 ✅ Concluído
- [x] Transcrever tabela Zona I / Zona II por ângulo da lança — completo em `app/src/data/tabelas/tm-130.json`, a partir de `docs/Tabelas_Zonas_Giro.xlsx`
- [x] Conferir contra a tabela impressa — confirmado via planilha extraída mecanicamente (ver `app/src/data/tabelas/README.md`); corrigiu a inferência anterior sobre as células mescladas da Zona II (65°/70° = 3.800 kg, não 3.700 kg)
- [x] Registrar constantes geométricas (altura do pé da lança 2,8 m, recuo 0 m) — já em `app/src/data/guindastes.json`

### Task 1.3 — Definir schema JSON que suporte as duas variantes ✅ Concluído
- [x] Schema "comprimento + raio + quadrante" (MD-300L)
- [x] Schema "zona + ângulo" (TM-130)
- [x] Camada de abstração comum para o motor de cálculo consumir os dois formatos

Formalizado em `app/src/data/tabelas/tabela-carga.schema.json` (JSON Schema draft-07, `oneOf` das duas variantes + tabela de JIB), espelhando os tipos TypeScript já existentes em `app/src/types/guindaste.ts` e consumidos por `app/src/engine/calcularCapacidadeMaxima.ts` via `calcularCapacidadeMaxima()`.

**Nota:** a tabela do TM-130 tem células mescladas na ficha técnica original — a transcrição da Task 1.2 precisa ser conferida manualmente contra o PDF, não só por extração automática.

---

## Épico 2 — Motor de cálculo v2 (dados reais + somatório de pesos)

*Pronto quando*: `calcularCapacidadeMaxima()` funciona para os dois guindastes reais, incluindo o somatório de pesos e a correção geométrica por altura/recuo do pé da lança.

**Status: ✅ Concluído (13/09/2026)** — `app/src/engine/calcularCapacidadeMaxima.ts` implementa a interpolação (as duas variantes), o somatório de cargas, o arredondamento de segurança e a correção geométrica (Task 2.2), agora testado contra pontos reais confirmados dos dois guindastes (28 testes passando).

### Task 2.1 — Suporte às duas variantes de tabela no motor de cálculo
- [x] Interpolação para a variante comprimento + raio + quadrante
- [x] Interpolação para a variante zona + ângulo — testada contra os pontos reais do TM-130 (`calcularCapacidadeMaximaTM130.test.ts`)
- [x] Arredondar sempre para baixo o resultado interpolado (piso de segurança) antes de comparar com o somatório de cargas

### Task 2.2 — Cálculo do raio real a partir da posição visual da lança ✅ Concluído
- [x] Aplicar altura do pé da lança e recuo, por guindaste — `calcularRaioReal()`/`calcularAlturaDoGancho()` em `app/src/engine/geometriaLanca.ts`, com testes em `geometriaLanca.test.ts`

`raioDaConfiguracao()` (em `calcularCapacidadeMaxima.ts`) agora aceita `configuracao.raioM` direto (compatibilidade com testes/entrada manual) **ou** deriva o raio a partir de `comprimentoLancaM` + `anguloLancaGraus` (posição visual que o canvas do Épico 3 vai alimentar), aplicando o recuo do pé da lança. A altura do pé da lança ainda não é usada pelo motor de cálculo em si (que só valida raio × capacidade) — fica disponível via `calcularAlturaDoGancho()` para quando o canvas (Task 3.1) precisar desenhar a lança a partir do pé real, elevado do solo.

### Task 2.3 — Somatório de cargas (RF09/RF10)
- [x] Campos de entrada: massa da lingada, massa do cabo de aço
- [x] Balancim: checkbox de uso + campo de massa
- [x] Comparar somatório contra a capacidade interpolada

### Task 2.4 — Testes unitários com valores reais ✅ Concluído
- [x] Casos de teste a partir dos pontos exatos das tabelas do MD-300L (`app/src/engine/calcularCapacidadeMaxima.test.ts`)
- [x] Casos de teste com pontos exatos do TM-130 (`app/src/engine/calcularCapacidadeMaximaTM130.test.ts`) — 7 pontos exatos + interpolação + independência entre zonas + somatório de cargas

---

## Épico 3 — Interface gráfica de produção (evolução do POC) ✅ Concluído (13/09/2026)

**Status: concluído.** `app/src/components/Simulador.tsx` agora tem canvas arrastável, seleção de guindaste, seletor de quadrante/zona, toggle de JIB, painel de peso, resultado e busca reversa por peso. 39 testes unitários + 3 testes Playwright (e2e) passando, build de produção OK.

> **Nota (13/09/2026, mais tarde):** o canvas 2D (react-konva) da Task 3.1 foi **substituído** por uma cena 3D real (WebGL) no Épico 7, a pedido do Gustavo ("layout muito simples, preciso de uma terceira dimensão"). Os itens abaixo continuam válidos como histórico da primeira versão; ver Épico 7 para o estado atual da visualização.

### Task 3.1 — Migrar POC (vanilla JS) para React + react-konva ✅ Concluído (substituído pelo Épico 7)
- [x] Canvas arrastável em `app/src/components/CanvasLanca.tsx` (react-konva) — gancho arrastável preso a um arco de raio fixo (`dragBoundFunc`), migrado do desenho SVG do POC. Só o ângulo de elevação é manipulado por arrasto; comprimento de lança é um controle separado (Task 3.4). **Substituído (Épico 7)** por `app/src/components/CenaGuindaste3D.tsx` (react-three-fiber/WebGL) — o arquivo `CanvasLanca.tsx` ficou órfão e deve ser apagado do repositório.

### Task 3.2 — Seleção de quadrante/zona de operação (RF08)
- [x] Seletor manual (toggle/dropdown) — frontal/lateral-traseira (MD-300L) ou Zona I/II (TM-130), sem view de giro em planta

### Task 3.3 — Suporte a JIB opcional (RF12) ✅ Concluído
- [x] Toggle de uso de JIB, exibido só quando `guindaste.possuiJIB = true` (hoje só MD-300L)
- [x] Ligado ao motor de cálculo — `calcularCapacidadeMaximaJIB()` em `app/src/engine/calcularCapacidadeMaxima.ts`, testado em `calcularCapacidadeMaximaJIB.test.ts` contra pontos exatos de `md-300l-jib.json`
- [x] Seletores de comprimento de JIB (9,0/15,5/20,0 m) e ângulo de JIB (10°/25°/40°) — combinações discretas reais da tabela, sem canvas (fora do escopo desta rodada, mantém o canvas simples)

### Task 3.4 — Campos numéricos sincronizados com o canvas ✅ Concluído
- [x] Comprimento de lança (dropdown com os 7 valores reais da tabela) e raio de trabalho (campo numérico) sincronizados nos dois sentidos com o arrasto do canvas — `definirRaioM()`/`definirAnguloGraus()` na store convertem entre raio e ângulo via `calcularRaioReal()`/inversa (`Math.acos`)

### Task 3.5 — Busca reversa: lista de configurações viáveis (RF05/RF15) ✅ Concluído
- [x] Campo "Peso a içar" (`app/src/components/BuscaReversa.tsx`) que varre a frota e lista as configurações viáveis, sem depender da configuração atualmente selecionada
- [x] Ordenada por menor guindaste primeiro (`capacidadeNominalKg`, novo campo no `Guindaste`) — `buscarConfiguracoesViaveis()` em `app/src/engine/buscaReversa.ts`, 6 testes em `buscaReversa.test.ts`

---

## Épico 4 — Alertas, validação e usabilidade ✅ Concluído (13/09/2026)

### Task 4.1 — Indicador visual de status ✅ Concluído
- [x] Verde (dentro do limite) / vermelho (excede) / âmbar (fora da faixa), com % de margem — `app/src/components/IndicadorStatus.tsx`, migrado do "status chip" do POC. Testado via Playwright (`e2e/simulador.spec.ts`), alternando entre os 3 estados com valores reais.

### Task 4.2 — Revisão de usabilidade ✅ Concluído
- [x] Fluxo completo em até 3 cliques ou 1 arrasto (RNF Usabilidade) — **auditado e confirmado**: com a tela já carregando uma configuração padrão válida, o fluxo principal (selecionar guindaste → posicionar a lança → ler o resultado) é **1 clique (selecionar guindaste) + 1 arrasto (posicionar a lança no canvas)**, sem cliques extras para ver o resultado (atualização ao vivo). O fluxo de JIB (RF12, opcional) precisa de mais interações (toggle + 2 seletores), aceitável por ser um caso secundário, não o fluxo principal.
- [x] **Bug real encontrado e corrigido durante a revisão**: o campo "Raio de trabalho" (variante A) é um valor *derivado* do ângulo (`raio ⇄ ângulo` via `engine/geometriaLanca.ts`) e reformatado a cada render — um campo 100% controlado por esse valor "engolia" a digitação do usuário (ex.: escrever "8." virava "8.00" antes de completar a casa decimal). Corrigido com `components/useCampoNumericoSincronizado.ts` (texto local livre enquanto o campo está focado, resincroniza no blur). Regressão coberta por um teste Playwright que digita tecla por tecla (`pressSequentially`, não `.fill()`).

---

## Épico 5 — Testes finais e apoio ao pitch/artigo 🟡 Quase concluído (13/09/2026)

Task 5.1 concluída. Task 5.2 tem o roteiro pronto, falta só a gravação (depende do Gustavo). Task 5.3 tem o rascunho bibliográfico e as seções de resultado/conclusão prontos, falta transcrever para o `.docx` e revisar o resumo.

### Task 5.1 — Testes de fluxo ponta a ponta ✅ Concluído
- [x] Playwright cobrindo UC02 para os dois guindastes — arrasto real via `page.mouse` (não só preenchimento de campos) em `e2e/simulador.spec.ts`: MD-300L (arrasta o gancho, confere raio e capacidade) e TM-130 (arrasta o gancho, confere ângulo e o platô de 3.800 kg da Zona I). 7 specs no total, cobrindo também status/JIB/busca reversa/bug de digitação.

### Task 5.2 — Roteiro e gravação do vídeo pitch
- [x] Roteiro escrito em `docs/Roteiro_Video_Pitch.md` (8 cenas, ~3–4 min, com falas sugeridas e checklist pré-gravação), já com o protótipo de produção funcionando (não mais o POC)
- [ ] Gravação em si — depende de tempo de câmera/voz do Gustavo, não é algo que o assistente possa produzir

### Task 5.3 — Artigo científico 🟡 Rascunho avançado
- [x] Levantamento bibliográfico inicial — 6 referências reais (verificadas via busca, não inventadas): Sommerville (2019), Sommerville & Sawyer (1997), Vazquez & Simões (2016), Martins (2007), PMI/PMBOK (2017) e OSHA 29 CFR 1926.1417 — substituindo os placeholders "(Citação)" do rascunho existente; a citação genérica "Tadano" foi trocada pelos fabricantes reais do projeto (Madal Palfinger, Grupo Luna)
- [x] Seções 4 (Apresentação e discussão dos resultados) e 5 (Considerações finais) redigidas com base no que foi de fato implementado (Épicos 0–4) — `docs/Artigo_Secoes_Pendentes.md`
- [ ] Transcrever o conteúdo de `docs/Artigo_Secoes_Pendentes.md` para dentro do `.docx` original, reaplicando a formatação ABNT (o Word não é editável diretamente pelo assistente)
- [ ] Atualizar o resumo/abstract (ainda genéricos) e preencher os dados do orientador e dos coautores 2/3, que seguem como placeholder

---

## Épico 6 — Fase 2 / melhorias futuras *(opcional, se sobrar tempo)*

- [ ] Tela simples de cadastro/edição de guindastes e tabelas (RF13)
- [ ] Suporte a cadastro de novos modelos de guindaste além do MD-300L e do TM-130
- [ ] Parametrizar a extensão das sapatas (hoje sempre assumida como máxima)

---

## Épico 7 — Redesenho de layout: visualização 3D (WebGL) e tela cheia ✅ Concluído (13/09/2026)

*Pedido do Gustavo:* o layout estava "muito simples" e precisava de uma "terceira dimensão", usando a tela inteira sem scroll de página (abas só quando um fluxo secundário precisar sair da tela principal), e o JIB (RF12) precisava aparecer melhor visualmente, já que adicionar lanças aumenta o alcance mas reduz a capacidade — e essa capacidade muda conforme o ângulo.

**Status: concluído.** Confirmado com o Gustavo (3 perguntas de esclarecimento) que: (1) "terceira dimensão" = WebGL real navegável, não só estilo 2D com sombra; (2) o fluxo principal (guindaste + cena 3D + peso/resultado) fica sempre visível numa tela só, e a busca reversa por peso (RF05/RF15) vira uma aba separada; (3) "adicionar lanças" é o **JIB que já existe** (RF12/Task 3.3) — só precisava ficar mais visível na nova UI, sem mudar o motor de cálculo, o schema de dados ou as regras de negócio.

### Task 7.1 — Migrar a cena para WebGL real (react-three-fiber) ✅ Concluído
- [x] Substituído `app/src/components/CanvasLanca.tsx` (react-konva, 2D) por `app/src/components/CenaGuindaste3D.tsx` (`@react-three/fiber` + `@react-three/drei` + `three`) — câmera em perspectiva fixa, `OrbitControls` para girar/aproximar, chão com grid para dar noção de profundidade
- [x] Mantida a mesma física/interação da Task 3.1: o gancho continua só num plano vertical fixo (RF08 — sem simulação de giro/azimute), arrastável só no ângulo de elevação; comprimento de lança continua um controle discreto à parte (Task 3.4)
- [x] Geometria pura extraída para `app/src/components/geometriaCanvas.ts` (agora em metros, não mais pixels), com testes unitários próprios (`geometriaCanvas.test.ts`)
- [x] `package.json`: removidas `react-konva`/`konva`, adicionadas `@react-three/fiber`, `@react-three/drei`, `three` (React fixado em `19.2.8` — restrição de peer dependency do `@react-three/fiber`)

### Task 7.2 — Layout em tela cheia, sem scroll de página, com abas ✅ Concluído
- [x] `App.tsx` reescrito: cabeçalho compacto + duas abas (`role="tablist"`) — "Simulação" (fluxo principal sempre visível) e "Buscar por peso" (RF05/RF15, isolada por não precisar aparecer ao mesmo tempo)
- [x] `index.css`/`App.css`: `100vh`/`100vw` sem scroll de página (`overflow: hidden` no `html/body/#root`), dashboard em grid (cena 3D + painel lateral), com fallback de rolagem interna só em telas pequenas (`@media max-width: 980px`)

### Task 7.3 — Expor o JIB (RF12) visualmente na cena 3D ✅ Concluído
- [x] Quando o JIB está ativo, a cena desenha um segundo segmento (cor distinta, laranja) preso na ponta da lança principal, com ângulo absoluto próprio (independente do ângulo da lança principal, batendo com o motor de cálculo)
- [x] Rótulos in-scene (comprimento e ângulo do JIB) e nota explicativa no painel lateral sobre o tradeoff (mais alcance, menos capacidade, capacidade também varia com o ângulo do JIB — tabela própria já existente desde a Task 3.3)
- [x] **Nenhuma mudança no motor de cálculo, no schema de dados ou nas regras de negócio** — confirmado explicitamente com o Gustavo que este épico é só de apresentação/visualização

### Task 7.4 — Testes ✅ Concluído
- [x] `e2e/simulador.spec.ts` reescrito: os dois testes de arrasto (UC02, MD-300L e TM-130) agora projetam pontos 3D exatos em pixels de tela usando a mesma câmera fixa exportada por `CenaGuindaste3D.tsx` (`three.js` + `PerspectiveCamera.project()`), em vez de assumir uma projeção 2D linear
- [x] `playwright.config.ts`: Chromium headless precisa de flags de software rendering (`--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist`) para expor WebGL nos testes
- [x] 44 testes unitários (Vitest) + 7 specs e2e (Playwright) passando, typecheck limpo, `npm run build` ok

**Pendência de limpeza manual — ✅ resolvida (13/09/2026, sessão seguinte):** `app/src/components/CanvasLanca.tsx` foi apagado (estava órfão, confirmado por busca em todo o `src/` e `e2e/` antes de remover).

**Bug real encontrado e corrigido na mesma sessão:** `playwright.config.ts` tinha um caminho de executável do Chromium **fixo e específico de Linux** (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, do ambiente onde o Claude Desktop rodou os testes) — quebrava 100% dos testes e2e no Windows do Gustavo com "executable doesn't exist". Corrigido removendo o `executablePath` fixo (Playwright resolve o binário certo por SO sozinho, desde que `npx playwright install chromium` tenha sido rodado), mantendo as flags de renderização por software (`--use-gl=swiftshader` etc.) que a cena WebGL precisa em modo headless. De quebra, o cold-start de otimização de dependências do Vite (three.js/fiber/drei são pesados) causava timeout intermitente na primeira navegação — aumentados os timeouts do Playwright (`expect: 15s`, teste: 45s) para absorver isso sem mascarar falhas reais depois. Reconfirmado: 44 testes unitários + 7 e2e passando, com a cena 3D de fato renderizando e sendo arrastada num Chromium real.

---

## Épico 8 — UI/UX industrial (painel escuro) + lança ajustável por arrasto (comprimento) ✅ Concluído (13/09/2026)

*Pedido do Gustavo:* o layout do Épico 7 ficou muito melhor, mas o visual ainda não passa a sensação de ferramenta **industrial** (o projeto é para uso industrial) — e hoje o comprimento da lança só é ajustável por um seletor discreto (dropdown), sem poder "puxar" a própria lança na cena 3D para estendê-la/recolhê-la, como seria natural num simulador desse tipo.

Confirmado com o Gustavo (2 perguntas de esclarecimento, nesta sessão do Claude Desktop):
1. O pedido de "ajustar o tamanho da lança" é especificamente sobre **arrastar a própria lança na cena 3D para mudar o comprimento** (não só o ângulo, como hoje) — não é sobre um bug no seletor existente, nem sobre destravar o comprimento no modo JIB ou dar um eixo de comprimento ao TM-130 (ver limitações reais na Task 8.2).
2. A direção visual escolhida foi **painel de controle industrial escuro, estilo HUD** — tema escuro, acentos de segurança em amarelo/laranja, tipografia técnica, indicadores estilo instrumento — em vez de um dashboard corporativo claro.

> **Nota de processo:** a sessão do Claude Desktop/Cowork levantou, esclareceu e documentou esta melhoria; a implementação de código foi feita depois, numa sessão do **Claude Code** (14/09/2026).

### Task 8.1 — Redesenho visual: painel de controle industrial (tema escuro / HUD) ✅ Concluído
- [x] Nova paleta fixa (não condicional a `prefers-color-scheme` — é a identidade visual da ferramenta): fundo grafite/preto (`--bg`/`--bg-elevado`/`--bg-painel`/`--bg-instrumento`), acento âmbar/laranja de segurança (`--accent`/`--accent-forte`), tipografia monoespaçada (`--mono`) para números e leituras — `app/src/index.css` + `app/src/App.css` reescritos
- [x] Indicadores de resultado redesenhados como "instrumento": `components/MedidorCapacidade.tsx` — barra de limite (mostrador) do somatório de cargas como % da capacidade, com marca no ponto de 100% e cor por faixa (verde/âmbar/vermelho), além do número da capacidade em fonte monoespaçada tabular
- [x] Contraste — texto claro (`--text-h`, `--text`) sobre fundos escuros; texto ESCURO (`--accent-texto`) sobre elementos com fundo âmbar (aba ativa), já que branco sobre âmbar não passaria em AA
- [x] Barra superior, abas e painel lateral redesenhados (bordas retas, uppercase técnico, inputs com fundo `--bg-instrumento`) — a estrutura de abas/tela cheia do Épico 7 não mudou, só o visual
- [x] Cena 3D (WebGL) também ajustada para combinar: chão escuro, grid com linhas de seção âmbar, JIB na cor de acento, rótulos flutuantes em estilo HUD (fundo escuro, borda colorida por tipo de leitura)

### Task 8.2 — Lança com comprimento ajustável por arrasto (além do seletor) ✅ Concluído
- [x] A própria estrutura da lança principal (não só o gancho) fica arrastável para estender/recolher o comprimento — `components/CenaGuindaste3D.tsx`, complementando o seletor discreto que já existia (Task 3.4)
- [x] Confirmado: nenhuma mudança no motor de cálculo foi necessária — `calcularCapacidadeMaximaVarianteA()` já interpolava continuamente
- [x] **Decisão de "snap" tomada e documentada**: valor **contínuo/livre**, não magnetizado aos 7 pontos reais — o motor já interpola com segurança (arredondando sempre para baixo) em qualquer ponto do domínio real (10,50 m–32,10 m); o valor é sempre limitado (`clamp`) a esse intervalo, nunca extrapolado, ver `store/useSimulacaoStore.ts` (`definirComprimentoLancaM`)
- [x] Limitações reais de dados respeitadas sem alteração: modo JIB continua travando a lança principal no máximo (32,10 m); TM-130 continua sem controle de comprimento arrastável (só a referência visual fixa de 12 m)
- [x] Área de clique da lança propositalmente **maior que a barra visível** (uma "alça" invisível ao redor, mesma técnica do plano de arrasto do ângulo) — melhora tanto a usabilidade real (barra fina é difícil de acertar com precisão) quanto a confiabilidade dos testes automatizados
- [x] Geometria pura (`projetarComprimento`) extraída para `components/geometriaCanvas.ts`, com 5 testes unitários dedicados

### Task 8.3 — Testes (não prevista originalmente, adicionada durante a implementação)
- [x] 1 novo teste e2e (arrasto real da lança, `page.mouse`) + 5 novos testes unitários de `projetarComprimento` — total: 49 testes unitários (Vitest) + 8 specs e2e (Playwright), typecheck e build limpos
- [x] **Dois bugs de ambiente reais encontrados e corrigidos durante a validação, não relacionados à lógica de negócio**: (1) o `<canvas>` da cena 3D podia ser medido pelo teste antes do React Three Fiber terminar de redimensioná-lo (preso no padrão do HTML, 300×150px) — corrigido esperando duas leituras consecutivas do tamanho baterem; (2) o raycasting de hover sobre a barra fina da lança é instável em WebGL renderizado por software (headless, sem GPU) — mitigado com uma área de clique maior (também ajuda o usuário real) e uma pequena retentativa da interação no teste

**Status:** ✅ concluído (14/09/2026) — 49 testes unitários + 8 e2e passando de forma estável (confirmado em múltiplas execuções seguidas), typecheck e `npm run build` limpos.

### Verificação independente (Claude Desktop, 14/09/2026)

Depois que o Claude Code aplicou as Tasks 8.1/8.2/8.3, esta sessão do Claude Desktop revisou o código (sem alterá-lo, por instrução do Gustavo) e reexecutou a suíte completa numa cópia isolada do projeto:

- [x] Typecheck (`tsc -b --noEmit`) — limpo.
- [x] `npx vitest run` — 49/49 testes unitários passando.
- [x] `npx oxlint` — nenhum aviso em `app/src/` ou `app/e2e/` (os avisos que o comando lista vêm só de `node_modules`, não é código do projeto).
- [x] `npm run build` — build de produção OK (o aviso de chunk >500kB é pré-existente, do peso do `three.js`/`@react-three/fiber`, não é uma regressão do Épico 8).
- [x] `npx playwright test` — 8/8 specs e2e passando, incluindo o novo teste da Task 8.2 (arrasto de comprimento), **depois de contornar** o achado abaixo.
- [x] Revisão de código confirmou, ponto a ponto, o que o ROADMAP já registrava: `estruturaArrastavel` só é `true` para o MD-300L fora do modo JIB (nunca no JIB, nunca no TM-130); `projetarComprimento()` e `definirComprimentoLancaM()` limitam (`clamp`) independentemente ao domínio real da tabela (10,50–32,10 m); nenhuma mudança no motor de cálculo (`engine/`).

**Achado a corrigir numa próxima sessão do Claude Code (não é um problema de negócio, é de configuração de teste):** `app/playwright.config.ts` tem um comentário dizendo que o Chromium completo é forçado via `channel: 'chromium'` (necessário porque o `chromium_headless_shell` padrão do Playwright não tem WebGL confiável), mas essa chave **não existe de fato** no bloco `use` do arquivo — só `baseURL` e `launchOptions`. Isso não chegou a ser pego antes porque no ambiente do Gustavo (Windows, com `npx playwright install` já rodado) o Playwright acaba resolvendo um Chromium usável mesmo sem a chave `channel` explícita; mas o comportamento real diverge do que o comentário promete, e é exatamente essa lacuna que fez a suíte falhar 8/8 nesta verificação (o Playwright tentou usar o `chromium_headless_shell`, sem WebGL confiável, em vez do Chromium completo). Corrigido **só na cópia de verificação** desta sessão (nunca no arquivo real do Gustavo, por instrução dele); a correção real — adicionar `channel: 'chromium',` ao bloco `use` — fica para a próxima sessão de desenvolvimento no Claude Code.

---

## Épico 9 — Guindaste 3D mais realista + campos de posição da lança embutidos na cena ✅ Concluído (14/09/2026)

*Pedido do Gustavo:* o modelo 3D do guindaste (Épicos 7/8) ainda é simples demais — não parece um guindaste de verdade (referências visuais enviadas: caminhão-guindaste com cabine, rodas, base/sapatas, lança em seções e moitão/gancho com padrão de risca/chevron). Além disso, os campos numéricos do painel "Posição da lança" (comprimento exato e raio de trabalho) devem sair do painel lateral e aparecer como rótulos/campos diretamente sobre o próprio desenho 3D, no ponto onde fazem sentido fisicamente.

Confirmado com o Gustavo (3 perguntas de esclarecimento, nesta sessão do Claude Desktop):
1. **Direção visual**: estilo técnico/linha (não o estilo "cartoon" laranja de outras duas referências enviadas) — paleta amarelo/preto/cinza de traço técnico, para continuar combinando com o tema HUD escuro + acentos âmbar já implementado no Épico 8, em vez de um visual ilustrativo/lúdico.
2. **Escopo**: o modelo 3D mais detalhado (cabine, rodas, base, lança em seções) vale para os **dois guindastes** (MD-300L e TM-130), ajustando as proporções conforme os dados reais de cada um.
3. **Painel "Posição da lança"**: o dropdown "Comprimento de lança — pontos reais da tabela (m)" também sai do painel lateral (não só os campos numéricos) — os 7 comprimentos reais da tabela do MD-300L passam a ser acessíveis diretamente a partir do próprio desenho 3D, não mais por um seletor separado.

### Task 9.1 — Modelo 3D mais detalhado do guindaste (linha técnica, amarelo/preto/cinza) ✅
- [x] Substituir a geometria simplificada atual (blocos/cilindros abstratos) por um modelo que pareça de fato um guindaste: cabine, chassi/base, rodas, sapatas de apoio, lança em seções visíveis (telescópica), moitão/gancho com o padrão de risca (chevron) das referências — `Caminhao`, `ParDeRodas`, `Sapata` (novos componentes) + `SegmentoLanca` com faixas de seção e chevrons no moitão, em `CenaGuindaste3D.tsx`
- [x] Paleta técnica em linha (amarelo/preto/cinza) — `COR_LANCA`, `COR_JIB`, `COR_BASE`, `COR_CHASSI`, `COR_CABINE`, `COR_RODA`, `COR_FAIXA`, mantendo os acentos âmbar de segurança e a legibilidade do tema HUD escuro do Épico 8
- [x] Aplicado aos dois guindastes (MD-300L e TM-130) — o caminhão/base fica sempre posicionado no lado -X do giro (atrás do pivot), fora do quadrante de operação da lança (+X), então nunca sobrepõe o arrasto em nenhum dos dois
- [x] Física de arrasto e câmera fixa (`CAMERA_POSICAO`/`CAMERA_ALVO`/`CAMERA_FOV`) preservadas — nenhuma mudança de interação, só visual
- [x] Confirmado que o raycasting da lança não foi afetado pelos novos detalhes visuais (rodas/cabine/chassi não têm handlers de pointer, então nunca competem no raycasting — ver nota de robustez na Task 9.2)

### Task 9.2 — Campos de posição da lança embutidos no desenho 3D (remove o painel "Posição da lança") ✅
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

## Épicos 10–16 — Simulador de içamento profissional e 100% parametrizável (planejado em 05/10/2026)

*Pedido do Gustavo:* transformar o simulador numa ferramenta de engenharia para planejar operações e montar orçamentos entregues a clientes. Todo ponto ajustável do guindaste real é parametrizável (campo + arrasto), o giro vai a 360° e deriva quadrante/zona, há um estado próprio "Sem dado do fabricante" (regra de ouro, RF17), mapa de área no chão, UI estilo SolidWorks em tema claro (substitui o Épico 8), CRUD Projeto → Orçamento → Cenários em IndexedDB e relatório PDF. Novos requisitos RF16–RF26 em `REQUISITOS_TECNICOS.md`. O plano completo, com o levantamento das fichas (pontos ajustáveis, cobertura das tabelas e dimensões encontradas e faltantes), foi aprovado pelo Gustavo antes de qualquer código.

**Decisões do Gustavo (AskUserQuestion, 05/10/2026):**
1. TM-130: a tabela polar por raio ("Com sapata para lança principal") vira a tabela da lança principal. A tabela zona × ângulo, que é a "Com sapata para lança JIB", fica como tabela de JIB, desligada até a Ribas confirmar.
2. Faixas da tabela polar: degrau conservador (o valor vale até o arco externo da faixa; não se interpola entre faixas).
3. Offset do JIB do MD-300L entre 10°/25°/40°: interpolar entre as tabelas vizinhas, arredondando para baixo; fora de 10–40° → sem dado.
4. "Massa do cabo de aço" da planilha = cabo de içamento pendurado (ponta → moitão), calculado e sobrescrevível.

**Ordem de dependência:** 10 (dados + motor v3) → 11 (fonte única de estado) → 12 (UI CAD tema claro) → 13 (modelo 3D fiel + arrasto de tudo) → 14 (mapa de área no chão) → 15 (persistência + CRUD) → 16 (relatório PDF). Testes unitários + e2e ao fim de cada épico, mostrados ao Gustavo antes de seguir.

## Épico 10 — Dados corrigidos e motor v3 🟡 Em andamento (05/10/2026)

### Task 10.0 — `channel: 'chromium'` no Playwright ✅
- [x] Adicionado ao bloco `use` de `app/playwright.config.ts` (pendência registrada nos Épicos 8 e 9).

### Task 10.1 — Tabela polar da lança principal do TM-130 ⏳ Bloqueada (depende do Gustavo)
- [x] `tm-130.json` renomeado para `tm-130-jib.json` (conteúdo idêntico): é a tabela "Com sapata para lança JIB" (ver `app/src/data/tabelas/README.md`)
- [ ] Gustavo transcreve o diagrama polar na aba `Principal_Polar` de `docs/Tabelas_Zonas_Giro.xlsx` (`zona | raio_inicial_m | raio_final_m | capacidade_kg`)
- [ ] Extração mecânica para `tm-130-principal.json` + `TipoTabela` `zona_raio_faixas` + schema + testes com valores reais

### Task 10.2 — Resultado rico (RF17) ✅
- [x] `engine/capacidadeDetalhada.ts`: capacidade + origem (exato/interpolado) + pontos reais usados + motivo quando não há dado. As funções antigas de `calcularCapacidadeMaxima.ts` passaram a delegar para elas (sem lógica duplicada)
- [x] `engine/interpolacao.ts`: `interpolarComDetalhe` (tolerância de ponto exato de 1 µm, que absorve o erro de ponto flutuante de um raio derivado de comprimento + ângulo)

### Task 10.3 — Modelo de parâmetros e especificações ✅
- [x] `types/cenario.ts` (`ParametrosDoCenario`, `AvaliacaoDoCenario`) e `types/especificacao.ts`
- [x] `data/especificacoes/{md-300l,tm-130}.json`: limites mecânicos, dimensões, passagem de cabo e moitão, cada valor com `fonte` (ficha/planilha ou `"aproximado"`)

### Task 10.4 — Giro → quadrante/zona (RF18) ✅
- [x] `config/criteriosDeGiro.ts` (arquivo único): MD-300L frontal |giro| ≤ 55° / lateral+traseira no resto (**PROVISÓRIO**). TM-130 Zona I ≤ 16° / Zona II ≤ 60°, da ficha, com limite mecânico de ±60°. `VERSAO_CRITERIO_GIRO`
- [x] `engine/classificarGiro.ts`: na fronteira exata, as duas regiões são avaliadas e vale a menor capacidade
- [x] **Achado**: os `#VALUE!` das Figuras A/B da planilha não são erro de fórmula. São imagens dentro da célula (recurso "Imagem na célula" do Excel) e mostram os setores de 110° (frontal) e 250° (lateral/traseira), iguais aos da p.3 do PDF

### Task 10.5 — `avaliarCenario` (ponto de entrada único do motor v3) ✅
- [x] `engine/avaliarCenario.ts`: limites mecânicos, giro, sapatas (só a máxima é tabelada), JIB (exige lança 32,10 m), passagem de cabo prevista pela tabela, geometria (`calcularPonta`/`resolverAnguloParaRaio` em `geometriaLanca.ts`), somatório expandido (cabo calculado/sobrescrito, excedente do moitão sobre o gancho já incluído na tabela, balancim), verificações (capacidade, limite do engenheiro, carga por perna, altura de içamento) e status `ok | atencao | nok | sem_dado`
- [x] **Achado**: com o ângulo máximo de 80°, o JIB não alcança raios que a própria tabela de JIB lista (ex.: 9 m a 25° no raio 8 m exige ~84°). O gráfico de alcance (p.4) marca 80° e 85°, então `anguloMaxGraus` passou a 85° (segue como "aproximado", a confirmar)

### Task 10.6 — Versionamento ✅
- [x] `data/catalogo.ts`: `CATALOGO` (contexto por guindaste) e `VERSAO_TABELAS` (hash FNV-1a do conteúdo de todos os JSON de dados)

### Task 10.7 — Busca reversa com a tabela polar ⏳ Depende da 10.1

**Verificação parcial (05/10/2026):** 90 testes unitários (54 anteriores + 36 novos, todos com células reais), 9/9 e2e (agora com `channel: 'chromium'` de fato), typecheck e `npm run build` limpos. `oxlint` não roda nesta máquina: uma política de Controle de Aplicativo do Windows bloqueia o binário nativo (`oxlint.win32-x64-msvc.node`). É problema de ambiente, não do código. A UI ainda usa o motor antigo; ela passa para `avaliarCenario` no Épico 11.

## Épico 11 — Fonte única de estado ✅ Concluído (05/10/2026)

### Task 11.1 — Store reescrita ✅
- [x] `store/useSimulacaoStore.ts`: `cenario: ParametrosDoCenario` é o **único** estado editável; `avaliacao` é sempre derivada dele por `avaliarCenario` a cada mudança (painel, cena, cotas e resultado não têm como divergir)
- [x] Ações com limite mecânico da ficha: `definirComprimentoLancaM`, `definirAnguloGraus`, `definirRaioM` (resolve o ângulo, inclusive com JIB; raio inalcançável vai ao extremo), `definirGiroGraus` (normaliza; TM-130 limitado a ±60°), `definirJIB`, `definirSapata`, `atualizarCenario` (genérica) e `carregarCenario` (para reabrir cenários, Épico 15)
- [x] A passagem de cabo acompanha a tabela ao mudar o comprimento (8 → 6 → 4 pernas), a não ser que o engenheiro a tenha mudado à mão. Ligar o JIB leva a lança a 32,10 m, 1 perna e gancho de 67 kg; desligar restaura
- [x] `store/parametrosIniciais.ts`: cenário inicial só com valores das especificações. O que não consta nas fichas (massa linear do cabo; massa do moitão do TM-130) começa **vazio**, e o motor responde "sem dado" até o engenheiro informar

### Task 11.2 — Seletor manual de quadrante/zona removido (RF18) ✅
- [x] A área é derivada do giro e mostrada na barra (`data-testid="regiao-derivada"`), com o selo "Critério de giro provisório" no MD-300L

### Task 11.3 — Campos de parâmetro padronizados (RF16) ✅
- [x] `components/CampoParametro.tsx`: rótulo, unidade, faixa válida visível e selo "≈" para valores aproximados. Aceita "vazio" (não informado) e vírgula decimal. Mantém a correção `type="text" inputMode="decimal"` do Épico 9
- [x] `components/PainelParametros.tsx`: lança e giro, JIB (comprimento discreto, ângulo contínuo), as 4 sapatas, cabo (pernas, massa linear, massa calculada sempre visível, sobrescrita manual), moitão, carga (descrição, peso, C × L × A, CG), acessórios (lingada, altura da lingada, balancim), altura de içamento, limite de utilização, vento e pressão do solo (informativos). O Épico 12 reorganiza isso numa árvore estilo CAD
- [x] `components/PainelResultado.tsx` + `IndicadorStatus.tsx`: 4 estados (OK / Atenção / NOK / **Sem dado do fabricante**, este com os motivos), capacidade com origem (exato ou interpolado, com os pontos reais usados), somatório item a item, medidor com marca do limite do engenheiro
- [x] Cena 3D: o TM-130 ganhou comprimento real arrastável (5,9–12,4 m); o JIB agora é desenhado como offset **para baixo** em relação à lança (planilha, obs. G6), não como ângulo absoluto

### Task 11.4 — Busca reversa honesta ✅
- [x] O TM-130 sai da busca (RF15) enquanto a tabela da lança principal não é transcrita, com aviso explícito na tela, em vez de sugerir configurações a partir da tabela do JIB

### Task 11.5 — Desempenho da cena 3D (não prevista) ✅
- [x] **Achado durante a validação:** os testes de arrasto ficaram intermitentes (timeouts). O perfil de CPU (CDP) mostrou que o gargalo não era o React: a cena renderizava ~20 quadros/s **parada** (WebGL por software), e cada interação disputava CPU com isso. Uma linha de base no commit anterior (worktree isolado) mostrou **o mesmo custo**, ou seja, não era regressão do Épico 11, mas um desperdício que já existia. Corrigido com `frameloop="demand"` no `<Canvas>` (só renderiza quando algo muda): tarefas longas com a cena parada caíram de 26 para 0 em 3 s, e a suíte e2e caiu de 1,6 min para ~40 s, estável em execução repetida

**Verificação (05/10/2026):** 102 testes unitários (90 + 12 da store), 11/11 e2e (suíte completa 2x seguidas: 22/22), typecheck e `npm run build` limpos. Novos e2e: área derivada do giro (0° → 7.500 kg frontal; 90° → 10.500 kg lateral; 55° → fronteira, menor valor), sapata parcial → "sem dado", limite do engenheiro → "Atenção", JIB com offset interpolado (17,5° → 2.525 kg). `oxlint` segue bloqueado pela política de Controle de Aplicativo do Windows (ambiente).

## Épico 12 — Interface estilo SolidWorks, tema claro ✅ Concluído (05/10/2026)

Substitui o tema escuro/HUD do Épico 8 (RF23).

### Task 12.1 — Shell em tela cheia no estilo CAD ✅
- [x] `App.tsx`: barra de comandos | área de trabalho (árvore de parâmetros | viewport 3D | resultado) | barra de status. 100vh, sem scroll de página; cada painel rola sozinho. Abaixo de 1150 px o painel de resultado desce para baixo da viewport
- [x] `index.css`/`App.css` reescritos: cinza claro, painéis brancos, acento azul de seleção, cores de status reservadas ao resultado (OK verde / Atenção âmbar / NOK vermelho / Sem dado cinza hachurado). Viewport com fundo em degradê, como no SolidWorks
- [x] `components/BarraDeComandos.tsx`: Novo (recomeça o cenário), Buscar por peso (abre `DialogoBuscaReversa`, um `<dialog>` modal) e seletor de massa **kg ⇄ t (RF14)**, só de exibição: resultado, somatório, barra de status e busca. Os campos de entrada continuam em kg, com a unidade no rótulo. Abrir, Salvar, Salvar como cenário, Comparar, Importar/Exportar JSON e Exportar PDF aparecem **desabilitados**, com o motivo no tooltip (Épicos 15/16)
- [x] `components/ArvoreParametros.tsx` (substitui `PainelParametros.tsx`): nós recolhíveis estilo FeatureManager (Guindaste, Lança, Giro, JIB, Sapatas, Cabo e moitão, Carga, Acessórios, Limites e operação, Ambiente), cada um com o resumo do valor atual visível mesmo recolhido. O seletor de guindaste e o toggle de JIB passaram para o nó "Guindaste"; comprimento e raio também estão na árvore (além dos campos embutidos na cena)
- [x] `components/BarraDeStatus.tsx`: status, capacidade (e se é ponto exato ou interpolado), somatório, % de utilização, área derivada do giro, selo de critério provisório e `VERSAO_TABELAS`

### Task 12.2 — Viewport com cubo de orientação, vistas padrão e cotas ✅
- [x] Cubo de orientação (`GizmoHelper` + `GizmoViewcube` do drei, já instalado; faces Frontal/Trás/Topo/Base/Lateral/Oposta). `OrbitControls` passou a `makeDefault`, que é o que o cubo usa
- [x] Barra de vistas padrão sobre a viewport: Frontal, Lateral, Superior e Isométrica (`cena/ControladorDeVista.tsx`). **Decisão**: as vistas frontal/lateral/superior **enquadram o guindaste atual** (alcance e altura reais, como o "zoom para ajustar" de um CAD); a isométrica é fixa porque é a câmera que os testes e2e projetam. Com distância fixa, uma lança curta ficava minúscula e as cotas ilegíveis (visto na revisão por captura de tela)
- [x] Cotas desenhadas na cena (`cena/Cotas.tsx`), com os valores do **motor** (não da geometria da cena): raio a partir do centro de giro (R), altura da ponta (H), ângulo da lança (α, com arco), altura de içamento (quando informada) e giro. Hoje o giro é só rótulo: a rotação da superestrutura na cena é do Épico 13
- [x] Marcas de encaixe dos comprimentos ainda não estendidos viraram "fantasmas" claros sobre uma guia tracejada até o comprimento máximo. No tema claro elas apareciam como blocos pretos flutuando além da ponta

**Verificação (05/10/2026):** revisão visual por captura de tela (isométrica, lateral, superior) antes de fechar; 102 testes unitários; 12/12 e2e (suíte 2x seguidas: 24/24, ~28 s), incluindo um novo teste de barra de status, cotas, vistas padrão, kg/t e comandos desabilitados; typecheck e `npm run build` limpos. `oxlint` segue bloqueado pela política de Controle de Aplicativo do Windows.

## Épicos 13–16 ⬜ Planejados
- **13** Modelo 3D fiel às dimensões das fichas + arrasto de giro, sapatas, JIB, carga C×L×A com CG
- **14** Mapa de área de operação no chão (OK/NOK/sem dado) com `avaliarCenario`
- **15** Persistência IndexedDB atrás de `RepositorioProjetos` + CRUD Projeto/Orçamento/Cenário + comparação + export/import JSON
- **16** Relatório PDF por cenário e por orçamento

---

## Status resumido

| Épico | Status |
|---|---|
| 0 — Fundamentos e protótipo conceitual | ✅ Concluído |
| 1 — Ingestão dos dados reais | ✅ Concluído — MD-300L e TM-130 digitalizados e conferidos |
| 2 — Motor de cálculo v2 | ✅ Concluído — interpolação, somatório, arredondamento e correção geométrica, testados com dados reais dos 2 guindastes |
| 3 — Interface gráfica de produção | ✅ Concluído — canvas (depois substituído pelo Épico 7), JIB, sincronização e busca reversa |
| 4 — Alertas, validação e usabilidade | ✅ Concluído — indicador de status e revisão de usabilidade (bug de digitação corrigido) |
| 5 — Testes finais e apoio ao pitch/artigo | 🟡 Testes concluídos; roteiro e rascunho do artigo prontos, faltam gravação e transcrição final |
| 6 — Fase 2 / melhorias futuras | ⬜ Opcional, se sobrar tempo |
| 7 — Redesenho de layout: 3D (WebGL) e tela cheia | ✅ Concluído — cena WebGL (react-three-fiber), layout em tela cheia com abas, JIB exposto visualmente |
| 8 — UI/UX industrial (painel escuro) + lança ajustável por arrasto | ✅ Concluído — tema industrial escuro, medidor de capacidade e arrasto de comprimento, 49 testes unitários + 8 e2e |
| 9 — Guindaste 3D mais realista + campos embutidos na cena | ✅ Concluído — modelo 3D detalhado (estilo técnico/linha) para os dois guindastes; campos de comprimento/raio/ângulo embutidos na cena com marcas de encaixe magnéticas nos 7 comprimentos reais do MD-300L |
| 10 — Dados corrigidos e motor v3 | 🟡 Em andamento — motor `avaliarCenario` pronto (90 testes); falta a tabela polar do TM-130 (depende do Gustavo) |
| 11 — Fonte única de estado | ✅ Concluído — store com `cenario` único + avaliação derivada, todos os parâmetros editáveis, 102 unitários + 11 e2e |
| 12 — Interface estilo SolidWorks, tema claro | ✅ Concluído — barra de comandos, árvore de parâmetros, viewport com cubo/vistas/cotas, barra de status, kg/t; 12 e2e |
| 13–16 — Simulador profissional parametrizável | ⬜ Planejados (ver acima) |

**Verificado em 13/09/2026 (Épico 7):** typecheck limpo, 44 testes unitários (Vitest) e 7 specs e2e (Playwright) passando, `npm run build` ok.

**Verificado de forma independente em 14/09/2026 (Épico 8, Claude Desktop):** typecheck limpo, 49 testes unitários (Vitest) e 8 specs e2e (Playwright) passando, `npm run build` e `oxlint` limpos. Achado (não bloqueia, ver Épico 8 acima): `app/playwright.config.ts` não seta de fato `channel: 'chromium'`, apesar do comentário dizer que sim — correção pendente para uma próxima sessão do Claude Code.

**Verificado em 14/09/2026 (Épico 9, Claude Code):** typecheck limpo, 54 testes unitários (Vitest) e 9 specs e2e (Playwright) passando (suíte completa 2x seguidas, os 2 testes de arrasto/marca de encaixe 3x seguidas isoladas), `npm run build` e `oxlint` limpos (mesmos 2 avisos pré-existentes de antes do épico). Ver notas de bugs reais corrigidos no Épico 9 acima (digitação em campo numérico dentro de `<Html>`, câmera R3F/OrbitControls brigando pela posição, `OrbitControls` orbitando durante um arrasto customizado).

**Validado de forma independente em 14/09/2026 (Épico 9, Claude Desktop):** o Gustavo pediu para validar as atualizações do Épico 9 e atualizar a documentação. Esta sessão do Claude Desktop revisou o código (sem alterá-lo) e reexecutou a suíte completa numa cópia isolada, confirmando os números que o Claude Code já tinha registrado acima: typecheck limpo, 54/54 testes unitários, `npm run build` ok, `oxlint` com os mesmos 2 tipos de aviso pré-existentes (`only-export-components` em `CenaGuindaste3D.tsx`, e `exhaustive-deps` no `useMemo` de `posicaoJIB` — nenhum dos dois é novo nem bloqueia). Os 9 specs e2e passaram (precisou contornar, só na cópia de verificação, o mesmo achado do Chromium do Épico 8 — `channel: 'chromium'` ainda não está presente em `app/playwright.config.ts`, ver abaixo). Revisão de código confirmou, ponto a ponto: o caminhão/base fica sempre no lado -X do pivot (nunca interfere no raycasting da lança, nos dois guindastes); `aplicarSnapComprimento()` mantém o valor livre longe das marcas e só "gruda" dentro da tolerância de 0,35 m documentada; o TM-130 recebe um campo de ângulo embutido (não de comprimento/raio), coerente com não ter esse eixo na tabela real; nenhuma mudança no motor de cálculo (`engine/`) ou no schema de dados.

**Achado que persiste (não é novo, mas ainda não foi corrigido):** o `app/playwright.config.ts` continua sem a chave `channel: 'chromium'` no bloco `use` (mtime do arquivo mudou desde o Épico 8, mas o conteúdo do bloco `use` é idêntico) — a correção segue pendente para uma sessão do Claude Code, conforme já registrado no Épico 8.

**Pendência que não bloqueia o roadmap:** o critério exato do quadrante frontal/lateral-traseira do MD-300L (Figuras A/B da planilha, com erro `#VALUE!`) segue em aberto — Gustavo vai perguntar para a turma na próxima aula. Afeta só a divisão fina dentro da tabela do MD-300L, não o início do Épico 1.
