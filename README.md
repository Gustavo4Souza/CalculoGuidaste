# Guindastes Ribas Ltda. — Simulador de Tabelas de Carga

Projeto da disciplina **Jornada** (8º semestre). Ferramenta web, gráfica e interativa, que substitui o cruzamento manual das tabelas de carga impressas e calcula em tempo real, nos dois sentidos:

1. **Guindaste + configuração → capacidade máxima permitida**, comparada com o somatório de cargas.
2. **Peso da peça → configurações viáveis da frota**, do menor guindaste para o maior.

Frota: **MD-300L** (Madal Palfinger, 30 t) e **TM-130** (Grupo Luna, 26 t), com as tabelas reais dos fabricantes.

## Documentação

A documentação é um **cofre do Obsidian**: abra esta pasta no Obsidian ("Abrir pasta como cofre") e comece pelo índice [🗂️ Simulador Guindastes Ribas](<🗂️ Simulador Guindastes Ribas.md>).

| Nota | Conteúdo |
|---|---|
| [📋 Visão Geral](<📋 Visão Geral.md>) | Problema, usuários, objetivos, escopo |
| [📐 Requisitos](<📐 Requisitos.md>) | RF01–RF26, RNF, requisitos técnicos |
| [⚖️ Regras de Negócio](<⚖️ Regras de Negócio.md>) | O que o cálculo nunca pode quebrar |
| [🏗️ Arquitetura e Stack](<🏗️ Arquitetura e Stack.md>) | Stack, módulos, fluxos |
| [🗄️ Modelo de Dados](<🗄️ Modelo de Dados.md>) | Tipos, tabelas JSON, persistência |
| [📊 Tabelas de Carga e Fontes](<📊 Tabelas de Carga e Fontes.md>) | Origem e conferência dos dados |
| [🖥️ Interface](<🖥️ Interface.md>) | Layout, cena 3D, relatório |
| [🗳️ Decisões e Configuração](<🗳️ Decisões e Configuração.md>) | Registro de decisões |
| [🧪 Plano de Testes](<🧪 Plano de Testes.md>) | Estratégia e suítes |
| [🗺️ Roadmap](<🗺️ Roadmap.md>) | Épicos e versões |
| [🛠️ Operação](<🛠️ Operação.md>) | Como rodar e problemas comuns |
| [❓ Pendências com a Ribas](<❓ Pendências com a Ribas.md>) · [✅ Próximos Passos](<✅ Próximos Passos.md>) | O que falta |

O detalhe de cada épico (tasks, achados, verificações, sprint) fica na pasta `Épicos/`, uma nota por épico.

## Rodar

```bash
cd app
npm install
npm run dev        # http://localhost:5173
npm run test       # testes unitários
npm run test:e2e   # testes ponta a ponta (Playwright)
```

Desenvolvendo com o Claude Code? Leia o `CLAUDE.md` primeiro.

## Estrutura

```
/            cofre do Obsidian (documentação) + CLAUDE.md
Épicos/      uma nota por épico (detalhe do roadmap)
docs/        fichas e planilhas da empresa, roteiro do pitch, artigo
prototipo/   POC aprovado pela turma
app/         código de produção (React + TypeScript + Vite + three.js)
```

Repositório: https://github.com/Gustavo4Souza/CalculoGuidaste
