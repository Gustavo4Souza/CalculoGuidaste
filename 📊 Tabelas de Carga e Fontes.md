---
tipo: referencia
status: ativo
criado: 2026-10-07
tags:
  - projeto
aliases:
  - Tabelas de Carga
  - Fontes dos dados
---

# 📊 Tabelas de Carga e Fontes

> [!warning] Não invente pontos de tabela
> Todo valor de capacidade vem de uma fonte em `docs/` e foi conferido contra ela. Se surgir a necessidade de um ponto novo, ele vem da ficha do fabricante, é conferido à mão e só então entra no JSON. Valores que não constam nas fichas ficam marcados como `"aproximado"` (selo ≈).

## Fontes recebidas da empresa (`docs/`)

| Arquivo | O que é | Usado para |
|---|---|---|
| [[Tabela Guindaste MD-300L.pdf]] | Ficha da Madal Palfinger (escaneada, 6 págs.) | Tabelas do MD-300L, setores de giro (p.3), dimensões e alcance (p.4) |
| [[TM_130.pdf]] | Ficha do Grupo Luna (p.2 vetorial) | Diagrama polar, tabela do JIB, limites e cotas do TM-130 |
| `Informações gerais - içamento.xlsx` | Planilha de cálculo da Ribas | Regra do somatório, altura/recuo do pé da lança, Figuras A/B (setores de giro) |
| `Tabelas_Extraidas_Guindaste.xlsx` | Transcrição do Gustavo das tabelas do MD-300L | Extração mecânica de `md-300l.json` e `md-300l-jib.json` |
| `Tabelas_Zonas_Giro.xlsx` | Transcrição do Gustavo da tabela zona × ângulo do TM-130 | Extração de `tm-130-jib.json` |
| `dados_guindaste_TM-130.xlsx` | Transcrição do Gustavo do diagrama polar do TM-130 | Extração de `tm-130-principal.json` (3 células corrigidas pelo PDF) |
| `documento_tecnico_MD300L_TM130.docx` | Respostas às 8 dúvidas (06/10/2026) | Ver [[❓ Pendências com a Ribas]] |

## MD-300L (Madal Palfinger)

- **30.000 kgf a 3,0 m**, lança de 10,50 a 32,10 m em 4 seções, JIB de 9,0 + 6,5 + 4,5 m.
- `md-300l.json`: áreas **frontal** e **lateral/traseira**, 7 comprimentos (10,50 / 14,10 / 17,70 / 21,30 / 24,90 / 28,50 / 32,10 m) × raios de 3 a 28 m.
- `md-300l-jib.json`: 3 comprimentos × 3 offsets (10° / 25° / 40°) × 2 áreas, raios de 4 a 36 m.
- Extraídos **mecanicamente** do XML de `Tabelas_Extraidas_Guindaste.xlsx` (13/09/2026).
- Notas da ficha que vão para o relatório: cargas a 85% do tombamento; acima da linha vermelha o limite é estrutural, abaixo é de estabilidade; a lança só se estende sem carga.

> [!bug] Histórico: dois erros de coluna
> A primeira digitalização, por extração de texto do PDF, mapeou as colunas errado. A primeira correção também estava parcialmente errada (20.000/16.000 kgf na coluna 14,10 m ficam no raio **4 m**, não 6 m). A solução definitiva foi o Gustavo transcrever a tabela numa planilha e extrair dela por código. Lição em [[🐛 Bugs e Lições Aprendidas]].

> [!note] JIB 20 m / 25° (lateral/traseira) não é monotônico
> 100 kg a 26 m e 350 kg a 28 m. É exatamente o que está impresso na p.3 (conferido duas vezes, a última em 06/10/2026). O documento técnico de 06/10 sugeria "350 kg a 26 m e 200 kg a 28 m", mas leu a tabela **frontal**, e nenhuma das duas tabelas tem 200 kg a 28 m. Os dados ficaram como estão: o motor só interpola entre pontos reais e arredonda para baixo, então o efeito é conservador.

## TM-130 (Grupo Luna)

- **26.000 kgf a 5 m**, lança recolhida de 5,9 m, ângulo de 0 a 70°, giro total de 120°.
- `tm-130-principal.json` (06/10/2026): diagrama polar **"Com sapata para lança principal"**.

| Raio (m) | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|
| **Zona I** (≤ 16°) | — | 26.000 | 21.600 | 18.500 | 16.000 | 11.000 | 10.000 | 8.800 | 8.100 |
| **Zona II** (16°–60°) | 20.400 | 16.300 | 13.300 | 11.200 | 7.700 | 6.100 | 5.100 | 4.500 | 4.000 |

  Valores em kg, um por arco do diagrama. Entre raios: interpolação para baixo. Fora de 5–12 m (Zona I) ou 4–12 m (Zona II): sem dado.
- `tm-130-jib.json` (antigo `tm-130.json`): tabela zona × ângulo, que pela legenda da ficha é **"Com sapata para lança JIB"**. Fica desligada.

> [!bug] Histórico: a tabela do TM-130 era a do JIB
> Até 05/10/2026 o simulador usava a tabela zona × ângulo (3.000–3.800 kg) como se fosse a da lança principal. Lendo a legenda da ficha, ela é a do **JIB**. A da lança principal é o diagrama polar, que o Gustavo transcreveu em `dados_guindaste_TM-130.xlsx`. Na conferência contra a camada de texto do PDF, 3 células da planilha estavam erradas e foram corrigidas para o valor do PDF:
> - Zona II, 5 m: 16.000 → **16.300**
> - Zona II, 8 m: 7.100 → **7.700**
> - Zona I, 6 m: 21.000 → **21.600**
>
> O script de extração recusa qualquer valor que não esteja no texto do diagrama e qualquer capacidade que aumente com o raio.

> [!bug] Histórico: células mescladas na tabela do JIB
> Uma leitura antiga por texto do PDF tinha deduzido 3.700 kg para 65°/70° na Zona II. A planilha mostrou que vale **3.800 kg** (o patamar de 3.700 kg vai só até 60°).

## Especificações e valores aproximados

Medidas que os desenhos **não cotam** ficam com `"fonte": "aproximado"`:

- **MD-300L:** recolhimento das sapatas, posição da sapata dianteira, altura do chassi, cabine, largura da superestrutura, comprimento de cada seção, distância mínima ponta → gancho.
- **TM-130:** comprimento máximo da lança (~12,4 m, derivado do alcance hidráulico), a maior parte do chassi.

Na legenda da cena aparece quantas medidas do desenho vêm da ficha e quantas são aproximadas.

## Relacionado

- [[🗄️ Modelo de Dados]]
- [[⚖️ Regras de Negócio]]
- [[❓ Pendências com a Ribas]]
- [[🐛 Bugs e Lições Aprendidas]]
