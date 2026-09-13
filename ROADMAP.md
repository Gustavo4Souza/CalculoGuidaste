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

**Status: concluído.** `app/src/components/Simulador.tsx` agora tem canvas arrastável (react-konva), seleção de guindaste, seletor de quadrante/zona, toggle de JIB, painel de peso, resultado e busca reversa por peso. 39 testes unitários + 3 testes Playwright (e2e) passando, build de produção OK.

### Task 3.1 — Migrar POC (vanilla JS) para React + react-konva ✅ Concluído
- [x] Canvas arrastável em `app/src/components/CanvasLanca.tsx` (react-konva) — gancho arrastável preso a um arco de raio fixo (`dragBoundFunc`), migrado do desenho SVG do POC. Só o ângulo de elevação é manipulado por arrasto; comprimento de lança é um controle separado (Task 3.4).

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

## Épico 4 — Alertas, validação e usabilidade

### Task 4.1 — Indicador visual de status
- [ ] Verde (dentro do limite) / vermelho (excede) / âmbar (fora da faixa), com % de margem

### Task 4.2 — Revisão de usabilidade
- [ ] Fluxo completo em até 3 cliques ou 1 arrasto (RNF Usabilidade)

---

## Épico 5 — Testes finais e apoio ao pitch/artigo

### Task 5.1 — Testes de fluxo ponta a ponta
- [ ] Playwright cobrindo UC02 para os dois guindastes

### Task 5.2 — Roteiro e gravação do vídeo pitch
- [ ] Com o protótipo de produção funcionando (não mais o POC)

### Task 5.3 — Artigo científico
- [ ] Levantamento bibliográfico inicial
- [ ] Redação usando a página do Notion como fonte de contexto/decisões

---

## Épico 6 — Fase 2 / melhorias futuras *(opcional, se sobrar tempo)*

- [ ] Tela simples de cadastro/edição de guindastes e tabelas (RF13)
- [ ] Suporte a cadastro de novos modelos de guindaste além do MD-300L e do TM-130
- [ ] Parametrizar a extensão das sapatas (hoje sempre assumida como máxima)

---

## Status resumido

| Épico | Status |
|---|---|
| 0 — Fundamentos e protótipo conceitual | ✅ Concluído |
| 1 — Ingestão dos dados reais | ✅ Concluído — MD-300L e TM-130 digitalizados e conferidos |
| 2 — Motor de cálculo v2 | ✅ Concluído — interpolação, somatório, arredondamento e correção geométrica, testados com dados reais dos 2 guindastes |
| 3 — Interface gráfica de produção | ✅ Concluído — canvas react-konva, JIB, sincronização e busca reversa |
| 4 — Alertas, validação e usabilidade | ⬜ Não iniciado |
| 5 — Testes finais e apoio ao pitch/artigo | ⬜ Não iniciado |
| 6 — Fase 2 / melhorias futuras | ⬜ Opcional, se sobrar tempo |

**Verificado em 13/09/2026:** typecheck limpo, `npm run build` ok, e os 28 testes unitários (motor de cálculo dos 2 guindastes + correção geométrica) passando.

**Pendência que não bloqueia o roadmap:** o critério exato do quadrante frontal/lateral-traseira do MD-300L (Figuras A/B da planilha, com erro `#VALUE!`) segue em aberto — Gustavo vai perguntar para a turma na próxima aula. Afeta só a divisão fina dentro da tabela do MD-300L, não o início do Épico 1.
