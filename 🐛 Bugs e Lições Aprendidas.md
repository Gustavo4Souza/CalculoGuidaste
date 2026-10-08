---
tipo: conceito
status: ativo
criado: 2026-10-07
tags:
  - projeto
aliases:
  - Bugs
  - Lições aprendidas
---

# 🐛 Bugs e Lições Aprendidas

Defeitos **reais** encontrados durante o projeto, como foram achados e a regra que ficou. Útil para o artigo (seção de resultados) e para não repetir o erro.

## Dados

| Quando | Defeito | Como foi achado | Correção / regra que ficou |
|---|---|---|---|
| 13/09/2026 | Colunas trocadas na tabela do MD-300L (2 episódios) | Conferência manual contra a ficha | Gustavo transcreveu em planilha e a extração passou a ser **mecânica**. ==Nunca digitar tabela lendo texto de PDF== |
| 13/09/2026 | Zona II do JIB do TM-130 com 3.700 kg deduzidos de células mescladas (o certo é 3.800) | Planilha transcrita da ficha | Não deduzir valor de célula mesclada |
| 05/10/2026 | A tabela "da lança principal" do TM-130 era a **do JIB** | Leitura da legenda da ficha | Ler a legenda de cada tabela antes de usar |
| 06/10/2026 | 3 células erradas na transcrição do diagrama polar | Conferência automática contra a camada de texto do PDF | O script recusa valor que não esteja no PDF e capacidade que cresça com o raio |
| 05/10/2026 | Com ângulo máximo de 80°, o JIB não alcançava raios que a própria tabela lista | Teste com ponto real do JIB | Limite subiu para 85° (depois confirmado na ficha) |
| 06/10/2026 | TM-130 começava com **1 perna** de cabo, valor que a ficha não dá | Revisão do documento técnico | Campo pode ficar vazio → sem dado. Valor inicial só se vier da ficha |

## Cálculo

| Quando | Defeito | Como foi achado | Correção / regra que ficou |
|---|---|---|---|
| 06/10/2026 | Raio vindo da trigonometria (4,500000000001 m) fazia a interpolação dar 18.349,9999 → 18.349 kg | Teste com valor real | Tolerância de ruído de 1e-6 kg no arredondamento. Não remover |
| 05/10/2026 | Erro de ponto flutuante impedia reconhecer um ponto exato de tabela | Teste com raio derivado | Tolerância de ponto exato de 1 µm em `interpolarComDetalhe` |

## Interface e cena 3D

| Quando | Defeito | Como foi achado | Correção / regra que ficou |
|---|---|---|---|
| 13/09/2026 | Digitar no campo "Raio de trabalho" reformatava e engolia o texto | Revisão de usabilidade | `useCampoNumericoSincronizado`: não reformatar enquanto o campo tem foco |
| 14/09/2026 | `<input type="number">` dentro de `<Html>` do drei corrompia a digitação | Teste manual + e2e | Campos com `type="text" inputMode="decimal"` |
| 14/09/2026 | A câmera do `<Canvas>` "brigava" com o `OrbitControls` | Revisão visual | Objeto de config da câmera memoizado (não recriar a cada render) |
| 14/09/2026 | O `OrbitControls` orbitava durante o arrasto da lança | e2e de arrasto | Desligar os controles via ref durante qualquer arrasto customizado |
| 05/10/2026 | Rótulos das cotas bloqueavam o clique nas peças | e2e de arrasto | `style={SEM_PONTEIRO}` em todo `<Html>` que é só rótulo (a prop `pointerEvents` do drei só vale no modo `transform`) |
| 05/10/2026 | Legenda do mapa sobre a viewport cobria peças arrastáveis | e2e de arrasto | Nada de overlay DOM sobre a cena sem conferir os pontos de arrasto |
| 05/10/2026 | Cena renderizava ~20 quadros/s parada e deixava o e2e intermitente | Perfil de CPU (CDP) + linha de base no commit anterior | `frameloop="demand"` |
| 07/10/2026 | A capacidade ("7.500 kg") aparecia em destaque com a operação **não validada** — lida como aprovação | Revisão por captura de tela | Veredito em frase primeiro; capacidade só numa tabela rotulada |
| 07/10/2026 | Verificações com ✔ verde enquanto o somatório estava incompleto (sem a massa do cabo) | Revisão por captura no Épico 17 | Sem dado, as verificações aparecem como parciais (?) |
| 05/10/2026 | "Salvar como cenário" fechava o diálogo mesmo quando a gravação falhava | Revisão de código | O diálogo só fecha com sucesso; a falha aparece na tela |

## Ambiente e build

| Quando | Defeito | Como foi achado | Correção / regra que ficou |
|---|---|---|---|
| 13/09/2026 | `executablePath` de Chromium fixo em Linux quebrava todo o e2e no Windows | e2e no Windows | Resolver o navegador pelo Playwright; `channel: 'chromium'` |
| 05/10/2026 | **Tela branca** ao rodar o projeto | Relato do Gustavo | Limites de erro, validação dos dados **antes** de importar o `App`, mensagem com o nome do campo; e2e que reproduz o caso |
| 06/10/2026 | Erro 504 "Outdated Optimize Dep" e WebSocket do Vite caindo | Console do navegador | Todas as dependências de runtime em `optimizeDeps.include` |
| 05/10/2026 | Falhas espalhadas com "Target crashed" no e2e | Repetição com ambiente limpo | Instabilidade da máquina (memória/disco), não do código. Rodar a suíte 2x |

## Lições gerais

1. **A fonte primária vence.** Planilha transcrita ajuda, mas a ficha do fabricante decide. Conferir por código sempre que a fonte tiver texto digital.
2. **Teste com valor real acha bug real.** Quase todos os defeitos de cálculo apareceram em testes com células reais da tabela.
3. **Um estado só.** Depois que o cenário virou o único estado editável (Épico 11), a classe inteira de bugs "o painel diz uma coisa e a cena outra" sumiu.
4. **"Sem dado" é uma resposta válida.** Preencher uma lacuna com um palpite é o erro mais perigoso que este sistema pode cometer.
5. **Intermitência é sintoma.** O e2e intermitente escondia um desperdício real de CPU. Vale investigar antes de aumentar o timeout.

## Relacionado

- [[🧪 Plano de Testes]]
- [[📊 Tabelas de Carga e Fontes]]
- [[🛠️ Operação]]
- [[📈 Indicadores]]
