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
   - **TM-130**: **zona de giro** (`I` | `II`, regiões discretas — não se interpola entre zonas) × **raio**, no diagrama polar "Com sapata para lança principal" (faixas em degrau conservador; transcrição pendente, Task 10.1). ⚠️ A tabela zona × **ângulo** (`tm-130-jib.json`, antigo `tm-130.json`) é a **"Com sapata para lança JIB"** (achado de 05/10/2026).
   - **Revisado em 05/10/2026 (RF18):** quadrante/zona passam a ser **derivados do giro da superestrutura** (0–360°, ou o limite mecânico da ficha). Os limites angulares vivem SÓ em `app/src/config/criteriosDeGiro.ts`: MD-300L frontal |giro| ≤ 55° (setor de 110° da ficha, **PROVISÓRIO**, com selo na UI/relatório); TM-130 Zona I ≤ 16° / Zona II ≤ 60° (da ficha, giro total de 120°). Na fronteira exata, vale a menor capacidade.
3. **Unidade interna sempre em kg** (kgf e kg são tratados como equivalentes — não há conversão real, é só rótulo). A UI oferece um seletor de exibição kg ⇄ toneladas (RF14), mas o cálculo interno nunca muda de unidade.
4. **Arredondamento de segurança (RT-MC05)**: todo resultado interpolado (fora de um ponto exato da tabela do fabricante) é sempre arredondado **para baixo**. Nunca ser otimista com a capacidade.
5. **JIB**: só o MD-300L está habilitado (`possuiJIB = true`). O TM-130 tem tabela de JIB na ficha (5,1 m, `tm-130-jib.json`), mas fica **desligado** até a Ribas confirmar se a unidade dela tem JIB. JIB do MD-300L: comprimento discreto (9,0/15,5/20,0 m), exige a lança em 32,10 m; offset entre 10°/25°/40° é interpolado (arredondando para baixo), fora disso → sem dado.
6. **RF15 (lista de configurações viáveis)**: ordenar sempre por **menor guindaste primeiro** (capacidade nominal), nunca pelo maior.
7. **Frota fechada em 2 guindastes** (MD-300L e TM-130) neste MVP — cadastro de novos modelos é melhoria futura (Épico 6).
8. **Sapatas parametrizáveis, mas só a extensão máxima tem capacidade validada** (revisado em 05/10/2026). Qualquer outra extensão → "Sem dado do fabricante".
9. **Regra de ouro (RF17)**: ponto exato → valor exato; entre pontos → interpolação arredondada para baixo; fora da cobertura da tabela (sapata parcial, passagem de cabo diferente da tabela, JIB fora da lança exigida, raio sem célula, giro além do limite) → status `sem_dado` com o motivo, **nunca** um valor inventado. O mapa da área de operação (RF22) segue a mesma regra porque usa o mesmo motor. Valores que não constam nas fichas ficam em `app/src/data/especificacoes/*.json` com `"fonte": "aproximado"` (selo ≈).
10. **Somatório (RF20)**: a "massa do cabo de aço" da planilha é o **cabo de içamento pendurado** (comprimento pendente × pernas × massa linear, sobrescrevível); o moitão só entra pelo excedente sobre o gancho que a tabela já inclui (MD-300L: 235 kg principal / 67 kg JIB).

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
- **Épico 3** — ✅ concluído: seleção de guindaste, quadrante/zona, toggle de JIB ligado ao motor (`calcularCapacidadeMaximaJIB`), campos sincronizados nos dois sentidos e busca reversa por peso (`components/BuscaReversa.tsx` + `engine/buscaReversa.ts`, RF05/RF15). O canvas original desta task (react-konva) foi **substituído** no Épico 7.
- **Épico 4** — ✅ concluído: indicador visual de status (`components/IndicadorStatus.tsx`) e revisão de usabilidade — fluxo principal confirmado em 1 clique + 1 arrasto; corrigido um bug real de digitação no campo "Raio de trabalho" (`components/useCampoNumericoSincronizado.ts`).
- **Épico 5** — 🟡 quase concluído: testes e2e de UC02 completo para os dois guindastes (`e2e/simulador.spec.ts`, arrasto real via `page.mouse`, agora projetando pontos 3D exatos); roteiro do vídeo pitch pronto (`docs/Roteiro_Video_Pitch.md`, falta só gravar); rascunho do artigo científico com bibliografia real e seções de resultado/conclusão prontas (`docs/Artigo_Secoes_Pendentes.md`, falta transcrever para o `.docx`).
- **Épico 6** — ⬜ não iniciado.
- **Épico 7** — ✅ concluído (13/09/2026): pedido do Gustavo para trazer "uma terceira dimensão" e usar a tela inteira sem scroll. `components/CanvasLanca.tsx` (react-konva, 2D) foi substituído por `components/CenaGuindaste3D.tsx` (react-three-fiber/three.js — WebGL real, câmera fixa + `OrbitControls`), mantendo a mesma física de arrasto (só o ângulo, plano vertical fixo, RF08). `App.tsx` virou um shell de abas em tela cheia ("Simulação" sempre visível / "Buscar por peso" isolada). O JIB (RF12, já existente desde o Épico 3) agora aparece com destaque visual próprio na cena 3D. **Nenhuma mudança no motor de cálculo, no schema de dados ou nas regras de negócio** — confirmado explicitamente com o Gustavo antes de implementar. `CanvasLanca.tsx` (órfão) já foi apagado, e um `executablePath` de Chromium fixo em Linux no `playwright.config.ts` — que quebrava todo o e2e no Windows — foi corrigido (ver ROADMAP.md, Épico 7).
- **Épico 8** — ✅ concluído (14/09/2026): visual industrial escuro (painel de controle estilo HUD, `index.css`/`App.css` reescritos com paleta fixa — não depende de `prefers-color-scheme` — acentos âmbar/laranja de segurança, tipografia monoespaçada) e comprimento da lança arrastável direto na cena 3D (`components/CenaGuindaste3D.tsx`), complementando o seletor discreto. Comprimento contínuo, limitado (`clamp`) ao domínio real da tabela (10,50–32,10 m) — decisão documentada no ROADMAP.md; modo JIB continua travado no máximo e o TM-130 continua sem esse controle, por serem limitações reais dos dados do fabricante. Indicador de resultado ganhou um "medidor" estilo instrumento (`components/MedidorCapacidade.tsx`, barra de limite com % da capacidade). Motor de cálculo, schema de dados e regras de negócio **não mudaram**. 49 testes unitários + 8 e2e passando (confirmado em múltiplas execuções, incluindo uma verificação independente no Claude Desktop em 14/09/2026 — ver ROADMAP.md). Dois bugs de ambiente relacionados a WebGL/timing foram encontrados e corrigidos durante a validação (ver ROADMAP.md, Épico 8, Task 8.3) — nenhum deles afeta a lógica de negócio.
- **Épicos 10–16** — planejados em 05/10/2026 (simulador profissional 100% parametrizável, RF16–RF26; ver ROADMAP.md). **Épico 10 🟡**: motor v3 `engine/avaliarCenario.ts` pronto (ponto de entrada único: giro → quadrante/zona, sapatas, JIB, pernas, cabo, moitão, altura, limite do engenheiro, estado `sem_dado`), com `data/catalogo.ts` (`CATALOGO`, `VERSAO_TABELAS`), `config/criteriosDeGiro.ts` e `data/especificacoes/*.json`. 90 testes unitários + 9 e2e. Falta a tabela polar do TM-130 (Task 10.1, depende do Gustavo). A UI ainda usa o motor antigo até o Épico 11.
- **Épico 11** — ✅ concluído (05/10/2026): `store/useSimulacaoStore.ts` tem `cenario: ParametrosDoCenario` como **único** estado editável e `avaliacao` sempre derivada por `avaliarCenario`; todo campo/arrasto escreve só ali (ações com limite mecânico da ficha). `components/CampoParametro.tsx` (rótulo, unidade, faixa, selo ≈), `PainelParametros.tsx` (todos os parâmetros), `PainelResultado.tsx`/`IndicadorStatus.tsx` (OK/Atenção/NOK/Sem dado). Seletor manual de quadrante/zona removido. TM-130 fora da busca reversa até a tabela polar. `<Canvas frameloop="demand">`: a cena só renderiza quando algo muda (antes gastava ~20 quadros/s parada e deixava o e2e intermitente). 102 unitários + 11 e2e.
- **Épico 12** — ✅ concluído (05/10/2026): interface estilo SolidWorks em **tema claro** (substitui o tema escuro do Épico 8). `App.tsx` = `BarraDeComandos` | `Simulador` (árvore `ArvoreParametros` | viewport | `PainelResultado`) | `BarraDeStatus`, + `DialogoBuscaReversa`. Preferências de UI (kg/t — RF14, vista, diálogo) ficam em `store/useInterfaceStore.ts`, **fora** do cenário. Viewport: `GizmoViewcube`, vistas padrão em `components/cena/ControladorDeVista.tsx` (frontal/lateral/superior enquadram o guindaste atual; a **isométrica é fixa** porque os testes e2e projetam pontos com ela — não mudar `VISTA_ISOMETRICA` sem ajustar o e2e) e cotas em `components/cena/Cotas.tsx` (valores do motor). Comandos de persistência/PDF ficam desabilitados até os Épicos 15/16. 102 unitários + 12 e2e.
- **Épico 13** — ✅ concluído (05/10/2026): modelo 3D fiel às fichas. **Referencial da cena: origem no CENTRO DE GIRO**, caminhão parado ao longo de X, superestrutura gira em Y (giro 0° → +X; MD-300L = frente/cabine, TM-130 = traseira; horário visto de cima), pé da lança em x = −recuo — ver `components/cena/geometriaCena.ts`. Medidas do caminhão em `especificacoes/*.json` (`caminhao`, `superestrutura`, `giroZeroApontaPara`), cada uma com a fonte. Cena em módulos (`components/cena/`), lê a store direto. Arrastáveis: gancho (ângulo; com JIB, raio), lança (comprimento), anel no chão (giro), pé de cada sapata (extensão), barra do JIB (ângulo), esferas do JIB (comprimento). Todo `<Html>` que é só rótulo usa `style={SEM_PONTEIRO}` (a prop `pointerEvents` do drei não vale fora do modo `transform` — sem isso o rótulo bloqueia o clique). O e2e importa a câmera de `cena/ControladorDeVista` (não de `CenaGuindaste3D`, que importa JSON). 108 unitários + 15 e2e.
- **Épico 14** — ✅ concluído (05/10/2026): mapa da área de operação no chão (RF22). `engine/mapaAreaOperacao.ts` varre giro × raio chamando **a própria `avaliarCenario`** (nunca duplique regra de capacidade no mapa); célula = pior status dos 4 cantos. Desenho em `components/cena/MapaNoChao.tsx`, cálculo memoizado sem giro/ângulo em `cena/useMapaAreaOperacao.ts`, legenda `cena/LegendaMapa.tsx` **no painel de resultado** (sobre a viewport ela cobria peças arrastáveis — não colocar overlays DOM sobre a cena sem conferir os pontos de arrasto do e2e). 117 unitários + 16 e2e.
- **Épico 9** — ✅ concluído (14/09/2026): guindaste 3D redesenhado (cabine, chassi, rodas, sapatas, lança em seções, moitão com risca/chevron) em estilo técnico/linha amarelo/preto/cinza, para os dois guindastes — caminhão/base sempre posicionado fora do quadrante de operação da lança. O painel lateral "Posição da lança" saiu (exceto o sub-painel do JIB, fora de escopo): "Comprimento", "Raio de trabalho" (MD-300L) e "Ângulo da lança" (TM-130) agora são campos embutidos diretamente na cena 3D. Os 7 comprimentos reais do MD-300L viraram marcas de encaixe visuais na lança (decisão confirmada com o Gustavo via `AskUserQuestion`): arrasto livre longe de uma marca, ímã perto dela, pulo exato ao clicar em cima (`geometriaCanvas.ts: aplicarSnapComprimento`). Três bugs reais de integração R3F/drei/OrbitControls foram encontrados e corrigidos no caminho (digitação corrompida em `<input type="number">` dentro de `<Html>`, a câmera do `<Canvas>` "brigando" com o `OrbitControls` por causa de um objeto de config recriado a cada render, e o `OrbitControls` podendo orbitar durante um arrasto customizado da lança/gancho — ver ROADMAP.md, Épico 9, para os detalhes). Motor de cálculo, schema de dados e regras de negócio **não mudaram**. 54 testes unitários + 9 e2e passando, verificado em múltiplas execuções (ver ROADMAP.md).

## Pendência conhecida (não bloqueia o desenvolvimento)

As Figuras A/B da planilha (`#VALUE!`) são imagens dentro da célula: setor frontal de 110° e lateral/traseiro de 250°. O critério ±55° está implementado como **PROVISÓRIO** em `app/src/config/criteriosDeGiro.ts`; falta a Ribas confirmar. Também a confirmar: orientação "0° = traseira" do TM-130, faixas da tabela polar, se a unidade TM-130 da Ribas tem JIB, ângulo máximo da lança do MD-300L (85°, aproximado), massa linear do cabo 5/8" e os valores "aproximado" das especificações.

## Achado da verificação de 14/09/2026 — ✅ corrigido em 05/10/2026

`channel: 'chromium'` foi adicionado ao bloco `use` de `app/playwright.config.ts` (Task 10.0).
