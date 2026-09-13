# Artigo científico — seções pendentes (Task 5.3)

> Rascunho para completar `docs/Artigo JA.docx - 8 periodo.pdf`. Copie o conteúdo abaixo para dentro do `.docx` original, nas seções correspondentes, e reaplique a formatação ABNT (fonte Arial 12, justificado, espaçamento 1,5 etc. — o Word não é editável diretamente por mim, então o texto aqui está em Markdown puro).
>
> Também: as citações "(Citação)" que já existem na seção 2 (Fundamentação Teórica) do rascunho atual precisam ser substituídas pelas referências reais abaixo — indiquei qual referência vai em cada uma.

## Onde encaixar as referências já citadas na Fundamentação Teórica

| Trecho no rascunho atual | Citação a usar |
|---|---|
| "Segundo Sommerville, essa área envolve atividades relacionadas à descoberta, análise, documentação e validação dos requisitos..." | SOMMERVILLE (2019) — ver referência completa abaixo |
| "Essa visão também é reforçada por Sommerville e Sawyer, que tratam a Engenharia de Requisitos como um processo sistemático..." | SOMMERVILLE; SAWYER (1997) |
| "Vazquez e Simões destacam que os requisitos são a base de praticamente todas as demais atividades do projeto..." | VAZQUEZ; SIMÕES (2016) |
| "Martins, ao abordar o gerenciamento de projetos de desenvolvimento de software com PMI, RUP e UML..." | MARTINS (2007) |
| "Fontes baseadas no PMBOK descrevem o Project Charter..." / "De acordo com o PMI, a WBS organiza o escopo total do projeto..." | PROJECT MANAGEMENT INSTITUTE (2017) |
| "Especificações técnicas de fabricantes, como a Tadano, apresentam diferentes comprimentos de lança..." | **Substituir "Tadano" pelos fabricantes reais do projeto**: MADAL PALFINGER ([2009?]) e GRUPO LUNA ([20--]) — são as fontes técnicas que o projeto de fato usou, mais precisas que uma citação genérica de um fabricante não utilizado no trabalho |
| "A norma OSHA 1926.1417, por exemplo, estabelece que procedimentos aplicáveis à operação..." | UNITED STATES. OCCUPATIONAL SAFETY AND HEALTH ADMINISTRATION (2010) |
| "Segundo [citação], os requisitos funcionais descrevem os serviços que o sistema deve fornecer..." (seção 3.4) | SOMMERVILLE (2019) — mesma referência da primeira ocorrência |

## 4 APRESENTAÇÃO E DISCUSSÃO DOS RESULTADOS

O desenvolvimento da ferramenta foi conduzido em cinco épicos incrementais, cada um correspondendo a um conjunto coerente de entregas verificáveis, conforme detalhado no roadmap do projeto. Esta seção apresenta os resultados obtidos em cada etapa e discute sua aderência aos requisitos levantados na fundamentação teórica e na metodologia.

### 4.1 Ingestão dos dados reais dos fabricantes

A primeira etapa consistiu na digitalização das tabelas de carga reais dos dois guindastes da frota-piloto: o MD-300L, da Madal Palfinger (capacidade nominal de 30.000 kgf), e o TM-130, do Grupo Luna (capacidade nominal de 26.000 kgf). Confirmou-se, na prática, a hipótese levantada na fundamentação teórica de que as tabelas de carga não seguem um formato único entre fabricantes: o MD-300L estrutura sua tabela por comprimento de lança, raio de operação e quadrante de trabalho (frontal ou lateral/traseiro), enquanto o TM-130 estrutura a sua por zona de giro e ângulo da lança — sem um eixo de raio explícito. Essa divergência exigiu que o modelo de dados do sistema fosse projetado com duas variantes de schema desde o início, unificadas por uma camada de abstração comum consumida pelo motor de cálculo.

Durante a digitalização, duas tentativas iniciais de extração automática de texto a partir dos PDFs das fichas técnicas produziram erros de mapeamento entre colunas e linhas — um risco inerente a tabelas densas, com múltiplas variáveis cruzadas e, no caso do TM-130, células mescladas na diagramação original. A digitalização só foi considerada confiável quando os dados foram extraídos de planilhas eletrônicas estruturadas, criadas manualmente a partir da leitura direta das fichas técnicas impressas e processadas de forma determinística (célula a célula), eliminando a ambiguidade de interpretação. Esse achado reforça, na prática, o requisito RNF03 (precisão dos resultados): a confiabilidade do motor de cálculo depende diretamente da confiabilidade dos dados de entrada, e não apenas da correção do algoritmo de interpolação.

