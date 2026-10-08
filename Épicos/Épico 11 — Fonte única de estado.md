---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 11
concluido_em: 2026-10-05
---

# Épico 11 — Fonte única de estado ✅ Concluído (05/10/2026)

## Task 11.1 — Store reescrita ✅
- [x] `store/useSimulacaoStore.ts`: `cenario: ParametrosDoCenario` é o **único** estado editável; `avaliacao` é sempre derivada dele por `avaliarCenario` a cada mudança (painel, cena, cotas e resultado não têm como divergir)
- [x] Ações com limite mecânico da ficha: `definirComprimentoLancaM`, `definirAnguloGraus`, `definirRaioM` (resolve o ângulo, inclusive com JIB; raio inalcançável vai ao extremo), `definirGiroGraus` (normaliza; TM-130 limitado a ±60°), `definirJIB`, `definirSapata`, `atualizarCenario` (genérica) e `carregarCenario` (para reabrir cenários, Épico 15)
- [x] A passagem de cabo acompanha a tabela ao mudar o comprimento (8 → 6 → 4 pernas), a não ser que o engenheiro a tenha mudado à mão. Ligar o JIB leva a lança a 32,10 m, 1 perna e gancho de 67 kg; desligar restaura
- [x] `store/parametrosIniciais.ts`: cenário inicial só com valores das especificações. O que não consta nas fichas (massa linear do cabo; massa do moitão do TM-130) começa **vazio**, e o motor responde "sem dado" até o engenheiro informar

## Task 11.2 — Seletor manual de quadrante/zona removido (RF18) ✅
- [x] A área é derivada do giro e mostrada na barra (`data-testid="regiao-derivada"`), com o selo "Critério de giro provisório" no MD-300L

## Task 11.3 — Campos de parâmetro padronizados (RF16) ✅
- [x] `components/CampoParametro.tsx`: rótulo, unidade, faixa válida visível e selo "≈" para valores aproximados. Aceita "vazio" (não informado) e vírgula decimal. Mantém a correção `type="text" inputMode="decimal"` do Épico 9
- [x] `components/PainelParametros.tsx`: lança e giro, JIB (comprimento discreto, ângulo contínuo), as 4 sapatas, cabo (pernas, massa linear, massa calculada sempre visível, sobrescrita manual), moitão, carga (descrição, peso, C × L × A, CG), acessórios (lingada, altura da lingada, balancim), altura de içamento, limite de utilização, vento e pressão do solo (informativos). O Épico 12 reorganiza isso numa árvore estilo CAD
- [x] `components/PainelResultado.tsx` + `IndicadorStatus.tsx`: 4 estados (OK / Atenção / NOK / **Sem dado do fabricante**, este com os motivos), capacidade com origem (exato ou interpolado, com os pontos reais usados), somatório item a item, medidor com marca do limite do engenheiro
- [x] Cena 3D: o TM-130 ganhou comprimento real arrastável (5,9–12,4 m); o JIB agora é desenhado como offset **para baixo** em relação à lança (planilha, obs. G6), não como ângulo absoluto

## Task 11.4 — Busca reversa honesta ✅
- [x] O TM-130 sai da busca (RF15) enquanto a tabela da lança principal não é transcrita, com aviso explícito na tela, em vez de sugerir configurações a partir da tabela do JIB

## Task 11.5 — Desempenho da cena 3D (não prevista) ✅
- [x] **Achado durante a validação:** os testes de arrasto ficaram intermitentes (timeouts). O perfil de CPU (CDP) mostrou que o gargalo não era o React: a cena renderizava ~20 quadros/s **parada** (WebGL por software), e cada interação disputava CPU com isso. Uma linha de base no commit anterior (worktree isolado) mostrou **o mesmo custo**, ou seja, não era regressão do Épico 11, mas um desperdício que já existia. Corrigido com `frameloop="demand"` no `<Canvas>` (só renderiza quando algo muda): tarefas longas com a cena parada caíram de 26 para 0 em 3 s, e a suíte e2e caiu de 1,6 min para ~40 s, estável em execução repetida

**Verificação (05/10/2026):** 102 testes unitários (90 + 12 da store), 11/11 e2e (suíte completa 2x seguidas: 22/22), typecheck e `npm run build` limpos. Novos e2e: área derivada do giro (0° → 7.500 kg frontal; 90° → 10.500 kg lateral; 55° → fronteira, menor valor), sapata parcial → "sem dado", limite do engenheiro → "Atenção", JIB com offset interpolado (17,5° → 2.525 kg). `oxlint` segue bloqueado pela política de Controle de Aplicativo do Windows (ambiente).

## Sprint (visão do backlog)

### Sprint 9 — Fonte única de estado (Épico 11) ✅ Concluída (05/10/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S9-01 | ✅ Store com `cenario` único e `avaliacao` derivada; ações com limite mecânico | Alta | Task 11.1 / RF16 |
| S9-02 | ✅ Seletor manual de quadrante/zona removido (área derivada do giro + selo provisório) | Alta | Task 11.2 / RF18 |
| S9-03 | ✅ `CampoParametro` + painel com todos os parâmetros + resultado com 4 estados | Alta | Task 11.3 / RF16, RF17, RF19–RF21 |
| S9-04 | ✅ Busca reversa sem o TM-130 até a tabela polar, com aviso | Média | Task 11.4 / RF15 |
| S9-05 | ✅ `frameloop="demand"` na cena 3D (CPU parada: 26 → 0 tarefas longas/3 s) | Alta | Task 11.5 / RNF Desempenho |

**Pronto quando**: todo parâmetro é editável e escreve num único estado, do qual o resultado é sempre derivado. ✅ Atingido: 102 testes unitários + 11 e2e (22/22 em execução repetida).

## Relacionado

- [[🗺️ Roadmap]]
- Anterior: [[Épico 10 — Dados corrigidos e motor v3]]
- Próximo: [[Épico 12 — Interface estilo SolidWorks]]
