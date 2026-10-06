/**
 * Monta o registro de um cenário a salvar (Épico 15, RF24): os parâmetros
 * completos, o resultado avaliado AGORA pelo motor e as versões das tabelas
 * e do critério de giro usadas nesse cálculo.
 */
import { CRITERIOS_DE_GIRO, VERSAO_CRITERIO_GIRO } from '../config/criteriosDeGiro'
import { CATALOGO, VERSAO_TABELAS } from '../data/catalogo'
import { avaliarCenario } from '../engine/avaliarCenario'
import type { ParametrosDoCenario } from '../types/cenario'
import type { CenarioSalvo, DadosCenario } from '../types/projeto'

export function montarDadosCenario(orcamentoId: string, nome: string, parametros: ParametrosDoCenario): DadosCenario {
  const ctx = CATALOGO[parametros.guindasteId]
  return {
    orcamentoId,
    nome,
    parametros: structuredClone(parametros),
    resultado: avaliarCenario(parametros, ctx),
    versaoTabelas: VERSAO_TABELAS,
    versaoCriterioGiro: VERSAO_CRITERIO_GIRO,
    criterioGiroProvisorio: CRITERIOS_DE_GIRO[parametros.guindasteId]?.provisorio ?? false,
  }
}

/** O cenário foi salvo com tabelas ou critério de giro diferentes dos atuais? (resultado pode ter mudado) */
export function versoesDiferentes(cenario: CenarioSalvo): { tabelas: boolean; criterioGiro: boolean } {
  return {
    tabelas: cenario.versaoTabelas !== VERSAO_TABELAS,
    criterioGiro: cenario.versaoCriterioGiro !== VERSAO_CRITERIO_GIRO,
  }
}
