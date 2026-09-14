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
| S4-03 | ✅ Testes de fluxo ponta a ponta (Playwright) para os dois guindastes — 7 specs em `e2e/simulador.spec.ts`, incluindo UC02 completo (arrasto real via `page.mouse`) para o MD-300L e o TM-130 | Baixa | Task 5.1 |
| S4-04 | 🟡 Roteiro pronto (`docs/Roteiro_Video_Pitch.md`); gravação pendente (depende do Gustavo) | Alta | Task 5.2 |
| S4-05 | 🟡 Levantamento bibliográfico feito e seções de resultado/conclusão redigidas (`docs/Artigo_Secoes_Pendentes.md`); falta transcrever para o `.docx` final | Alta | Task 5.3 |

**Épico 4 concluído (13/09/2026)**: 39 testes unitários + 5 testes Playwright passando, build de produção verificado.

## Sprint 5 — Redesenho de layout: 3D (WebGL) e tela cheia (Épico 7) ✅ Concluída (13/09/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S5-01 | ✅ Substituir o canvas 2D (react-konva) por uma cena WebGL real (react-three-fiber/three.js), mantendo a mesma física de arrasto (só ângulo, plano vertical fixo) | Alta | Task 7.1 |
| S5-02 | ✅ Layout em tela cheia (100vh/100vw), sem scroll de página, com abas: "Simulação" (fluxo principal sempre visível) e "Buscar por peso" (RF05/RF15, isolada) | Alta | Task 7.2 |
| S5-03 | ✅ Expor o JIB (RF12) visualmente na cena 3D — segmento com cor/ângulo próprios, rótulos, nota do tradeoff alcance×capacidade×ângulo | Média | Task 7.3 |
| S5-04 | ✅ Reescrever os testes de arrasto (e2e) para a cena 3D, com projeção exata via `three.js` | Alta | Task 7.4 |

**Pronto quando**: a tela de simulação usa toda a viewport sem scroll, tem uma visualização 3D navegável do guindaste, e o JIB aparece claramente destacado — tudo sem alterar o motor de cálculo. ✅ Atingido — 44 testes unitários + 7 e2e passando, build de produção verificado. Pedido explicitamente pelo Gustavo (layout "muito simples"), não fazia parte do roadmap original.

**Pendência de limpeza manual (fora do alcance do assistente):** apagar `app/src/components/CanvasLanca.tsx`, órfão desde a S5-01.

## Sprint 6 — UI/UX industrial (painel escuro) + lança ajustável por arrasto (Épico 8) ✅ Concluída (14/09/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S6-01 | ✅ Redesenho visual em painel de controle industrial (tema escuro/HUD, acentos de segurança amarelo/laranja, tipografia técnica) | Alta | Task 8.1 |
| S6-02 | ✅ Permitir arrastar a lança na cena 3D para ajustar o comprimento (não só o ângulo), complementando o seletor discreto já existente | Alta | Task 8.2 |
| S6-03 | ✅ Testes (não previstos originalmente): +1 e2e (arrasto de comprimento) e +5 unitários (`projetarComprimento`) | Alta | Task 8.3 |

**Pronto quando**: a UI tem uma linguagem visual industrial consistente (tema escuro, acentos de segurança) e o comprimento da lança pode ser ajustado por arrasto na cena 3D, com snap decidido e documentado — mantendo intactos o motor de cálculo, o schema de dados e as regras de negócio. ✅ Atingido — 49 testes unitários + 8 e2e passando, typecheck e build limpos (ver ROADMAP.md, Épico 8, para o detalhe da verificação independente feita no Claude Desktop).

**Limitações de dados respeitadas (confirmado no código, não é trabalho pendente)**: no modo JIB a lança principal fica travada no comprimento máximo (a tabela de JIB não tem esse eixo); o TM-130 não tem eixo de comprimento na tabela real (só zona×ângulo).

**Nota de processo:** esta sprint foi levantada e esclarecida no Claude Desktop (13/09/2026), implementada numa sessão do Claude Code, e depois auditada/verificada de novo no Claude Desktop (14/09/2026) — sem alterar o código, só lendo, testando numa cópia isolada e atualizando esta documentação, conforme combinado com o Gustavo.

