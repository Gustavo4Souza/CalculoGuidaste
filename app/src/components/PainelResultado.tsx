import { CircleAlert, CircleCheck, CircleHelp, CircleX } from 'lucide-react'
import { rotuloRegiao } from '../engine/capacidadeDetalhada'
import { formatarMassa, formatarPercentual, useInterfaceStore } from '../store/useInterfaceStore'
import { useSimulacaoStore } from '../store/useSimulacaoStore'
import { MedidorCapacidade } from './MedidorCapacidade'
import { Veredito } from './resultado/Veredito'

const ROTULO_CHAVE: Record<string, string> = {
  comprimentoLancaM: 'lança',
  raioM: 'raio',
  anguloJibGraus: 'JIB',
  anguloLancaGraus: 'ângulo',
  zona: 'zona',
}
const UNIDADE_CHAVE: Record<string, string> = {
  comprimentoLancaM: ' m',
  raioM: ' m',
  anguloJibGraus: '°',
  anguloLancaGraus: '°',
}

/**
 * Resultado da avaliação (Épico 17 — painel de tarefas à direita, estilo
 * SolidWorks). Ordem de leitura pensada para não deixar dúvida:
 * 1) o veredito em frase; 2) os números, cada um com rótulo e unidade;
 * 3) o medidor de utilização; 4) os detalhes (somatório item a item,
 * verificações e os pontos reais da tabela usados).
 */
export function PainelResultado() {
  const avaliacao = useSimulacaoStore((s) => s.avaliacao)
  const cenario = useSimulacaoStore((s) => s.cenario)
  const unidade = useInterfaceStore((s) => s.unidadeMassa)
  const kg = (v: number) => formatarMassa(v, unidade)
  const { capacidade, somatorio, status, percentualUtilizacao, verificacoes, geometria, giro } = avaliacao
  const limite = cenario.limiteUtilizacaoPercentual
  const temCapacidade = capacidade.capacidadeKg !== null
  // Sem dado: o somatório pode estar incompleto (ex.: cabo sem massa), então um ✔ aqui enganaria.
  const parciais = status === 'sem_dado'
  const folgaKg = temCapacidade ? capacidade.capacidadeKg! - somatorio.totalKg : null

  return (
    <section className={`resultado resultado--${status}`} aria-label="Resultado">
      <h2 className="painel-titulo">Resultado da avaliação</h2>

      <Veredito avaliacao={avaliacao} limitePercentual={limite} jibAtivo={cenario.jib.ativo} />

      <table className="resultado__valores">
        <tbody>
          <tr>
            <th scope="row">Somatório de cargas</th>
            <td>{kg(somatorio.totalKg)}</td>
          </tr>
          <tr>
            <th scope="row">
              Capacidade da tabela
              <small>limite do fabricante</small>
            </th>
            <td>
              <span className={`capacidade ${temCapacidade ? '' : 'capacidade--semdado'}`}>
                {temCapacidade ? kg(capacidade.capacidadeKg!) : 'Sem dado do fabricante'}
              </span>
              {temCapacidade && (
                <small className="resultado__origem">
                  {capacidade.origem === 'exato' ? 'ponto exato da tabela' : 'interpolado, arredondado para baixo'}
                  {capacidade.regiao && <> · {rotuloRegiao(capacidade.regiao)}</>}
                </small>
              )}
            </td>
          </tr>
          <tr>
            <th scope="row">Utilização</th>
            <td>
              {percentualUtilizacao === null ? '—' : formatarPercentual(percentualUtilizacao)}
              <small>limite do engenheiro: {limite}%</small>
            </td>
          </tr>
          <tr>
            <th scope="row">{folgaKg !== null && folgaKg < 0 ? 'Excedente' : 'Folga'}</th>
            <td className={folgaKg !== null && folgaKg < 0 ? 'resultado__excedente' : ''}>
              {folgaKg === null ? '—' : kg(Math.abs(folgaKg))}
            </td>
          </tr>
          <tr>
            <th scope="row">Raio de trabalho</th>
            <td>{geometria.raioM.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m</td>
          </tr>
          <tr>
            <th scope="row">Área da tabela</th>
            <td>{giro.regioes.map(rotuloRegiao).join(' / ') || '—'}</td>
          </tr>
        </tbody>
      </table>

      {temCapacidade && (
        <MedidorCapacidade
          capacidadeMaximaKg={capacidade.capacidadeKg!}
          somatorioDeCargasKg={somatorio.totalKg}
          limiteUtilizacaoPercentual={limite}
        />
      )}

      <details className="resultado__detalhe" open>
        <summary>Somatório item a item</summary>
        <ul className="resultado__lista">
          {somatorio.itens.map((item) => (
            <li key={item.descricao}>
              <span>{item.descricao}</span>
              <span>{kg(item.massaKg)}</span>
            </li>
          ))}
          <li className="resultado__total">
            <span>Total</span>
            <span>{kg(somatorio.totalKg)}</span>
          </li>
        </ul>
      </details>

      {verificacoes.length > 0 && (
        <details className="resultado__detalhe" open>
          <summary>{parciais ? 'Verificações parciais — falta dado' : 'Verificações'}</summary>
          {parciais && (
            <p className="resultado__aviso-parcial">
              Calculadas com o que já foi informado. Só valem depois de completar o que falta acima.
            </p>
          )}
          <ul className="resultado__verificacoes">
            {verificacoes.map((v) => (
              <li
                key={v.id}
                className={!v.aprovada ? (v.id === 'limite_engenheiro' ? 'atencao' : 'reprovada') : parciais ? 'parcial' : 'aprovada'}
              >
                {!v.aprovada && v.id === 'limite_engenheiro' ? (
                  <CircleAlert size={14} aria-hidden="true" />
                ) : !v.aprovada ? (
                  <CircleX size={14} aria-hidden="true" />
                ) : parciais ? (
                  <CircleHelp size={14} aria-hidden="true" />
                ) : (
                  <CircleCheck size={14} aria-hidden="true" />
                )}
                <span>
                  {v.descricao}
                  <small>{v.detalhe}</small>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {temCapacidade && capacidade.origem !== 'exato' && (
        <details className="resultado__detalhe">
          <summary>Pontos da tabela usados na interpolação</summary>
          <ul className="resultado__pontos">
            {capacidade.pontosUsados.map((p, i) => (
              <li key={i}>
                {Object.entries(p.chaves)
                  .map(([k, v]) => `${ROTULO_CHAVE[k] ?? k} ${typeof v === 'number' ? v.toLocaleString('pt-BR') : v}${UNIDADE_CHAVE[k] ?? ''}`)
                  .join(' · ')}{' '}
                → {kg(p.capacidadeKg)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
