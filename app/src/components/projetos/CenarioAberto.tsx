import { versoesDiferentes } from '../../persistencia/montarCenario'
import { formatarMassa, useInterfaceStore } from '../../store/useInterfaceStore'
import { useProjetosStore } from '../../store/useProjetosStore'
import { useSimulacaoStore } from '../../store/useSimulacaoStore'
import { ROTULO_STATUS_CURTO } from './rotulos'

/** Há alterações na simulação desde o último salvamento do cenário aberto? */
export function useAlteracoesNaoSalvas(): boolean {
  const aberto = useProjetosStore((s) => s.aberto)
  const cenario = useSimulacaoStore((s) => s.cenario)
  return aberto !== null && JSON.stringify(cenario) !== JSON.stringify(aberto.cenario.parametros)
}

/**
 * Cenário aberto (Épico 15, RF24), no topo do painel de resultado: de onde
 * ele veio (projeto › orçamento › cenário), se há alterações não salvas e —
 * quando o cenário foi salvo com outra versão das tabelas ou do critério de
 * giro — o resultado SALVO lado a lado com o RECALCULADO agora.
 */
export function CenarioAberto() {
  const aberto = useProjetosStore((s) => s.aberto)
  const avaliacao = useSimulacaoStore((s) => s.avaliacao)
  const unidade = useInterfaceStore((s) => s.unidadeMassa)
  const alterado = useAlteracoesNaoSalvas()
  if (!aberto) return null

  const { cenario, projeto, orcamento } = aberto
  const versoes = versoesDiferentes(cenario)
  const salvo = cenario.resultado
  const capacidade = (kg: number | null) => (kg === null ? 'sem dado' : formatarMassa(kg, unidade))

  return (
    <section className="cenario-aberto" aria-label="Cenário aberto" data-testid="cenario-aberto">
      <div className="cenario-aberto__caminho">
        {projeto.cliente} — {projeto.obra} › {orcamento.nome}
      </div>
      <div className="cenario-aberto__nome">
        {cenario.nome}
        {alterado && <span className="cenario-aberto__alterado"> ● alterações não salvas</span>}
      </div>

      {(versoes.tabelas || versoes.criterioGiro) && (
        <div className="cenario-aberto__versao" role="alert">
          <strong>
            Salvo com {versoes.tabelas ? 'outra versão das tabelas' : ''}
            {versoes.tabelas && versoes.criterioGiro ? ' e ' : ''}
            {versoes.criterioGiro ? 'outro critério de giro' : ''} — o resultado foi recalculado.
          </strong>
          <table>
            <thead>
              <tr>
                <th />
                <th>Salvo</th>
                <th>Recalculado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Status</th>
                <td>{ROTULO_STATUS_CURTO[salvo.status]}</td>
                <td>{ROTULO_STATUS_CURTO[avaliacao.status]}</td>
              </tr>
              <tr>
                <th>Capacidade</th>
                <td>{capacidade(salvo.capacidade.capacidadeKg)}</td>
                <td>{capacidade(avaliacao.capacidade.capacidadeKg)}</td>
              </tr>
              <tr>
                <th>Versão</th>
                <td>{cenario.versaoTabelas}</td>
                <td>atual</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
