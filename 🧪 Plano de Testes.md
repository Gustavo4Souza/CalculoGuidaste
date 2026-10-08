---
tipo: projeto
status: ativo
criado: 2026-10-07
tags:
  - projeto
aliases:
  - Testes
---

# 🧪 Plano de Testes

> [!tip] Regra de ouro dos testes
> Toda mudança no motor de cálculo vem com teste no Vitest usando **células reais** das tabelas (nunca valores fictícios). Um teste com número inventado só prova que o código concorda consigo mesmo.

## Situação (07/10/2026)

- **161 testes unitários** (Vitest, 16 arquivos) e **23 testes e2e** (Playwright).
- A suíte e2e é rodada **2 vezes seguidas** ao fim de cada épico, porque a cena WebGL por software já mostrou intermitência.
- `tsc -b` e `npm run build` limpos; `oxlint` só com avisos antigos de fast refresh.

## Como rodar

Tudo dentro de `app/`:

| Comando | O que faz |
|---|---|
| `npm run test` | Testes unitários (Vitest), ~2 s |
| `npm run test:watch` | Vitest em modo observação |
| `npm run test:e2e` | Playwright; sobe o `npm run dev` na porta 5173 se não houver um rodando (~1 min) |
| `npm run build` | Typecheck (`tsc -b`) + build de produção |
| `npm run lint` | oxlint |

Primeira vez numa máquina: `npx playwright install chromium`.

> [!warning] Depois do e2e
> O Playwright derruba o servidor da 5173 no fim. Se a tela ficar branca no navegador do dia a dia, reinicie o `npm run dev` e recarregue com **Ctrl+Shift+R**.

## Pipeline de qualidade (por entrega)

```mermaid
flowchart LR
    A[Mudança] --> B[npm run test]
    B --> C[npm run build<br/>tsc -b + vite build]
    C --> D[npm run lint]
    D --> E[npm run test:e2e<br/>2x seguidas]
    E --> F[Revisão visual<br/>por captura de tela]
    F --> G[Docs + commit]
```

Ainda não há CI no GitHub; o pipeline roda à mão ao fim de cada épico. Automatizar é um item de [[✅ Próximos Passos]].

## Testes unitários (Vitest)

| Arquivo | O que cobre |
|---|---|
| `engine/avaliarCenario.test.ts` | Motor v3 completo: ponto exato (MD-300L 17,70 m / 8 m frontal = 7.500 kg), giro → área, fronteira de 55° e 16° com a menor capacidade, sapata parcial → sem dado, pernas, cabo calculado/sobrescrito, moitão, altura de içamento, limite do engenheiro, diagrama polar do TM-130, nº de pernas vazio |
| `engine/calcularCapacidadeMaxima*.test.ts` | Primitivas por tabela: MD-300L principal, JIB (offset interpolado: 17,5° → 2.525 kg) e TM-130 |
| `engine/interpolacao.test.ts` | Arredondamento para baixo com tolerância de ruído (18.350, não 18.349) |
| `engine/geometriaLanca.test.ts` | Raio a partir de comprimento + ângulo, com altura e recuo do pé; ângulo para um raio |
| `engine/buscaReversa.test.ts` | Configurações viáveis, menor guindaste primeiro, TM-130 pela tabela polar |
| `engine/mapaAreaOperacao.test.ts` | Cada nó do mapa = `avaliarCenario`; 17,70 m e 9.000 kg: frontal passa a 7 m e reprova a 8 m; TM-130 só ±60° |
| `store/useSimulacaoStore.test.ts` | Ações com limite mecânico, passagem de cabo que acompanha o comprimento, JIB liga/desliga |
| `components/gerenciador/nos.test.ts` | Estado de cada nó da árvore e a que nó cada motivo de "sem dado" pertence, com cenários reais |
| `components/geometriaCanvas.test.ts`, `cena/geometriaCena.test.ts` | Ímã das marcas de comprimento; posições de eixos e sapatas a partir do centro de giro |
| `data/validarEspecificacao.test.ts` | Especificações reais completas; campo faltando apontado pelo nome |
| `persistencia/RepositorioIndexedDB.test.ts` | CRUD, busca sem acento, cópias, cascata, exportar/importar e 6 tipos de arquivo inválido (`fake-indexeddb`, implementação real) |
| `relatorio/modeloRelatorio.test.ts`, `camerasDeCaptura.test.ts` | Conteúdo do PDF (exato, interpolado, sem dado, ≈, avisos de versão) e câmeras de captura |

