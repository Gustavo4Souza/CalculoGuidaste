---
tipo: decisao
status: ativo
criado: 2026-10-07
tags:
  - projeto
aliases:
  - Decisões
  - ADR
---

# 🗳️ Decisões e Configuração

Registro das decisões do projeto, da mais antiga para a mais recente. Decisão nova: acrescente uma linha aqui e uma no [[🗓️ Log de Atualizações]].

## Produto e arquitetura

| Data | Decisão | Motivo | Alternativas descartadas |
|---|---|---|---|
| 20/08/2026 | **Web app**, não executável | Sem instalação, portável, deploy gratuito, bom para a banca | Executável desktop |
| 20/08/2026 | Desktop/notebook como alvo do MVP | Escopo do semestre | Responsivo para celular/tablet |
| 13/09/2026 | Dados **reais** dos fabricantes substituem os fictícios do POC | A Ribas enviou as fichas e a planilha | — |
| 13/09/2026 | Frota fechada em **MD-300L e TM-130** | São os dois guindastes cujos dados existem | Cadastro de modelos (Épico 6) |
| 13/09/2026 | Busca reversa inspirada no [Liebherr Crane Finder](https://www.liebherr.com/pt-br/guindastes-moveis-sobre-esteiras-e-pneus/servico/crane-finder-6361887), **menor guindaste primeiro** | Visão econômica: não sugerir sempre o maior | Ordenar pelo maior |
| 13/09/2026 | **Cena 3D com three.js** (react-three-fiber) no lugar do react-konva 2D | Pedido do Gustavo por "uma terceira dimensão" e tela cheia | Manter 2D |
| 14/09/2026 | Comprimento da lança **contínuo** com ímã nas 7 marcas reais | Arrasto livre com precisão nas colunas da tabela | Só seletor discreto |
| 05/10/2026 | Simulador vira ferramenta de engenharia **100% parametrizável** (Épicos 10–16, RF16–RF26) | Planejar operações e montar orçamentos entregues a clientes | — |
| 05/10/2026 | **Cenário como único estado editável**; avaliação sempre derivada | Árvore, cena, resultado e PDF nunca divergem | Estados separados por painel |
| 05/10/2026 | Interface **CAD tema claro** (estilo SolidWorks) | Ferramenta de engenharia, leitura em escritório | Tema escuro/HUD do Épico 8 |
| 05/10/2026 | Origem da cena no **centro de giro** | O raio desenhado é exatamente o raio do motor | Origem no pé da lança |
| 05/10/2026 | **IndexedDB** atrás de `RepositorioProjetos` + exportar/importar JSON | Offline, sem servidor nem login | File System Access API (só Chromium); Supabase (auth, custo, LGPD) |
| 05/10/2026 | Importar projeto é **sempre cópia** (IDs novos) | Nunca sobrescrever dado existente | Mesclar/sobrescrever |
| 05/10/2026 | Legenda do mapa no **painel de resultado** | Sobre a viewport cobria peças arrastáveis | Overlay na viewport |
| 05/10/2026 | Vistas Frontal/Lateral/Superior **enquadram o guindaste**; Isométrica **fixa** | Lança curta ficava minúscula; os e2e projetam pontos com a isométrica | Distância fixa em todas |
| 06/10/2026 | Relatório **recalcula** com as tabelas atuais e avisa versão diferente | O que se entrega tem que refletir os dados vigentes | Imprimir o resultado salvo |
| 06/10/2026 | jsPDF carregado **sob demanda** | ~400 kB só baixam ao exportar | Carregar junto com o app |
| 07/10/2026 | Documentação migra do **Notion para o Obsidian** (esta pasta) | Escolha do Gustavo | Notion |
| 07/10/2026 | Interface **bem próxima do SolidWorks** (CommandManager com abas, FeatureManager, PropertyManager com ✔/✖, barra de vista, painel de tarefas) | Os engenheiros já conhecem o padrão | Só limpar o layout anterior |
| 07/10/2026 | **Veredito em frase primeiro**; a capacidade nunca aparece sozinha como destaque; mesmos nomes de status em tela, diálogos e PDF | O "7.500 kg" em destaque com status "sem dado" parecia aprovação | Número grande no topo |
| 07/10/2026 | Campos de digitação soltos na cena (Task 9.2) **saem**; digitação só no PropertyManager; arrastos ficam | Duplicavam a árvore e se sobrepunham às cotas | Manter os dois |
| 07/10/2026 | Sem dado, as verificações aparecem como **parciais** | O somatório pode estar incompleto; um ✔ enganaria | Mostrar ✔ normal |
| 07/10/2026 | Comando indisponível fica **desabilitado com o motivo** | O engenheiro sabe por que não pode | Esconder o comando |
| 07/10/2026 | Ícones com `lucide-react` | Gratuito, SVG, leve | Ícones desenhados à mão |
| 07/10/2026 | Fluxo de telas com **etapas navegáveis**, **começando pela carga**, orçamento **só técnico** (Épico 18) | Escolha do Gustavo | Assistente linear; começar pelo guindaste; valores comerciais |
| 07/10/2026 | `ARQUITETURA`, `REQUISITOS_TECNICOS`, `BACKLOG` e `ROADMAP.md` **incorporados** às notas e apagados; detalhe por épico em `Épicos/` | Sem duplicidade nem arquivo sem uso | Arquivar numa pasta |

## Regras de cálculo e dados

| Data | Decisão | Motivo |
|---|---|---|
| 13/09/2026 | Validar contra o **somatório** de cargas | Regra da planilha da Ribas |
| 13/09/2026 | Interpolação sempre **arredondada para baixo** | Nunca ser otimista com a capacidade |
| 13/09/2026 | Cálculo interno em **kg**; kg ⇄ t só na exibição | Uma unidade só no motor |
| 13/09/2026 | Tabelas extraídas **mecanicamente** de planilhas transcritas pelo Gustavo | A leitura de texto do PDF errou colunas duas vezes |
| 05/10/2026 | Estado próprio **"Sem dado do fabricante"** (regra de ouro, RF17) | Fora da tabela não existe resposta segura |
| 05/10/2026 | Quadrante/zona **derivados do giro**, critérios num arquivo único | Fiel à operação real; fácil de corrigir quando a Ribas confirmar |
| 05/10/2026 | Na **fronteira** de áreas vale a **menor** capacidade | Segurança |
| 05/10/2026 | TM-130: tabela zona × ângulo é a do **JIB**; a da lança principal é o **diagrama polar** | Legenda da ficha |
| 05/10/2026 | Offset do JIB do MD-300L entre 10°/25°/40° **interpolado**; fora → sem dado | Escolha do Gustavo |
| 05/10/2026 | "Massa do cabo de aço" = **cabo de içamento pendurado**, calculado e sobrescrevível | A lingada da Ribas é de cintas |
| 05/10/2026 | Moitão: só o **excedente** sobre o gancho já incluído na tabela | A ficha do MD-300L diz que a tabela inclui o gancho |
| 05/10/2026 | Sapatas parametrizáveis, mas **só a extensão máxima** é validada | Única condição das fichas |
| 05/10/2026 | Ângulo máximo do MD-300L = **85°** | Com 80° o JIB não alcança raios que a própria tabela lista |
| 05/10/2026 | Mapa da área: célula com o **pior** status dos 4 cantos; usa o próprio `avaliarCenario` | Verde só se a região inteira for; uma regra só |
| 06/10/2026 | TM-130: diagrama polar com **valores sobre os arcos** e **interpolação entre raios** | A transcrição mostrou um valor por raio, não faixas. Substitui o "degrau conservador" de 05/10 |
| 06/10/2026 | Nas 3 divergências planilha × PDF do TM-130, **vale o PDF** | Fonte primária |
| 06/10/2026 | Tolerância de ruído numérico de **1e-6 kg** no arredondamento | Erro de ponto flutuante tirava 1 kg (18.349 em vez de 18.350) |
| 06/10/2026 | Critério ±55° do MD-300L **confirmado** (não é mais provisório) | Documento técnico, item 1 |
| 06/10/2026 | 85° do MD-300L passa a ter **fonte na ficha p.4** | Documento técnico, item 4 |
| 06/10/2026 | Nº de pernas do cabo pode ficar **vazio**; TM-130 começa vazio → sem dado | A ficha não informa; o nº de roldanas não vale como nº de pernas |
| 06/10/2026 | Direção do 0° do TM-130 é **convenção do simulador**, com aviso no relatório; **não bloqueia** o cálculo | As zonas são medidas a partir do 0° do próprio diagrama |
| 06/10/2026 | JIB 20 m/25° do MD-300L **mantido** como impresso | O documento técnico leu a tabela frontal no lugar da lateral |
| 06/10/2026 | Massa linear de referência da internet (0,95–1,10 kg/m) **não vira padrão** | Não é dado da Ribas; errar para menos deixa o cálculo otimista |

## Configuração que muda comportamento

| Onde | O quê | Cuidado |
|---|---|---|
| `app/src/config/criteriosDeGiro.ts` | Setores de giro, referência do 0°, `provisorio`, `aviso` | Mudou? Suba `VERSAO_CRITERIO_GIRO` |
| `app/src/data/especificacoes/*.json` | Limites mecânicos e dimensões com fonte | Campo novo → `VALORES_COM_FONTE` |
| `app/src/data/guindastes.json` | Frota, capacidade nominal, pé da lança, `possuiJIB` | Ligar o JIB do TM-130 só após confirmação |
| `app/src/persistencia/repositorio.ts` | Implementação do repositório | Trocar por backend = trocar esta linha |
| `app/src/persistencia/arquivoDeProjeto.ts` | `SCHEMA_VERSION` e `migrarArquivo` | Formato mudou → nova versão + migração |
| `app/src/components/gerenciador/nos.ts` | A que nó cada motivo de "sem dado" pertence | Motivo novo no motor? Confira o prefixo em `noDoMotivo` |
| `app/vite.config.ts` | `optimizeDeps.include` | Dependência nova de runtime → acrescentar aqui |
| `app/playwright.config.ts` | `channel: 'chromium'`, flags do SwiftShader | Não usar `executablePath` fixo |
| `app/src/components/cena/ControladorDeVista.tsx` | `VISTA_ISOMETRICA` | Mudou? Ajuste os pontos do e2e |

## Relacionado

- [[⚖️ Regras de Negócio]]
- [[🏗️ Arquitetura e Stack]]
- [[❓ Pendências com a Ribas]]
- [[🗓️ Log de Atualizações]]
