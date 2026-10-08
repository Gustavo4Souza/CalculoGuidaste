---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 18
concluido_em: 2026-10-08
---

# Épico 18 — Fluxo de telas ✅ Concluído (08/10/2026)

*Pedido do Gustavo:* em vez de abrir direto na simulação, um fluxo de telas que o engenheiro segue até gerar o orçamento e o relatório.

**Decisões do Gustavo (07/10/2026):**
1. **Etapas navegáveis:** barra de etapas sempre visível; dá para voltar e pular para qualquer etapa já liberada.
2. **Orçamento só técnico:** conjunto de cenários + relatório de viabilidade, sem valores comerciais.
3. **Começa pela carga:** o pedido do cliente é a peça; o sistema sugere os guindastes viáveis (menor primeiro, RF15).

**Padrões adotados (podem ser trocados):** o relatório libera com o cenário salvo, e um cenário "sem dado" sai no PDF com a tarja **OPERAÇÃO NÃO VALIDADA**; as sugestões usam só a lança principal (o JIB continua na simulação).

**Regras de cálculo não mudaram.** A única peça nova no motor (`sugerirConfiguracoes`) só chama `avaliarCenario`.

## Fluxo

```
Início ─▶ ① Projeto ─▶ ② Carga ─▶ ③ Guindaste ─▶ ④ Simulação ─▶ ⑤ Verificação ─▶ ⑥ Relatório
```

| Tela | O que o engenheiro faz | Libera a próxima quando |
|---|---|---|
| Início | Novo projeto, projetos recentes, abrir, importar JSON, consulta rápida por peso, simulação livre | — |
| ① Projeto | Projeto novo (cliente, obra, local, responsável) ou existente; orçamento novo ou existente; reabrir um cenário salvo | Projeto e orçamento definidos |
| ② Carga | Peso, C×L×A, CG, descrição, lingada, balancim, massa linear do cabo, **raio necessário**, altura de içamento, limite de utilização | Peso e raio informados |
| ③ Guindaste | Cards de cada configuração, menor guindaste primeiro, com o resultado real do motor; reprovadas recolhidas; "não alcança" listado à parte | Uma configuração escolhida |
| ④ Simulação | A área de trabalho do [[Épico 17 — Visual SolidWorks\|Épico 17]] | Sempre |
| ⑤ Verificação | Resultado completo, salvar no orçamento, cenários do orçamento, comparar, adicionar outro cenário | Cenário salvo |
| ⑥ Relatório | Prévia (cabeçalho, status, tarja, resumo), cenário ou orçamento, gerar PDF | — |

## Task 18.1 — Motor: sugestão de configurações ✅
- [x] `engine/sugerirConfiguracoes.ts`: para cada guindaste e cada configuração candidata (colunas reais da tabela do MD-300L; comprimento máximo do TM-130, que não tem eixo de comprimento) × cada área do critério de giro, põe o gancho no **raio necessário** (`resolverAnguloParaRaio`) e chama **`avaliarCenario`**. Giro representativo: 0° na primeira área, meio do setor nas outras. A passagem de cabo acompanha a tabela de cada comprimento.
- [x] Ordem (RF15): **menor guindaste primeiro**; dentro dele aprovada → atenção → não validada → reprovada, depois a lança mais curta. Lança que não alcança o raio vai para `foraDeAlcance`.
- [x] 7 testes com valores reais: TM-130 antes do MD-300L; cada sugestão é **exatamente** o que `avaliarCenario` responde; MD-300L a 7 m (17,70 m frontal = 10.800 kg; 10,50 m frontal = 10.500 kg); TM-130 a 7 m (Zona I 18.500 kg; Zona II 11.200 kg); ordem por status; pernas 8/6/4 por comprimento; raio de 30 m só alcançado pela lança de 32,10 m; TM-130 sem nº de pernas → não validada com o motivo.

