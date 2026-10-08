# App — Guindastes Ribas (Simulador de Tabela de Carga)

Código do simulador (React + TypeScript + Vite). A documentação do projeto — contexto, requisitos RF01–RF26, modelo de dados, arquitetura e roadmap — é um cofre do Obsidian na raiz do repositório: comece por `../🗂️ Simulador Guindastes Ribas.md` (o detalhe de cada épico fica em `../Épicos/`).

## Rodando localmente

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Typecheck (`tsc -b`) + build de produção em `dist/` |
| `npm run test` | Testes unitários do motor de cálculo (Vitest) |
| `npm run test:watch` | Vitest em modo watch |
| `npm run test:e2e` | Testes de fluxo ponta a ponta (Playwright) — roda `npm run dev` automaticamente. Rodar `npx playwright install` uma vez antes, na primeira vez. |
| `npm run lint` | Oxlint |

## Estrutura

```
src/
  types/guindaste.ts              modelo de dados (espelha a seção 7 do Notion)
  data/guindastes.json            metadados reais dos 2 guindastes da frota
  data/tabelas/md-300l.json       tabela de carga real (parcial — Épico 1 em andamento)
  data/tabelas/tm-130.json        tabela de carga real (vazia — Épico 1 ainda não iniciado)
  engine/interpolacao.ts          interpolação linear genérica + arredondamento de segurança
  engine/calcularCapacidadeMaxima.ts   motor de cálculo (RT-MC01) — dispatch por tipo de tabela
  store/useSimulacaoStore.ts      estado global (Zustand)
  components/Simulador.tsx        tela única de simulação (ainda sem canvas — Épico 3)
e2e/simulador.spec.ts             smoke test end-to-end (Playwright)
```

## Estado atual (ver `../🗺️ Roadmap.md` e `../Épicos/` para o roadmap completo)

- **Épico 0** (fundamentos, POC): ✅ concluído.
- **Épico 1** (dados reais em JSON): em andamento — só 2 pontos reais do MD-300L estão digitalizados (`src/data/tabelas/README.md` explica o que falta).
- **Épico 2** (motor de cálculo v2): parcialmente coberto — interpolação, somatório de cargas (RF09/RF10) e arredondamento de segurança já implementados e testados; falta a correção geométrica real (RF11, hoje é preciso passar `raioM` já calculado).
- **Épico 3** (interface de produção): parcialmente coberto — tela funcional com campos numéricos e seletor manual de quadrante/zona (RF08); falta o canvas arrastável (react-konva) e a busca reversa (RF05/RF15).