**Achado da verificação (14/09/2026), para corrigir num próximo Claude Code:** `app/playwright.config.ts` não seta de fato `channel: 'chromium'` no bloco `use`, apesar do comentário do arquivo dizer que sim — ver ROADMAP.md (Épico 8) para o detalhe. Não é um bug de negócio nem trava o Gustavo hoje, mas deixa o comportamento real do arquivo divergente do que ele documenta.

## Sprint 7 — Guindaste 3D mais realista + campos embutidos na cena (Épico 9) 🔲 Não iniciada (14/09/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S7-01 | 🔲 Modelo 3D mais detalhado do guindaste (cabine, rodas, base, lança em seções, moitão com risca), estilo técnico/linha amarelo/preto/cinza, para os dois guindastes (MD-300L e TM-130) | Alta | Task 9.1 |
| S7-02 | 🔲 Remover o painel "Posição da lança" (incluindo o dropdown de comprimento) e embutir os campos de comprimento exato e raio de trabalho como rótulos sobre a própria lança, dentro do desenho 3D | Alta | Task 9.2 |

**Pronto quando**: o guindaste 3D parece de fato um guindaste (não uma forma abstrata), no estilo técnico/linha combinando com o tema HUD já existente (Épico 8), e os campos de comprimento/raio ficam embutidos no próprio desenho — sem alterar o motor de cálculo, o schema de dados ou as regras de negócio. Pedido explicitamente pelo Gustavo, com referências visuais anexadas e 3 decisões confirmadas nesta sessão do Claude Desktop (ver ROADMAP.md, Épico 9).

**Ponto em aberto para a implementação:** como os 7 comprimentos reais da tabela do MD-300L ficam acessíveis sem o dropdown (ex.: marcas ao longo da lança) — a confirmar com o Gustavo antes de codar.

**Nota de processo:** esta sprint foi levantada e esclarecida no Claude Desktop (14/09/2026) — a implementação (Task 9.1/9.2) acontece numa sessão do Claude Code.

## Backlog futuro (Épico 6, opcional — se sobrar tempo)

- Tela simples de Administrador para cadastro/edição de guindastes e tabelas (RF13).
- Suporte a cadastro de novos modelos de guindaste além do MD-300L e do TM-130.
- Parametrizar a extensão das sapatas (hoje sempre assumida como máxima).

## Critérios de Aceite / Definition of Done

- Todo item do backlog só é considerado "pronto" se: (1) rastreável a um RF/RNF consolidado no Notion, (2) coberto por pelo menos um teste (unitário ou de fluxo) quando aplicável, e (3) demonstrável na tela sem erros de console.
- O motor de cálculo deve retornar exatamente os valores da tabela de carga real (MD-300L/TM-130) nos pontos exatos, e valores coerentes (monotônicos, sempre arredondados para baixo) nos pontos interpolados — validação de RNF Confiabilidade.
- A interação de arrasto (UC02) não pode apresentar lag perceptível em uma máquina comum — validação de RNF Desempenho.

## Próximos Passos Imediatos

Com os Épicos 1 a 4, 7 e 8 concluídos (dados reais, motor de cálculo v2, interface gráfica de produção — agora em 3D/tela cheia, visual industrial e lança arrastável — e alertas/usabilidade), o próximo trabalho de desenvolvimento é o Épico 9, e falta fechar o Épico 5:

1. **S7-01/S7-02 (Épico 9)** — Modelo 3D mais realista do guindaste e campos de comprimento/raio embutidos na cena — próximo trabalho de desenvolvimento, feito no Claude Code.
2. **Achado da verificação do Épico 8** — corrigir `app/playwright.config.ts` (falta a chave `channel: 'chromium'` que o próprio comentário do arquivo já diz existir) numa próxima sessão do Claude Code.
3. **S4-04** — Roteiro e gravação do vídeo pitch com o protótipo de produção funcionando (vale regravar as capturas de tela depois do Épico 9, com o novo modelo 3D).
4. Formalizar o S1-01 (deploy inicial no Vercel), pendência que ficou em aberto desde a Sprint 1.
5. Manter a página do Notion atualizada a cada decisão — é a entrega acadêmica formal do projeto.
6. Em paralelo, seguir o levantamento bibliográfico do artigo científico (**S4-05** — já há um template e um rascunho em `docs/`).
