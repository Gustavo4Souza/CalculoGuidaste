---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 13
concluido_em: 2026-10-05
---

# Épico 13 — Modelo 3D fiel às fichas e arrasto de todos os parâmetros ✅ Concluído (05/10/2026)

## Task 13.1 — Referencial real e geometria a partir das especificações ✅
- [x] **Decisão de geometria**: origem do mundo = **centro de giro**. O caminhão fica parado ao longo de X e a superestrutura gira em Y; o pé da lança fica em x = −recuo (1,4 m no MD-300L, RF11). Assim o raio desenhado é exatamente o raio do motor (antes a origem era o pé e o recuo só entrava nas cotas)
- [x] Giro 0° aponta para +X: no MD-300L é a **frente do caminhão** (a lança a 0° fica sobre a cabine, setor frontal); no TM-130 é a **traseira**. Giro positivo = horário visto de cima. Nova chave `giroZeroApontaPara` na especificação
- [x] Novos blocos `caminhao` e `superestrutura` em `data/especificacoes/*.json`, cada medida com a sua fonte:
  - **MD-300L**: eixos a 5,94 / 1,36 / 0 m do centro de giro; extremos +9,989 / −2,455 m (12.444 mm); sapata traseira a −2,075 m; bitola 2,4 m e largura 2,6 m; raio traseiro de giro 3,016 m; plataforma 2,543 m; altura de transporte 3,858 m (tudo da ficha p.4). Aproximados: sapata dianteira, altura do chassi, cabine e largura da superestrutura
  - **TM-130**: sapata dianteira a 3,757 m, **derivada** da cota de 4.715,3 mm (centro de giro → sapata) da ficha p.2; o restante é aproximado. A ficha do TM-130 não traz o desenho cotado do chassi 6x4 padrão
- [x] `components/cena/geometriaCena.ts` (puro, com 6 testes unitários): posição de eixos e sapatas, lados direita/esquerda conforme a frente, convenção do giro
- [x] A legenda da viewport mostra quantas medidas do desenho vêm da ficha e quantas são aproximadas ("Desenho: 15 medidas da ficha, 5 aproximadas (≈)" no MD-300L; 5/15 no TM-130)

## Task 13.2 — Cena dividida em módulos ✅
- [x] `CenaGuindaste3D.tsx` virou composição e lê a store direto (antes recebia 15 props): `cena/Caminhao`, `cena/Sapatas`, `cena/AnelDeGiro`, `cena/SegmentoLanca` (movido sem mudança de comportamento), `cena/CargaSuspensa`, `cena/Cotas`, `cena/primitivas` (paleta e planos de arrasto vertical/horizontal), `cena/ControladorDeVista`

## Task 13.3 — Arrasto de todos os parâmetros ✅
- [x] **Giro**: anel no chão em volta do centro de giro (arrastar = girar a superestrutura), cota em arco do 0° até o giro e as **fronteiras dos setores do critério de giro desenhadas no chão** (±55° no MD-300L; ±16° e limite mecânico ±60° em vermelho no TM-130)
- [x] **Sapatas**: o pé de cada sapata arrasta só a extensão daquela sapata. Fora da extensão máxima o pé fica laranja e mostra a medida
- [x] **Lança**: comprimento (com as marcas de encaixe) e ângulo (gancho), como antes, agora no referencial que gira
- [x] **JIB**: arrastar a barra do JIB muda o ângulo (offset); clicar nas esferas ao longo do JIB troca o comprimento (só 9,0 / 15,5 / 20,0 m, seções montadas); arrastar o gancho do JIB muda o raio
- [x] **Carga** (RF19): C × L × A em escala real presa ao gancho pela lingada (ou pelo balancim), cabo de içamento da ponta até o moitão, **CG** marcado e plano da altura de içamento. Sem altura informada, a carga aparece apoiada no solo (o mesmo pior caso de cabo pendente que o motor usa)

## Task 13.4 — Testes e correções ✅
- [x] Os 3 e2e de arrasto existentes passaram a considerar o recuo de 1,4 m (a origem mudou); +3 e2e novos: arrasto do anel de giro (0° → 90°, área vira lateral/traseira), arrasto do pé de sapata (só aquela sapata muda; "sem dado") e carga/CG
- [x] **Bug real encontrado nos testes**: os rótulos das cotas (`<Html>` do drei) bloqueavam o clique nas peças que ficavam por baixo deles na tela. O contêiner que o drei cria em volta de cada rótulo intercepta o ponteiro, e a prop `pointerEvents` do `<Html>` **só vale no modo `transform`**, que não usamos. Corrigido com `style={SEM_PONTEIRO}` em todo `<Html>` que é só rótulo; os campos de entrada continuam clicáveis
- [x] O e2e passou a importar a câmera de `cena/ControladorDeVista` e `GANCHO_OFFSET_Y` de `geometriaCanvas.ts`, porque a cena agora importa o catálogo (JSON) e o carregador do Playwright não aceita JSON sem "import attributes"

**Verificação (05/10/2026):** revisão visual por captura (isométrica, lateral, planta com giro 90°, TM-130 e modo JIB, que bateu com o ponto exato da tabela: JIB 15,5 m / 25° / raio 14 m = 900 kg); 108 testes unitários (+6 de `geometriaCena`); 15/15 e2e (suíte 2x seguidas: 30/30, ~30 s); typecheck e `npm run build` limpos. **Sem e2e**: o arrasto do ângulo do JIB e o clique nas esferas de comprimento do JIB (na câmera isométrica fixa o JIB sai do quadro); cobertos por revisão visual.

**Limitações conhecidas:** as vistas padrão enquadram supondo a lança no eixo X (giro ≈ 0°); com giro grande, use a órbita. Com o MD-300L a 0° e raio curto, a carga é desenhada sobre a cabine (fiel à geometria: o desenho mostra que aquela posição não serve).

## Sprint (visão do backlog)

### Sprint 11 — Modelo 3D fiel e arrasto de todos os parâmetros (Épico 13) ✅ Concluída (05/10/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S11-01 | ✅ Origem no centro de giro; caminhão parado, superestrutura gira; medidas do caminhão/superestrutura das fichas (com fonte) | Alta | Task 13.1 / RF16 |
| S11-02 | ✅ Cena dividida em módulos (`components/cena/`) | Média | Task 13.2 |
| S11-03 | ✅ Arrasto de giro (anel + setores no chão), sapatas, JIB (ângulo/comprimento/raio), carga em escala com CG | Alta | Task 13.3 / RF16, RF18, RF19 |
| S11-04 | ✅ Rótulos `<Html>` não bloqueiam mais o clique (bug real) | Alta | Task 13.4 |

**Pronto quando**: o desenho usa as medidas das fichas (aproximadas marcadas) e todo parâmetro com sentido físico pode ser arrastado na cena. ✅ Atingido: 108 unitários + 15 e2e (30/30 em execução repetida).

## Relacionado

- [[🗺️ Roadmap]]
- Anterior: [[Épico 12 — Interface estilo SolidWorks]]
- Próximo: [[Épico 14 — Mapa da área de operação]]
