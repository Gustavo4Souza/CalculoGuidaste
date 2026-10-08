---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 10
concluido_em: 2026-10-06
---

# Épico 10 — Dados corrigidos e motor v3 ✅ Concluído (06/10/2026)

> [!abstract] Plano dos Épicos 10–16
> *Pedido do Gustavo:* transformar o simulador numa ferramenta de engenharia para planejar operações e montar orçamentos entregues a clientes. Todo ponto ajustável do guindaste real é parametrizável (campo + arrasto), o giro vai a 360° e deriva quadrante/zona, há um estado próprio "Sem dado do fabricante" (regra de ouro, RF17), mapa de área no chão, UI estilo SolidWorks em tema claro (substitui o Épico 8), CRUD Projeto → Orçamento → Cenários em IndexedDB e relatório PDF. Novos requisitos RF16–RF26 em [[📐 Requisitos]]. O plano completo, com o levantamento das fichas (pontos ajustáveis, cobertura das tabelas e dimensões encontradas e faltantes), foi aprovado pelo Gustavo antes de qualquer código.
>
> **Decisões do Gustavo (AskUserQuestion, 05/10/2026):**
> 1. TM-130: a tabela polar por raio ("Com sapata para lança principal") vira a tabela da lança principal. A tabela zona × ângulo, que é a "Com sapata para lança JIB", fica como tabela de JIB, desligada até a Ribas confirmar.
> 2. Faixas da tabela polar: degrau conservador (o valor vale até o arco externo da faixa; não se interpola entre faixas).
> 3. Offset do JIB do MD-300L entre 10°/25°/40°: interpolar entre as tabelas vizinhas, arredondando para baixo; fora de 10–40° → sem dado.
> 4. "Massa do cabo de aço" da planilha = cabo de içamento pendurado (ponta → moitão), calculado e sobrescrevível.
>
> **Ordem de dependência:** 10 (dados + motor v3) → 11 (fonte única de estado) → 12 (UI CAD tema claro) → 13 (modelo 3D fiel + arrasto de tudo) → 14 (mapa de área no chão) → 15 (persistência + CRUD) → 16 (relatório PDF). Testes unitários + e2e ao fim de cada épico, mostrados ao Gustavo antes de seguir.

## Task 10.0 — `channel: 'chromium'` no Playwright ✅
- [x] Adicionado ao bloco `use` de `app/playwright.config.ts` (pendência registrada nos Épicos 8 e 9).

## Task 10.1 — Tabela polar da lança principal do TM-130 ✅ Concluída (06/10/2026)
- [x] `tm-130.json` renomeado para `tm-130-jib.json` (conteúdo idêntico): é a tabela "Com sapata para lança JIB" (ver `app/src/data/tabelas/README.md`)
- [x] Gustavo transcreveu o diagrama em `docs/dados_guindaste_TM-130.xlsx` (aba `Centro de Giro`). A leitura confirmou que os valores ficam **sobre os arcos** (um por raio), e não em faixas entre eles
- [x] **Conferência contra a camada de texto do PDF**: 3 divergências na planilha (Zona II 5 m: 16.000 → 16.300; Zona II 8 m: 7.100 → 7.700; Zona I 6 m: 21.000 → 21.600). **Decisão do Gustavo:** valem os valores do PDF; as células foram corrigidas com nota
- [x] **Decisão do Gustavo:** entre raios, **interpolação** arredondada para baixo (substitui o "degrau conservador", que pressupunha faixas)
- [x] Extração mecânica (com travas: valor tem que estar no texto do PDF; capacidade não pode aumentar com o raio) para `tm-130-principal.json`; novo tipo `TabelaCargaZonaRaio` e `tipoTabelaPrincipal: "zona_raio"`; schema atualizado; `capacidadeZonaRaioDetalhada` no motor
- [x] Testes com valores reais: pontos exatos nas duas zonas (26.000 / 21.600 / 8.100 / 20.400 / 7.700 / 4.000 kg), interpolação (Zona II 7,5 m → 9.450 kg), cobertura por zona (4,5 m tem dado na Zona II e não na Zona I), fronteira de 16° com a menor capacidade (8 m → 7.700 kg) e raio além de 12 m → sem dado
- [x] **Bug real encontrado nos testes**: com o raio vindo da trigonometria (4,500000000001 m), a interpolação dava 18.349,9999999 kg e o arredondamento para baixo cortava para 18.349, embora a conta exata seja 18.350. `arredondarParaBaixo` ganhou uma tolerância de ruído numérico de 1e-6 kg (`TOLERANCIA_RUIDO_KG`), com teste; continua conservador para qualquer diferença real

## Task 10.2 — Resultado rico (RF17) ✅
- [x] `engine/capacidadeDetalhada.ts`: capacidade + origem (exato/interpolado) + pontos reais usados + motivo quando não há dado. As funções antigas de `calcularCapacidadeMaxima.ts` passaram a delegar para elas (sem lógica duplicada)
- [x] `engine/interpolacao.ts`: `interpolarComDetalhe` (tolerância de ponto exato de 1 µm, que absorve o erro de ponto flutuante de um raio derivado de comprimento + ângulo)

