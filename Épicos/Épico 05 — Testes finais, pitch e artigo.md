---
tipo: projeto
status: ativo
criado: 2026-10-07
tags:
  - projeto
  - epico
epico: 5
---

# Épico 5 — Testes finais e apoio ao pitch/artigo 🟡 Quase concluído (13/09/2026)

Task 5.1 concluída. Task 5.2 tem o roteiro pronto, falta só a gravação (depende do Gustavo). Task 5.3 tem o rascunho bibliográfico e as seções de resultado/conclusão prontos, falta transcrever para o `.docx` e revisar o resumo.

## Task 5.1 — Testes de fluxo ponta a ponta ✅ Concluído
- [x] Playwright cobrindo UC02 para os dois guindastes — arrasto real via `page.mouse` (não só preenchimento de campos) em `e2e/simulador.spec.ts`: MD-300L (arrasta o gancho, confere raio e capacidade) e TM-130 (arrasta o gancho, confere ângulo e o platô de 3.800 kg da Zona I). 7 specs no total, cobrindo também status/JIB/busca reversa/bug de digitação.

## Task 5.2 — Roteiro e gravação do vídeo pitch
- [x] Roteiro escrito em `docs/Roteiro_Video_Pitch.md` (8 cenas, ~3–4 min, com falas sugeridas e checklist pré-gravação), já com o protótipo de produção funcionando (não mais o POC)
- [ ] Gravação em si — depende de tempo de câmera/voz do Gustavo, não é algo que o assistente possa produzir

## Task 5.3 — Artigo científico 🟡 Rascunho avançado
- [x] Levantamento bibliográfico inicial — 6 referências reais (verificadas via busca, não inventadas): Sommerville (2019), Sommerville & Sawyer (1997), Vazquez & Simões (2016), Martins (2007), PMI/PMBOK (2017) e OSHA 29 CFR 1926.1417 — substituindo os placeholders "(Citação)" do rascunho existente; a citação genérica "Tadano" foi trocada pelos fabricantes reais do projeto (Madal Palfinger, Grupo Luna)
- [x] Seções 4 (Apresentação e discussão dos resultados) e 5 (Considerações finais) redigidas com base no que foi de fato implementado (Épicos 0–4) — `docs/Artigo_Secoes_Pendentes.md`
- [ ] Transcrever o conteúdo de `docs/Artigo_Secoes_Pendentes.md` para dentro do `.docx` original, reaplicando a formatação ABNT (o Word não é editável diretamente pelo assistente)
- [ ] Atualizar o resumo/abstract (ainda genéricos) e preencher os dados do orientador e dos coautores 2/3, que seguem como placeholder

## Sprint (visão do backlog)

A Sprint 4 cobriu os Épicos 4 e 5: ver [[Épico 04 — Alertas, validação e usabilidade#Sprint (visão do backlog)]].

## Relacionado

- [[🗺️ Roadmap]]
- Anterior: [[Épico 04 — Alertas, validação e usabilidade]]
- Próximo: [[Épico 06 — Melhorias futuras]]
