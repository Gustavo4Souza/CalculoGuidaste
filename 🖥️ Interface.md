---
tipo: projeto
status: ativo
criado: 2026-10-07
tags:
  - projeto
aliases:
  - Interface
  - Telas
---

# 🖥️ Interface

Interface no padrão do **SolidWorks** em tema claro, em tela cheia (100vh, sem rolagem da página). O Épico 12 trouxe a estrutura CAD; o [[Épico 17 — Visual SolidWorks|Épico 17]] aproximou o visual e a interação do SolidWorks e reorganizou o resultado para o engenheiro não ter dúvida. O fluxo de telas (Início → Relatório) é o [[Épico 18 — Fluxo de telas|Épico 18]].

> [!important] Regras de clareza
> - O **veredito vem primeiro, em frase**: Operação aprovada · Aprovada com atenção · Operação reprovada · **Operação não validada**. Os mesmos nomes na tela, nos diálogos e no PDF.
> - A capacidade da tabela **nunca aparece sozinha como destaque**: ela fica numa tabela de valores, rotulada "limite do fabricante".
> - Todo número tem **rótulo e unidade**; percentuais com vírgula decimal.
> - **Cor forte só para status.** O resto é cinza e azul de seleção.
> - Toda pendência diz **onde se corrige** ("Corrigir em Cabo e moitão").
> - Comando indisponível fica **desabilitado com o motivo**, não some.
> - Sem dado, as verificações aparecem como **parciais (?)**: um ✔ com somatório incompleto enganaria.

## Fluxo de telas (Épico 18)

```
Início ─▶ ① Projeto ─▶ ② Carga ─▶ ③ Guindaste ─▶ ④ Simulação ─▶ ⑤ Verificação ─▶ ⑥ Relatório
```

- **Início:** novo projeto, projetos recentes, abrir, importar JSON, consulta rápida por peso e simulação livre.
- **Barra de etapas** abaixo da barra de título: etapas concluídas com ✔, a atual destacada, as bloqueadas com cadeado e o **motivo** no tooltip; à direita o orçamento ativo e Voltar/Avançar. A URL acompanha a etapa (`#/carga`), então o Voltar do navegador funciona.
- **① Projeto** → **② Carga** (com o raio necessário) → **③ Guindaste** (cards com o resultado real do motor, menor guindaste primeiro) → **④ Simulação** (a área de trabalho abaixo) → **⑤ Verificação** (resultado completo, salvar, cenários do orçamento, comparar, adicionar outro) → **⑥ Relatório** (prévia e PDF).
- A área de simulação fica **montada e escondida** fora da etapa ④: a cena é necessária para as capturas do PDF, e a câmera fica onde o engenheiro a deixou.
- Detalhe em [[Épico 18 — Fluxo de telas]].

