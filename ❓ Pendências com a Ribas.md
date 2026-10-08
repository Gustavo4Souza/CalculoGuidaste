---
tipo: projeto
status: ativo
criado: 2026-10-07
tags:
  - projeto
aliases:
  - Pendências com a Ribas
  - Dúvidas para a empresa
---

# ❓ Pendências com a Ribas

Dados que **só a empresa pode confirmar**. Enquanto não vierem, o simulador responde "Sem dado do fabricante" ou usa uma convenção marcada, nunca um palpite.

## Em aberto

| # | Pergunta | Como o simulador se comporta hoje | Como obter |
|---|---|---|---|
| 1 | **Massa linear do cabo 5/8"** instalado (kg/m) | Campo vazio → sem dado (a não ser que o engenheiro sobrescreva a massa do cabo) | Certificado do cabo do fornecedor |
| 2 | **Nº de pernas do cabo do TM-130** | Campo vazio → sem dado | Contar as pernas no moitão do equipamento |
| 3 | **A unidade TM-130 tem JIB?** | JIB do TM-130 desligado (tabela pronta nos dados) | Inspeção visual ou nota fiscal/lista de entrega |
| 4 | **Para que lado do caminhão aponta o 0° do diagrama do TM-130?** | Convenção: traseira. Só afeta o desenho; o relatório traz um aviso | Ver onde fica a Zona I no equipamento real |
| 5 | **Medidas não cotadas** nos desenhos (≈) | Valores aproximados marcados com ≈ | Medição no equipamento ou desenho do fabricante |

> [!question] Resposta genérica de 07/10/2026
> Chegou um texto com respostas gerais de mercado (massa linear típica de 0,95–1,10 kg/m; "0° tradicionalmente na traseira"; "26.000 ÷ 4.300 ≈ 6 pernas"). **Não fecha nenhuma pendência**, porque não é dado da unidade da Ribas:
> - A faixa de massa linear não é o cabo instalado. Usar o valor baixo deixaria o cálculo otimista.
> - A conta das pernas está errada: 6 × 4.300 = 25.800 kg, **menos** que os 26.000 kg da tabela; seriam necessárias pelo menos 7. A conclusão de manter "sem dado" está certa.
> - "Tradicionalmente na traseira" contradiz a própria ficha do MD-300L, que põe o setor frontal do lado da cabine.
>
> Possível melhoria: mostrar a faixa típica como **dica** no campo de massa linear, sem preencher valor.

## Respondidas

| Data | Pergunta | Resposta | O que mudou |
|---|---|---|---|
| 06/10/2026 | Critério do setor frontal do MD-300L | Setor de 110° = ±55° | `provisorio: false`; versão do critério `2026-10-06-1` |
| 06/10/2026 | Ângulo máximo da lança do MD-300L | 85°, do desenho (p.4) | Fonte "ficha p.4", sem ≈ |
| 06/10/2026 | Nº de pernas do TM-130 | Não consta; não deduzir pelas roldanas | Campo pode ficar vazio; TM-130 começa vazio |
| 06/10/2026 | 0° do TM-130 | Não declarado na ficha | Convenção do simulador + aviso no relatório |
| 06/10/2026 | JIB 20 m/25° com erro de impressão? | O documento disse "350 kg a 26 m, 200 kg a 28 m" | **Não aplicado**: o documento leu a tabela frontal; os dados seguem o impresso (ver [[📊 Tabelas de Carga e Fontes]]) |
| 05/10/2026 | Os `#VALUE!` das Figuras A/B da planilha | São imagens dentro da célula: setores de 110° e 250° | Base do critério de giro do MD-300L |

Fonte das respostas de 06/10: `docs/documento_tecnico_MD300L_TM130.docx`.

## Relacionado

- [[⚖️ Regras de Negócio]]
- [[📊 Tabelas de Carga e Fontes]]
- [[🗳️ Decisões e Configuração]]
- [[✅ Próximos Passos]]
