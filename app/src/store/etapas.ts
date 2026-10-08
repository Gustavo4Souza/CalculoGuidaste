/**
 * Etapas do fluxo de trabalho (Épico 18) e a regra de quando cada uma fica
 * liberada. Módulo puro (sem React nem store): recebe o estado e devolve,
 * para cada etapa, se está liberada e — se não — o MOTIVO, que a barra de
 * etapas mostra para o engenheiro nunca ficar sem saber o que falta.
 */
import type { ParametrosDoCenario } from '../types/cenario'

export type Etapa = 'inicio' | 'projeto' | 'carga' | 'guindaste' | 'simulacao' | 'verificacao' | 'relatorio'

export const ETAPAS_NUMERADAS: { id: Exclude<Etapa, 'inicio'>; numero: number; rotulo: string }[] = [
  { id: 'projeto', numero: 1, rotulo: 'Projeto' },
  { id: 'carga', numero: 2, rotulo: 'Carga' },
  { id: 'guindaste', numero: 3, rotulo: 'Guindaste' },
  { id: 'simulacao', numero: 4, rotulo: 'Simulação' },
  { id: 'verificacao', numero: 5, rotulo: 'Verificação' },
  { id: 'relatorio', numero: 6, rotulo: 'Relatório' },
]

export const ORDEM_ETAPAS: Etapa[] = ['inicio', ...ETAPAS_NUMERADAS.map((e) => e.id)]

export interface EstadoDoFluxo {
  /** Simulação livre: sem projeto definido de antemão (o projeto é criado ao salvar). */
  livre: boolean
  temOrcamentoAtivo: boolean
  raioNecessarioM: number | null
  configuracaoEscolhida: boolean
  /** O cenário da tela está salvo num orçamento (Épico 15). */
  cenarioSalvo: boolean
}

export interface SituacaoDaEtapa {
  liberada: boolean
  motivo?: string
}

export function situacaoDasEtapas(f: EstadoDoFluxo, cenario: ParametrosDoCenario): Record<Etapa, SituacaoDaEtapa> {
  const carga: SituacaoDaEtapa =
    f.temOrcamentoAtivo || f.livre ? { liberada: true } : { liberada: false, motivo: 'Defina o projeto e o orçamento na etapa 1.' }
  const pedidoCompleto = cenario.carga.pesoKg > 0 && f.raioNecessarioM !== null && f.raioNecessarioM > 0
  const guindaste: SituacaoDaEtapa = !carga.liberada
    ? carga
    : pedidoCompleto
      ? { liberada: true }
      : { liberada: false, motivo: 'Informe o peso da carga e o raio necessário na etapa 2.' }
  const simulacao: SituacaoDaEtapa =
    f.configuracaoEscolhida || f.livre
      ? { liberada: true }
      : { liberada: false, motivo: 'Escolha uma configuração de guindaste na etapa 3.' }
  const relatorio: SituacaoDaEtapa = f.cenarioSalvo
    ? { liberada: true }
    : { liberada: false, motivo: 'Salve o cenário na etapa 5 (Verificação).' }

  return {
    inicio: { liberada: true },
    projeto: { liberada: true },
    carga,
    guindaste,
    simulacao,
    verificacao: simulacao,
    relatorio,
  }
}
