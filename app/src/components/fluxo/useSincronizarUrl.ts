import { useEffect, useRef } from 'react'
import { ORDEM_ETAPAS, type Etapa } from '../../store/etapas'
import { situacaoAtual, useFluxoStore } from '../../store/useFluxoStore'

/**
 * Etapa ⇄ URL (Épico 18): a etapa atual vai para o hash (`#/carga`), então
 * o Voltar/Avançar do navegador percorre as etapas. Um link direto para uma
 * etapa ainda bloqueada cai na etapa atual — exceto `#/simulacao`, que abre a
 * simulação livre (atalho usado também pelos testes e2e).
 */
export function useSincronizarUrl() {
  const etapa = useFluxoStore((s) => s.etapa)
  const primeiraVez = useRef(true)

  useEffect(() => {
    const lerHash = () => {
      const pedida = window.location.hash.replace(/^#\/?/, '') as Etapa
      if (!ORDEM_ETAPAS.includes(pedida)) return
      const fluxo = useFluxoStore.getState()
      if (pedida === fluxo.etapa) return
      if (pedida === 'simulacao' && !situacaoAtual().simulacao.liberada) {
        fluxo.iniciarSimulacaoLivre()
        return
      }
      if (!fluxo.irPara(pedida)) window.history.replaceState(null, '', `#/${fluxo.etapa}`)
    }
    lerHash()
    window.addEventListener('hashchange', lerHash)
    return () => window.removeEventListener('hashchange', lerHash)
  }, [])

  useEffect(() => {
    // Na montagem, quem manda é o hash (lido acima); depois, cada mudança de etapa vai para a URL.
    if (primeiraVez.current) {
      primeiraVez.current = false
      if (ORDEM_ETAPAS.includes(window.location.hash.replace(/^#\/?/, '') as Etapa)) return
    }
    if (window.location.hash !== `#/${etapa}`) window.location.hash = `/${etapa}`
  }, [etapa])
}
