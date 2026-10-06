/**
 * Projetos, orçamentos e cenários salvos (Épico 15, RF24):
 * Projeto (cliente, obra, local, responsável) → Orçamento → Cenários de
 * operação. Cada cenário guarda o conjunto COMPLETO de parâmetros (reabrir
 * restaura exatamente o mesmo estado) e o resultado no momento em que foi
 * salvo, junto com as versões das tabelas e do critério de giro usadas.
 */
import type { AvaliacaoDoCenario, ParametrosDoCenario } from './cenario'

export interface Projeto {
  id: string
  cliente: string
  obra: string
  local: string
  responsavel: string
  criadoEm: string
  atualizadoEm: string
}

export interface Orcamento {
  id: string
  projetoId: string
  nome: string
  descricao: string
  criadoEm: string
  atualizadoEm: string
}

export interface CenarioSalvo {
  id: string
  orcamentoId: string
  nome: string
  parametros: ParametrosDoCenario
  /** Resultado no momento do salvamento (o que foi apresentado ao cliente). */
  resultado: AvaliacaoDoCenario
  versaoTabelas: string
  versaoCriterioGiro: string
  criterioGiroProvisorio: boolean
  criadoEm: string
  atualizadoEm: string
}

/** Dados editáveis de cada entidade (o resto é gerado pelo repositório). */
export type DadosProjeto = Pick<Projeto, 'cliente' | 'obra' | 'local' | 'responsavel'>
export type DadosOrcamento = Pick<Orcamento, 'projetoId' | 'nome' | 'descricao'>
export type DadosCenario = Omit<CenarioSalvo, 'id' | 'criadoEm' | 'atualizadoEm'>

/** Arquivo JSON de exportação/importação de um projeto inteiro (backup e troca entre máquinas, RF25). */
export interface ArquivoDeProjeto {
  formato: 'guindastes-ribas/projeto'
  schemaVersion: number
  exportadoEm: string
  projeto: Projeto
  orcamentos: Orcamento[]
  cenarios: CenarioSalvo[]
}
