---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 4
concluido_em: 2026-09-13
---

# Épico 4 — Alertas, validação e usabilidade ✅ Concluído (13/09/2026)

## Task 4.1 — Indicador visual de status ✅ Concluído
- [x] Verde (dentro do limite) / vermelho (excede) / âmbar (fora da faixa), com % de margem — `app/src/components/IndicadorStatus.tsx`, migrado do "status chip" do POC. Testado via Playwright (`e2e/simulador.spec.ts`), alternando entre os 3 estados com valores reais.

## Task 4.2 — Revisão de usabilidade ✅ Concluído
- [x] Fluxo completo em até 3 cliques ou 1 arrasto (RNF Usabilidade) — **auditado e confirmado**: com a tela já carregando uma configuração padrão válida, o fluxo principal (selecionar guindaste → posicionar a lança → ler o resultado) é **1 clique (selecionar guindaste) + 1 arrasto (posicionar a lança no canvas)**, sem cliques extras para ver o resultado (atualização ao vivo). O fluxo de JIB (RF12, opcional) precisa de mais interações (toggle + 2 seletores), aceitável por ser um caso secundário, não o fluxo principal.
- [x] **Bug real encontrado e corrigido durante a revisão**: o campo "Raio de trabalho" (variante A) é um valor *derivado* do ângulo (`raio ⇄ ângulo` via `engine/geometriaLanca.ts`) e reformatado a cada render — um campo 100% controlado por esse valor "engolia" a digitação do usuário (ex.: escrever "8." virava "8.00" antes de completar a casa decimal). Corrigido com `components/useCampoNumericoSincronizado.ts` (texto local livre enquanto o campo está focado, resincroniza no blur). Regressão coberta por um teste Playwright que digita tecla por tecla (`pressSequentially`, não `.fill()`).

## Sprint (visão do backlog)

### Sprint 4 — Alertas, validação, testes finais e apoio ao pitch/artigo (Épicos 4 e 5)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S4-01 | ✅ Indicador visual verde/âmbar/vermelho com % de margem de segurança | Alta | Task 4.1 |
| S4-02 | ✅ Revisão de usabilidade: fluxo completo em até 3 cliques/1 arrasto — confirmado (1 clique + 1 arrasto) e um bug real de digitação corrigido | Média | Task 4.2 |
| S4-03 | ✅ Testes de fluxo ponta a ponta (Playwright) para os dois guindastes — 7 specs em `e2e/simulador.spec.ts`, incluindo UC02 completo (arrasto real via `page.mouse`) para o MD-300L e o TM-130 | Baixa | Task 5.1 |
| S4-04 | 🟡 Roteiro pronto (`docs/Roteiro_Video_Pitch.md`); gravação pendente (depende do Gustavo) | Alta | Task 5.2 |
| S4-05 | 🟡 Levantamento bibliográfico feito e seções de resultado/conclusão redigidas (`docs/Artigo_Secoes_Pendentes.md`); falta transcrever para o `.docx` final | Alta | Task 5.3 |

**Épico 4 concluído (13/09/2026)**: 39 testes unitários + 5 testes Playwright passando, build de produção verificado.

## Relacionado

- [[🗺️ Roadmap]]
- Anterior: [[Épico 03 — Interface de produção]]
- Próximo: [[Épico 05 — Testes finais, pitch e artigo]]
