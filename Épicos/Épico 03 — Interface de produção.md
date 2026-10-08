---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 3
concluido_em: 2026-09-13
---

# Épico 3 — Interface gráfica de produção (evolução do POC) ✅ Concluído (13/09/2026)

**Status: concluído.** `app/src/components/Simulador.tsx` agora tem canvas arrastável, seleção de guindaste, seletor de quadrante/zona, toggle de JIB, painel de peso, resultado e busca reversa por peso. 39 testes unitários + 3 testes Playwright (e2e) passando, build de produção OK.

> **Nota (13/09/2026, mais tarde):** o canvas 2D (react-konva) da Task 3.1 foi **substituído** por uma cena 3D real (WebGL) no Épico 7, a pedido do Gustavo ("layout muito simples, preciso de uma terceira dimensão"). Os itens abaixo continuam válidos como histórico da primeira versão; ver Épico 7 para o estado atual da visualização.

## Task 3.1 — Migrar POC (vanilla JS) para React + react-konva ✅ Concluído (substituído pelo Épico 7)
- [x] Canvas arrastável em `app/src/components/CanvasLanca.tsx` (react-konva) — gancho arrastável preso a um arco de raio fixo (`dragBoundFunc`), migrado do desenho SVG do POC. Só o ângulo de elevação é manipulado por arrasto; comprimento de lança é um controle separado (Task 3.4). **Substituído (Épico 7)** por `app/src/components/CenaGuindaste3D.tsx` (react-three-fiber/WebGL) — o arquivo `CanvasLanca.tsx` ficou órfão e deve ser apagado do repositório.

## Task 3.2 — Seleção de quadrante/zona de operação (RF08)
- [x] Seletor manual (toggle/dropdown) — frontal/lateral-traseira (MD-300L) ou Zona I/II (TM-130), sem view de giro em planta

## Task 3.3 — Suporte a JIB opcional (RF12) ✅ Concluído
- [x] Toggle de uso de JIB, exibido só quando `guindaste.possuiJIB = true` (hoje só MD-300L)
- [x] Ligado ao motor de cálculo — `calcularCapacidadeMaximaJIB()` em `app/src/engine/calcularCapacidadeMaxima.ts`, testado em `calcularCapacidadeMaximaJIB.test.ts` contra pontos exatos de `md-300l-jib.json`
- [x] Seletores de comprimento de JIB (9,0/15,5/20,0 m) e ângulo de JIB (10°/25°/40°) — combinações discretas reais da tabela, sem canvas (fora do escopo desta rodada, mantém o canvas simples)

## Task 3.4 — Campos numéricos sincronizados com o canvas ✅ Concluído
- [x] Comprimento de lança (dropdown com os 7 valores reais da tabela) e raio de trabalho (campo numérico) sincronizados nos dois sentidos com o arrasto do canvas — `definirRaioM()`/`definirAnguloGraus()` na store convertem entre raio e ângulo via `calcularRaioReal()`/inversa (`Math.acos`)

## Task 3.5 — Busca reversa: lista de configurações viáveis (RF05/RF15) ✅ Concluído
- [x] Campo "Peso a içar" (`app/src/components/BuscaReversa.tsx`) que varre a frota e lista as configurações viáveis, sem depender da configuração atualmente selecionada
- [x] Ordenada por menor guindaste primeiro (`capacidadeNominalKg`, novo campo no `Guindaste`) — `buscarConfiguracoesViaveis()` em `app/src/engine/buscaReversa.ts`, 6 testes em `buscaReversa.test.ts`

## Sprint (visão do backlog)

### Sprint 3 — Interface gráfica de produção (Épico 3) ✅ Concluída (13/09/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S3-01 | ✅ Migrar o POC (vanilla JS) para React + react-konva | Alta | Task 3.1 |
| S3-02 | ✅ Seletor manual de quadrante/zona (toggle/dropdown, sem view de giro) | Alta | Task 3.2 / RF08 |
| S3-03 | ✅ Toggle de uso de JIB, exibido só para guindastes com `possuiJIB = true` — ligado ao motor de cálculo | Média | Task 3.3 / RF12 |
| S3-04 | ✅ Campos numéricos sincronizados com o canvas (comprimento de lança, raio) | Alta | Task 3.4 |
| S3-05 | ✅ Busca reversa (RF05/RF15): campo "Peso a içar" + lista ordenada por menor guindaste primeiro | Alta | Task 3.5 |

**Pronto quando**: a interface de produção reproduz a linha de raciocínio aprovada do POC, mas com dados reais e todos os requisitos novos (RF08–RF15). ✅ Atingido — 39 testes unitários + 3 testes Playwright (e2e) passando, build de produção verificado. S1-01 (deploy inicial no Vercel) segue pendente, arrastada das sprints anteriores.

## Relacionado

- [[🗺️ Roadmap]]
- Anterior: [[Épico 02 — Motor de cálculo v2]]
- Próximo: [[Épico 04 — Alertas, validação e usabilidade]]
