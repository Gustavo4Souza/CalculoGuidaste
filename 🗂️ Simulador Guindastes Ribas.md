---
tipo: indice
status: ativo
criado: 2026-10-07
tags:
  - projeto
  - faculdade
aliases:
  - Simulador Guindastes Ribas
  - Índice do projeto
---

# 🗂️ Simulador Guindastes Ribas

Simulador gráfico e interativo de **tabelas de carga de guindastes** para a Guindastes Ribas Ltda. (cliente fictício), feito na disciplina **Jornada** do 8º semestre. Substitui o cruzamento manual das tabelas impressas por um cálculo em tempo real, nos dois sentidos: **configuração → capacidade** e **peso → configuração**.

> [!info] Fonte de verdade
> Desde 07/10/2026 esta pasta é um **cofre do Obsidian** e estas notas são a documentação oficial do projeto (antes era o Notion). Toda decisão nova entra aqui: na nota do assunto, em [[🗳️ Decisões e Configuração]] e numa linha do [[🗓️ Log de Atualizações]].

## Situação em 07/10/2026 (após o Épico 17)

- ==Épicos 0–4 e 7–17 concluídos==. Épico 18 (fluxo de telas) é o próximo; Épico 5 (pitch e artigo) quase concluído; Épico 6 (melhorias futuras) não iniciado.
- **161 testes unitários + 23 e2e** passando; build e typecheck limpos.
- Frota: **MD-300L** (Madal Palfinger, 30 t) e **TM-130** (Grupo Luna, 26 t), com tabelas reais conferidas contra as fichas.
- Pendências abertas: ver [[❓ Pendências com a Ribas]] e [[✅ Próximos Passos]].

## Notas

| Nota | Conteúdo | Status |
|---|---|---|
| [[📋 Visão Geral]] | Problema, usuários, objetivos, escopo | ✅ |
| [[📐 Requisitos]] | RF01–RF26, RNF e requisitos técnicos por módulo | ✅ |
| [[⚖️ Regras de Negócio]] | As regras que o cálculo nunca pode quebrar | ✅ |
| [[🏗️ Arquitetura e Stack]] | Stack, módulos, estrutura de pastas, fluxo principal | ✅ |
| [[🗄️ Modelo de Dados]] | Tipos, tabelas JSON, especificações, persistência | ✅ |
| [[📊 Tabelas de Carga e Fontes]] | De onde vem cada dado e o histórico de correções | ✅ |
| [[🖥️ Interface]] | Layout estilo CAD, cena 3D, arrastos, relatório | ✅ |
| [[🗳️ Decisões e Configuração]] | Registro de decisões com data e motivo | ✅ |
| [[🧪 Plano de Testes]] | Estratégia, suítes, como rodar, metas | ✅ |
| [[🗺️ Roadmap]] | Épicos 0–16, versões e o que entrou em cada uma | ✅ |
| `Épicos/` | Uma nota por épico com o detalhe das tasks e a sprint (ex.: [[Épico 10 — Dados corrigidos e motor v3]]) | ✅ |
| [[🛠️ Operação]] | Como rodar, perfis de uso, história de um dia, problemas comuns | ✅ |
| [[📈 Indicadores]] | Métricas de qualidade e de entrega | ✅ |
| [[🐛 Bugs e Lições Aprendidas]] | Defeitos reais encontrados e o que ficou de regra | ✅ |
| [[❓ Pendências com a Ribas]] | Dados que só a empresa pode confirmar | 🟡 aberto |
| [[✅ Próximos Passos]] | Checklist do que falta | 🟡 aberto |
| [[🗓️ Log de Atualizações]] | Linha do tempo do projeto | ✅ |

## Fora das notas

- **Código:** `app/` (React + TypeScript + Vite). Instruções para o Claude Code em `CLAUDE.md`.
- **Fontes da empresa:** pasta `docs/` (fichas em PDF e planilhas), ver [[📊 Tabelas de Carga e Fontes]].
- **Protótipo aprovado pela turma:** `prototipo/poc-simulador.html`.
- **Repositório:** [github.com/Gustavo4Souza/CalculoGuidaste](https://github.com/Gustavo4Souza/CalculoGuidaste).

## Relacionado

- [[📋 Visão Geral]]
- [[🗺️ Roadmap]]
- [[✅ Próximos Passos]]
