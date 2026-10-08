---
tipo: projeto
status: ativo
criado: 2026-10-07
tags:
  - projeto
---

# 📋 Visão Geral

## Problema

A Guindastes Ribas Ltda. planeja cada içamento cruzando à mão as **tabelas de carga impressas** dos fabricantes. Cada guindaste tem uma tabela num formato diferente, a capacidade depende de várias grandezas ao mesmo tempo (comprimento e ângulo da lança, raio, área de giro, JIB, sapatas) e o peso que vale não é só o da peça: entram lingada, cabo, balancim e moitão. O processo é lento, difícil de revisar e propenso a erro. Um erro aqui é um risco de tombamento ou de colapso estrutural.

## Solução

Uma aplicação web que reproduz o guindaste real em 3D e calcula, em tempo real e nos dois sentidos:

1. **Guindaste + configuração → capacidade máxima permitida**, comparada com o somatório de cargas.
2. **Peso da peça → configurações viáveis da frota**, do menor guindaste para o maior.

O engenheiro arrasta a lança, gira a superestrutura, abre as sapatas, informa a carga e vê na hora se a operação passa, não passa ou **não tem dado do fabricante**. Depois salva o cenário num projeto/orçamento e emite um relatório em PDF para validar e assinar.

## Usuários

| Perfil | O que faz no sistema |
|---|---|
| **Engenheiro de planejamento de içamento** | Monta cenários, confere a capacidade, salva em orçamentos, emite o PDF e assina |
| **Orçamentista / comercial** | Usa a busca por peso para saber qual guindaste oferecer ao cliente |
| **Administrador do sistema** *(futuro, RF13)* | Cadastraria guindastes e tabelas novas sem mexer no código |
| **Banca e turma** | Avaliam o projeto (vídeo pitch, artigo, demonstração) |

Casos de uso da Estação 1: **UC01** selecionar guindaste, **UC02** manipular a lança e ver a capacidade, **UC03** receber o alerta de status.

## Objetivos

- **Precisão de 100%** contra a tabela do fabricante em pontos exatos e interpolação sempre arredondada **para baixo** entre eles.
- **Nunca inventar dado:** fora da cobertura da tabela, o resultado é "Sem dado do fabricante", com o motivo (ver [[⚖️ Regras de Negócio]]).
- Fluxo principal em **até 3 cliques ou 1 arrasto**.
- Tudo o que se ajusta no guindaste real ser ajustável no simulador, digitando ou arrastando.
- Rastreabilidade: cada cenário salvo guarda a versão das tabelas e do critério de giro com que foi calculado.

## Fora do escopo (neste semestre)

- Guindastes além do MD-300L e do TM-130 (cadastro de modelos é o Épico 6).
- Verificação de vento e de pressão no solo: não há dado nas fichas; os campos são só informativos no relatório.
- Contas de usuário, servidor e sincronização entre máquinas: os dados ficam no navegador, com exportar/importar JSON.
- Uso em celular/tablet: o alvo é desktop/notebook.
- Substituir a validação do engenheiro: o relatório sempre exige assinatura do responsável.

## Contexto acadêmico

- Disciplina **Jornada**, 8º semestre. Projeto solo do Gustavo, desenvolvido com apoio do Claude Code.
- Entregas: o próprio sistema, o **vídeo pitch**, o **artigo científico** (template UniSENAI PR) e esta documentação.
- O POC (`prototipo/poc-simulador.html`) foi apresentado e aprovado pela turma em 20/08/2026.

## Relacionado

- [[🗂️ Simulador Guindastes Ribas]]
- [[📐 Requisitos]]
- [[⚖️ Regras de Negócio]]
- [[🏗️ Arquitetura e Stack]]
