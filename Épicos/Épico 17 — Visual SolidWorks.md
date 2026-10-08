---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 17
concluido_em: 2026-10-07
---

# Épico 17 — Sistema visual SolidWorks e área de trabalho ✅ Concluído (07/10/2026)

*Pedido do Gustavo:* seguir o layout e o design do SolidWorks, que os engenheiros já conhecem, numa abordagem profissional, limpa e direta. ==O engenheiro não pode ter dúvida sobre a informação que aparece.== O fluxo de telas (Início → Projeto → Carga → Guindaste → Simulação → Verificação → Relatório) é o [[Épico 18 — Fluxo de telas|Épico 18]].

**Decisões do Gustavo (07/10/2026):** fidelidade "bem próxima" ao SolidWorks (CommandManager com abas e ícones, FeatureManager, PropertyManager com ✔/✖, barra de vista, painel de tarefas); biblioteca de ícones `lucide-react`; os campos de digitação soltos na cena 3D (Task 9.2) saem, mas todos os arrastos ficam.

**Motor de cálculo, dados e regras de negócio não mudaram.**

## Problemas encontrados na tela antiga (revisão por captura)

- O número da capacidade ("7.500 kg") aparecia grande, em destaque, enquanto o status era "sem dado". Lido rápido, parecia "posso içar 7,5 t" com a operação **não validada**. Era o problema mais grave.
- Comprimento e raio apareciam duas vezes (árvore e campos soltos na cena), e os rótulos da cena se sobrepunham.
- A barra de comandos era uma fileira de textos, sem agrupamento nem hierarquia.
- Com a operação não validada, as verificações mostravam ✔ verde em "Somatório ≤ capacidade", mesmo com o somatório incompleto (achado durante a revisão do próprio Épico 17).

## Task 17.1 — Sistema visual ✅
- [x] Tokens de cor e tipografia em `index.css`: janela cinza neutra, painéis quase brancos, azul de seleção `#0a64c8`, fonte do sistema (Segoe UI) e números em fonte monoespaçada. **A cor forte fica só para o status.** Os nomes antigos das variáveis continuam valendo (diálogos não quebraram).
- [x] `lucide-react` (ícones SVG, sem custo) e acrescentado ao `optimizeDeps.include`.
- [x] Mesmos nomes de status em toda parte (`components/resultado/nomes.ts`): **Operação aprovada · Aprovada com atenção · Operação reprovada · Operação não validada**. Nas tabelas dos diálogos: Aprovada · Atenção · Reprovada · Não validada. No PDF: OPERAÇÃO APROVADA… OPERAÇÃO NÃO VALIDADA.
- [x] Percentuais com vírgula decimal (`formatarPercentual`), como o resto dos números.

## Task 17.2 — Barra de título e CommandManager ✅
- [x] `shell/BarraDeTitulo.tsx`: marca, **menu Arquivo** (Novo, Abrir, Salvar, Salvar como cenário, Importar/Exportar JSON, Exportar PDF), **acesso rápido** com ícones (Novo, Abrir, Salvar com marca de alteração, Salvar como, Exportar PDF), **documento aberto** no centro (cliente › orçamento › cenário, "● alterações não salvas") e kg ⇄ t.
- [x] `shell/CommandManager.tsx`: abas **Guindaste** (MD-300L / TM-130, Lança JIB, Sapatas na extensão máxima) e **Avaliar** (Buscar por peso, Comparar cenários, Relatório PDF), com ícones grandes e grupos rotulados. Comando indisponível fica **desabilitado com o motivo no tooltip** (ex.: "JIB desligado para o TM-130 até a confirmação da Ribas"), em vez de sumir.
- [x] `shell/useComandos.ts`: cada comando (rótulo, dica, regra de disponibilidade) existe num lugar só e é usado pelo menu, pelo acesso rápido e pelo CommandManager.
- [x] `BarraDeComandos.tsx` apagado.

