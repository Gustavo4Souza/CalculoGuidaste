import { Check, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { ETAPAS_NUMERADAS, ORDEM_ETAPAS } from '../../store/etapas'
import { useFluxoStore } from '../../store/useFluxoStore'
import { useSituacaoDasEtapas } from './useSituacaoDasEtapas'

/**
 * Barra de etapas (Épico 18): ① Projeto ─ ② Carga ─ ③ Guindaste ─ ④ Simulação
 * ─ ⑤ Verificação ─ ⑥ Relatório. Navegável: qualquer etapa liberada abre com
 * um clique; uma bloqueada mostra o cadeado e diz o que falta. Voltar e
 * Avançar à direita seguem a ordem das etapas.
 */
export function BarraDeEtapas() {
  const etapa = useFluxoStore((s) => s.etapa)
  const orcamentoAtivo = useFluxoStore((s) => s.orcamentoAtivo)
  const livre = useFluxoStore((s) => s.livre)
  const irPara = useFluxoStore((s) => s.irPara)
  const situacao = useSituacaoDasEtapas()
  const indice = ORDEM_ETAPAS.indexOf(etapa)
  const anterior = ORDEM_ETAPAS[indice - 1]
  const proxima = ORDEM_ETAPAS[indice + 1]

  return (
    <nav className="etapas" aria-label="Etapas do trabalho">
      <ol className="etapas__lista">
        {ETAPAS_NUMERADAS.map((e, i) => {
          const s = situacao[e.id]
          const atual = e.id === etapa
          const feita = s.liberada && ORDEM_ETAPAS.indexOf(e.id) < indice
          return (
            <li key={e.id} className="etapas__item">
              {i > 0 && <span className="etapas__ligacao" aria-hidden="true" />}
              <button
                type="button"
                className={`etapa ${atual ? 'etapa--atual' : ''} ${feita ? 'etapa--feita' : ''}`}
                aria-current={atual ? 'step' : undefined}
                disabled={!s.liberada}
                title={s.liberada ? `Ir para ${e.rotulo}` : s.motivo}
                onClick={() => irPara(e.id)}
              >
                <span className="etapa__numero" aria-hidden="true">
                  {!s.liberada ? <Lock size={11} /> : feita ? <Check size={12} /> : e.numero}
                </span>
                {e.rotulo}
              </button>
            </li>
          )
        })}
      </ol>

      <span className="etapas__contexto" title="Orçamento em que você está trabalhando">
        {orcamentoAtivo
          ? `${orcamentoAtivo.projeto.cliente} › ${orcamentoAtivo.orcamento.nome}`
          : livre
            ? 'Simulação livre — o projeto é criado ao salvar'
            : 'Sem projeto'}
      </span>

      <div className="etapas__navegacao">
        <button type="button" className="comando" disabled={!anterior} onClick={() => anterior && irPara(anterior)}>
          <ChevronLeft size={14} aria-hidden="true" /> Voltar
        </button>
        <button
          type="button"
          className="comando comando--destaque"
          disabled={!proxima || !situacao[proxima].liberada}
          title={proxima && !situacao[proxima].liberada ? situacao[proxima].motivo : undefined}
          onClick={() => proxima && irPara(proxima)}
        >
          Avançar <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
