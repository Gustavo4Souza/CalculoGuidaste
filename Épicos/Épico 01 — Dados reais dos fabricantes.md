---
tipo: projeto
status: concluido
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 1
---

# Épico 1 — Ingestão dos dados reais dos fabricantes

*Pronto quando*: as tabelas de carga do MD-300L e do TM-130 estão digitalizadas em JSON e validadas manualmente contra pelo menos 3 pontos de cada tabela impressa.

**Status: ✅ Concluído (13/09/2026).**

**Nota (13/09/2026):** os pontos originais de ambas as tabelas tinham erros vindos de extração de texto de PDF (mapeamento de coluna errado no MD-300L; inferência de células mescladas errada na Zona II do TM-130 — ver histórico em `app/src/data/tabelas/README.md`). O problema foi resolvido de vez quando Gustavo criou `docs/Tabelas_Extraidas_Guindaste.xlsx` e `docs/Tabelas_Zonas_Giro.xlsx` diretamente a partir das tabelas impressas — os dados foram extraídos **mecanicamente** do XML dessas planilhas (sem depender de leitura de texto de PDF), eliminando o risco de erro de coluna/célula mesclada.

## Task 1.1 — Digitalizar tabela MD-300L ✅ Concluído
- [x] Transcrever tabela Área Frontal (7 comprimentos de lança × todos os raios) — completo em `app/src/data/tabelas/md-300l.json`, a partir de `docs/Tabelas_Extraidas_Guindaste.xlsx`
- [x] Transcrever tabela Área Lateral/Traseira — completo no mesmo arquivo
- [x] Transcrever as 4 tabelas de JIB (3 comprimentos × 3 ângulos, frontal e lateral/traseira) — completo em `app/src/data/tabelas/md-300l-jib.json` (ainda não conectado ao motor de cálculo — RF12/Task 3.3)
- [x] Registrar constantes geométricas (altura do pé da lança 3 m, recuo 1,4 m) — já em `app/src/data/guindastes.json`

## Task 1.2 — Digitalizar tabela TM-130 ✅ Concluído
- [x] Transcrever tabela Zona I / Zona II por ângulo da lança — completo em `app/src/data/tabelas/tm-130.json`, a partir de `docs/Tabelas_Zonas_Giro.xlsx`
- [x] Conferir contra a tabela impressa — confirmado via planilha extraída mecanicamente (ver `app/src/data/tabelas/README.md`); corrigiu a inferência anterior sobre as células mescladas da Zona II (65°/70° = 3.800 kg, não 3.700 kg)
- [x] Registrar constantes geométricas (altura do pé da lança 2,8 m, recuo 0 m) — já em `app/src/data/guindastes.json`

## Task 1.3 — Definir schema JSON que suporte as duas variantes ✅ Concluído
- [x] Schema "comprimento + raio + quadrante" (MD-300L)
- [x] Schema "zona + ângulo" (TM-130)
- [x] Camada de abstração comum para o motor de cálculo consumir os dois formatos

Formalizado em `app/src/data/tabelas/tabela-carga.schema.json` (JSON Schema draft-07, `oneOf` das duas variantes + tabela de JIB), espelhando os tipos TypeScript já existentes em `app/src/types/guindaste.ts` e consumidos por `app/src/engine/calcularCapacidadeMaxima.ts` via `calcularCapacidadeMaxima()`.

**Nota:** a tabela do TM-130 tem células mescladas na ficha técnica original — a transcrição da Task 1.2 precisa ser conferida manualmente contra o PDF, não só por extração automática.

## Sprint (visão do backlog)

### Sprint 1 — Ingestão de dados reais (Épico 1) ✅ Concluída (13/09/2026)

| ID | Tarefa | Prioridade | Rastreio |
|---|---|---|---|
| S1-01 | Setup do projeto (Vite + React + TS), conectar ao repositório GitHub (`Gustavo4Souza/CalculoGuidaste`), deploy inicial no Vercel | Alta | Task 3.1 |
| S1-02 | ✅ Digitalizar a tabela do MD-300L (frontal + lateral/traseira + JIB) em JSON, variante comprimento+raio+quadrante | Alta | Task 1.1 |
| S1-03 | ✅ Digitalizar a tabela do TM-130 (Zona I/II × ângulo) em JSON, variante zona+ângulo — conferido contra planilha extraída da ficha técnica | Alta | Task 1.2 |
| S1-04 | ✅ Definir o schema JSON comum que suporta as duas variantes | Alta | Task 1.3 |

**Pronto quando**: as duas tabelas estão digitalizadas e validadas manualmente contra pelo menos 3 pontos de cada tabela impressa. ✅ Atingido — ver `app/src/data/tabelas/README.md` e os testes em `app/src/engine/calcularCapacidadeMaxima.test.ts` / `calcularCapacidadeMaximaTM130.test.ts`. S1-01 (setup/deploy) ainda não foi formalmente concluído nesta sprint, mas o esqueleto do projeto (`app/`) já existe e roda localmente.

## Relacionado

- [[🗺️ Roadmap]]
- Anterior: [[Épico 00 — Fundamentos e protótipo]]
- Próximo: [[Épico 02 — Motor de cálculo v2]]
