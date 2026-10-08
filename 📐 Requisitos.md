---
tipo: projeto
status: ativo
criado: 2026-10-07
tags:
  - projeto
aliases:
  - Requisitos
  - RF
---

# 📐 Requisitos

Não existe um documento de requisitos separado da empresa: esta nota cumpre esse papel. RF01–RF07 vêm do escopo original; RF08–RF15 surgiram dos arquivos reais recebidos em 13/09/2026; RF16–RF26 vieram do pedido de 05/10/2026 de tornar o simulador uma ferramenta de engenharia 100% parametrizável.

## Requisitos funcionais

| ID | Descrição | Status |
|---|---|---|
| **RF01** | Selecionar o guindaste da frota (MD-300L e TM-130). | ✅ |
| **RF02** | Manipular graficamente a lança e o raio de trabalho. | ✅ cena 3D |
| **RF03** | Simular a carga e emitir alerta visual de status. | ✅ 4 estados |
| **RF04** | Carregar e consultar as tabelas técnicas reais dos fabricantes. | ✅ |
| **RF05** | A partir do peso da peça, indicar as configurações necessárias (lista ordenada, ver RF15). | ✅ |
| **RF06** | A partir da configuração, calcular a capacidade máxima permitida. | ✅ |
| **RF07** | Interpolar entre pontos tabelados (raio, comprimento, offset do JIB). | ✅ |
| **RF08** | Suportar estruturas de tabela diferentes: comprimento × raio × quadrante (MD-300L) e zona × raio (TM-130). *O seletor manual de quadrante/zona foi substituído pelo RF18.* | ✅ revisado |
| **RF09** | Capturar pesos acessórios: lingada, cabo de aço e balancim opcional. | ✅ |
| **RF10** | Validar a capacidade contra o **somatório** de cargas, nunca contra a carga isolada. | ✅ |
| **RF11** | Corrigir a geometria por guindaste (altura e recuo do pé da lança) ao converter a posição da lança em raio. | ✅ |
| **RF12** | JIB opcional (comprimento e offset próprios) só para guindastes com `possuiJIB = true`. Hoje só o MD-300L; o TM-130 tem tabela de JIB, mas fica desligado até confirmação. | ✅ |
| **RF13** | Cadastro/administração de guindastes e tabelas. | ⬜ Épico 6 |
| **RF14** | Alternar a exibição da massa entre kg e toneladas (só exibição; cálculo sempre em kg). | ✅ |
| **RF15** | Lista ordenada de configurações viáveis para um peso, **menor guindaste primeiro**. | ✅ |
| **RF16** | Parametrização completa: todo ponto ajustável do guindaste real tem campo (rótulo, unidade, faixa) e, quando faz sentido, arrasto na cena. Limites = limites mecânicos da ficha. | ✅ |
| **RF17** | Regra de ouro: ponto exato → valor exato; entre pontos → interpolação para baixo; fora da tabela → estado **"Sem dado do fabricante"** com o motivo. | ✅ |
| **RF18** | Giro da superestrutura 0–360° (ou o limite mecânico); quadrante/zona **derivados do giro** num arquivo único de critérios; fronteira exata → menor capacidade. | ✅ |
| **RF19** | Carga com peso, dimensões C × L × A, centro de gravidade e descrição; verificação da altura de içamento. | ✅ |
| **RF20** | Cabo de içamento (comprimento pendente × pernas × massa linear, sobrescrevível), excedente do moitão e verificação de carga por perna. Nº de pernas pode ficar **não informado** → sem dado. | ✅ |
| **RF21** | Limite de utilização definido pelo engenheiro (status "Atenção" acima de X%). | ✅ |
| **RF22** | Mapa da área de operação no chão (OK / NOK / sem dado), calculado pelo mesmo motor. | ✅ |
| **RF23** | Interface estilo CAD (SolidWorks), tema claro: árvore de parâmetros, viewport com cubo e vistas, cotas, barra de status. | ✅ |
| **RF24** | Projetos → Orçamentos → Cenários: CRUD, duplicar, comparar 2+, reabrir no mesmo estado, versões registradas. | ✅ |
| **RF25** | Persistência no navegador (IndexedDB) atrás de uma interface substituível; exportar/importar JSON validado e versionado. | ✅ |
| **RF26** | Relatório PDF por cenário e por orçamento, com somatório, origem da capacidade, versões e campo de assinatura. | ✅ |