### 4.2 Motor de cálculo

O motor de cálculo foi implementado como um módulo de software independente da interface gráfica, em conformidade com o requisito RNF06 (facilidade de manutenção) e com a separação de responsabilidades discutida na fundamentação teórica. Suas responsabilidades incluem: a interpolação linear da capacidade máxima dentro de uma linha da tabela (RF06); a correção geométrica que converte a posição visual da lança — comprimento e ângulo de elevação — no raio real de trabalho utilizado pela tabela do fabricante, considerando a altura e o recuo do pé da lança de cada guindaste (RF02); o somatório de todas as massas envolvidas na operação de içamento — carga, lingada, cabo de aço e balancim opcional —, validado contra a capacidade da tabela em vez da carga isolada; e o arredondamento sistemático para baixo de qualquer valor interpolado, como piso de segurança (RNF03).

A validação desse motor foi realizada por meio de testes automatizados comparando a saída do sistema com valores exatos das tabelas reais dos dois fabricantes — e não com dados fictícios —, atendendo diretamente ao critério de aceitação do RF04. Ao final do desenvolvimento, o motor de cálculo contava com 39 casos de teste automatizados, cobrindo pontos exatos de tabela, casos interpolados, casos fora da faixa operável (RF05) e a derivação geométrica do raio a partir do ângulo de elevação.

### 4.3 Interface gráfica interativa

A camada de interface foi construída como uma aplicação web em React, com um canvas interativo (biblioteca react-konva) que representa graficamente a lança do guindaste selecionado. O usuário manipula o ângulo de elevação arrastando o ponto correspondente ao gancho, restrito a um arco de raio fixo — o comprimento de lança sendo um parâmetro discreto selecionado à parte, refletindo o próprio caráter discreto dos comprimentos disponíveis na tabela do fabricante. Essa manipulação satisfaz o RF02 (manipulação gráfica das variáveis) e a US02 do levantamento de requisitos.

Como requisito adicional identificado a partir da documentação real recebida da empresa — não previsto no escopo original —, a ferramenta também precisou suportar uma lança JIB opcional, disponível apenas no MD-300L. Essa funcionalidade foi implementada como um caso à parte do motor de cálculo, ativado por um controle que só é exibido quando o guindaste selecionado declara suporte à JIB, evitando a apresentação de uma opção inválida ao usuário.

O indicador de status (RF03/RNF02) foi implementado com três estados — dentro do limite, excede a capacidade e fora da faixa operável —, cada um sinalizado por cor, ícone e mensagem textual, de modo que a informação não dependa exclusivamente da percepção de cor, conforme recomendado pelo requisito não funcional correspondente.

### 4.4 Busca reversa por peso

Como funcionalidade complementar ao fluxo principal — inspirada em ferramentas comerciais do setor que, a partir do peso a içar, sugerem a configuração de guindaste mais adequada —, foi implementada uma busca reversa: o usuário informa o peso da carga e o sistema varre toda a frota cadastrada, retornando a configuração mais econômica de cada guindaste capaz de atender aquele peso, ordenada sempre pelo guindaste de menor capacidade nominal primeiro. Esse critério de ordenação foi uma decisão de projeto deliberada, alinhada à ideia de recomendar a solução mais econômica disponível, e não necessariamente a de maior capacidade.

### 4.5 Revisão de usabilidade

A revisão de usabilidade conduzida ao final do desenvolvimento confirmou que o fluxo principal do sistema — selecionar um guindaste, posicionar a lança e ler o resultado — pode ser completado em um clique e um arrasto, sem exigir múltiplas telas ou etapas intermediárias, atendendo ao RNF01. Essa mesma revisão também identificou um problema real de usabilidade não previsto originalmente: um campo numérico cujo valor exibido era recalculado a cada tecla digitada (por ser derivado de uma conversão geométrica) chegava a interferir na própria digitação do usuário, sobrescrevendo o texto antes que a entrada fosse concluída. A correção desse problema — mantendo um valor de exibição local enquanto o campo está em foco, sincronizado com o valor real apenas ao perder o foco — ilustra como a validação de usabilidade, mesmo em um sistema funcionalmente correto, pode revelar fricções de interação que só se manifestam com o uso real da interface.

## 5 CONSIDERAÇÕES FINAIS

