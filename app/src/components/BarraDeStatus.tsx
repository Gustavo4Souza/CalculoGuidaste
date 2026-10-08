import { CATALOGO, VERSAO_TABELAS } from '../data/catalogo'
import { rotuloRegiao } from '../engine/capacidadeDetalhada'
import { formatarMassa, formatarPercentual, useInterfaceStore } from '../store/useInterfaceStore'
import { useSimulacaoStore } from '../store/useSimulacaoStore'
import { NOME_STATUS } from './resultado/nomes'

/**
 * Barra de status inferior (Épico 12 → Épico 17), como a do SolidWorks:
 * à esquerda o veredito e os números do resultado, à direita o sistema de
 * unidades e a versão das tabelas usadas no cálculo.
 */
export function BarraDeStatus() {
  const avaliacao = useSimulacaoStore((s) => s.avaliacao)
  const guindasteId = useSimulacaoStore((s) => s.cenario.guindasteId)
  const unidade = useInterfaceStore((s) => s.unidadeMassa)
  const { status, capacidade, somatorio, percentualUtilizacao, giro } = avaliacao
  const provisorio = CATALOGO[guindasteId].criterioDeGiro.provisorio

  return (
    <footer className="barra-status" aria-label="Barra de status">
      <span className={`barra-status__status barra-status__status--${status}`} data-testid="status-barra">
        {NOME_STATUS[status]}
      </span>
      <span>
        Capacidade da tabela:{' '}
        <strong>{capacidade.capacidadeKg === null ? 'sem dado' : formatarMassa(capacidade.capacidadeKg, unidade)}</strong>
        {capacidade.origem && <> ({capacidade.origem === 'exato' ? 'ponto exato' : 'interpolado'})</>}
      </span>
      <span>
        Somatório: <strong>{formatarMassa(somatorio.totalKg, unidade)}</strong>
      </span>
      <span>
        Utilização: <strong>{percentualUtilizacao === null ? '—' : formatarPercentual(percentualUtilizacao)}</strong>
      </span>
      <span data-testid="regiao-derivada">Área: {giro.regioes.map(rotuloRegiao).join(' / ') || '—'}</span>
      {provisorio && <span className="selo-provisorio">Critério de giro provisório</span>}
      <span className="barra-status__direita">
        <span className="barra-status__unidades" title="Unidades do cálculo: massa em kg (kgf ≡ kg), comprimento em m, ângulo em graus">
          {unidade} · m · °
        </span>
        <span className="barra-status__versao" title="Versão dos dados de tabela usados no cálculo">
          {VERSAO_TABELAS}
        </span>
      </span>
    </footer>
  )
}
