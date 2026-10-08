---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 15
concluido_em: 2026-10-05
---

# Épico 15 — Persistência e projetos/orçamentos/cenários (RF24/RF25) ✅ Concluído (05/10/2026)

## Task 15.1 — Camada de persistência isolada ✅
- [x] `persistencia/RepositorioProjetos.ts`: interface única que a UI conhece (listar/buscar/obter/criar/atualizar/excluir projetos, orçamentos e cenários; duplicar cenário; exportar/importar projeto). Tudo assíncrono, e os métodos devolvem cópias. Um backend futuro implementa a mesma interface; a troca é uma linha em `persistencia/repositorio.ts`
- [x] `persistencia/RepositorioIndexedDB.ts`: implementação no IndexedDB com a lib `idb` (~1 kB). Banco `guindastes-ribas`, stores `projetos`, `orcamentos` (índice por projeto) e `cenarios` (índice por orçamento). Exclusão em **cascata** (projeto → orçamentos → cenários) numa única transação. Busca sem diferenciar maiúsculas nem acentos ("industria" acha "Indústria"). Listas do mais recente para o mais antigo
- [x] **Por que IndexedDB** (pedido de prós e contras): funciona offline, sem servidor e sem login, e aguenta os dados de cenários (e as capturas do Épico 16). O contra é que os dados ficam presos ao navegador, resolvido pelo exportar/importar JSON. Alternativas avaliadas: File System Access API (só Chromium, mais atrito) e backend tipo Supabase (sincroniza, mas traz auth, custo e LGPD fora do escopo do semestre)

## Task 15.2 — Modelo e versionamento ✅
- [x] `types/projeto.ts`: Projeto {cliente, obra, local, responsável} → Orçamento {nome, descrição} → CenarioSalvo {nome, **parametros completos**, **resultado no momento do salvamento**, `versaoTabelas`, `versaoCriterioGiro`, `criterioGiroProvisorio`}
- [x] `persistencia/montarCenario.ts`: monta o registro com o resultado avaliado agora pelo motor e as versões. `versoesDiferentes()` diz se o cenário foi salvo com outras tabelas ou outro critério de giro
- [x] Arquivo de projeto (`persistencia/arquivoDeProjeto.ts`): `formato: "guindastes-ribas/projeto"` + `schemaVersion` (1), com ponto de migração para versões futuras. **Importar sempre como cópia** (IDs novos, vínculos remapeados), nunca sobrescrevendo um projeto existente. Validação com mensagens em português: JSON inválido, formato errado, versão mais nova, guindaste fora da frota, campo numérico inválido (ex.: "17,7" como texto), cenário apontando para orçamento inexistente. Nada é gravado se o arquivo é recusado

## Task 15.3 — Interface ✅
- [x] Barra de comandos: **Novo** (desvincula o cenário; pede confirmação se houver alterações não salvas), **Abrir** (gerenciador), **Salvar** (sobrescreve o cenário aberto; sem cenário aberto, vira "Salvar como"; mostra ● com alterações pendentes), **Salvar como cenário**, **Comparar**, **Importar JSON**, **Exportar JSON**. Só o **Exportar PDF** segue desabilitado (Épico 16)
- [x] `components/projetos/DialogoProjetos.tsx`: gerenciador em 3 colunas (projetos com busca, criar e editar | orçamentos do projeto | cenários do orçamento com guindaste, % de utilização e status), com abrir, duplicar, renomear e excluir (exclusões confirmadas) e caixas para escolher cenários a comparar
- [x] `components/projetos/DialogoSalvarCenario.tsx`: escolhe (ou cria na hora) projeto e orçamento e dá nome ao cenário
- [x] `components/projetos/DialogoComparar.tsx`: 2 ou mais cenários lado a lado (status, guindaste, lança, JIB, raio, giro/área, sapatas, carga, somatório, capacidade exata/interpolada, utilização, limite do engenheiro, versões), com o resultado **como foi salvo** e ⚠ quando a versão difere da atual
- [x] `components/projetos/CenarioAberto.tsx` no topo do painel de resultado: projeto › orçamento › cenário, "● alterações não salvas" e, se o cenário foi salvo com outra versão das tabelas ou do critério de giro, o resultado **salvo × recalculado** lado a lado
- [x] `components/Dialogo.tsx`: diálogo modal genérico (`<dialog>` nativo); a busca reversa passou a usá-lo. `useInterfaceStore.dialogo` substituiu o antigo `buscaAberta`
- [x] `store/useProjetosStore.ts`: estado do gerenciador e do cenário aberto. Abrir um cenário carrega os parâmetros na store da simulação (`carregarCenario`), e o resultado é recalculado na hora

**Verificação (05/10/2026):** 125 testes unitários (+8 do repositório com `fake-indexeddb`: CRUD, busca, cópias, sobrescrever/duplicar, cascata, ida e volta do JSON e 6 tipos de arquivo inválido); 19/19 e2e (suíte 2x seguidas: 38/38, em duas rodadas independentes), com 3 testes novos: salvar → alterar → salvar como novo → **recarregar a página** → reabrir idêntico → comparar; exportar → importar como cópia → arquivo inválido recusado; excluir em cascata com confirmação. Typecheck e `npm run build` limpos. Revisão visual do gerenciador e da comparação por captura.

**Nota de verificação:** numa rodada intermediária a suíte falhou de forma espalhada (testes diferentes a cada vez, com "Target crashed", ou seja, o processo do navegador caindo). Repetida com o ambiente limpo (sem servidores sobrando, ~5 GB livres), passou 38/38 em duas rodadas seguidas. Foi instabilidade da máquina, não do código.

