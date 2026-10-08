---
tipo: projeto
status: ativo
criado: 2026-10-07
tags:
  - projeto
aliases:
  - Indicadores
  - Métricas
---

# 📈 Indicadores

Projeto solo e acadêmico: os indicadores são poucos e servem para três coisas. São **portão de qualidade** (nada fecha um épico com teste falhando), servem de **evidência para o artigo** e mostram **onde está o risco**.

## Qualidade

| Indicador | Meta | Atual (07/10/2026) | Como é usado |
|---|---|---|---|
| Testes unitários passando | 100% | **161/161** | Portão ao fim de cada épico |
| Testes e2e passando | 100%, 2 rodadas seguidas | **23/23** (2x) | Portão; detecta intermitência |
| Precisão contra a tabela em pontos exatos | 100% | 100% nas células testadas | Requisito de confiabilidade |
| Interpolações arredondadas para baixo | 100% | 100% | Regra de segurança |
| Valores de capacidade sem fonte | 0 | 0 | Toda célula vem de `docs/` |
| Medidas do desenho aproximadas (≈) | Diminuir | MD-300L 5 de 20; TM-130 15 de 20 | Prioriza o que pedir à Ribas |
| Typecheck e build | Limpos | Limpos | Portão |
| Lint | 0 erros | 0 erros (avisos antigos de fast refresh) | Limpeza contínua |
| Vulnerabilidades do `npm audit` | 0 altas no que vai para produção | 1 alta em `source-map-js` (só ferramenta de build) | Item de [[✅ Próximos Passos]] |

## Evolução dos testes

| Marco | Unitários | e2e |
|---|---|---|
| Épico 2 (motor v2) | 28 | — |
| Épico 3 (UI de produção) | 39 | 3 |
| Épico 7 (3D) | 44 | 7 |
| Épico 8 | 49 | 8 |
| Épico 9 | 54 | 9 |
| Épico 10 (motor v3, parcial) | 90 | 9 |
| Épico 11 | 102 | 11 |
| Épico 12 | 102 | 12 |
| Épico 13 | 108 | 15 |
| Épico 14 | 117 | 16 |
| Épico 15 | 125 | 19 |
| Correção da tela branca | 128 | 20 |
| Épico 16 | 139 | 22 |
| Respostas da Ribas | 152 | 22 |
| Épico 17 (visual SolidWorks) | **161** | **23** |

## Desempenho

| Indicador | Meta | Atual |
|---|---|---|
| Cena parada | 0 quadros renderizados | 0 (`frameloop="demand"`; antes ~20 quadros/s) |
| Mapa da área de operação (lança de 32,10 m, >4.000 avaliações) | < 100 ms | ~33 ms |
| Suíte unitária | < 10 s | ~2 s |
| Suíte e2e | < 2 min | ~1 min |
| Chunk do PDF | Fora do carregamento inicial | ~400 kB, baixado só ao exportar |

## Entrega

| Indicador | Valor |
|---|---|
| Commits no repositório | 18 (até 06/10/2026) |
| Épicos concluídos | 16 de 19 (0–4 e 7–17); 5 quase; 6 e 18 não iniciados |
| Requisitos funcionais atendidos | 25 de 26 (falta RF13, Épico 6) |
| Bugs reais encontrados pelos testes ou pela revisão | 12+ (ver [[🐛 Bugs e Lições Aprendidas]]) |
| Deploys públicos | 0 (pendente) |

Depois do deploy, vale acompanhar a **frequência de deploy** e a **taxa de falha** (deploys que precisaram de correção), no espírito DORA, mesmo em escala pequena.

## Produto (depois da entrega)

- Cenários salvos por orçamento e % de cenários com "sem dado" (mede o quanto falta de dado da Ribas).
- Tempo para montar um orçamento com o simulador × à mão (bom dado para o artigo).
- Divergências encontradas entre o simulador e a conferência manual do engenheiro (meta: 0).

## Relacionado

- [[🧪 Plano de Testes]]
- [[🗺️ Roadmap]]
- [[🐛 Bugs e Lições Aprendidas]]
- [[🗂️ Simulador Guindastes Ribas]]
