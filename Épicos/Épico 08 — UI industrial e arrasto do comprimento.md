---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 8
concluido_em: 2026-09-13
---

# Épico 8 — UI/UX industrial (painel escuro) + lança ajustável por arrasto (comprimento) ✅ Concluído (13/09/2026)

*Pedido do Gustavo:* o layout do Épico 7 ficou muito melhor, mas o visual ainda não passa a sensação de ferramenta **industrial** (o projeto é para uso industrial) — e hoje o comprimento da lança só é ajustável por um seletor discreto (dropdown), sem poder "puxar" a própria lança na cena 3D para estendê-la/recolhê-la, como seria natural num simulador desse tipo.

Confirmado com o Gustavo (2 perguntas de esclarecimento, nesta sessão do Claude Desktop):
1. O pedido de "ajustar o tamanho da lança" é especificamente sobre **arrastar a própria lança na cena 3D para mudar o comprimento** (não só o ângulo, como hoje) — não é sobre um bug no seletor existente, nem sobre destravar o comprimento no modo JIB ou dar um eixo de comprimento ao TM-130 (ver limitações reais na Task 8.2).
2. A direção visual escolhida foi **painel de controle industrial escuro, estilo HUD** — tema escuro, acentos de segurança em amarelo/laranja, tipografia técnica, indicadores estilo instrumento — em vez de um dashboard corporativo claro.

> **Nota de processo:** a sessão do Claude Desktop/Cowork levantou, esclareceu e documentou esta melhoria; a implementação de código foi feita depois, numa sessão do **Claude Code** (14/09/2026).

## Task 8.1 — Redesenho visual: painel de controle industrial (tema escuro / HUD) ✅ Concluído
- [x] Nova paleta fixa (não condicional a `prefers-color-scheme` — é a identidade visual da ferramenta): fundo grafite/preto (`--bg`/`--bg-elevado`/`--bg-painel`/`--bg-instrumento`), acento âmbar/laranja de segurança (`--accent`/`--accent-forte`), tipografia monoespaçada (`--mono`) para números e leituras — `app/src/index.css` + `app/src/App.css` reescritos
- [x] Indicadores de resultado redesenhados como "instrumento": `components/MedidorCapacidade.tsx` — barra de limite (mostrador) do somatório de cargas como % da capacidade, com marca no ponto de 100% e cor por faixa (verde/âmbar/vermelho), além do número da capacidade em fonte monoespaçada tabular
- [x] Contraste — texto claro (`--text-h`, `--text`) sobre fundos escuros; texto ESCURO (`--accent-texto`) sobre elementos com fundo âmbar (aba ativa), já que branco sobre âmbar não passaria em AA
- [x] Barra superior, abas e painel lateral redesenhados (bordas retas, uppercase técnico, inputs com fundo `--bg-instrumento`) — a estrutura de abas/tela cheia do Épico 7 não mudou, só o visual
- [x] Cena 3D (WebGL) também ajustada para combinar: chão escuro, grid com linhas de seção âmbar, JIB na cor de acento, rótulos flutuantes em estilo HUD (fundo escuro, borda colorida por tipo de leitura)

## Task 8.2 — Lança com comprimento ajustável por arrasto (além do seletor) ✅ Concluído
- [x] A própria estrutura da lança principal (não só o gancho) fica arrastável para estender/recolher o comprimento — `components/CenaGuindaste3D.tsx`, complementando o seletor discreto que já existia (Task 3.4)
- [x] Confirmado: nenhuma mudança no motor de cálculo foi necessária — `calcularCapacidadeMaximaVarianteA()` já interpolava continuamente
- [x] **Decisão de "snap" tomada e documentada**: valor **contínuo/livre**, não magnetizado aos 7 pontos reais — o motor já interpola com segurança (arredondando sempre para baixo) em qualquer ponto do domínio real (10,50 m–32,10 m); o valor é sempre limitado (`clamp`) a esse intervalo, nunca extrapolado, ver `store/useSimulacaoStore.ts` (`definirComprimentoLancaM`)
- [x] Limitações reais de dados respeitadas sem alteração: modo JIB continua travando a lança principal no máximo (32,10 m); TM-130 continua sem controle de comprimento arrastável (só a referência visual fixa de 12 m)
- [x] Área de clique da lança propositalmente **maior que a barra visível** (uma "alça" invisível ao redor, mesma técnica do plano de arrasto do ângulo) — melhora tanto a usabilidade real (barra fina é difícil de acertar com precisão) quanto a confiabilidade dos testes automatizados
- [x] Geometria pura (`projetarComprimento`) extraída para `components/geometriaCanvas.ts`, com 5 testes unitários dedicados

## Task 8.3 — Testes (não prevista originalmente, adicionada durante a implementação)
- [x] 1 novo teste e2e (arrasto real da lança, `page.mouse`) + 5 novos testes unitários de `projetarComprimento` — total: 49 testes unitários (Vitest) + 8 specs e2e (Playwright), typecheck e build limpos
- [x] **Dois bugs de ambiente reais encontrados e corrigidos durante a validação, não relacionados à lógica de negócio**: (1) o `<canvas>` da cena 3D podia ser medido pelo teste antes do React Three Fiber terminar de redimensioná-lo (preso no padrão do HTML, 300×150px) — corrigido esperando duas leituras consecutivas do tamanho baterem; (2) o raycasting de hover sobre a barra fina da lança é instável em WebGL renderizado por software (headless, sem GPU) — mitigado com uma área de clique maior (também ajuda o usuário real) e uma pequena retentativa da interação no teste

