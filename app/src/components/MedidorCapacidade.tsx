/**
 * Task 8.1 — indicador de resultado redesenhado como "instrumento" (barra
 * de limite), no lugar de só um número solto. Mostra o somatório de cargas
 * como % da capacidade máxima, com uma marca no ponto de 100% — a mesma
 * lógica de status do IndicadorStatus.tsx (verde/âmbar/vermelho), só que
 * em forma de mostrador, mais perto da leitura de um painel real de
 * guindaste do que de um card de dashboard corporativo.
 *
 * A barra satura visualmente em 150% da capacidade — acima disso, o
 * excedente real (mostrado em texto) importa mais do que a posição exata
 * do preenchimento.
 */
const LIMITE_VISUAL_PERCENTUAL = 150

export function MedidorCapacidade({
  capacidadeMaximaKg,
  somatorioDeCargasKg,
  limiteUtilizacaoPercentual = 100,
}: {
  capacidadeMaximaKg: number
  somatorioDeCargasKg: number
  /** Épico 11 (RF21) — limite definido pelo engenheiro, marcado no trilho quando < 100%. */
  limiteUtilizacaoPercentual?: number
}) {
  if (capacidadeMaximaKg <= 0) return null

  const percentualUsado = (somatorioDeCargasKg / capacidadeMaximaKg) * 100
  const larguraPreenchimento = Math.min(percentualUsado, LIMITE_VISUAL_PERCENTUAL)
  const marca100Posicao = (100 / LIMITE_VISUAL_PERCENTUAL) * 100

  const cor =
    percentualUsado > 100
      ? 'var(--perigo)'
      : percentualUsado > limiteUtilizacaoPercentual
        ? 'var(--aviso)'
        : 'var(--sucesso)'

  return (
    <div className="medidor">
      <div className="medidor__trilho">
        <div
          className="medidor__preenchimento"
          style={{ width: `${(larguraPreenchimento / LIMITE_VISUAL_PERCENTUAL) * 100}%`, background: cor }}
        />
        <div className="medidor__marca-100" style={{ left: `${marca100Posicao}%` }} />
        {limiteUtilizacaoPercentual < 100 && (
          <div
            className="medidor__marca-limite"
            title={`Limite do engenheiro: ${limiteUtilizacaoPercentual}%`}
            style={{ left: `${(limiteUtilizacaoPercentual / LIMITE_VISUAL_PERCENTUAL) * 100}%` }}
          />
        )}
      </div>
      <div className="medidor__legenda">
        <span>0%</span>
        <span>{percentualUsado.toFixed(0)}% da capacidade</span>
        <span>{LIMITE_VISUAL_PERCENTUAL}%</span>
      </div>
    </div>
  )
}
