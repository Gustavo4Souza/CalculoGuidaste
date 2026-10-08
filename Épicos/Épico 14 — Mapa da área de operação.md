---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 14
concluido_em: 2026-10-05
---

# Épico 14 — Mapa da área de operação no chão (RF22) ✅ Concluído (05/10/2026)

## Task 14.1 — Motor do mapa (TS puro) ✅
- [x] `engine/mapaAreaOperacao.ts`: para a configuração atual (lança, JIB, sapatas, cabo, carga, acessórios, limites), varre uma grade polar giro × raio (padrão 5° × 0,5 m, do centro até o alcance máximo da lança atual) e, em cada nó, chama **a mesma `avaliarCenario`**, só trocando o giro e o ângulo da lança que põe o gancho naquele raio. Não há regra de capacidade própria no mapa
- [x] **Decisão**: cada célula fica com o **pior status dos 4 cantos** (nok > sem dado > atenção > ok), para que uma célula só seja verde se a região inteira for. Cantos fora do alcance são ignorados; a célula só é "fora de alcance" se nenhum canto for alcançável. No TM-130 a grade cobre só o giro mecânico (±60°)
- [x] Desempenho: ~33 ms para a grade inteira da lança de 32,10 m (>4.000 nós). O `engine/texto.ts` passou a reaproveitar o `Intl.NumberFormat`, porque criar um a cada mensagem do motor ficaria caro com milhares de avaliações
- [x] 9 testes unitários com valores reais (17,70 m, 9.000 kg): frontal passa a 7 m (10.800 kg) e reprova a 8 m (7.500 kg); lateral passa a 8 m (10.500 kg); a 8 m, 55° (fronteira → menor capacidade) reprova e 60° passa; cada nó é exatamente o que `avaliarCenario` responde; abaixo de 3 m é "sem dado"; o centro é inalcançável; sapata parcial → 100% "sem dado"; TM-130 só ±60°

## Task 14.2 — Desenho no chão e legenda ✅
- [x] `components/cena/MapaNoChao.tsx`: uma malha com cor por vértice (verde OK / âmbar atenção / vermelho NOK, translúcida) e outra com textura hachurada cinza para "sem dado do fabricante". O que a lança não alcança fica sem cor
- [x] `components/cena/useMapaAreaOperacao.ts`: cálculo memoizado **sem o giro e sem o ângulo da lança** (o mapa já varre todos), então girar ou subir a lança não recalcula nada
- [x] Botão "Área de operação" na barra de vistas (liga/desliga, `useInterfaceStore.mostrarMapa`) e `cena/LegendaMapa.tsx` com a % de células de cada status. Quando nenhuma posição é validada (ex.: massa linear do cabo vazia), a legenda avisa e aponta para os motivos no painel de resultado
- [x] **Decisão de layout tomada nos testes**: a legenda fica no **painel de resultado**, não sobre a viewport. Em qualquer canto da viewport ela cobria alguma peça arrastável: no rodapé, o anel de giro; no topo, a barra de vistas; abaixo dela, o gancho da lança de 14,10 m

**Verificação (05/10/2026):** revisão visual por captura (planta e isométrica, com e sem dado); 117 testes unitários (+9 do mapa); 16/16 e2e (suíte 2x seguidas: 32/32, ~41 s), incluindo um novo teste de legenda, recálculo (cabo + 9.000 kg → regiões OK e NOK), sapata parcial → 100% sem dado e liga/desliga; typecheck e `npm run build` limpos.

## Sprint (visão do backlog)

### Sprint 12 — Mapa da área de operação no chão (Épico 14) ✅ Concluída (05/10/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S12-01 | ✅ `engine/mapaAreaOperacao.ts` — grade giro × raio avaliada por `avaliarCenario` (sem lógica duplicada), testes com valores reais | Alta | Task 14.1 / RF22 |
| S12-02 | ✅ Mapa no chão (OK/Atenção/NOK em cor, sem dado hachurado) + botão liga/desliga + legenda | Alta | Task 14.2 / RF22 |

**Pronto quando**: o chão mostra, para a configuração atual, onde a operação é OK, NOK ou sem dado do fabricante, usando a mesma função do motor. ✅ Atingido: 117 unitários + 16 e2e (32/32 em execução repetida).

## Relacionado

- [[🗺️ Roadmap]]
- Anterior: [[Épico 13 — Modelo 3D fiel e arrasto de tudo]]
- Próximo: [[Épico 15 — Projetos, orçamentos e cenários]]