**Status:** ✅ concluído (14/09/2026) — 49 testes unitários + 8 e2e passando de forma estável (confirmado em múltiplas execuções seguidas), typecheck e `npm run build` limpos.

## Verificação independente (Claude Desktop, 14/09/2026)

Depois que o Claude Code aplicou as Tasks 8.1/8.2/8.3, esta sessão do Claude Desktop revisou o código (sem alterá-lo, por instrução do Gustavo) e reexecutou a suíte completa numa cópia isolada do projeto:

- [x] Typecheck (`tsc -b --noEmit`) — limpo.
- [x] `npx vitest run` — 49/49 testes unitários passando.
- [x] `npx oxlint` — nenhum aviso em `app/src/` ou `app/e2e/` (os avisos que o comando lista vêm só de `node_modules`, não é código do projeto).
- [x] `npm run build` — build de produção OK (o aviso de chunk >500kB é pré-existente, do peso do `three.js`/`@react-three/fiber`, não é uma regressão do Épico 8).
- [x] `npx playwright test` — 8/8 specs e2e passando, incluindo o novo teste da Task 8.2 (arrasto de comprimento), **depois de contornar** o achado abaixo.
- [x] Revisão de código confirmou, ponto a ponto, o que o ROADMAP já registrava: `estruturaArrastavel` só é `true` para o MD-300L fora do modo JIB (nunca no JIB, nunca no TM-130); `projetarComprimento()` e `definirComprimentoLancaM()` limitam (`clamp`) independentemente ao domínio real da tabela (10,50–32,10 m); nenhuma mudança no motor de cálculo (`engine/`).

**Achado a corrigir numa próxima sessão do Claude Code (não é um problema de negócio, é de configuração de teste):** `app/playwright.config.ts` tem um comentário dizendo que o Chromium completo é forçado via `channel: 'chromium'` (necessário porque o `chromium_headless_shell` padrão do Playwright não tem WebGL confiável), mas essa chave **não existe de fato** no bloco `use` do arquivo — só `baseURL` e `launchOptions`. Isso não chegou a ser pego antes porque no ambiente do Gustavo (Windows, com `npx playwright install` já rodado) o Playwright acaba resolvendo um Chromium usável mesmo sem a chave `channel` explícita; mas o comportamento real diverge do que o comentário promete, e é exatamente essa lacuna que fez a suíte falhar 8/8 nesta verificação (o Playwright tentou usar o `chromium_headless_shell`, sem WebGL confiável, em vez do Chromium completo). Corrigido **só na cópia de verificação** desta sessão (nunca no arquivo real do Gustavo, por instrução dele); a correção real — adicionar `channel: 'chromium',` ao bloco `use` — fica para a próxima sessão de desenvolvimento no Claude Code.

## Verificação final

**Verificado de forma independente em 14/09/2026 (Épico 8, Claude Desktop):** typecheck limpo, 49 testes unitários (Vitest) e 8 specs e2e (Playwright) passando, `npm run build` e `oxlint` limpos. Achado (não bloqueia, ver Épico 8 acima): `app/playwright.config.ts` não seta de fato `channel: 'chromium'`, apesar do comentário dizer que sim — correção pendente para uma próxima sessão do Claude Code.

## Sprint (visão do backlog)

### Sprint 6 — UI/UX industrial (painel escuro) + lança ajustável por arrasto (Épico 8) ✅ Concluída (14/09/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S6-01 | ✅ Redesenho visual em painel de controle industrial (tema escuro/HUD, acentos de segurança amarelo/laranja, tipografia técnica) | Alta | Task 8.1 |
| S6-02 | ✅ Permitir arrastar a lança na cena 3D para ajustar o comprimento (não só o ângulo), complementando o seletor discreto já existente | Alta | Task 8.2 |
| S6-03 | ✅ Testes (não previstos originalmente): +1 e2e (arrasto de comprimento) e +5 unitários (`projetarComprimento`) | Alta | Task 8.3 |

**Pronto quando**: a UI tem uma linguagem visual industrial consistente (tema escuro, acentos de segurança) e o comprimento da lança pode ser ajustado por arrasto na cena 3D, com snap decidido e documentado — mantendo intactos o motor de cálculo, o schema de dados e as regras de negócio. ✅ Atingido — 49 testes unitários + 8 e2e passando, typecheck e build limpos (ver [[🗺️ Roadmap]], Épico 8, para o detalhe da verificação independente feita no Claude Desktop).

**Limitações de dados respeitadas (confirmado no código, não é trabalho pendente)**: no modo JIB a lança principal fica travada no comprimento máximo (a tabela de JIB não tem esse eixo); o TM-130 não tem eixo de comprimento na tabela real (só zona×ângulo).

**Nota de processo:** esta sprint foi levantada e esclarecida no Claude Desktop (13/09/2026), implementada numa sessão do Claude Code, e depois auditada/verificada de novo no Claude Desktop (14/09/2026) — sem alterar o código, só lendo, testando numa cópia isolada e atualizando esta documentação, conforme combinado com o Gustavo.

**Achado da verificação (14/09/2026), para corrigir num próximo Claude Code:** `app/playwright.config.ts` não seta de fato `channel: 'chromium'` no bloco `use`, apesar do comentário do arquivo dizer que sim — ver [[🗺️ Roadmap]] (Épico 8) para o detalhe. Não é um bug de negócio nem trava o Gustavo hoje, mas deixa o comportamento real do arquivo divergente do que ele documenta.

## Relacionado

- [[🗺️ Roadmap]]
- Anterior: [[Épico 07 — Cena 3D e tela cheia]]
- Próximo: [[Épico 09 — Guindaste 3D realista]]
