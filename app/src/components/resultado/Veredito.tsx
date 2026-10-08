import { CircleAlert, CircleCheck, CircleHelp, CircleX, type LucideIcon } from 'lucide-react'
import { formatarPercentual, useInterfaceStore } from '../../store/useInterfaceStore'
import type { AvaliacaoDoCenario, StatusDoCenario } from '../../types/cenario'
import { NOME_STATUS } from './nomes'
import { noDaVerificacao, noDoMotivo, TITULO_NO, type IdNo } from '../gerenciador/nos'

const VISUAL: Record<StatusDoCenario, { classe: string; Icone: LucideIcon }> = {
  ok: { classe: 'good', Icone: CircleCheck },
  atencao: { classe: 'warning', Icone: CircleAlert },
  nok: { classe: 'critical', Icone: CircleX },
  sem_dado: { classe: 'semdado', Icone: CircleHelp },
}

function IrPara({ no }: { no: IdNo }) {
  const editarNo = useInterfaceStore((s) => s.editarNo)
  return (
    <button type="button" className="veredito__ir" onClick={() => editarNo(no)}>
      Corrigir em {TITULO_NO[no]}
    </button>
  )
}

/**
 * Veredito (Épico 17) — a primeira coisa do painel de resultado, em frase,
 * para o engenheiro não ter dúvida: aprovada, aprovada com atenção,
 * reprovada ou NÃO VALIDADA (sem dado). O número da capacidade nunca
 * aparece sozinho como destaque; cada pendência leva ao nó que a corrige.
 */
export function Veredito({
  avaliacao,
  limitePercentual,
  jibAtivo,
}: {
  avaliacao: AvaliacaoDoCenario
  limitePercentual: number
  jibAtivo: boolean
}) {
  const { status, percentualUtilizacao, verificacoes, motivosSemDado } = avaliacao
  const pct = percentualUtilizacao ?? 0
  const { classe, Icone } = VISUAL[status]
  const reprovadas = verificacoes.filter((v) => !v.aprovada && v.id !== 'limite_engenheiro')

  return (
    <div className={`veredito status-chip status-chip--${classe}`} role="status">
      <div className="veredito__cabecalho">
        <Icone size={22} aria-hidden="true" />
        <p className="status-chip__titulo">{NOME_STATUS[status]}</p>
      </div>

      {status === 'ok' && (
        <p className="status-chip__sub">
          Utilização de {formatarPercentual(pct)} da capacidade da tabela · margem de {formatarPercentual(100 - pct)}.
        </p>
      )}

      {status === 'atencao' && (
        <p className="status-chip__sub">
          Utilização de {formatarPercentual(pct)}, acima do limite de {limitePercentual}% definido pelo engenheiro. Está dentro da
          tabela do fabricante.
        </p>
      )}

      {status === 'nok' && (
        <ul className="status-chip__lista">
          {reprovadas.map((v) => (
            <li key={v.id}>
              <span>
                {v.id === 'capacidade' ? (
                  <>
                    <strong>Carga excede a capacidade da tabela</strong> — utilização de {formatarPercentual(pct)}.
                  </>
                ) : (
                  <>
                    <strong>{v.descricao}</strong> — {v.detalhe}
                  </>
                )}
              </span>
              <IrPara no={noDaVerificacao(v.id)} />
            </li>
          ))}
        </ul>
      )}

      {status === 'sem_dado' && (
        <>
          <p className="status-chip__sub">Falta dado do fabricante ou do cenário. Até corrigir, o resultado não vale para a operação:</p>
          <ul className="status-chip__lista">
            {motivosSemDado.map((m) => (
              <li key={m}>
                <span>{m}</span>
                <IrPara no={noDoMotivo(m, jibAtivo)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