## Task 18.2 — Store do fluxo ✅
- [x] `store/etapas.ts` (puro, 4 testes): as etapas e a regra de liberação, **com o motivo de cada bloqueio** ("Informe o peso da carga e o raio necessário na etapa 2.").
- [x] `store/useFluxoStore.ts`: etapa atual, simulação livre, **orçamento ativo**, **raio necessário** (não faz parte do cenário salvo) e configuração escolhida. `baseDoPedido` monta o cenário de cada guindaste com a carga da etapa ②. Abrir ou salvar um cenário define o orçamento ativo; abrir a partir das etapas iniciais leva à simulação.
- [x] `fluxo/useSincronizarUrl.ts`: a etapa vai para a URL (`#/carga`), então o **Voltar do navegador** percorre as etapas. `#/simulacao` abre a simulação livre (atalho dos testes e2e).

## Task 18.3 — Telas ✅
- [x] `fluxo/BarraDeEtapas.tsx`: etapas numeradas, ✔ nas concluídas, cadeado e motivo (tooltip) nas bloqueadas, orçamento ativo e Voltar/Avançar.
- [x] `fluxo/TelaInicio.tsx`, `TelaProjeto.tsx`, `TelaCarga.tsx` (com o resumo do pedido: peso preliminar sem cabo e moitão), `TelaGuindaste.tsx`, `TelaVerificacao.tsx` (reaproveita o painel de resultado inteiro) e `TelaRelatorio.tsx` (prévia a partir do mesmo modelo do PDF).
- [x] **Decisão de arquitetura:** a área de simulação (CommandManager + gerenciador + cena + resultado) fica **montada desde que a etapa ④ é liberada**, só escondida (`visibility: hidden`, `inert`) nas outras etapas. A cena precisa existir para o relatório capturar as vistas, e a câmera fica onde o engenheiro a deixou, como um documento aberto.
- [x] "Corrigir em ‹nó›" do veredito, a partir da Verificação, volta para a simulação já com o nó aberto.
- [x] Arquivo → Novo volta ao Início (com confirmação se houver alteração não salva).

## Task 18.4 — Relatório ✅
- [x] `modeloRelatorio.ts`: campo `tarja` no cenário "sem dado" — **"OPERAÇÃO NÃO VALIDADA — este cenário NÃO pode ser usado para executar o içamento…"** (teste novo). `gerarPdf.ts` desenha a tarja logo abaixo do status.

## Verificação (08/10/2026)
- Revisão visual por captura de todas as etapas (fluxo completo até o PDF), sem erros no console.
- **173 testes unitários** (+7 da sugestão, +4 das etapas, +1 da tarja); **26 e2e** (2 rodadas seguidas: 52/52). Os 23 anteriores abrem direto `#/simulacao`; 3 novos: fluxo completo Início → PDF (com o Voltar do navegador e etapas bloqueadas com motivo); "Corrigir em…" a partir da Verificação + tarja na prévia; "Adicionar outro cenário" (17,70 m lateral a 7 m = 11.900 kg, tabela real) + Arquivo → Novo.
- Typecheck, build e lint sem avisos novos.

> [!bug] Achado de ambiente
> Um servidor de desenvolvimento antigo, iniciado antes de o `lucide-react` entrar, devolvia **504 (Outdated Optimize Dep)** ao carregar o jsPDF. Num servidor novo, o PDF sai normalmente. É o mesmo caso já documentado em [[🛠️ Operação]]: reinicie o `npm run dev` depois de mudar dependências.

> [!note] Achado nos testes
> Na Verificação existem dois painéis de resultado no DOM: o da tela e o da simulação escondida. Os seletores CSS do e2e olham `.area-tela` nessas etapas (seletores por papel/rótulo já ignoram o escondido).

## Relacionado

- [[🗺️ Roadmap]]
- [[🖥️ Interface]]
- Anterior: [[Épico 17 — Visual SolidWorks]]
