import { situacaoDasEtapas } from '../../store/etapas'
import { useFluxoStore } from '../../store/useFluxoStore'
import { useProjetosStore } from '../../store/useProjetosStore'
import { useSimulacaoStore } from '../../store/useSimulacaoStore'

/** Liberação de cada etapa (com o motivo das bloqueadas), reativa às três stores. */
export function useSituacaoDasEtapas() {
  const livre = useFluxoStore((s) => s.livre)
  const temOrcamentoAtivo = useFluxoStore((s) => s.orcamentoAtivo !== null)
  const raioNecessarioM = useFluxoStore((s) => s.raioNecessarioM)
  const configuracaoEscolhida = useFluxoStore((s) => s.configuracaoEscolhida)
  const cenarioSalvo = useProjetosStore((s) => s.aberto !== null)
  const cenario = useSimulacaoStore((s) => s.cenario)
  return situacaoDasEtapas({ livre, temOrcamentoAtivo, raioNecessarioM, configuracaoEscolhida, cenarioSalvo }, cenario)
}