## Requisitos não funcionais (FURPS+)

| Categoria | Requisito | Como é garantido |
|---|---|---|
| **Confiabilidade** | 100% de precisão contra a tabela; interpolação sempre para baixo | Motor em TS puro testado com células reais ([[🧪 Plano de Testes]]) |
| **Usabilidade** | Fluxo principal em até 3 cliques ou 1 arrasto | Revisão de usabilidade do Épico 4 + e2e de arrasto |
| **Desempenho** | Cena 3D sem travar durante o arrasto | `frameloop="demand"`; mapa da área em ~33 ms para >4.000 avaliações |
| **Rastreabilidade** | Saber com que dados um resultado foi calculado | `VERSAO_TABELAS` (hash dos JSON) e `VERSAO_CRITERIO_GIRO` em cada cenário e no PDF |
| **Robustez** | Um erro não pode deixar a tela em branco | Limites de erro (`LimiteDeErro`) e validação dos dados antes de abrir o app |
| **Portabilidade** | Rodar em qualquer SO com navegador | Web app estático (ver [[🏗️ Arquitetura e Stack]]) |

## Requisitos técnicos por módulo

### Motor de cálculo (`app/src/engine/`)

- **RT-MC01** Ponto de entrada único `avaliarCenario(parametros, contexto)` que despacha pelo tipo de tabela do guindaste.
- **RT-MC02** Interpolação para as duas variantes (comprimento × raio e zona × raio) e entre offsets do JIB.
- **RT-MC03** Correção geométrica (altura e recuo do pé da lança, ponta do JIB, altura do gancho).
- **RT-MC04** Somatório expandido: carga + lingada + cabo + balancim + excedente do moitão.
- **RT-MC05** Arredondamento sempre para baixo, com tolerância de ruído numérico de 1e-6 kg.
- **RT-MC06** Estado `sem_dado` com motivos (sapata parcial, raio sem célula, pernas fora da tabela, JIB fora da lança exigida, giro além do limite, dado não informado).
- **RT-MC07** Busca reversa pela frota, menor guindaste primeiro.
- **RT-MC08** Tabelas e especificações em JSON, desacopladas do código.
- **RT-MC09** Testes com valores reais das tabelas.

### Interface (`app/src/components/`)

- **RT-UI01** Seleção de guindaste e toggle de JIB no nó "Guindaste" da árvore.
- **RT-UI02** Cena 3D com arrasto de lança, gancho, giro, sapatas e JIB, sincronizada com os campos.
- **RT-UI03** Área de giro derivada e mostrada na barra de status (o seletor manual saiu).
- **RT-UI05** Campos de carga, acessórios, cabo e moitão com selo ≈ para valores aproximados.
- **RT-UI06** Diálogo "Buscar por peso" (RF05/RF15).
- **RT-UI07** Seletor kg ⇄ t (RF14).
- **RT-UI08** Indicador de status com 4 estados e medidor de utilização.

### Dados e persistência

- **RT-DD01** Schemas diferentes por tipo de tabela, com camada comum (`data/catalogo.ts`).
- **RT-DD02** Vários guindastes cadastrados ao mesmo tempo.
- **RT-DD03** *(futuro)* Tela de administração (RF13).
- **RT-DD04** Repositório de projetos atrás da interface `RepositorioProjetos`, com `schemaVersion` e migração.

## Relacionado

- [[🗂️ Simulador Guindastes Ribas]]
- [[⚖️ Regras de Negócio]]
- [[🗄️ Modelo de Dados]]
- [[🧪 Plano de Testes]]
