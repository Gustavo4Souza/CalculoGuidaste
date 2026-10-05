import { CATALOGO, VERSAO_TABELAS } from '../data/catalogo'
import { rotuloRegiao } from '../engine/capacidadeDetalhada'
import { formatarMassa, useInterfaceStore } from '../store/useInterfaceStore'
import { useSimulacaoStore } from '../store/useSimulacaoStore'
import type { StatusDoCenario } from '../types/cenario'

const ROTULO_STATUS: Record<StatusDoCenario, string> = {
  ok: 'OK — dentro do limite',
  atencao: 'Atenção — acima do limite do engenheiro',
  nok: 'NOK — operação reprovada',
  sem_dado: 'Sem dado do fabricante',
}

/**
 * Barra de status inferior (Épico 12, RF23): o resultado resumido, sempre
 * visível, mais a versão das tabelas e o selo do critério de giro provisório.
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
        {ROTULO_STATUS[status]}
      </span>
      <span>
        Capacidade: <strong>{capacidade.capacidadeKg === null ? '—' : formatarMassa(capacidade.capacidadeKg, unidade)}</strong>
        {capacidade.origem && <> ({capacidade.origem === 'exato' ? 'ponto exato' : 'interpolado'})</>}
      </span>
      <span>
        Somatório: <strong>{formatarMassa(somatorio.totalKg, unidade)}</strong>
      </span>
      <span>
        Utilização: <strong>{percentualUtilizacao === null ? '—' : `${percentualUtilizacao.toFixed(1)}%`}</strong>
      </span>
      <span data-testid="regiao-derivada">Área: {giro.regioes.map(rotuloRegiao).join(' / ') || '—'}</span>
      {provisorio && <span className="selo-provisorio">Critério de giro provisório</span>}
      <span className="barra-status__versao" title="Versão dos dados de tabela usados no cálculo">
        {VERSAO_TABELAS}
      </span>
    </footer>
  )
}
