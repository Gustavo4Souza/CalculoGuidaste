# Arquitetura

> Espelha as seções 3, 5 e 6 da [documentação no Notion](https://app.notion.com/p/3da034f53a1280df8666fc97c0590e38).

## Decisão: Web App

Definido: a ferramenta será uma **aplicação web**, não um executável desktop. Confirmado pelo usuário em 20/08/2026.

### Por quê

- **Instalação/distribuição:** nenhuma — acesso por link/navegador, ideal para demo e para a banca avaliar remotamente.
- **Manipulação gráfica (drag-and-drop da lança/raio):** totalmente viável com Canvas/SVG (Konva.js), com a mesma qualidade de interação de uma solução desktop.
- **Portabilidade:** roda em qualquer SO com navegador — Windows, Mac, Linux — sem builds separados.
- **Velocidade de desenvolvimento no prazo do semestre:** ecossistema JS maduro para canvas interativo e deploy gratuito (Vercel/Netlify) em minutos, sem o custo de empacotar/assinar um instalador.
- **Alinhamento com o objetivo do projeto:** reforça a narrativa de "modernização" — acesso instantâneo de qualquer dispositivo, em vez de uma ferramenta interna instalada máquina a máquina.

### Ressalva a monitorar

Uso 100% offline (ex.: dentro da cabine do guindaste, sem internet) não foi confirmado como requisito. Se surgir essa exigência, a mesma aplicação evolui para **PWA instalável** (ícone na área de trabalho, funciona offline após o primeiro acesso) sem reescrever o motor de cálculo nem a interface — não é necessário trocar de arquitetura.

## Stack Tecnológica

| Camada | Tecnologia | Por quê |
|---|---|---|
| Frontend / UI | React + TypeScript + Vite | Componentização, tipagem reduz erros no motor de cálculo, build rápido. |
| Canvas interativo | react-konva (Konva.js) | Drag-and-drop de objetos gráficos (lança, ponto de carga) com boa performance (RNF Desempenho). |
| Estado da aplicação | Zustand | Leve, evita boilerplate para estado de simulação (guindaste ativo, raio, lança). |
| Motor de cálculo | Módulo TS puro (sem dependência de UI) | Testável isoladamente — essencial para RNF Confiabilidade (100% de precisão, arredondamento sempre para baixo). |
| Dados das tabelas de carga | JSON estruturado, **real** por guindaste (MD-300L e TM-130) | Duas variantes de schema (ver `REQUISITOS_TECNICOS.md`), fácil de versionar. |
| Persistência (fase Admin) | Backend leve Node/Express + SQLite (opcional, se sobrar tempo) | Suporta RF13 (cadastro/administração) sem exigir infraestrutura pesada. |
| Testes | Vitest (unitário do motor de cálculo) + Playwright (fluxo de simulação) | Cobre a RNF de confiabilidade e usabilidade. |
| Deploy / demo | Vercel ou Netlify (estático) | Link público para a banca e para gravar o vídeo pitch sem custo de servidor. |

## Decisões de UI/UX (13/09/2026, referência: Liebherr Crane Finder)

Referência externa usada: [Liebherr Crane Finder](https://www.liebherr.com/pt-br/guindastes-moveis-sobre-esteiras-e-pneus/servico/crane-finder-6361887) — ferramenta real do setor que, a partir de peso/altura/alcance, devolve uma lista ordenada de guindastes/configurações viáveis, com uma "visão econômica" (não sugere sempre o maior guindaste).

| Decisão | Escolha |
|---|---|
| Fluxo principal da UI | Tela única de simulação (guindaste → arrasto de lança/raio → capacidade) — sem abas/fluxos separados |
| Entrada de dados na simulação | Híbrido: canvas (arrastar) + campos numéricos sincronizados nos dois sentidos |
| Busca reversa (peso → configuração, RF05) | Recurso secundário na mesma tela: lista ordenada de configurações viáveis (RF15), inspirada no Liebherr Crane Finder |
| Critério de ordenação da lista do RF15 | Menor guindaste primeiro, por capacidade nominal |
| Seleção de quadrante/zona (RF08) | Seletor manual (toggle/dropdown) ao lado do canvas — sem simulação física de giro/azimute, para manter o escopo do canvas dentro do prazo do semestre |
| Dispositivo-alvo do MVP | Desktop/notebook apenas — responsividade mobile/tablet fica para fase futura |

## Dados e unidades

| Decisão | Escolha |
|---|---|
| Dados de tabela de carga | Reais do fabricante (MD-300L e TM-130), recebidos em 13/09/2026 — substituem os dados fictícios do POC |
| Peso validado contra a tabela | Somatório (carga içada + lingada + cabo de aço + balancim), não a carga isolada |
| Unidade interna de carga | kg (kgf e kg tratados como equivalentes) + seletor de exibição kg ⇄ toneladas (RF14) |
| Arredondamento do motor de cálculo | Sempre para baixo (piso de segurança) em pontos interpolados — nunca otimista |
| Suporte a JIB | Somente para guindastes com `possuiJIB = true` — confirmado: MD-300L tem, TM-130 não tem |

## Repositório e documentação

| Decisão | Escolha |
|---|---|
| Repositório de código | GitHub: `github.com/Gustavo4Souza/CalculoGuidaste` — desenvolvimento na pasta local `Jornada/` |
| Documentação técnica | Arquivos Markdown (esta pasta) + [página no Notion](https://app.notion.com/p/3da034f53a1280df8666fc97c0590e38) como fonte de verdade de contexto/decisões |
| Entregáveis acadêmicos | A página do Notion é a entrega formal do projeto, mantida sempre atualizada — sem TAP/Escopo, UML ou Matriz de Rastreabilidade como arquivos separados |
| Deploy / demo | Vercel ou Netlify (estático) |
