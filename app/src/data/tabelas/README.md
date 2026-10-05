# Tabelas de carga (dados reais)

Este é o destino final da digitalização das tabelas dos fabricantes — **Épico 1** do roadmap (`../../../ROADMAP.md`).

- `tabela-carga.schema.json` — schema JSON formal (Task 1.3) que documenta as duas variantes (`comprimento_raio_quadrante` e `zona_angulo`) e a tabela de JIB. Espelha os tipos TypeScript em `../../types/guindaste.ts`, que já implementam a camada de abstração comum consumida pelo motor de cálculo (`../../engine/calcularCapacidadeMaxima.ts`).

## ⚠️ Correção de 05/10/2026 (Épico 10): a tabela zona × ângulo do TM-130 é a do JIB

Lendo a p.2 de `../../../docs/TM_130.pdf` renderizada em alta resolução, a tabela "Zona de giro × Ângulo da lança × Carga" (3.000–3.800 kg) tem a legenda **"Com sapata para lança JIB"**. A tabela da **lança principal** é outra: o diagrama polar ao lado, **"Com sapata para lança principal"**, por **raio** (arcos de 4 a 12 m) e zona (Zona I 0°~16°, Zona II 16°~60°), com capacidade máxima de 26.000 kg (`A=26000`).

- `tm-130.json` foi renomeado para **`tm-130-jib.json`** (conteúdo idêntico, dados continuam conferidos). O TM-130 fica com `possuiJIB = false` (desligado) até a Ribas confirmar se a unidade dela tem JIB.
- **Pendente (Task 10.1):** transcrever o diagrama polar numa nova aba `Principal_Polar` de `docs/Tabelas_Zonas_Giro.xlsx` (`zona | raio_inicial_m | raio_final_m | capacidade_kg`) e extrair mecanicamente para `tm-130-principal.json`. Interpretação decidida: **degrau conservador**, ou seja, cada valor vale para toda a faixa até o arco externo, sem interpolar entre faixas (a confirmar com a Ribas). Até lá, o motor novo (`engine/avaliarCenario.ts`) responde "sem dado do fabricante" para a lança principal do TM-130.

## `tm-130-jib.json` (antigo `tm-130.json`) — variante B (`zona_angulo`) ✅ Completo (13/09/2026)

Digitalização completa das duas zonas de giro (Zona I 0°–16° e Zona II 16°–60°, cada uma com 12 ângulos de lança de 0° a 70°), a partir de `../../../docs/Tabelas_Zonas_Giro.xlsx` — planilha criada por Gustavo diretamente da tabela impressa (`../../../docs/TM_130.pdf`), com uma aba por zona (`Zona_I`, `Zona_II`). Extraído mecanicamente do XML da planilha, mesma técnica usada no MD-300L.

⚠️ **Histórico**: uma tentativa anterior (via extração de texto puro do PDF, que tem células mescladas na ficha técnica original — ver `../../../ROADMAP.md`) tinha inferido os valores de 40°–70° (Zona I) e 60°–70° (Zona II) por dedução, sem confirmação visual das linhas de mesclagem. A planilha confirmou a Zona I certinha, mas corrigiu a Zona II: os ângulos **65° e 70° valem 3.800 kg**, não 3.700 kg como a inferência anterior assumia (o platô de 3.700 kg vai só até 60°).

## `md-300l.json` — variante A (`comprimento_raio_quadrante`) ✅ Completo (13/09/2026)

Digitalização completa das áreas **Frontal** e **Lateral/Traseira** (7 comprimentos de lança × todos os raios tabelados, gancho principal), a partir de `../../../docs/Tabelas_Extraidas_Guindaste.xlsx` — planilha criada por Gustavo diretamente da tabela impressa (`../../../docs/Tabela Guindaste MD-300L.pdf`), com uma aba por sub-tabela (`01_Frontal_Principal`, `02_Lateral_Principal`). Os dados foram extraídos **mecanicamente** do XML da planilha (não digitados/lidos manualmente célula a célula pelo assistente), o que elimina o risco de erro de mapeamento de coluna que apareceu na tentativa anterior via texto de PDF.

⚠️ **Histórico do episódio de correção**: a primeira tentativa de digitalizar essa tabela (via extração de texto puro do PDF) produziu um mapeamento de colunas errado. A correção intermediária aplicada antes desta planilha (mudar os 2 pontos-semente de `comprimentoLancaM: 17.70` para `14.10`) também estava **parcialmente errada** — o valor real de 20.000 kgf/16.000 kgf na coluna 14,10 m está no raio **4,00 m**, não 6,00 m (a essa altura, raio 6,00 m/14,10 m vale 14.500 kgf frontal / 15.300 kgf lateral-traseira). Os testes em `../../engine/calcularCapacidadeMaxima.test.ts` foram atualizados para os valores corretos, com mais pontos exatos cobrindo as duas áreas.

## `md-300l-jib.json` — `TabelaJIB` (opcional, só guindastes com `possuiJIB = true`) ✅ Completo (13/09/2026)

As 2 sub-tabelas de JIB (frontal e lateral/traseira, cada uma com as 9 combinações de 3 comprimentos de JIB × 3 ângulos), também extraídas mecanicamente das abas `03_Frontal_JIB` e `04_Lateral_JIB` da mesma planilha. Ainda **não conectado ao motor de cálculo** — o suporte a JIB no cálculo (RF12) é escopo do Épico 3 (Task 3.3), não do Épico 1.

Fonte dos dados: `../../../docs/Informações gerais - içamento.xlsx`, `../../../docs/Tabela Guindaste MD-300L.pdf` e `../../../docs/TM_130.pdf` (raiz do repo).

## Achado de 05/10/2026: possível erro de impressão na tabela do JIB do MD-300L

Em `md-300l-jib.json`, JIB 20,0 m a 25° (lateral/traseira) tem **100 kg a 26 m** e **350 kg a 28 m**, o que não é monotônico. Conferido na p.3 do PDF: é exatamente o que está impresso (não é erro de transcrição). Mantido como está, porque o motor só interpola entre pontos reais e arredonda para baixo, então o efeito é conservador. Vale perguntar à Ribas.

## Especificações técnicas (`../especificacoes/*.json`) — Épico 10

Limites mecânicos, dimensões, passagem de cabo e moitão de cada guindaste, **cada valor com a sua fonte** (`"fonte": "ficha p.X"` ou `"aproximado"`). Os valores `"aproximado"` não constam nas fontes e aparecem com o selo "≈" na interface e no relatório, aguardando decisão do Gustavo.
