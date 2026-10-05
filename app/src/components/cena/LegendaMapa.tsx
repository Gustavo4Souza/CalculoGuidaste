import type { MapaAreaOperacao } from '../../engine/mapaAreaOperacao'
import { CORES_MAPA } from './MapaNoChao'

const ITENS = [
  { status: 'ok', rotulo: 'OK' },
  { status: 'atencao', rotulo: 'Atenção (limite do engenheiro)' },
  { status: 'nok', rotulo: 'NOK' },
  { status: 'sem_dado', rotulo: 'Sem dado do fabricante' },
] as const

/**
 * Legenda do mapa da área de operação (Épico 14, RF22), sobre a viewport.
 * Mostra quantas células de cada status existem para a configuração atual.
 */
export function LegendaMapa({ mapa }: { mapa: MapaAreaOperacao }) {
  const alcancaveis = mapa.contagem.ok + mapa.contagem.atencao + mapa.contagem.nok + mapa.contagem.sem_dado
  return (
    <div className="legenda-mapa" aria-label="Legenda da área de operação" data-testid="legenda-mapa">
      <div className="legenda-mapa__titulo">Área de operação — configuração atual</div>
      {ITENS.map((item) => (
        <div key={item.status} className="legenda-mapa__item" data-status={item.status}>
          <span
            className={`legenda-mapa__amostra ${item.status === 'sem_dado' ? 'legenda-mapa__amostra--hachura' : ''}`}
            style={item.status === 'sem_dado' ? undefined : { background: CORES_MAPA[item.status] }}
          />
          <span>{item.rotulo}</span>
          <span className="legenda-mapa__pct">
            {alcancaveis === 0 ? '—' : `${Math.round((mapa.contagem[item.status] / alcancaveis) * 100)}%`}
          </span>
        </div>
      ))}
      {alcancaveis > 0 && mapa.contagem.ok + mapa.contagem.atencao + mapa.contagem.nok === 0 && (
        <div className="legenda-mapa__aviso">
          Nenhuma posição validada: falta algum dado do cenário ou da tabela — veja os motivos no painel de resultado.
        </div>
      )}
      <div className="legenda-mapa__nota">
        Cada célula ({mapa.giros[1] - mapa.giros[0]}° × {(mapa.raios[1] - mapa.raios[0]).toLocaleString('pt-BR')} m) é
        avaliada pelo motor nos 4 cantos e fica com o pior status. Sem cor = fora do alcance da lança atual.
      </div>
    </div>
  )
}
