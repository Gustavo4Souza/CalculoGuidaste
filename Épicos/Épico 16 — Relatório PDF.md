---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 16
concluido_em: 2026-10-06
---

# Épico 16 — Relatório PDF (RF26) ✅ Concluído (06/10/2026)

## Task 16.1 — Modelo do relatório (puro, testado) ✅
- [x] `relatorio/modeloRelatorio.ts`: todo o conteúdo do PDF, já calculado e formatado, sem dependência de desenho:
  - cabeçalho (cliente, obra, local, responsável, orçamento, data de emissão, versão das tabelas e do critério de giro);
  - por cenário: guindaste e fonte dos dados, status, resumo, **todos os parâmetros** (com (~) onde o limite vem de valor aproximado), somatório item a item, capacidade da tabela com a origem (**ponto exato** ou **interpolado e entre quais pontos reais**), verificações, motivos de "sem dado", avisos, ambiente (informativo) e notas da ficha;
  - aviso de validação pelo engenheiro responsável
- [x] **Decisão**: o relatório **recalcula** cada cenário com as tabelas atuais (o que se entrega tem que refletir os dados vigentes) e **avisa** quando o cenário foi salvo com outra versão das tabelas ou do critério de giro
- [x] Relatório de **orçamento**: capa + **comparativo** dos cenários (status, guindaste, lança, JIB, raio, área, carga, somatório, capacidade, utilização) + um capítulo por cenário
- [x] 8 testes com valores reais: ponto exato (7.500 kg), interpolado (9.975 kg entre 10.800 e 7.500 kg, com os pontos listados), sem dado (sapata parcial, com o motivo), parâmetros (~), aviso de versão diferente, comparativo frontal × lateral (7.500 × 10.500 kg)

## Task 16.2 — Capturas da cena ✅
- [x] `components/cena/CapturadorDeCena.tsx`: renderiza a cena atual **fora da tela** (render target 1200 × 800, com câmera própria) e devolve JPEG; a câmera do usuário não se mexe. Registrado em `relatorio/capturas.ts`, então o relatório não conhece three.js nem React
- [x] `relatorio/camerasDeCaptura.ts` (puro, 3 testes): a vista **lateral** olha o plano da lança de frente **qualquer que seja o giro** (como o gráfico de alcance da ficha; as vistas da tela supõem giro ≈ 0°); a **superior** enquadra juntos caminhão com sapatas, anel de giro e carga
- [x] Para capturar, cada cenário é carregado temporariamente na cena com o mapa da área de operação ligado; no fim, o cenário e a preferência de mapa que estavam na tela são **restaurados exatamente** (coberto por e2e)
- [x] **Limitação**: as cotas e rótulos da cena são HTML sobre o canvas e não saem nas imagens; os valores estão nas tabelas do relatório

## Task 16.3 — PDF e interface ✅
- [x] `relatorio/gerarPdf.ts` com `jspdf` + `jspdf-autotable`, **carregados sob demanda** (chunk separado de ~400 kB, baixado só ao exportar). Cabeçalho e rodapé em todas as páginas (título, data, versões, "Página x de y"); status colorido; selo de critério de giro provisório; capturas lado a lado com legenda das cores do chão; tabelas; **bloco de validação obrigatória e assinatura** (engenheiro responsável, CREA/ART, data)
- [x] `paraPdf()`: a fonte padrão do PDF tem os acentos, mas não ≈ ≤ → ●; esses viram ~ <= -> *, e qualquer outro caractere fora da fonte vira "?" em vez de quebrar o texto
- [x] `components/projetos/DialogoExportarPdf.tsx`: "Exportar PDF" na barra de comandos → cenário atual (salvo ou não) ou orçamento completo. Arquivo `relatorio-<nome>-<aaaa-mm-dd>.pdf`
- [x] `jspdf` e `jspdf-autotable` acrescentados ao `optimizeDeps.include` do `vite.config.ts` (regra da avaliação de 06/10/2026)

**Verificação (06/10/2026):** 139 testes unitários (+11); 22/22 e2e (2x seguidas: 44/44), com 2 novos que geram o PDF de verdade (cenário atual; orçamento com tela restaurada); typecheck e build limpos. Revisão visual das páginas dos dois PDFs gerados, renderizadas e conferidas uma a uma; dois ajustes de diagramação feitos a partir dela (selo provisório duplicado na capa do relatório de um cenário; legenda colada nas imagens).

**Nota:** `npm audit` aponta 1 vulnerabilidade alta em `source-map-js`, dependência interna das ferramentas de build (Vite/PostCSS), que não vai no simulador entregue. Não foi corrigida neste épico.

## Sprint (visão do backlog)

### Sprint 14 — Relatório PDF (Épico 16) ✅ Concluída (06/10/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S14-01 | ✅ Modelo do relatório (puro, testado com valores reais), recalculado com as tabelas atuais e aviso de versão | Alta | Task 16.1 / RF26 |
| S14-02 | ✅ Capturas lateral (plano da lança, qualquer giro) e superior (com a área de operação) fora da tela | Alta | Task 16.2 / RF26 |
| S14-03 | ✅ PDF por cenário e por orçamento (comparativo), selo provisório, versões, validação e assinatura | Alta | Task 16.3 / RF26 |

**Pronto quando**: o engenheiro exporta um PDF do cenário ou do orçamento inteiro com tudo o que o RF26 pede. ✅ Atingido: 139 unitários + 22 e2e (44/44 em execução repetida).

## Relacionado

- [[🗺️ Roadmap]]
- Anterior: [[Épico 15 — Projetos, orçamentos e cenários]]
- Próximo: [[Épico 17 — Visual SolidWorks]]