## Task 17.3 — FeatureManager e PropertyManager ✅
- [x] `gerenciador/nos.ts` (puro, 9 testes com valores reais): nós da árvore, **a que nó cada motivo de "sem dado" e cada verificação reprovada pertencem**, e o estado de cada nó (✔ completo · ? falta dado · ! atenção · ✖ reprovado). Lê a avaliação do motor, não recalcula nada.
- [x] `gerenciador/PainelGerenciador.tsx`: abas Árvore / Propriedades. A árvore mostra ícone, nome, resumo do valor e o estado de cada nó, com legenda. **Clicar num nó abre o PropertyManager dele**.
- [x] PropertyManager: cabeçalho com **✔ (Confirmar)** e **✖ (Cancelar)**, caixa "Mensagem" que explica o nó e grupos recolhíveis ("rollouts"). A edição é ao vivo (cena e resultado acompanham); ✖ desfaz tudo o que mudou desde que o nó foi aberto (`useInterfaceStore.edicao` guarda o cenário de antes).
- [x] `gerenciador/PropriedadesDoNo.tsx`: os campos da antiga `ArvoreParametros.tsx` (apagada), reorganizados em grupos, mais valores calculados só de leitura (altura da ponta, cabo pendente, massa do cabo no somatório, dados do fabricante).
- [x] `CampoParametro`: unidade colada ao valor (caixa de valor do PropertyManager); campo opcional vazio fica tracejado.

## Task 17.4 — Viewport ✅
- [x] `cena/BarraDeVista.tsx` (a "heads-up toolbar" do SolidWorks): Frontal, Lateral, Superior, Isométrica, Área de operação e **Cotas** (liga/desliga).
- [x] Campos soltos "Comprimento (m)" e "Raio de trabalho (m)" saíram da cena; no lugar, a cota **L = 17,70 m**. Todos os arrastos continuam.
- [x] A dica de uso virou uma legenda discreta sobre a cena, sem capturar o ponteiro.

## Task 17.5 — Painel de resultado e barra de status ✅
- [x] `resultado/Veredito.tsx`: **o veredito vem primeiro, em frase**. Em "não validada", a lista do que falta, cada item com **"Corrigir em ‹nó›"**, que abre o PropertyManager certo. Em "reprovada", o que reprovou e onde corrigir.
- [x] Números numa tabela, **cada um com rótulo e unidade**: somatório, capacidade da tabela ("limite do fabricante", ponto exato ou interpolado, área), utilização (com o limite do engenheiro), folga ou **excedente** em vermelho, raio e área. A capacidade nunca aparece sozinha como destaque.
- [x] Medidor com as marcas **"tabela 100%"** e **"engenheiro X%"** escritas.
- [x] Verificações: ✔ / ! (limite do engenheiro) / ✖. **Com a operação não validada, elas aparecem como "parciais" (?)**, com o aviso de que só valem depois de completar o que falta.
- [x] Barra de status: veredito à esquerda, números, área, unidades (kg · m · °) e versão das tabelas à direita.

## Verificação (07/10/2026)
- Revisão visual por captura (MD-300L não validada, aprovada, reprovada; TM-130; 1366 × 768; menu Arquivo), sem erros no console.
- **161 testes unitários** (+9 de `gerenciador/nos.test.ts`); **23 e2e** (suíte completa 2x seguidas: 46/46). O e2e ganhou os helpers `editar`, `preencher` e `ler`, que abrem o nó da árvore antes de usar o campo, e um teste novo: "Corrigir em…" abre o nó certo, ✖ desfaz, ✔ confirma e as verificações viram parciais sem dado.
- Typecheck e `npm run build` limpos; `oxlint` sem avisos novos (os 10 avisos são de arquivos que não mudaram).

> [!note] Achado nos testes
> O selo "≈" fica dentro do rótulo do campo, então o nome acessível vira "Sapata dianteira esquerda (m)≈". O helper do e2e casa pelo início do rótulo.

## Relacionado

- [[🗺️ Roadmap]]
- [[🖥️ Interface]]
- Anterior: [[Épico 16 — Relatório PDF]]
- Próximo: [[Épico 18 — Fluxo de telas]]
