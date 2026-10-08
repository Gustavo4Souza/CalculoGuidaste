---
tipo: projeto
status: ativo
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 18
---

# Épico 18 — Fluxo de telas ⬜ Planejado (07/10/2026)

*Pedido do Gustavo:* em vez de abrir direto na simulação, um fluxo de telas que o engenheiro segue até gerar o orçamento e o relatório.

**Decisões do Gustavo (07/10/2026):**
1. **Etapas navegáveis:** barra de etapas sempre visível; dá para voltar e pular para qualquer etapa já liberada.
2. **Orçamento só técnico:** conjunto de cenários + relatório de viabilidade, sem valores comerciais.
3. **Começa pela carga:** o pedido do cliente é a peça; o sistema sugere os guindastes viáveis (menor primeiro, RF15).

**Padrões propostos (o Gustavo pode trocar):** relatório liberado com o cenário salvo, e cenário "sem dado" sai no PDF com a tarja **OPERAÇÃO NÃO VALIDADA**; sugestões só com a lança principal (o JIB continua na simulação).

## Fluxo

```
Início ─▶ ① Projeto ─▶ ② Carga ─▶ ③ Guindaste ─▶ ④ Simulação ─▶ ⑤ Verificação ─▶ ⑥ Relatório
```

| Tela | O que o engenheiro faz | Libera a próxima quando |
|---|---|---|
| Início | Novo projeto, recentes, abrir, importar, consulta rápida por peso, simulação livre | — |
| ① Projeto | Cliente, obra, local, responsável, nome do orçamento | Obrigatórios preenchidos |
| ② Carga | Peso, C×L×A, CG, descrição, lingada, balancim, **raio necessário**, altura de içamento | Peso e raio informados |
| ③ Guindaste | Cards das configurações viáveis, menor guindaste primeiro, com o resultado real do motor | Uma configuração escolhida |
| ④ Simulação | A área de trabalho do [[Épico 17 — Visual SolidWorks|Épico 17]] | Sempre |
| ⑤ Verificação | Checklist ✔/✖/? com "Ir para o parâmetro", salvar, mais cenários, comparar | Cenário salvo |
| ⑥ Relatório | Prévia, cenário ou orçamento, exportar PDF | — |

## Tasks previstas

- [ ] Store do fluxo (etapa atual, etapas liberadas, sincronizada com a URL `#/carga` etc.)
- [ ] Telas Início, Projeto, Carga, Guindaste, Verificação e Relatório
- [ ] `engine/sugerirConfiguracoes`: avalia cada configuração candidata da frota **com o próprio `avaliarCenario`** no raio pedido (sem regra nova), com testes em valores reais
- [ ] Atalho `#/simulacao` para o e2e; testes do fluxo completo até o PDF
- [ ] Notas do Obsidian

## Relacionado

- [[🗺️ Roadmap]]
- [[🖥️ Interface]]
- Anterior: [[Épico 17 — Visual SolidWorks]]
