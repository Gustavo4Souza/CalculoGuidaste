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

## Épico 9 — Guindaste 3D mais realista + campos de posição da lança embutidos na cena 🔲 Não iniciado (14/09/2026)

*Pedido do Gustavo:* o modelo 3D do guindaste (Épicos 7/8) ainda é simples demais — não parece um guindaste de verdade (referências visuais enviadas: caminhão-guindaste com cabine, rodas, base/sapatas, lança em seções e moitão/gancho com padrão de risca/chevron). Além disso, os campos numéricos do painel "Posição da lança" (comprimento exato e raio de trabalho) devem sair do painel lateral e aparecer como rótulos/campos diretamente sobre o próprio desenho 3D, no ponto onde fazem sentido fisicamente.

Confirmado com o Gustavo (3 perguntas de esclarecimento, nesta sessão do Claude Desktop):
1. **Direção visual**: estilo técnico/linha (não o estilo "cartoon" laranja de outras duas referências enviadas) — paleta amarelo/preto/cinza de traço técnico, para continuar combinando com o tema HUD escuro + acentos âmbar já implementado no Épico 8, em vez de um visual ilustrativo/lúdico.
2. **Escopo**: o modelo 3D mais detalhado (cabine, rodas, base, lança em seções) vale para os **dois guindastes** (MD-300L e TM-130), ajustando as proporções conforme os dados reais de cada um.
3. **Painel "Posição da lança"**: o dropdown "Comprimento de lança — pontos reais da tabela (m)" também sai do painel lateral (não só os campos numéricos) — os 7 comprimentos reais da tabela do MD-300L passam a ser acessíveis diretamente a partir do próprio desenho 3D, não mais por um seletor separado.

### Task 9.1 — Modelo 3D mais detalhado do guindaste (linha técnica, amarelo/preto/cinza)
- [ ] Substituir a geometria simplificada atual (blocos/cilindros abstratos) por um modelo que pareça de fato um guindaste: cabine, chassi/base, rodas, sapatas de apoio, lança em seções visíveis (telescópica), moitão/gancho com o padrão de risca (chevron) das referências
- [ ] Paleta técnica em linha (amarelo/preto/cinza), mantendo os acentos âmbar de segurança e a legibilidade do tema HUD escuro do Épico 8 — não é uma mudança de tema, só de nível de detalhe do modelo
- [ ] Aplicar aos dois guindastes (MD-300L e TM-130), com proporções ajustadas aos dados reais de cada um (comprimento de lança, altura/recuo do pé da lança já existentes em `guindastes.json`)
- [ ] Preservar toda a física de arrasto existente (ângulo — Épico 3/7 —, e comprimento — Épico 8) e a mesma câmera fixa usada pelos testes e2e (`CAMERA_POSICAO`/`CAMERA_ALVO`/`CAMERA_FOV` exportados por `CenaGuindaste3D.tsx`) — é um redesenho visual, não uma mudança de interação
- [ ] **Atenção para os testes existentes**: `e2e/simulador.spec.ts` projeta pontos 3D exatos em pixels de tela a partir da geometria da lança (`pontaDaLanca`/`projetarComprimento`) — qualquer novo detalhe visual (cabine, rodas etc.) não pode interferir no raycasting da lança nem na projeção usada pelos testes

### Task 9.2 — Campos de posição da lança embutidos no desenho 3D (remove o painel "Posição da lança")
- [ ] Remover o painel lateral "Posição da lança" (dropdown de comprimento + campo de comprimento exato + campo de raio de trabalho)
- [ ] "Comprimento exato" passa a ser um rótulo/campo sobreposto no meio da lança, na própria cena 3D
- [ ] "Raio de trabalho" passa a ser um rótulo/campo sobreposto no pé da lança (onde ela começa), na própria cena 3D
- [ ] Os 7 comprimentos reais da tabela do MD-300L (hoje no dropdown) precisam continuar acessíveis de alguma forma diretamente no desenho 3D (ex.: marcas/pontos de encaixe ao longo da lança) — **decisão de interação em aberto**: fica para quem for implementar propor e confirmar com o Gustavo antes de codar, mantendo o valor sempre dentro do domínio real (10,50–32,10 m) e sem mascarar que o motor de cálculo interpola com segurança fora dos 7 pontos exatos (mesma regra já documentada no Épico 8)
- [ ] Conferir se algo equivalente faz sentido para o TM-130 (que não tem eixo de comprimento de lança na tabela real, só zona×ângulo) — provavelmente um rótulo de ângulo da lança no lugar do raio, a confirmar durante a implementação
- [ ] **Nenhuma mudança esperada no motor de cálculo, no schema de dados ou nas regras de negócio** — é só reposicionamento de UI; os valores e os limites (`clamp`) continuam os mesmos do Épico 8

**Status:** 🔲 não iniciado (14/09/2026) — levantado e esclarecido com o Gustavo no Claude Desktop; implementação fica para uma sessão do Claude Code.

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
| 9 — Guindaste 3D mais realista + campos embutidos na cena | ⬜ Não iniciado — modelo 3D detalhado (estilo técnico/linha) para os dois guindastes; campos de comprimento/raio saem do painel e vão para dentro do desenho 3D |

**Verificado em 13/09/2026 (Épico 7):** typecheck limpo, 44 testes unitários (Vitest) e 7 specs e2e (Playwright) passando, `npm run build` ok.

**Verificado de forma independente em 14/09/2026 (Épico 8, Claude Desktop):** typecheck limpo, 49 testes unitários (Vitest) e 8 specs e2e (Playwright) passando, `npm run build` e `oxlint` limpos. Achado (não bloqueia, ver Épico 8 acima): `app/playwright.config.ts` não seta de fato `channel: 'chromium'`, apesar do comentário dizer que sim — correção pendente para uma próxima sessão do Claude Code.

**Pendência que não bloqueia o roadmap:** o critério exato do quadrante frontal/lateral-traseira do MD-300L (Figuras A/B da planilha, com erro `#VALUE!`) segue em aberto — Gustavo vai perguntar para a turma na próxima aula. Afeta só a divisão fina dentro da tabela do MD-300L, não o início do Épico 1.