Este trabalho teve como objetivo desenvolver uma ferramenta gráfica e interativa para consulta e simulação de tabelas de carga de guindastes, substituindo o processo manual de cruzamento de tabelas impressas empregado pela empresa Guindastes Ribas Ltda. Os resultados obtidos indicam que o objetivo foi atingido: a ferramenta desenvolvida permite selecionar um guindaste da frota, ajustar graficamente a posição da lança, e obter em tempo real a capacidade máxima permitida para essa configuração, validada contra os dados reais fornecidos pelos fabricantes dos dois equipamentos estudados.

Entre os principais resultados, destacam-se: (i) a demonstração prática de que tabelas de carga de fabricantes distintos podem exigir estruturas de dados fundamentalmente diferentes, o que reforça a importância de um levantamento de requisitos que não pressuponha um formato único de dados antes de conhecer as fontes reais; (ii) a constatação de que a extração automática de dados a partir de documentos PDF não é suficientemente confiável para tabelas técnicas densas, sendo necessária uma etapa de digitalização estruturada e verificável; e (iii) a identificação, por meio de uma revisão de usabilidade dedicada, de um problema de interação que não seria detectado apenas por testes automatizados do motor de cálculo, reforçando a importância de validar a experiência do usuário como uma atividade distinta da validação funcional.

Como sugestão para trabalhos futuros, aponta-se: a extensão do modelo de dados para suportar o cadastro de novos modelos de guindaste além dos dois inicialmente contemplados, sem alteração de código; a implementação de uma tela administrativa para cadastro e edição de tabelas de carga, hoje mantidas como arquivos de dados estáticos; e a condução de testes de usabilidade com usuários reais do domínio — operadores e engenheiros de içamento —, para validar empiricamente critérios de aceitação como o do RNF01, avaliados neste trabalho apenas por inspeção da equipe de desenvolvimento.

## REFERÊNCIAS

GRUPO LUNA. *TM 130*: guindastes hidráulicos telescópicos — especificações técnicas. [S.l.]: Grupo Luna, [20--].

MADAL PALFINGER. *Guindaste Hidráulico MD 300L*: características técnicas. Caxias do Sul: Madal Palfinger, [2009?].

MARTINS, José Carlos Cordeiro. *Gerenciando Projetos de Desenvolvimento de Software com PMI, RUP e UML*. Rio de Janeiro: Brasport, 2007.

PROJECT MANAGEMENT INSTITUTE. *Um Guia do Conhecimento em Gerenciamento de Projetos (Guia PMBOK)*. 6. ed. Newtown Square: Project Management Institute, 2017.

SOMMERVILLE, Ian. *Engenharia de Software*. 10. ed. São Paulo: Pearson, 2019.

SOMMERVILLE, Ian; SAWYER, Pete. *Requirements Engineering*: a good practice guide. Chichester: John Wiley & Sons, 1997.

UNITED STATES. Occupational Safety and Health Administration. *29 CFR 1926.1417 – Operation*. Washington, DC: OSHA, [2010]. Disponível em: https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.1417. Acesso em: 13 set. 2026.

VAZQUEZ, Carlos Eduardo; SIMÕES, Guilherme Siqueira. *Engenharia de Requisitos*: software orientado ao negócio. Rio de Janeiro: Brasport, 2016.

---

## Observações para quem for revisar/transcrever

1. **Datas entre colchetes** (`[2009?]`, `[20--]`) seguem a convenção ABNT para datas incertas/aproximadas — a MD-300L tem "03/09" impresso no rodapé da última página do catálogo, provavelmente mês/ano de revisão (março/2009), mas não há confirmação explícita; o catálogo do TM-130 não traz data de publicação em lugar nenhum.
2. As citações que eu resolvi (Sommerville, Sommerville & Sawyer, Vazquez & Simões, Martins, PMBOK, OSHA) foram **verificadas via busca na web** nesta sessão — não vieram só da minha memória — mas vale conferir edição/ano contra o exemplar físico ou digital que vocês realmente usaram, caso o grupo tenha estudado uma edição diferente da localizada.
3. Substituí a citação genérica "Tadano" (fabricante que não aparece em nenhum outro lugar do projeto) pelos dois fabricantes reais do trabalho — Madal Palfinger e Grupo Luna —, que são exatamente as fontes técnicas usadas para digitalizar as tabelas de carga.
4. O `RESUMO`/`ABSTRACT` no início do artigo continua genérico ("realiza as simulações de forma simples para o usuário") — vale atualizar para mencionar os resultados concretos (dados reais dos dois fabricantes, canvas interativo, motor de cálculo testado, busca reversa) antes da entrega final.
5. Os nomes/dados do quarto autor (orientador) e o e-mail/GitHub dos coautores 2 e 3 ainda estão como placeholder no `.docx` original — preencher antes de entregar.
