---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 12
concluido_em: 2026-10-05
---

# Épico 12 — Interface estilo SolidWorks, tema claro ✅ Concluído (05/10/2026)

Substitui o tema escuro/HUD do Épico 8 (RF23).

## Task 12.1 — Shell em tela cheia no estilo CAD ✅
- [x] `App.tsx`: barra de comandos | área de trabalho (árvore de parâmetros | viewport 3D | resultado) | barra de status. 100vh, sem scroll de página; cada painel rola sozinho. Abaixo de 1150 px o painel de resultado desce para baixo da viewport
- [x] `index.css`/`App.css` reescritos: cinza claro, painéis brancos, acento azul de seleção, cores de status reservadas ao resultado (OK verde / Atenção âmbar / NOK vermelho / Sem dado cinza hachurado). Viewport com fundo em degradê, como no SolidWorks
- [x] `components/BarraDeComandos.tsx`: Novo (recomeça o cenário), Buscar por peso (abre `DialogoBuscaReversa`, um `<dialog>` modal) e seletor de massa **kg ⇄ t (RF14)**, só de exibição: resultado, somatório, barra de status e busca. Os campos de entrada continuam em kg, com a unidade no rótulo. Abrir, Salvar, Salvar como cenário, Comparar, Importar/Exportar JSON e Exportar PDF aparecem **desabilitados**, com o motivo no tooltip (Épicos 15/16)
- [x] `components/ArvoreParametros.tsx` (substitui `PainelParametros.tsx`): nós recolhíveis estilo FeatureManager (Guindaste, Lança, Giro, JIB, Sapatas, Cabo e moitão, Carga, Acessórios, Limites e operação, Ambiente), cada um com o resumo do valor atual visível mesmo recolhido. O seletor de guindaste e o toggle de JIB passaram para o nó "Guindaste"; comprimento e raio também estão na árvore (além dos campos embutidos na cena)
- [x] `components/BarraDeStatus.tsx`: status, capacidade (e se é ponto exato ou interpolado), somatório, % de utilização, área derivada do giro, selo de critério provisório e `VERSAO_TABELAS`

## Task 12.2 — Viewport com cubo de orientação, vistas padrão e cotas ✅
- [x] Cubo de orientação (`GizmoHelper` + `GizmoViewcube` do drei, já instalado; faces Frontal/Trás/Topo/Base/Lateral/Oposta). `OrbitControls` passou a `makeDefault`, que é o que o cubo usa
- [x] Barra de vistas padrão sobre a viewport: Frontal, Lateral, Superior e Isométrica (`cena/ControladorDeVista.tsx`). **Decisão**: as vistas frontal/lateral/superior **enquadram o guindaste atual** (alcance e altura reais, como o "zoom para ajustar" de um CAD); a isométrica é fixa porque é a câmera que os testes e2e projetam. Com distância fixa, uma lança curta ficava minúscula e as cotas ilegíveis (visto na revisão por captura de tela)
- [x] Cotas desenhadas na cena (`cena/Cotas.tsx`), com os valores do **motor** (não da geometria da cena): raio a partir do centro de giro (R), altura da ponta (H), ângulo da lança (α, com arco), altura de içamento (quando informada) e giro. Hoje o giro é só rótulo: a rotação da superestrutura na cena é do Épico 13
- [x] Marcas de encaixe dos comprimentos ainda não estendidos viraram "fantasmas" claros sobre uma guia tracejada até o comprimento máximo. No tema claro elas apareciam como blocos pretos flutuando além da ponta

**Verificação (05/10/2026):** revisão visual por captura de tela (isométrica, lateral, superior) antes de fechar; 102 testes unitários; 12/12 e2e (suíte 2x seguidas: 24/24, ~28 s), incluindo um novo teste de barra de status, cotas, vistas padrão, kg/t e comandos desabilitados; typecheck e `npm run build` limpos. `oxlint` segue bloqueado pela política de Controle de Aplicativo do Windows.

## Sprint (visão do backlog)

### Sprint 10 — Interface estilo SolidWorks, tema claro (Épico 12) ✅ Concluída (05/10/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S10-01 | ✅ Shell CAD: barra de comandos, árvore de parâmetros, viewport, painel de resultado, barra de status; tema claro | Alta | Task 12.1 / RF23 |
| S10-02 | ✅ Seletor kg ⇄ t (só exibição) | Média | Task 12.1 / RF14 |
| S10-03 | ✅ Busca reversa em diálogo modal pela barra de comandos | Média | Task 12.1 / RF05, RF15 |
| S10-04 | ✅ Cubo de orientação + vistas padrão que enquadram o guindaste atual | Alta | Task 12.2 / RF23 |
| S10-05 | ✅ Cotas na cena (R, H, α, içamento, giro) com valores do motor | Alta | Task 12.2 / RF23 |

**Pronto quando**: a tela segue o padrão CAD (comandos, árvore, viewport, status) em tema claro, sem scroll, com todo parâmetro visível com rótulo, unidade e faixa. ✅ Atingido: 102 unitários + 12 e2e (24/24 em execução repetida).

## Relacionado

- [[🗺️ Roadmap]]
- Anterior: [[Épico 11 — Fonte única de estado]]
- Próximo: [[Épico 13 — Modelo 3D fiel e arrasto de tudo]]