## Layout da simulação

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ▣ Ribas  Arquivo▾  [novo][abrir][salvar●][salvar como][PDF]   Cliente › Orç. › Cenário ●   kg|t │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Guindaste] [Avaliar]                       ← CommandManager (abas)          │
│  MD-300L  TM-130 │ Lança JIB │ Extensão máxima      (ícones grandes, grupos) │
├────────────────┬────────────────────────────────────────┬────────────────────┤
│ [Árvore|Propr.]│  [Frontal Lateral Superior Iso | Área de│ RESULTADO          │
│ ▣ MD-300L    ? │   operação  Cotas]   ← barra de vista   │ ┌ veredito ──────┐ │
│  Lança       ✔ │                                        │ │ Não validada   │ │
│  Giro        ✔ │              cena 3D                   │ │ falta: … [Corr.]│ │
│  Sapatas     ✔ │                                        │ └────────────────┘ │
│  Cabo/moitão ? │                                        │ Somatório  9.106 kg│
│  Carga       ✔ │                                        │ Capacidade 7.500 kg│
│  …             │                                    cubo│ Utilização 121,4%  │
├────────────────┴────────────────────────────────────────┴────────────────────┤
│ Operação reprovada │ Capacidade da tabela · Somatório · Utilização · Área │ kg · m · ° │ versão │
└──────────────────────────────────────────────────────────────────────────────┘
```

Abaixo de 1150 px de largura o painel de tarefas desce para baixo da viewport.

## Barra de título e CommandManager

- **Menu Arquivo:** Novo, Abrir, Salvar, Salvar como cenário, Importar JSON, Exportar JSON, Exportar PDF.
- **Acesso rápido** (ícones): Novo, Abrir, Salvar (com marca de alteração), Salvar como cenário, Exportar PDF.
- **Documento aberto** no centro: cliente › orçamento › cenário, ou "Cenário não salvo — MD-300L".
- **CommandManager**, aba **Guindaste**: MD-300L / TM-130, Lança JIB, Sapatas na extensão máxima. Aba **Avaliar**: Buscar por peso, Comparar cenários, Relatório PDF.
- Os comandos vêm de um lugar só (`shell/useComandos.ts`), com o mesmo rótulo e a mesma regra em todo lugar.

## FeatureManager e PropertyManager

- **Árvore** (FeatureManager): raiz com o guindaste e os nós **Lança**, **Giro**, **JIB** (com ele ligado), **Sapatas**, **Cabo e moitão**, **Carga**, **Acessórios**, **Limites e operação**, **Ambiente**. Cada nó mostra o resumo do valor e o estado: ✔ completo · ? falta dado · ! atenção · ✖ reprovado (`gerenciador/nos.ts`, testado).
- **Clicar num nó abre o PropertyManager** dele: cabeçalho com **✔ Confirmar** e **✖ Cancelar**, caixa "Mensagem" explicando o nó e grupos recolhíveis. A edição é ao vivo; ✖ desfaz tudo desde que o nó foi aberto.
- Cada campo (`CampoParametro`) mostra rótulo, unidade colada ao valor, faixa válida e o selo **≈** quando o limite vem de valor aproximado. Aceita vírgula decimal e "vazio" (não informado) onde faz sentido; vazio fica tracejado. Usa `type="text" inputMode="decimal"` (um `<input type="number">` corrompia a digitação).

## Cena 3D

- **Referencial:** origem no **centro de giro**; o caminhão fica parado ao longo de X; a superestrutura gira em Y; o pé da lança fica em x = −recuo. Assim o raio desenhado é exatamente o raio do motor.
- **Giro 0°** aponta para +X: frente/cabine no MD-300L, traseira no TM-130. Giro positivo = horário visto de cima.
- **Cubo de orientação** e vistas padrão **Frontal / Lateral / Superior** (enquadram o guindaste atual) e **Isométrica** (fixa, porque os testes e2e projetam pontos com ela).
- **Barra de vista** no topo da cena: vistas padrão, **Área de operação** e **Cotas** (liga/desliga).
- **Cotas** desenhadas com os valores do motor: comprimento (L), raio (R), altura da ponta (H), ângulo (α), giro e altura de içamento. Desde o Épico 17 não há mais campos de digitação dentro da cena: a digitação fica no PropertyManager.
- `frameloop="demand"`: a cena só renderiza quando algo muda.

### O que se arrasta

| Peça | O que muda |
|---|---|
| Gancho | Ângulo da lança (com JIB: o raio) |
| Corpo da lança | Comprimento, com ímã nas 7 marcas reais do MD-300L |
| Anel no chão | Giro da superestrutura (com as fronteiras dos setores desenhadas) |
| Pé de cada sapata | Extensão daquela sapata (laranja fora da extensão máxima) |
| Barra do JIB | Offset do JIB |
| Esferas do JIB | Comprimento do JIB (9,0 / 15,5 / 20,0 m) |

A carga aparece em escala real (C × L × A) presa ao gancho pela lingada ou pelo balancim, com o **centro de gravidade** marcado e o plano da altura de içamento.

### Mapa da área de operação

Botão "Área de operação" na barra de vistas. Pinta o chão em volta do guindaste: **verde** OK, **âmbar** atenção, **vermelho** NOK, **cinza hachurado** sem dado; o que a lança não alcança fica sem cor. Cada célula fica com o **pior** status dos 4 cantos. A legenda, com a % de cada status, fica no painel de resultado (sobre a viewport ela cobria peças arrastáveis).

## Painel de resultado

1. **Cenário aberto** (quando há): projeto › orçamento › cenário, "● alterações não salvas" e, se as versões diferem, resultado **salvo × recalculado**.
2. **Veredito** em frase, com a cor do status. Em "não validada", a lista do que falta, cada item com **Corrigir em ‹nó›**; em "reprovada", o que reprovou e onde corrigir.
3. **Valores**: somatório, capacidade da tabela (limite do fabricante, ponto exato ou interpolado, área), utilização (com o limite do engenheiro), folga ou **excedente**, raio e área.
4. **Medidor** com as marcas "tabela 100%" e "engenheiro X%" escritas.
5. **Detalhes**: somatório item a item, verificações (✔ / ! / ✖, ou **parciais** sem dado) e os pontos da tabela usados na interpolação.
6. **Legenda do mapa** da área de operação.

## Diálogos

| Diálogo | Para quê |
|---|---|
| Buscar por peso | Lista das configurações viáveis da frota, menor guindaste primeiro (RF15) |
| Projetos (Abrir) | Gerenciador em 3 colunas: projetos (com busca) · orçamentos · cenários; abrir, duplicar, renomear, excluir |
| Salvar como cenário | Escolher ou criar projeto e orçamento e nomear o cenário |
| Comparar | 2 ou mais cenários lado a lado, com o resultado **como foi salvo** e ⚠ quando a versão difere |
| Exportar PDF | Cenário atual (salvo ou não) ou orçamento completo |

## Relatório PDF

- **Por cenário:** cabeçalho (cliente, obra, local, responsável, data, versões), status, resumo, todos os parâmetros (com ~ para aproximados), somatório, capacidade e origem, verificações, motivos de "sem dado", avisos, notas da ficha, **vistas lateral e superior** capturadas da cena (com o mapa no chão) e o **bloco de validação e assinatura** (engenheiro, CREA/ART, data).
- **Por orçamento:** capa, comparativo dos cenários e um capítulo por cenário.
- O relatório **recalcula** com as tabelas atuais e avisa quando o cenário foi salvo com outra versão.
- Limitação: as cotas e rótulos da cena são HTML e não saem nas imagens; os valores estão nas tabelas do PDF.

## Relacionado

- [[🏗️ Arquitetura e Stack]]
- [[🛠️ Operação]]
- [[📐 Requisitos]]
- [[🐛 Bugs e Lições Aprendidas]]
