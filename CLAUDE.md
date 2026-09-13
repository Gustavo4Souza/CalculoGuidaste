# CLAUDE.md

Contexto para o Claude Code (ou qualquer assistente) trabalhar neste repositório. Leia isto antes de mexer em código.

## O que é este projeto

Simulador gráfico e interativo de tabelas de carga de guindastes, para o cliente fictício **Guindastes Ribas Ltda.** (disciplina **Jornada**, 8º semestre). Calcula, nos dois sentidos:

1. Peso da peça/máquina → configuração de guindaste necessária (comprimento de lança, raio).
2. Guindaste + configuração (raio/lança) → capacidade máxima de carga permitida.

## Fonte de verdade

**A [página do Notion](https://app.notion.com/p/3da034f53a1280df8666fc97c0590e38) manda.** Toda decisão de projeto, requisito (RF01–RF15) e o roadmap completo vivem lá — é também a entrega acadêmica formal do projeto (não existe TAP/UML/Matriz de Rastreabilidade como arquivo separado). Os `.md` na raiz deste repositório (`README.md`, `ARQUITETURA.md`, `REQUISITOS_TECNICOS.md`, `BACKLOG.md`, `ROADMAP.md`) são a mesma informação em formato local, para consulta rápida durante o desenvolvimento — mas se algo divergir, o Notion vence. **Qualquer decisão nova tomada durante o desenvolvimento deve ser propagada de volta para o Notion**, não só para os `.md` locais.

Repositório: `github.com/Gustavo4Souza/CalculoGuidaste`.

## Estrutura do repositório

```
/                       documentação (README/ARQUITETURA/REQUISITOS_TECNICOS/BACKLOG/ROADMAP.md)
docs/                   dados reais recebidos da empresa (xlsx + 2 PDFs) + material do artigo científico
prototipo/              POC vanilla JS/SVG aprovado pela turma (referência visual, não é o código de produção)
app/                    o código de produção (React + TypeScript + Vite) — ver app/README.md
```

`cd app/` para rodar `npm install`, `npm run dev`, `npm run test`, `npm run test:e2e`, `npm run build`.

## Regras de negócio que NÃO podem ser esquecidas

1. **Somatório de cargas (RF09/RF10)**: a capacidade nunca é validada contra a carga içada isolada, e sim contra o somatório de carga içada + massa da lingada + massa do cabo de aço + massa do balancim (opcional). Vem da própria planilha de apoio ao cálculo da empresa (`docs/Informações gerais - içamento.xlsx`).
2. **Duas estruturas de tabela diferentes (RF08)** — não existe um schema único:
   - **MD-300L**: comprimento de lança (discreto) × raio × **quadrante** (`frontal` | `lateral_traseira`).
   - **TM-130**: **zona de giro** (`I` | `II`, regiões discretas — não se interpola entre zonas) × ângulo da lança.
   - A seleção de quadrante/zona na UI é um **seletor manual** (toggle/dropdown) — decidido que NÃO haverá simulação física de giro/azimute, para manter o escopo do canvas dentro do prazo do semestre.
3. **Unidade interna sempre em kg** (kgf e kg são tratados como equivalentes — não há conversão real, é só rótulo). A UI oferece um seletor de exibição kg ⇄ toneladas (RF14), mas o cálculo interno nunca muda de unidade.
4. **Arredondamento de segurança (RT-MC05)**: todo resultado interpolado (fora de um ponto exato da tabela do fabricante) é sempre arredondado **para baixo**. Nunca ser otimista com a capacidade.
5. **JIB**: só o MD-300L tem (`possuiJIB = true`). Confirmado que o TM-130 **não** tem, apesar de a ficha técnica genérica dele mencionar um JIB opcional.
6. **RF15 (lista de configurações viáveis)**: ordenar sempre por **menor guindaste primeiro** (capacidade nominal), nunca pelo maior.
7. **Frota fechada em 2 guindastes** (MD-300L e TM-130) neste MVP — cadastro de novos modelos é melhoria futura (Épico 6).
8. **Sapatas sempre com extensão máxima** — é a única extensão coberta pelos dados reais recebidos.

## Estado atual dos dados (importante!)

`md-300l.json`, `md-300l-jib.json` e `tm-130.json` estão **completos e conferidos** (13/09/2026) — ver `app/src/data/tabelas/README.md` para o histórico dos episódios de correção. **Não invente pontos de tabela fictícios**: se surgir necessidade de um ponto novo (ex.: alguma extensão de sapata diferente da máxima), os valores exatos vêm de `docs/Tabela Guindaste MD-300L.pdf`, `docs/TM_130.pdf`, `docs/Tabelas_Extraidas_Guindaste.xlsx`, `docs/Tabelas_Zonas_Giro.xlsx` e `docs/Informações gerais - içamento.xlsx`, e precisam ser conferidos manualmente contra a fonte antes de entrar no JSON.

- `md-300l.json` e `md-300l-jib.json`: extraídos mecanicamente de `docs/Tabelas_Extraidas_Guindaste.xlsx` (planilha criada por Gustavo a partir da tabela impressa) — não por leitura de texto de PDF, que causou dois episódios de erro de coluna antes disso.
- `tm-130.json`: extraído mecanicamente de `docs/Tabelas_Zonas_Giro.xlsx` (mesma técnica) — corrigiu uma inferência anterior sobre células mescladas na Zona II (65°/70° = 3.800 kg, não 3.700 kg).

## Convenções de código

- Nomes de domínio (tipos, campos, funções que representam conceitos do problema — `Guindaste`, `capacidadeMaximaKg`, `calcularCapacidadeMaxima`, `quadranteOuZona` etc.) ficam **em português**, para bater com a documentação e com os termos que aparecem nas fichas técnicas reais. Termos genéricos de programação (nomes de hooks, bibliotecas, padrões) seguem o inglês normal do ecossistema (`useState`, `props`, etc.).
- Comentários e docstrings em português.
- O motor de cálculo (`app/src/engine/`) é TypeScript puro, sem dependência de UI — mantenha assim (é o que permite testá-lo isoladamente, RNF Confiabilidade).
- Toda mudança no motor de cálculo precisa vir com teste no Vitest usando valores **reais** das tabelas (não fictícios) sempre que possível.

## Roadmap — onde estamos

Ver `ROADMAP.md` (Épico → Task → Sub-task completo) e `BACKLOG.md` (visão de sprints). Resumo:

- **Épico 0** — ✅ concluído (POC aprovado pela turma).
- **Épico 1** — ✅ concluído: MD-300L (tabelas principais + JIB) e TM-130 digitalizados e conferidos.
- **Épico 2** — ✅ concluído: `app/src/engine/calcularCapacidadeMaxima.ts` faz interpolação, somatório de cargas, arredondamento para baixo e correção geométrica (RF11 — `raioM` pode vir pronto ou ser derivado de `comprimentoLancaM`+`anguloLancaGraus` via `engine/geometriaLanca.ts`), testado com 28 casos contra dados reais confirmados do MD-300L e do TM-130.
- **Épico 3** — ✅ concluído: canvas arrastável (`components/CanvasLanca.tsx`, react-konva), toggle de JIB ligado ao motor (`calcularCapacidadeMaximaJIB`), campos sincronizados nos dois sentidos e busca reversa por peso (`components/BuscaReversa.tsx` + `engine/buscaReversa.ts`, RF05/RF15).
- **Épico 4–6** — ⬜ não iniciados.

## Pendência conhecida (não bloqueia o desenvolvimento)

O critério exato do quadrante frontal/lateral-traseira do MD-300L (Figuras A/B da planilha, com erro `#VALUE!`) ainda não foi esclarecido pela empresa — Gustavo vai perguntar para a turma. Não impede digitalizar o resto da tabela nem seguir com o Épico 1/2/3.
