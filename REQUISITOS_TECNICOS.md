# Requisitos Técnicos por Módulo

> Espelha as seções 4 e 7 da [documentação no Notion](https://app.notion.com/p/3da034f53a1280df8666fc97c0590e38). Não existe um `SRS_Guindastes_Ribas.docx` separado da empresa — os RF01–RF15 abaixo, consolidados no Notion, cumprem esse papel.

## Requisitos Funcionais (RF01–RF26)

RF01–RF07 vêm do escopo original do projeto; RF08 em diante são novos, identificados a partir dos 3 arquivos reais recebidos da empresa em 13/09/2026.

| ID | Descrição |
|---|---|
| **RF01** | Selecionar o guindaste da frota (hoje: MD-300L e TM-130). |
| **RF02** | Manipulação gráfica interativa da lança e do raio de trabalho. |
| **RF03** | Simular a carga e emitir alertas visuais (dentro do limite / excede a capacidade / fora da faixa da tabela). |
| **RF04** | Carregar e consultar as tabelas técnicas reais dos fabricantes. |
| **RF05** | Calcular, a partir do peso da peça, a(s) configuração(ões) de guindaste necessária(s) — apresentada como lista ordenada quando houver mais de uma opção viável (ver RF15). |
| **RF06** | Calcular, a partir da configuração (raio/lança), a capacidade máxima permitida. |
| **RF07** | Interpolar entre pontos tabelados (raio, comprimento de lança ou ângulo, conforme o guindaste). |
| **RF08** *(novo)* | Suportar estruturas de tabela heterogêneas: por comprimento de lança + raio + quadrante (MD-300L) **ou** por zona de giro + ângulo da lança (TM-130). Seleção de quadrante/zona feita por um **seletor manual** (toggle/dropdown) na tela de simulação — sem simulação física de giro/azimute. |
| **RF09** *(novo)* | Capturar pesos acessórios: massa da lingada, massa do cabo de aço, e uso opcional de balancim (com massa própria). |
| **RF10** *(novo)* | Calcular o somatório de cargas (carga içada + acessórios) e comparar esse total contra a tabela — nunca a carga isolada. |
| **RF11** *(novo)* | Aplicar a correção geométrica por guindaste (altura do pé da lança + recuo do pé da lança) ao converter a posição visual da lança em raio real de tabela. |
| **RF12** *(novo, confirmado)* | Suportar lança JIB opcional (comprimento e ângulo próprios) apenas para guindastes com `possuiJIB = true` — hoje, só o MD-300L. Confirmado que o TM-130 não tem JIB. |
| **RF13** | Cadastro/administração de guindastes e tabelas (ator Administrador do Sistema). |
| **RF14** *(novo)* | Permitir ao usuário alternar a unidade de exibição da carga entre kg e toneladas (conversão só de exibição — o cálculo interno permanece sempre em kg). |
| **RF15** *(novo)* | Ao informar o peso de uma carga a içar, exibir uma lista ordenada de configurações viáveis (guindaste + comprimento de lança + raio) dentre a frota que atendem aquele peso, em vez de validar só a configuração atual — inspirado no Liebherr Crane Finder. **Critério de ordenação: menor guindaste primeiro, por capacidade nominal.** |
| **RF16** *(Épico 10+, 05/10/2026)* | Parametrização completa: todo ponto ajustável do guindaste real (comprimento e ângulo da lança, giro, JIB, sapatas, cabo, moitão, carga, acessórios) pode ser digitado em campo numérico (rótulo, unidade e faixa válida visíveis) e, quando fizer sentido, arrastado na cena 3D. Limites = limites mecânicos da ficha. |
| **RF17** | Regra de ouro: ponto exato → valor exato; entre pontos → interpolação arredondada para baixo; fora da cobertura da tabela → estado próprio **"Sem dado do fabricante — operação não validada"** (diferente de OK/NOK), com o motivo, na interface e no relatório. Vale também para configurações não tabeladas (sapata parcial, passagem de cabo diferente, JIB fora da lança exigida). |
| **RF18** *(revisa RF08)* | Giro da superestrutura 0–360° (ou o limite mecânico da ficha); quadrante (MD-300L) e zona (TM-130) passam a ser **derivados do giro**, com os limites angulares num único arquivo de configuração (`app/src/config/criteriosDeGiro.ts`) e selo "Critério de giro provisório" enquanto não confirmado. Na fronteira exata, vale a menor capacidade. |
| **RF19** | Carga com peso, dimensões C × L × A, centro de gravidade e descrição; verificação de altura de içamento necessária. |
| **RF20** | Cabo de içamento: massa = comprimento pendente × nº de pernas × massa linear (calculada, sempre visível, sobrescrevível); moitão (só o excedente sobre o gancho já incluído na tabela entra no somatório); verificação de carga por perna (dado da ficha). |
| **RF21** | Limite de utilização definido pelo engenheiro (status "Atenção" acima de X% da capacidade). |
| **RF22** | Mapa de área de operação no chão (OK / NOK / sem dado), usando a mesma função do motor. |
| **RF23** | Interface estilo CAD (SolidWorks), tema claro, com árvore de parâmetros, viewport com cubo de orientação, vistas padrão, cotas e barra de status. |
| **RF24** | Projetos → Orçamentos → Cenários: CRUD completo, duplicar, comparar 2+ cenários, reabrir com o mesmo estado; cada cenário registra a versão das tabelas e do critério de giro. |
| **RF25** | Persistência no navegador (IndexedDB) atrás de uma interface substituível, com exportar/importar JSON. |
| **RF26** | Relatório PDF por cenário e por orçamento (comparativo), com somatório detalhado, origem da capacidade (exato/interpolado e pontos usados), selo provisório, versões e campo de assinatura do engenheiro. |

> **Revisões de 05/10/2026 (Épico 10):** RF08 — o seletor manual de quadrante/zona sai (RF18). RF12 — a tabela zona × ângulo do TM-130 é, pela legenda da ficha, a **"Com sapata para lança JIB"**; o TM-130 tem uma tabela de JIB, mantida nos dados mas desligada até a Ribas confirmar se a unidade dela tem JIB. A lança principal do TM-130 usa o diagrama polar por raio ("Com sapata para lança principal").

### Requisitos não-funcionais (FURPS+)

- **Usabilidade** — fluxo principal em até 3 cliques ou 1 arrasto.
- **Confiabilidade** — 100% de precisão contra a tabela do fabricante, com **arredondamento sempre para baixo** em pontos interpolados (nunca otimista).
- **Desempenho** — canvas sem lag perceptível.

## 4.1 Módulo de Interface (UI/UX)

- **RT-UI01** — Tela de seleção de guindaste (lista/cards dos modelos da frota) → implementa RF01, UC01.
- **RT-UI02** — Canvas SVG/Konva com representação proporcional da lança e do raio de trabalho, atualizada em tempo real ao arrastar, **e** campos numéricos sincronizados nos dois sentidos (comprimento de lança, raio) → implementa RF02, UC02.
- **RT-UI03** — Seletor manual (toggle/dropdown) de quadrante (frontal/lateral-traseira, MD-300L) ou zona de giro (Zona I/II, TM-130), sem simulação física de giro/azimute → implementa RF08.
- **RT-UI04** — Toggle de uso de JIB, exibido só quando o guindaste selecionado suportar (`possuiJIB = true`) → implementa RF12.
- **RT-UI05** — Painel de peso: campos de carga içada, massa da lingada, massa do cabo de aço, e checkbox + campo de massa do balancim (opcional) → implementa RF09.
- **RT-UI06** — Campo "Peso a içar" que, além de validar a configuração atual, abre uma lista ordenada de outras configurações viáveis da frota (menor guindaste primeiro) → implementa RF05/RF15.
- **RT-UI07** — Seletor de exibição kg ⇄ toneladas (conversão só de exibição) → implementa RF14.
- **RT-UI08** — Indicador visual de status (verde = dentro do limite, âmbar = fora da faixa, vermelho = excede) com exibição da margem em % → implementa RF03, UC03.
- **RT-UI09** — Toda ação principal (selecionar guindaste, ajustar raio/lança, ver resultado) alcançável em até 3 cliques ou por arrasto direto → implementa RNF Usabilidade.
- **RT-UI10** — Renderização do canvas sem travamentos perceptíveis durante o arrasto (uso de `requestAnimationFrame` / otimização Konva) → implementa RNF Desempenho.

## 4.2 Módulo de Motor de Cálculo

- **RT-MC01** — Função pura `calcularCapacidadeMaxima(guindaste, configuração)` que despacha, por trás de uma interface única, para a implementação correta conforme o `tipo de tabela` do guindaste (`comprimento_raio_quadrante` ou `zona_angulo`) → implementa RF06/RF08.
- **RT-MC02** — Interpolação para a variante comprimento + raio + quadrante (MD-300L) e para a variante zona + ângulo (TM-130) → implementa RF07.
- **RT-MC03** — Correção geométrica: aplicar altura do pé da lança e recuo do pé da lança, por guindaste, ao converter a posição visual da lança em raio real de tabela → implementa RF11.
- **RT-MC04** — Cálculo do somatório de cargas (carga içada + massa da lingada + massa do cabo de aço + massa do balancim opcional) e comparação contra a capacidade interpolada → implementa RF09/RF10.
- **RT-MC05** — **Arredondamento sempre para baixo** (piso de segurança) do resultado interpolado, antes de comparar com o somatório de cargas → implementa RNF Confiabilidade.
- **RT-MC06** — Validação de limites: resposta explícita quando a combinação está fora da faixa operável do guindaste (não apenas "excedido", mas "configuração inválida/fora da faixa") → implementa RF03.
- **RT-MC07** — Cálculo reverso: dado um peso, varrer a frota e retornar a lista de configurações (guindaste + comprimento de lança + raio) que atendem aquele peso, ordenada por menor guindaste primeiro → implementa RF05/RF15.
- **RT-MC08** — Carregamento das tabelas técnicas reais a partir de arquivos de dados (JSON) desacoplados do código → implementa RF04.
- **RT-MC09** — Suíte de testes unitários comparando a saída do motor com valores exatos das tabelas reais do MD-300L e do TM-130 → implementa RNF Confiabilidade (100% de precisão).

## 4.3 Módulo de Dados

- **RT-DD01** — Dois schemas de tabela de carga (variante A e variante B, ver "Modelo de Dados" abaixo), documentados, sob uma camada de abstração comum para o motor de cálculo consumir os dois formatos.
- **RT-DD02** — Suporte a múltiplos guindastes da frota simultaneamente cadastrados (hoje: 2) → implementa RF01.
- **RT-DD03** — (Se houver tempo) tela simples de Administrador para cadastrar/editar guindastes e tabelas sem mexer em código → suporta o ator Administrador do Sistema, RF13.

## Modelo de Dados

O ponto central: **os dois guindastes reais têm tabelas de carga com esquemas diferentes** — o modelo de dados precisa de uma camada de abstração por "tipo de guindaste" em vez de assumir um formato único.

- **Guindaste** — id, nome/modelo, fabricante, peso total, altura do pé da lança, recuo do pé da lança, possui JIB (booleano), tipo de tabela (`comprimento_raio_quadrante` | `zona_angulo`).
- **TabelaCarga · variante A (comprimento + raio + quadrante)** — usada pelo MD-300L: comprimento de lança (discreto), quadrante (`frontal` | `lateral_traseira`), pontos de `{ raioM, capacidadeKgf }`.
- **TabelaCarga · variante B (zona + ângulo)** — usada pelo TM-130: zona de giro (`I` | `II`), pontos de `{ anguloGraus, capacidadeKg }`.
- **TabelaJIB** *(opcional, só para guindastes com JIB)* — comprimento do JIB, ângulo do JIB, quadrante, pontos de `{ raioM, capacidadeKgf }`.
- **ConfiguraçãoDeIçamento** *(entrada do usuário/estado da simulação)* — guindaste selecionado, comprimento/ângulo de lança atual, quadrante/zona atual, uso de JIB (+ parâmetros, se aplicável), carga içada, massa da lingada, massa do cabo de aço, uso de balancim (+ massa).
- **ResultadoDoCálculo** — capacidade máxima interpolada (já arredondada para baixo), somatório de cargas do usuário, status (`dentro_do_limite` | `excede_capacidade` | `fora_da_faixa`), margem ou excedente em %.

### Exemplo — Guindaste (JSON)

```json
{
  "id": "MD-300L",
  "fabricante": "Madal Palfinger",
  "pesoTotalKg": 29000,
  "alturaPeDaLancaM": 3.0,
  "recuoPeDaLancaM": 1.4,
  "possuiJIB": true,
  "tipoTabela": "comprimento_raio_quadrante"
}
```

```json
{
  "id": "TM-130",
  "fabricante": "Grupo Luna",
  "pesoTotalKg": 25500,
  "alturaPeDaLancaM": 2.8,
  "recuoPeDaLancaM": 0,
  "possuiJIB": false,
  "tipoTabela": "zona_angulo"
}
```

### Exemplo — TabelaCarga variante A (MD-300L)

```json
{
  "guindasteId": "MD-300L",
  "comprimentoLancaM": 17.70,
  "quadrante": "frontal",
  "pontos": [
    { "raioM": 6.00, "capacidadeKgf": 20000 }
  ]
}
```

### Exemplo — TabelaCarga variante B (TM-130)

```json
{
  "guindasteId": "TM-130",
  "zona": "I",
  "pontos": [
    { "anguloGraus": 45, "capacidadeKg": 12000 }
  ]
}
```

A digitalização completa das duas tabelas reais (todos os comprimentos/raios/quadrantes do MD-300L e todas as zonas/ângulos do TM-130) é o objetivo do Épico 1 do roadmap — ver `ROADMAP.md`.