## Testes e2e (Playwright, `app/e2e/simulador.spec.ts`)

Desde o Épico 17 os campos ficam no PropertyManager de cada nó: os helpers `editar(page, 'Lança')`, `preencher(page, nó, rótulo, valor)` e `ler(page, nó, rótulo)` abrem o nó antes. O campo é localizado pelo **início** do rótulo, porque o selo "≈" fica dentro dele.

Os arrastos são **reais** (`page.mouse`), projetando pontos 3D exatos com a câmera isométrica fixa.

- Carga inicial e ponto exato do MD-300L; indicador de status; digitação tecla a tecla no raio
- JIB só no MD-300L; UC02 arrastando o gancho (MD-300L e TM-130); arrastar a lança; clicar numa marca de encaixe
- RF18 área derivada do giro; RF17 sapata parcial; busca reversa com o TM-130 antes do MD-300L
- Layout CAD (status, cotas, vistas, kg/t); arrastar o anel de giro e o pé da sapata; carga com CG
- Mapa da área de operação (legenda, recálculo, liga/desliga)
- Salvar → alterar → salvar como novo → **recarregar a página** → reabrir idêntico → comparar
- Exportar e importar JSON (como cópia); arquivo inválido recusado; excluir em cascata
- Épico 17: "Corrigir em…" abre o nó certo, ✖ desfaz, ✔ confirma, verificações parciais sem dado
- **Regressão da tela branca:** especificação quebrada mostra o campo pelo nome
- PDF de um cenário e de um orçamento, com a tela restaurada

**Sem e2e (cobertos por revisão visual):** arrastar o ângulo do JIB e clicar nas esferas de comprimento do JIB (na câmera isométrica o JIB sai do quadro).

## Configuração do Playwright

- `channel: 'chromium'` (o headless shell não tem WebGL confiável) + `--use-gl=swiftshader`.
- Timeouts de 45 s por teste e 15 s por expect: o primeiro carregamento paga o pré-empacotamento do three.js.
- Nunca fixar `executablePath` (quebrou todo o e2e no Windows uma vez).

## Definition of Done

Um item só está **pronto** quando:

1. É rastreável a um requisito de [[📐 Requisitos]] (RF/RNF) ou a um caso de uso (UC01–UC03).
2. Está coberto por pelo menos um teste (unitário ou e2e) quando aplicável.
3. Funciona na tela sem erros de console.
4. O motor devolve **exatamente** o valor da tabela nos pontos exatos e valores coerentes (monotônicos, arredondados para baixo) nos interpolados.
5. O arrasto (UC02) não tem atraso perceptível numa máquina comum.
6. A suíte inteira (unitário + build + e2e 2x) passa e as notas afetadas foram atualizadas.

## Ordem de teste e desenvolvimento

**Dados → motor → estado → interface → persistência → relatório.** Cada camada depende da anterior estar certa: não adianta testar o arrasto se a tabela tem uma coluna trocada. Por isso o Épico 1 (dados conferidos) veio antes de tudo e o motor v3 (Épico 10) antes da nova UI.

## Relacionado

- [[📈 Indicadores]]
- [[🐛 Bugs e Lições Aprendidas]]
- [[⚖️ Regras de Negócio]]
- [[🛠️ Operação]]
