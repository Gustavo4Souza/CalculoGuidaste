# Roteiro — Vídeo Pitch (Task 5.2)

> Rascunho de roteiro para o vídeo pitch da disciplina Jornada. Escrito para ~3–4 minutos de vídeo, com o protótipo de **produção** funcionando (não mais o POC). Ajuste o texto de narração à sua própria voz — isto é um guia de estrutura e conteúdo, não um texto para decorar.
>
> **Gravação em si não incluída aqui** — grave a tela (ex.: OBS Studio, Loom, ou o gravador de tela nativo do SO) narrando por cima, seguindo as cenas abaixo. Rode `npm run dev` em `app/` antes de gravar.

## Estrutura geral

| Cena | Duração aprox. | O que mostrar na tela |
|---|---|---|
| 1. Problema | 30s | Slide/fala, sem tela do app |
| 2. Solução | 20s | Slide/fala ou tela inicial do app |
| 3. Demo — UC01/UC02 (MD-300L) | 60s | App: seleção de guindaste + arrasto no canvas |
| 4. Demo — segunda estrutura de tabela (TM-130) | 30s | App: troca de guindaste, zona de giro |
| 5. Demo — alertas e JIB | 40s | App: forçar "excede capacidade", toggle de JIB |
| 6. Demo — busca reversa (RF15) | 30s | App: campo "peso a içar" |
| 7. Diferenciais técnicos | 30s | Slide ou nada (só fala) |
| 8. Encerramento | 15s | Slide com link/repositório |

## Cena 1 — Problema (30s)

> "Na Guindastes Ribas, decidir qual guindaste usar para içar uma peça — e em qual configuração de lança e raio — hoje depende de cruzar manualmente tabelas de carga impressas, específicas de cada fabricante. É um processo lento e sujeito a erro humano, num contexto onde o erro tem consequência de segurança real."

## Cena 2 — Solução (20s)

> "Desenvolvemos um simulador web interativo que substitui esse cruzamento manual: você escolhe o guindaste, ajusta a posição da lança arrastando na tela, e o sistema calcula a capacidade máxima em tempo real, direto contra os dados reais dos fabricantes."

*(Mostrar a tela inicial do app já carregada — deixa evidente que é web, sem instalação.)*

## Cena 3 — Demo: seleção + arrasto (MD-300L) (60s)

Ações na tela, narrando em paralelo:

1. Mostrar o dropdown de guindaste — "Aqui temos os dois guindastes reais recebidos da empresa: o MD-300L, da Madal Palfinger, e o TM-130, do Grupo Luna."
2. Com o MD-300L selecionado, arrastar o gancho no canvas — "Arrastando o gancho, a lança se move e o raio de trabalho é recalculado ao vivo — e junto com ele, a capacidade máxima permitida, direto da tabela real do fabricante."
3. Apontar o indicador verde — "Enquanto a carga estiver dentro do limite, o indicador fica verde, com a margem de segurança em %."
4. Trocar o comprimento de lança no dropdown — "O comprimento de lança também é ajustável — sete opções reais, tiradas direto da ficha técnica."

## Cena 4 — Demo: segunda estrutura de tabela (TM-130) (30s)

1. Trocar para o TM-130 — "Já o TM-130 tem uma tabela de carga estruturada de um jeito completamente diferente: por zona de giro e ângulo da lança, não por raio. O sistema suporta os dois formatos por trás de uma única interface."
2. Arrastar o gancho / trocar a zona — mostrar o ângulo mudando.

## Cena 5 — Demo: alertas e JIB (40s)

1. Aumentar a "Carga içada" até exceder a capacidade — "Se a carga ultrapassa o limite, o alerta muda para vermelho, com o percentual de excedente."
2. Arrastar para um raio fora do alcance da tabela — "E se a configuração está fora da faixa que o fabricante testou, o sistema avisa em âmbar, em vez de arriscar um cálculo otimista."
3. Voltar ao MD-300L e ativar o toggle de JIB — "O MD-300L também suporta uma lança JIB opcional — o TM-130 não tem essa opção, então o toggle nem aparece pra ele."

## Cena 6 — Demo: busca reversa (RF15) (30s)

1. Preencher o campo "Peso a içar" no painel de busca — "E se a pergunta for ao contrário — 'que guindaste eu preciso para essa peça?' — o sistema varre a frota inteira e sugere as configurações viáveis, sempre começando pelo guindaste menor, o mais econômico."

## Cena 7 — Diferenciais técnicos (30s, só fala ou slide)

> "Por trás da interface, o motor de cálculo é testado com mais de 40 casos automatizados contra os valores exatos das tabelas reais dos dois fabricantes — incluindo a correção geométrica da posição da lança, o somatório de todos os pesos envolvidos no içamento (não só a carga isolada), e o arredondamento sempre para baixo em qualquer valor interpolado, como piso de segurança."

## Cena 8 — Encerramento (15s)

> "O código está aberto no GitHub, e a documentação completa do projeto — requisitos, decisões de arquitetura e roadmap — está publicada no Notion. Obrigado!"

*(Slide final com: link do repositório, link do Notion, nomes da equipe.)*

## Checklist antes de gravar

- [ ] `npm run dev` rodando sem erros de console
- [ ] Preparar uma configuração de exemplo que já dá "excede a capacidade" sem precisar digitar muito ao vivo (ex.: MD-300L, 14,10 m, raio 4 m, carga 25.000 kg)
- [ ] Preparar um raio fora da faixa para a Cena 5 (ex.: 999 m)
- [ ] Testar o áudio antes de gravar a versão final
- [ ] Ter o link do Notion e do repositório GitHub à mão para o slide final