## Task 10.3 — Modelo de parâmetros e especificações ✅
- [x] `types/cenario.ts` (`ParametrosDoCenario`, `AvaliacaoDoCenario`) e `types/especificacao.ts`
- [x] `data/especificacoes/{md-300l,tm-130}.json`: limites mecânicos, dimensões, passagem de cabo e moitão, cada valor com `fonte` (ficha/planilha ou `"aproximado"`)

## Task 10.4 — Giro → quadrante/zona (RF18) ✅
- [x] `config/criteriosDeGiro.ts` (arquivo único): MD-300L frontal |giro| ≤ 55° / lateral+traseira no resto (**PROVISÓRIO**). TM-130 Zona I ≤ 16° / Zona II ≤ 60°, da ficha, com limite mecânico de ±60°. `VERSAO_CRITERIO_GIRO`
- [x] `engine/classificarGiro.ts`: na fronteira exata, as duas regiões são avaliadas e vale a menor capacidade
- [x] **Achado**: os `#VALUE!` das Figuras A/B da planilha não são erro de fórmula. São imagens dentro da célula (recurso "Imagem na célula" do Excel) e mostram os setores de 110° (frontal) e 250° (lateral/traseira), iguais aos da p.3 do PDF

## Task 10.5 — `avaliarCenario` (ponto de entrada único do motor v3) ✅
- [x] `engine/avaliarCenario.ts`: limites mecânicos, giro, sapatas (só a máxima é tabelada), JIB (exige lança 32,10 m), passagem de cabo prevista pela tabela, geometria (`calcularPonta`/`resolverAnguloParaRaio` em `geometriaLanca.ts`), somatório expandido (cabo calculado/sobrescrito, excedente do moitão sobre o gancho já incluído na tabela, balancim), verificações (capacidade, limite do engenheiro, carga por perna, altura de içamento) e status `ok | atencao | nok | sem_dado`
- [x] **Achado**: com o ângulo máximo de 80°, o JIB não alcança raios que a própria tabela de JIB lista (ex.: 9 m a 25° no raio 8 m exige ~84°). O gráfico de alcance (p.4) marca 80° e 85°, então `anguloMaxGraus` passou a 85° (segue como "aproximado", a confirmar)

## Task 10.6 — Versionamento ✅
- [x] `data/catalogo.ts`: `CATALOGO` (contexto por guindaste) e `VERSAO_TABELAS` (hash FNV-1a do conteúdo de todos os JSON de dados)

## Task 10.7 — Busca reversa com a tabela polar ✅ Concluída (06/10/2026)
- [x] `buscaReversa.ts` aceita tabelas "zona + raio": em cada zona, o maior raio que atende o peso (fica a zona de maior alcance). O TM-130 voltou à busca e aparece **antes** do MD-300L (26.000 × 30.000 kg nominais, RF15); o aviso "Fora da busca" sumiu

**Verificação parcial (05/10/2026):** 90 testes unitários (54 anteriores + 36 novos, todos com células reais), 9/9 e2e (agora com `channel: 'chromium'` de fato), typecheck e `npm run build` limpos. `oxlint` não roda nesta máquina: uma política de Controle de Aplicativo do Windows bloqueia o binário nativo (`oxlint.win32-x64-msvc.node`). É problema de ambiente, não do código. A UI ainda usa o motor antigo; ela passa para `avaliarCenario` no Épico 11.

## Sprint (visão do backlog)

### Sprint 8 — Dados corrigidos e motor v3 (Épico 10) ✅ Concluída (06/10/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S8-00 | ✅ `channel: 'chromium'` no `playwright.config.ts` | Média | Task 10.0 |
| S8-01 | ✅ Tabela polar da lança principal do TM-130 (transcrição do Gustavo → conferência contra o PDF, 3 células corrigidas → extração mecânica) | Alta | Task 10.1 / RF08, RF12 |
| S8-02 | ✅ Capacidade detalhada (exato/interpolado, pontos usados, motivo de "sem dado") | Alta | Task 10.2 / RF17 |
| S8-03 | ✅ `ParametrosDoCenario` + especificações com fonte | Alta | Task 10.3 / RF16 |
| S8-04 | ✅ Giro → quadrante/zona em arquivo único, critério provisório do MD-300L | Alta | Task 10.4 / RF18 |
| S8-05 | ✅ `avaliarCenario`: sapatas, JIB, pernas, cabo, moitão, altura, limite do engenheiro | Alta | Task 10.5 / RF17, RF19–RF21 |
| S8-06 | ✅ `VERSAO_TABELAS` / `VERSAO_CRITERIO_GIRO` | Média | Task 10.6 / RF24 |
| S8-07 | ✅ Busca reversa com a tabela polar (TM-130 de volta, antes do MD-300L) | Média | Task 10.7 / RF15 |

**Pronto quando**: o motor v3 avalia qualquer cenário dos dois guindastes com dados reais, devolvendo "sem dado do fabricante" fora da cobertura. Hoje: 90 testes unitários + 9 e2e passando; falta só a tabela polar do TM-130.

**Sprints seguintes:** Épicos 10–16 concluídos (a tabela polar do TM-130 entrou em 06/10/2026) (PDF). Ver [[🗺️ Roadmap]].

## Relacionado

- [[🗺️ Roadmap]]
- Anterior: [[Épico 09 — Guindaste 3D realista]]
- Próximo: [[Épico 11 — Fonte única de estado]]
