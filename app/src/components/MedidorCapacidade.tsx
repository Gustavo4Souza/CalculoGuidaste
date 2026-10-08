import { formatarPercentual } from '../store/useInterfaceStore'

/**
 * Medidor de utilização (Task 8.1 → Épico 17): o somatório de cargas como %
 * da capacidade da tabela, com as marcas de 100% (limite do fabricante) e
 * do limite do engenheiro (RF21), cada uma com rótulo — o engenheiro lê o
 * que cada marca significa, sem precisar adivinhar.
 *
 * A barra satura em 150%: acima disso, o excedente (no texto) importa mais
 * do que a posição exata do preenchimento.
 */
const LIMITE_VISUAL_PERCENTUAL = 150

export function MedidorCapacidade({
  capacidadeMaximaKg,
  somatorioDeCargasKg,
  limiteUtilizacaoPercentual = 100,
}: {
  capacidadeMaximaKg: number
  somatorioDeCargasKg: number
  limiteUtilizacaoPercentual?: number
}) {
  if (capacidadeMaximaKg <= 0) return null

  const percentualUsado = (somatorioDeCargasKg / capacidadeMaximaKg) * 100
  const posicao = (pct: number) => `${(Math.min(pct, LIMITE_VISUAL_PERCENTUAL) / LIMITE_VISUAL_PERCENTUAL) * 100}%`
  const cor =
    percentualUsado > 100 ? 'var(--nok)' : percentualUsado > limiteUtilizacaoPercentual ? 'var(--atencao)' : 'var(--ok)'

  return (
    <figure className="medidor" aria-label={`Utilização de ${formatarPercentual(percentualUsado)} da capacidade da tabela`}>
      <figcaption className="medidor__titulo">
        <span>Utilização da capacidade</span>
        <strong>{formatarPercentual(percentualUsado)}</strong>
      </figcaption>
      <div className="medidor__trilho">
        <div className="medidor__preenchimento" style={{ width: posicao(percentualUsado), background: cor }} />
        <div className="medidor__marca medidor__marca--fabricante" style={{ left: posicao(100) }} />
        {limiteUtilizacaoPercentual < 100 && (
          <div className="medidor__marca medidor__marca--engenheiro" style={{ left: posicao(limiteUtilizacaoPercentual) }} />
        )}
      </div>
      <div className="medidor__escala">
        <span>0%</span>
        {limiteUtilizacaoPercentual < 100 && (
          <span className="medidor__rotulo-marca medidor__rotulo-marca--engenheiro" style={{ left: posicao(limiteUtilizacaoPercentual) }}>
            engenheiro {limiteUtilizacaoPercentual}%
          </span>
        )}
        <span className="medidor__rotulo-marca" style={{ left: posicao(100) }}>
          tabela 100%
        </span>
        <span>{LIMITE_VISUAL_PERCENTUAL}%</span>
      </div>
    </figure>
  )
}
