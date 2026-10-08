import { Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CATALOGO } from '../../data/catalogo'
import { rotuloRegiao } from '../../engine/capacidadeDetalhada'
import { sugerirConfiguracoes, type SugestaoDeConfiguracao } from '../../engine/sugerirConfiguracoes'
import { baseDoPedido, frotaParaSugestao, useFluxoStore } from '../../store/useFluxoStore'
import { formatarMassa, formatarPercentual, useInterfaceStore } from '../../store/useInterfaceStore'
import { useSimulacaoStore } from '../../store/useSimulacaoStore'
import { ROTULO_STATUS_CURTO } from '../projetos/rotulos'

const m = (v: number) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`
const graus = (v: number) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}°`

function CartaoDaConfiguracao({ s, aoUsar }: { s: SugestaoDeConfiguracao; aoUsar: () => void }) {
  const unidade = useInterfaceStore((st) => st.unidadeMassa)
  const a = s.avaliacao
  const nome = `${s.guindasteId} · lança ${m(s.comprimentoLancaM)} · ${rotuloRegiao(s.regiao)}`
  return (
    <article className={`sugestao sugestao--${a.status}`} aria-label={nome}>
      <header className="sugestao__cabecalho">
        <strong>
          Lança {m(s.comprimentoLancaM)} · {rotuloRegiao(s.regiao)}
        </strong>
        <span className={`selo-status selo-status--${a.status}`}>{ROTULO_STATUS_CURTO[a.status]}</span>
      </header>
      <table className="resultado__valores">
        <tbody>
          <tr>
            <th scope="row">Capacidade da tabela</th>
            <td>{a.capacidade.capacidadeKg === null ? 'sem dado' : formatarMassa(a.capacidade.capacidadeKg, unidade)}</td>
          </tr>
          <tr>
            <th scope="row">Somatório de cargas</th>
            <td>{formatarMassa(a.somatorio.totalKg, unidade)}</td>
          </tr>
          <tr>
            <th scope="row">Utilização</th>
            <td>{a.percentualUtilizacao === null ? '—' : formatarPercentual(a.percentualUtilizacao)}</td>
          </tr>
          <tr>
            <th scope="row">Ângulo da lança · giro</th>
            <td>
              {graus(s.parametros.lanca.anguloGraus)} · {graus(s.giroGraus)}
            </td>
          </tr>
        </tbody>
      </table>
      {a.status === 'sem_dado' && (
        <ul className="sugestao__motivos">
          {a.motivosSemDado.map((mot) => (
            <li key={mot}>{mot}</li>
          ))}
        </ul>
      )}
      {a.status === 'nok' && (
        <ul className="sugestao__motivos">
          {a.verificacoes
            .filter((v) => !v.aprovada && v.id !== 'limite_engenheiro')
            .map((v) => (
              <li key={v.id}>
                {v.descricao}: {v.detalhe}
              </li>
            ))}
        </ul>
      )}
      <button type="button" className="comando comando--destaque" aria-label={`Usar ${nome}`} onClick={aoUsar}>
        Usar esta configuração
      </button>
    </article>
  )
}

/**
 * ③ Guindaste (Épico 18, RF05/RF15): para a carga e o raio da etapa ②, cada
 * configuração candidata da frota avaliada pelo próprio motor
 * (`sugerirConfiguracoes`), com o MENOR guindaste primeiro. Reprovadas
 * ficam recolhidas; o que a lança não alcança é listado à parte.
 */
export function TelaGuindaste() {
  const cenario = useSimulacaoStore((s) => s.cenario)
  const raio = useFluxoStore((s) => s.raioNecessarioM)
  const escolher = useFluxoStore((s) => s.escolherConfiguracao)
  const [mostrarReprovadas, setMostrarReprovadas] = useState(false)

  const resultado = useMemo(() => {
    if (raio === null) return null
    const candidatos = frotaParaSugestao().map((ctx) => ({ ctx, base: baseDoPedido(ctx, cenario) }))
    return sugerirConfiguracoes(candidatos, raio)
  }, [cenario, raio])

  if (!resultado || raio === null) return null
  const porGuindaste = [...new Set(resultado.sugestoes.map((s) => s.guindasteId))]
  const foraDeAlcance = (id: string) => resultado.foraDeAlcance.filter((f) => f.guindasteId === id)
  const guindastesSemAlcance = frotaParaSugestao().filter((c) => !porGuindaste.includes(c.guindaste.id))
  const totalReprovadas = resultado.sugestoes.filter((s) => s.avaliacao.status === 'nok').length

  return (
    <div className="tela">
      <header className="tela__cabecalho">
        <span className="tela__numero">3</span>
        <div>
          <h2>Guindaste</h2>
          <p>
            Configurações da frota para a carga de {formatarMassa(cenario.carga.pesoKg, 'kg')} a {m(raio)} de raio, com o{' '}
            <strong>menor guindaste primeiro</strong>. Cada resultado é o cálculo completo do motor, com o somatório de cargas.
          </p>
        </div>
      </header>

      <div className="tela__barra">
        <label className="checkbox">
          <input type="checkbox" checked={mostrarReprovadas} onChange={(e) => setMostrarReprovadas(e.target.checked)} />
          Mostrar reprovadas ({totalReprovadas})
        </label>
      </div>

      {porGuindaste.map((id) => {
        const { guindaste } = CATALOGO[id]
        const lista = resultado.sugestoes.filter((s) => s.guindasteId === id && (mostrarReprovadas || s.avaliacao.status !== 'nok'))
        const fora = foraDeAlcance(id)
        return (
          <section key={id} className="tela__cartao" aria-label={guindaste.nome}>
            <h3 className="sugestoes__guindaste">
              <Truck size={18} aria-hidden="true" /> {guindaste.nome}
              <small>
                {guindaste.fabricante} · {(guindaste.capacidadeNominalKg / 1000).toLocaleString('pt-BR')} t nominais
              </small>
            </h3>
            {lista.length === 0 ? (
              <p className="tela__vazio">Todas as configurações deste guindaste reprovam para esta carga.</p>
            ) : (
              <div className="sugestoes">
                {lista.map((s) => (
                  <CartaoDaConfiguracao key={`${s.comprimentoLancaM}-${s.regiao}`} s={s} aoUsar={() => escolher(s.parametros)} />
                ))}
              </div>
            )}
            {fora.length > 0 && (
              <p className="tela__nota">
                Não alcançam {m(raio)}: {fora.map((f) => `lança ${m(f.comprimentoLancaM)}`).join(', ')}.
              </p>
            )}
          </section>
        )
      })}

      {guindastesSemAlcance.map((ctx) => (
        <section key={ctx.guindaste.id} className="tela__cartao tela__cartao--apagado" aria-label={ctx.guindaste.nome}>
          <h3 className="sugestoes__guindaste">
            <Truck size={18} aria-hidden="true" /> {ctx.guindaste.nome}
          </h3>
          <p className="tela__vazio">Nenhuma lança deste guindaste alcança {m(raio)} de raio.</p>
        </section>
      ))}

      <p className="tela__nota">
        Sugestões com a lança principal. O JIB, as sapatas e todos os outros parâmetros continuam ajustáveis na simulação.
      </p>
    </div>
  )
}
