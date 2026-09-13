import type { ResultadoDoCalculo } from '../types/guindaste'

/**
 * Indicador visual de status (Task 4.1 / RF03 / UC03) — verde (dentro do
 * limite) / âmbar (fora da faixa) / vermelho (excede a capacidade), com a
 * margem (ou excedente) em %. Migrado do "status chip" do POC
 * (`prototipo/poc-simulador.html`), agora como componente React.
 */
export function IndicadorStatus({ resultado }: { resultado: ResultadoDoCalculo | null }) {
  if (!resultado) {
    return (
      <div className="status-chip status-chip--indefinido">
        <span className="status-chip__icone" aria-hidden="true">
          –
        </span>
        <div>
          <p className="status-chip__titulo">Aguardando configuração</p>
          <p className="status-chip__sub">Selecione um guindaste e ajuste a lança para calcular.</p>
        </div>
      </div>
    )
  }

  const { status, margemPercentual } = resultado

  if (status === 'fora_da_faixa') {
    return (
      <div className="status-chip status-chip--warning" role="status">
        <span className="status-chip__icone" aria-hidden="true">
          ▲
        </span>
        <div>
          <p className="status-chip__titulo">Configuração fora da faixa operável</p>
          <p className="status-chip__sub">
            Não há dado de tabela para este raio/ângulo — ajuste a posição da lança (RT-MC06).
          </p>
        </div>
      </div>
    )
  }

  if (status === 'excede_capacidade') {
    const excedente = Math.abs(margemPercentual)
    return (
      <div className="status-chip status-chip--critical" role="status">
        <span className="status-chip__icone" aria-hidden="true">
          ⛔
        </span>
        <div>
          <p className="status-chip__titulo">Carga excede a capacidade máxima</p>
          <p className="status-chip__sub">
            Excedente de {excedente.toFixed(1)}% — reduza o raio, a lança ou o peso antes de içar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="status-chip status-chip--good" role="status">
      <span className="status-chip__icone" aria-hidden="true">
        ✓
      </span>
      <div>
        <p className="status-chip__titulo">Dentro do limite seguro</p>
        <p className="status-chip__sub">
          Margem de segurança: {margemPercentual.toFixed(1)}% sobre a capacidade máxima.
        </p>
      </div>
    </div>
  )
}
