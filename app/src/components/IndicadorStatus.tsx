import type { AvaliacaoDoCenario } from '../types/cenario'

/**
 * Indicador visual de status (Task 4.1 / RF03 → Épico 11, RF17): quatro
 * estados — dentro do limite (verde), acima do limite do engenheiro
 * (âmbar), reprovado (vermelho) e "sem dado do fabricante" (cinza
 * hachurado), este último um estado próprio, nunca confundido com OK/NOK.
 */
export function IndicadorStatus({ avaliacao }: { avaliacao: AvaliacaoDoCenario }) {
  const { status, percentualUtilizacao, verificacoes, motivosSemDado } = avaliacao
  const pct = percentualUtilizacao ?? 0

  if (status === 'nok') {
    const reprovadas = verificacoes.filter((v) => !v.aprovada && v.id !== 'limite_engenheiro')
    const porCapacidade = reprovadas.some((v) => v.id === 'capacidade')
    return (
      <div className="status-chip status-chip--critical" role="status">
        <span className="status-chip__icone" aria-hidden="true">
          ⛔
        </span>
        <div>
          <p className="status-chip__titulo">
            {porCapacidade ? 'Carga excede a capacidade máxima' : 'Operação reprovada'}
          </p>
          {porCapacidade && <p className="status-chip__sub">Utilização de {pct.toFixed(1)}% da capacidade da tabela.</p>}
          <ul className="status-chip__lista">
            {reprovadas.map((v) => (
              <li key={v.id}>
                {v.descricao}: {v.detalhe}
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  if (status === 'sem_dado') {
    return (
      <div className="status-chip status-chip--semdado" role="status">
        <span className="status-chip__icone" aria-hidden="true">
          ∅
        </span>
        <div>
          <p className="status-chip__titulo">Sem dado do fabricante — operação não validada</p>
          <ul className="status-chip__lista">
            {motivosSemDado.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  if (status === 'atencao') {
    return (
      <div className="status-chip status-chip--warning" role="status">
        <span className="status-chip__icone" aria-hidden="true">
          ▲
        </span>
        <div>
          <p className="status-chip__titulo">Acima do limite definido pelo engenheiro</p>
          <p className="status-chip__sub">
            Utilização de {pct.toFixed(1)}% — dentro da tabela, mas acima do limite de utilização configurado.
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
          Utilização de {pct.toFixed(1)}% · margem de {(100 - pct).toFixed(1)}% sobre a capacidade da tabela.
        </p>
      </div>
    </div>
  )
}
