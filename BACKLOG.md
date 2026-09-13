# Backlog Priorizado

> Visão de sprints do projeto. O detalhamento completo Épico → Task → Sub-task (com status de cada item) está em [ROADMAP.md](./ROADMAP.md), espelhando a seção 9 do Notion. Este backlog organiza esses épicos em sprints, com critérios de aceite.

O Épico 0 (fundamentos, decisão de arquitetura, documentação inicial e POC) está **concluído** — POC apresentado e aprovado pela turma em 20/08/2026. A partir daqui, o trabalho é migrar do POC (dados fictícios) para o produto real (dados do MD-300L e do TM-130).

## Sprint 1 — Ingestão de dados reais (Épico 1) ✅ Concluída (13/09/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S1-01 | Setup do projeto (Vite + React + TS), conectar ao repositório GitHub (`Gustavo4Souza/CalculoGuidaste`), deploy inicial no Vercel | Alta | Task 3.1 |
| S1-02 | ✅ Digitalizar a tabela do MD-300L (frontal + lateral/traseira + JIB) em JSON, variante comprimento+raio+quadrante | Alta | Task 1.1 |
| S1-03 | ✅ Digitalizar a tabela do TM-130 (Zona I/II × ângulo) em JSON, variante zona+ângulo — conferido contra planilha extraída da ficha técnica | Alta | Task 1.2 |
| S1-04 | ✅ Definir o schema JSON comum que suporta as duas variantes | Alta | Task 1.3 |

**Pronto quando**: as duas tabelas estão digitalizadas e validadas manualmente contra pelo menos 3 pontos de cada tabela impressa. ✅ Atingido — ver `app/src/data/tabelas/README.md` e os testes em `app/src/engine/calcularCapacidadeMaxima.test.ts` / `calcularCapacidadeMaximaTM130.test.ts`. S1-01 (setup/deploy) ainda não foi formalmente concluído nesta sprint, mas o esqueleto do projeto (`app/`) já existe e roda localmente.

## Sprint 2 — Motor de cálculo v2 (Épico 2) ✅ Concluída (13/09/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S2-01 | ✅ Interpolação para as duas variantes de tabela (comprimento+raio+quadrante e zona+ângulo) | Alta | Task 2.1 / RT-MC02 |
| S2-02 | ✅ Arredondamento sempre para baixo (piso de segurança) no resultado interpolado | Alta | Task 2.1 / RT-MC05 |
| S2-03 | ✅ Correção geométrica (altura do pé da lança + recuo), por guindaste — `engine/geometriaLanca.ts` | Alta | Task 2.2 / RT-MC03 |
| S2-04 | ✅ Somatório de cargas (carga içada + lingada + cabo de aço + balancim opcional) | Alta | Task 2.3 / RF09-RF10 |
| S2-05 | ✅ Testes unitários com os valores exatos das tabelas reais do MD-300L e do TM-130 | Alta | Task 2.4 / RNF Confiabilidade |

**Pronto quando**: `calcularCapacidadeMaxima()` funciona para os dois guindastes reais, incluindo somatório de pesos e correção geométrica. ✅ Atingido — 28 testes unitários passando (motor de cálculo dos 2 guindastes + geometria da lança), typecheck e build de produção verificados.

## Sprint 3 — Interface gráfica de produção (Épico 3) ✅ Concluída (13/09/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S3-01 | ✅ Migrar o POC (vanilla JS) para React + react-konva | Alta | Task 3.1 |
| S3-02 | ✅ Seletor manual de quadrante/zona (toggle/dropdown, sem view de giro) | Alta | Task 3.2 / RF08 |
| S3-03 | ✅ Toggle de uso de JIB, exibido só para guindastes com `possuiJIB = true` — ligado ao motor de cálculo | Média | Task 3.3 / RF12 |
| S3-04 | ✅ Campos numéricos sincronizados com o canvas (comprimento de lança, raio) | Alta | Task 3.4 |
| S3-05 | ✅ Busca reversa (RF05/RF15): campo "Peso a içar" + lista ordenada por menor guindaste primeiro | Alta | Task 3.5 |

**Pronto quando**: a interface de produção reproduz a linha de raciocínio aprovada do POC, mas com dados reais e todos os requisitos novos (RF08–RF15). ✅ Atingido — 39 testes unitários + 3 testes Playwright (e2e) passando, build de produção verificado. S1-01 (deploy inicial no Vercel) segue pendente, arrastada das sprints anteriores.

## Sprint 4 — Alertas, validação, testes finais e apoio ao pitch/artigo (Épicos 4 e 5)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S4-01 | ✅ Indicador visual verde/âmbar/vermelho com % de margem de segurança | Alta | Task 4.1 |
| S4-02 | ✅ Revisão de usabilidade: fluxo completo em até 3 cliques/1 arrasto — confirmado (1 clique + 1 arrasto) e um bug real de digitação corrigido | Média | Task 4.2 |
| S4-03 | Testes de fluxo ponta a ponta (Playwright) para os dois guindastes — parcialmente coberto (5 specs em `e2e/simulador.spec.ts`, cobrindo MD-300L/JIB/TM-130), falta ampliar para UC02 completo | Baixa | Task 5.1 |
| S4-04 | Roteiro e gravação do vídeo pitch com o protótipo de produção funcionando | Alta | Task 5.2 |
| S4-05 | Levantamento bibliográfico e redação do artigo científico | Alta | Task 5.3 |

**Épico 4 concluído (13/09/2026)**: 39 testes unitários + 5 testes Playwright passando, build de produção verificado.

## Backlog futuro (Épico 6, opcional — se sobrar tempo)

- Tela simples de Administrador para cadastro/edição de guindastes e tabelas (RF13).
- Suporte a cadastro de novos modelos de guindaste além do MD-300L e do TM-130.
- Parametrizar a extensão das sapatas (hoje sempre assumida como máxima).

## Critérios de Aceite / Definition of Done

- Todo item do backlog só é considerado "pronto" se: (1) rastreável a um RF/RNF consolidado no Notion, (2) coberto por pelo menos um teste (unitário ou de fluxo) quando aplicável, e (3) demonstrável na tela sem erros de console.
- O motor de cálculo deve retornar exatamente os valores da tabela de carga real (MD-300L/TM-130) nos pontos exatos, e valores coerentes (monotônicos, sempre arredondados para baixo) nos pontos interpolados — validação de RNF Confiabilidade.
- A interação de arrasto (UC02) não pode apresentar lag perceptível em uma máquina comum — validação de RNF Desempenho.

## Próximos Passos Imediatos

Com os Épicos 1 a 4 concluídos (dados reais, motor de cálculo v2, interface gráfica de produção e alertas/usabilidade — 39 testes unitários + 5 e2e passando), o foco agora é o Épico 5:

1. **S4-03** — Ampliar os testes de fluxo ponta a ponta (Playwright): hoje cobrem MD-300L/JIB/TM-130/busca reversa/indicador de status, falta um UC02 mais completo (arrasto real no canvas simulando ponteiro, não só preencher campos).
2. **S4-04** — Roteiro e gravação do vídeo pitch com o protótipo de produção funcionando (já dá pra gravar — os 4 primeiros épicos estão prontos).
3. Formalizar o S1-01 (deploy inicial no Vercel), pendência que ficou em aberto desde a Sprint 1.
4. Manter a página do Notion atualizada a cada decisão — é a entrega acadêmica formal do projeto.
5. Em paralelo, seguir o levantamento bibliográfico do artigo científico (**S4-05** — já há um template e um rascunho em `docs/`).