## Avaliação pós-Épico 15 — bug da tela branca ✅ Corrigido (05/10/2026)

**Relato do Gustavo:** ao rodar o projeto, a tela ficava toda branca. No console: `Cannot read properties of undefined (reading 'dianteiraM')` em `extremosDoCaminhao` (cena 3D) e o WebSocket do Vite falhando.

**Diagnóstico:**
- Os arquivos em disco estavam corretos: as duas especificações têm o bloco `caminhao` (commitado no Épico 13). Com um servidor recém-iniciado, a aplicação carrega sem nenhum erro, tanto em desenvolvimento quanto no build de produção (`vite preview`).
- O navegador estava rodando o código novo da cena com o JSON de especificação **antigo**, e o WebSocket do Vite sem conexão indica uma aba ligada a um servidor que já não existia. Causa provável: o Playwright sobe o `npm run dev` na porta 5173 durante os testes e o derruba no fim; uma aba aberta nesse servidor temporário fica com módulos de momentos diferentes.
- O erro de `hostname` no console **não é do projeto**: o termo não aparece em `src/`. Vem do cliente do Vite sem conexão ou de extensão do navegador.
- **O defeito real era de robustez**: a aplicação não tinha nenhum limite de erro, então qualquer erro na cena desmontava a tela inteira. Além disso, um dado incompleto só aparecia como `undefined` lá dentro da cena.

**Correções:**
- [x] `components/LimiteDeErro.tsx` (error boundary): em volta da cena 3D, um erro nela deixa a árvore de parâmetros e o resultado funcionando, com "Tentar de novo" e "Recarregar a página". Também em volta da aplicação inteira, como última defesa
- [x] `data/validarEspecificacao.ts` + `PROBLEMAS_DE_DADOS` em `data/catalogo.ts`: confere todos os campos obrigatórios das especificações e diz **pelo nome** o que falta (ex.: `"caminhao.dianteiraM" ausente ou inválido`). Não lança erro na importação do módulo, porque isso voltaria a deixar a tela em branco
- [x] `main.tsx`: confere os dados **antes** de carregar a aplicação (importação dinâmica do `App`). A store da simulação monta o cenário inicial na importação do módulo, então um dado quebrado derrubaria tudo antes de qualquer limite de erro existir. Com problema, mostra uma tela com a lista e a orientação (Ctrl+Shift+R / reiniciar o servidor). Os estilos dessa tela ficam em `index.css`, porque `App.css` só carrega junto com o `App`
- [x] `RepositorioIndexedDB`: falha ao abrir o IndexedDB (ex.: janela anônima com armazenamento bloqueado) vira mensagem clara, sem "Uncaught (in promise)"
- [x] `useProjetosStore`: `criarProjeto`, `criarOrcamento`, `selecionarProjeto` e `selecionarOrcamento` passaram a tratar erro. **Defeito encontrado na revisão**: o diálogo "Salvar como cenário" fechava mesmo quando a gravação falhava, e o engenheiro acharia que tinha salvado. Agora `salvarComoNovo` devolve se salvou, e o diálogo só fecha em caso de sucesso, mostrando o erro caso contrário

**Verificação:** 128 testes unitários (+3 da validação: especificações reais completas, especificação sem `caminhao` apontada pelo nome, número como texto apontado); 20/20 e2e (2x seguidas: 40/40), incluindo um teste novo que **reproduz o relato** (intercepta o `md-300l.json` e entrega a versão sem `caminhao`) e confere que aparece a mensagem com o nome do campo, não a tela branca; typecheck e build limpos; captura de tela da mensagem de erro.

## Sprint (visão do backlog)

### Sprint 13 — Persistência e projetos/orçamentos/cenários (Épico 15) ✅ Concluída (05/10/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S13-01 | ✅ `RepositorioProjetos` (interface) + `RepositorioIndexedDB` (idb), cascata, busca, cópias | Alta | Task 15.1 / RF25 |
| S13-02 | ✅ Cenário salvo com parâmetros completos, resultado e versões das tabelas/critério de giro | Alta | Task 15.2 / RF24 |
| S13-03 | ✅ Exportar/importar projeto em JSON (sempre como cópia, com validação e schemaVersion) | Alta | Task 15.2 / RF25 |
| S13-04 | ✅ Gerenciador, salvar/salvar como, abrir (estado idêntico), comparar 2+ cenários, aviso de versão | Alta | Task 15.3 / RF24 |

**Pronto quando**: o engenheiro cria projetos, orçamentos e cenários, reabre um cenário exatamente como salvou, compara cenários e leva o projeto para outra máquina por JSON. ✅ Atingido: 125 unitários + 19 e2e (38/38 em execução repetida).

### Correção pós-Épico 15 — tela branca ✅ (05/10/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| FIX-01 | ✅ Limites de erro (cena 3D e aplicação), validação das especificações com mensagem pelo nome do campo, checagem de dados antes de carregar o `App` | Alta | ROADMAP, avaliação pós-Épico 15 |
| FIX-02 | ✅ IndexedDB indisponível → mensagem clara; "Salvar como cenário" não fecha mais quando a gravação falha | Alta | ROADMAP, avaliação pós-Épico 15 |

## Relacionado

- [[🗺️ Roadmap]]
- Anterior: [[Épico 14 — Mapa da área de operação]]
- Próximo: [[Épico 16 — Relatório PDF]]
