---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 2
---

# Épico 2 — Motor de cálculo v2 (dados reais + somatório de pesos)

*Pronto quando*: `calcularCapacidadeMaxima()` funciona para os dois guindastes reais, incluindo o somatório de pesos e a correção geométrica por altura/recuo do pé da lança.

**Status: ✅ Concluído (13/09/2026)** — `app/src/engine/calcularCapacidadeMaxima.ts` implementa a interpolação (as duas variantes), o somatório de cargas, o arredondamento de segurança e a correção geométrica (Task 2.2), agora testado contra pontos reais confirmados dos dois guindastes (28 testes passando).

## Task 2.1 — Suporte às duas variantes de tabela no motor de cálculo
- [x] Interpolação para a variante comprimento + raio + quadrante
- [x] Interpolação para a variante zona + ângulo — testada contra os pontos reais do TM-130 (`calcularCapacidadeMaximaTM130.test.ts`)
- [x] Arredondar sempre para baixo o resultado interpolado (piso de segurança) antes de comparar com o somatório de cargas

## Task 2.2 — Cálculo do raio real a partir da posição visual da lança ✅ Concluído
- [x] Aplicar altura do pé da lança e recuo, por guindaste — `calcularRaioReal()`/`calcularAlturaDoGancho()` em `app/src/engine/geometriaLanca.ts`, com testes em `geometriaLanca.test.ts`

`raioDaConfiguracao()` (em `calcularCapacidadeMaxima.ts`) agora aceita `configuracao.raioM` direto (compatibilidade com testes/entrada manual) **ou** deriva o raio a partir de `comprimentoLancaM` + `anguloLancaGraus` (posição visual que o canvas do Épico 3 vai alimentar), aplicando o recuo do pé da lança. A altura do pé da lança ainda não é usada pelo motor de cálculo em si (que só valida raio × capacidade) — fica disponível via `calcularAlturaDoGancho()` para quando o canvas (Task 3.1) precisar desenhar a lança a partir do pé real, elevado do solo.

## Task 2.3 — Somatório de cargas (RF09/RF10)
- [x] Campos de entrada: massa da lingada, massa do cabo de aço
- [x] Balancim: checkbox de uso + campo de massa
- [x] Comparar somatório contra a capacidade interpolada

## Task 2.4 — Testes unitários com valores reais ✅ Concluído
- [x] Casos de teste a partir dos pontos exatos das tabelas do MD-300L (`app/src/engine/calcularCapacidadeMaxima.test.ts`)
- [x] Casos de teste com pontos exatos do TM-130 (`app/src/engine/calcularCapacidadeMaximaTM130.test.ts`) — 7 pontos exatos + interpolação + independência entre zonas + somatório de cargas

## Sprint (visão do backlog)

### Sprint 2 — Motor de cálculo v2 (Épico 2) ✅ Concluída (13/09/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S2-01 | ✅ Interpolação para as duas variantes de tabela (comprimento+raio+quadrante e zona+ângulo) | Alta | Task 2.1 / RT-MC02 |
| S2-02 | ✅ Arredondamento sempre para baixo (piso de segurança) no resultado interpolado | Alta | Task 2.1 / RT-MC05 |
| S2-03 | ✅ Correção geométrica (altura do pé da lança + recuo), por guindaste — `engine/geometriaLanca.ts` | Alta | Task 2.2 / RT-MC03 |
| S2-04 | ✅ Somatório de cargas (carga içada + lingada + cabo de aço + balancim opcional) | Alta | Task 2.3 / RF09-RF10 |
| S2-05 | ✅ Testes unitários com os valores exatos das tabelas reais do MD-300L e do TM-130 | Alta | Task 2.4 / RNF Confiabilidade |

**Pronto quando**: `calcularCapacidadeMaxima()` funciona para os dois guindastes reais, incluindo somatório de pesos e correção geométrica. ✅ Atingido — 28 testes unitários passando (motor de cálculo dos 2 guindastes + geometria da lança), typecheck e build de produção verificados.

## Relacionado

- [[🗺️ Roadmap]]
- Anterior: [[Épico 01 — Dados reais dos fabricantes]]
- Próximo: [[Épico 03 — Interface de produção]]
