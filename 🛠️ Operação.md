---
tipo: projeto
status: ativo
criado: 2026-10-07
tags:
  - projeto
aliases:
  - Operação
  - Como rodar
---

# 🛠️ Operação

## Como rodar

Requisitos: Node.js 20.19+ ou 22.12+ (exigência do Vite 8) e npm.

```bash
cd app
npm install
npm run dev        # http://localhost:5173
```

Build de produção: `npm run build` e `npm run preview`. Testes em [[🧪 Plano de Testes]].

## Perfis e funcionalidades

| Perfil | Funcionalidades que usa |
|---|---|
| Engenheiro de içamento | Árvore de parâmetros, arrasto na cena, mapa da área, salvar/abrir/comparar cenários, PDF |
| Orçamentista | Buscar por peso, comparar cenários, PDF do orçamento |
| Banca/turma | Demonstração guiada (ver roteiro do pitch em `docs/Roteiro_Video_Pitch.md`) |

## Um dia de uso

**08h — Pedido do cliente.** A Indústria Alfa precisa trocar um transformador de 9 t em Caxias do Sul. O orçamentista abre o simulador, clica em **Buscar por peso** e informa 9.000 kg. A lista mostra primeiro as configurações do TM-130 (o menor guindaste que atende) e depois as do MD-300L.

**09h — Primeiro cenário.** O engenheiro escolhe o MD-300L, deixa a lança em 17,70 m e arrasta o gancho até 7 m de raio. Informa a carga (9.000 kg, 2,0 × 1,5 × 1,8 m), a lingada (120 kg) e a massa linear do cabo do certificado. O status fica 🟢 OK. Ele liga o **mapa da área de operação**: a 7 m o chão fica verde em todo o giro, mas a 8 m o setor frontal (±55°) fica vermelho (7.500 kg na tabela) e o lateral/traseiro continua verde (10.500 kg).

**10h — Alternativa.** Ele salva como "Frontal 7 m" num projeto novo (cliente, obra, local, responsável) e no orçamento "Proposta A". Gira a superestrutura para 90° (área lateral/traseira) e salva "Lateral 8 m". Abre **Comparar** e vê os dois lado a lado.

**11h — Incidente técnico.** Depois de rodar os testes e2e, a tela do navegador fica **branca**. A causa conhecida: o Playwright derrubou o servidor de desenvolvimento que a aba estava usando. Ele reinicia o `npm run dev` e recarrega com **Ctrl+Shift+R**. Se um dado estivesse realmente quebrado, a tela diria qual campo, em vez de ficar branca.

**14h — TM-130 sem dado.** Testando o TM-130, o resultado aparece como ⚪ **Sem dado do fabricante**: o nº de pernas do cabo não foi informado. Ele confere no moitão do equipamento, preenche o campo e o resultado aparece.

**16h — Relatório.** Ele clica em **Exportar PDF → orçamento completo**. O PDF sai com capa, comparativo, um capítulo por cenário com as vistas lateral e superior e o bloco de assinatura. Ele assina, informa a ART e envia ao cliente. No fim do dia, **Exportar JSON** guarda uma cópia do projeto fora do navegador.

## Problemas comuns

| Sintoma | Causa | O que fazer |
|---|---|---|
| Tela branca depois do e2e | O Playwright derrubou o servidor da 5173 | Reiniciar `npm run dev` e recarregar com Ctrl+Shift+R |
| Erro **504 (Outdated Optimize Dep)** | Dependência de runtime fora de `optimizeDeps.include` | Acrescentar no `vite.config.ts` e reiniciar |
| WebSocket do Vite falhando só no navegador do dia a dia | Extensão ou proxy do navegador | Testar numa janela anônima |
| "export named … not found" após atualizar o código | Cache antigo do navegador | Limpar os dados do site ou Ctrl+Shift+R |
| Tela de erro listando um campo da especificação | JSON de especificação incompleto | Corrigir o campo apontado em `data/especificacoes/` |
| Projetos sumiram | IndexedDB é por navegador/perfil (janela anônima não guarda) | Usar o mesmo perfil; manter backups com Exportar JSON |
| `oxlint` não roda | Controle de Aplicativo do Windows bloqueia o binário nativo (aconteceu em 05/10) | Problema do ambiente, não do código |

## Backup dos dados

Os projetos vivem no **IndexedDB do navegador**. Limpar os dados do site apaga tudo. Rotina recomendada: **Exportar JSON** de cada projeto ao fechar um orçamento. Importar sempre cria uma cópia, então não há risco de sobrescrever.

## Relacionado

- [[🖥️ Interface]]
- [[🧪 Plano de Testes]]
- [[🐛 Bugs e Lições Aprendidas]]
- [[📈 Indicadores]]
