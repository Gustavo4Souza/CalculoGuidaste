# Guindastes Ribas Ltda. — Ferramenta de Simulação de Tabelas de Carga

Documentação técnica de apoio ao desenvolvimento do projeto (Disciplina **Jornada** — 8º Semestre).

Ferramenta gráfica e interativa que substitui o cruzamento manual de tabelas de carga impressas, calculando em tempo real, nos dois sentidos:

1. **Peso da peça/máquina → configuração de guindaste necessária** (comprimento de lança, raio de trabalho).
2. **Guindaste + configuração (raio/lança) → capacidade máxima de carga permitida.**

> **Fonte de verdade do projeto:** toda decisão, requisito e o roadmap completo vivem na [página do Notion](https://app.notion.com/p/3da034f53a1280df8666fc97c0590e38). Os arquivos `.md` desta pasta são a referência técnica detalhada para quem for codar — mantidos em sincronia com o Notion, mas em caso de dúvida o Notion manda.

## Repositório

Código versionado em: **https://github.com/Gustavo4Souza/CalculoGuidaste**. O código de produção fica na pasta `app/` (React + TypeScript + Vite) — ver `app/README.md`. Desenvolvendo com Claude Code? Leia o `CLAUDE.md` na raiz primeiro.

## Documentos

1. [ARQUITETURA.md](./ARQUITETURA.md) — decisão de arquitetura (Web App), stack tecnológica e decisões de UI/UX.
2. [REQUISITOS_TECNICOS.md](./REQUISITOS_TECNICOS.md) — requisitos funcionais RF01–RF15, requisitos técnicos por módulo e modelo de dados (duas variantes de tabela de carga).
3. [BACKLOG.md](./BACKLOG.md) — backlog priorizado em sprints, critérios de aceite e próximos passos imediatos.
4. [ROADMAP.md](./ROADMAP.md) — roadmap completo Épico → Task → Sub-task, espelhando a seção 9 do Notion.

## Dados reais recebidos da empresa (13/09/2026)

A empresa forneceu 3 arquivos que **substituem os dados fictícios** usados na fase de POC — salvos em `docs/` desta mesma pasta:

- `Informações gerais - içamento.xlsx` — guia de cálculo campo a campo por guindaste (revela a regra do somatório de cargas e as duas estruturas de tabela diferentes).
- `Tabela Guindaste MD-300L.pdf` — ficha técnica da Madal Palfinger (30 t a 3.000 mm).
- `TM_130.pdf` — ficha técnica do Grupo Luna (26.000 kgf a 5 m).

## Premissas ativas

- **Frota do MVP**: apenas os dois guindastes reais recebidos — MD-300L e TM-130. Cadastro de novos modelos é melhoria futura (Épico 6).
- **Regra de negócio central**: a capacidade deve ser validada contra o **somatório** de carga içada + massa da lingada + massa do cabo de aço + massa do balancim (opcional) — nunca a carga isolada.
- **Unidade interna**: kg (kgf e kg tratados como equivalentes). A interface oferece um seletor de exibição kg ⇄ toneladas (RF14), mas o cálculo é sempre em kg.
- **Arredondamento**: o motor de cálculo sempre arredonda a capacidade interpolada para baixo (piso de segurança) — nunca otimista.
- **Rastreabilidade**: todo item de requisito/backlog referencia o RF/RNF correspondente consolidado no Notion (não existe um `SRS_Guindastes_Ribas.docx` separado da empresa) e/ou o caso de uso da Estação 1 (UC01/UC02/UC03).
- **Entregáveis acadêmicos**: a página do Notion, mantida sempre atualizada, é a entrega formal do projeto — não haverá TAP/Escopo, UML ou Matriz de Rastreabilidade como arquivos separados. O artigo científico continua sendo um entregável à parte (ver ROADMAP.md, Épico 5).
- **Pendência conhecida**: o critério exato do quadrante frontal/lateral-traseira do MD-300L (Figuras A/B da planilha, com erro `#VALUE!`) ainda não foi esclarecido — não bloqueia o início do desenvolvimento, só a divisão fina dentro da tabela do MD-300L.
