import { FileDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { emitirRelatorioDoCenarioAtual, emitirRelatorioDoOrcamento } from '../../relatorio/emitirRelatorio'
import { montarModeloCenario } from '../../relatorio/modeloRelatorio'
import { useProjetosStore } from '../../store/useProjetosStore'
import { useSimulacaoStore } from '../../store/useSimulacaoStore'
import { ROTULO_STATUS_CURTO } from '../projetos/rotulos'

/**
 * ⑥ Relatório (Épico 18, RF26): prévia do que vai no PDF — cabeçalho, status
 * (com a tarja quando a operação não está validada) e o resumo — e a
 * emissão do cenário ou do orçamento inteiro (comparativo + um capítulo por
 * cenário). O conteúdo vem do mesmo modelo do PDF (`modeloRelatorio.ts`).
 */
export function TelaRelatorio() {
  const cenario = useSimulacaoStore((s) => s.cenario)
  const aberto = useProjetosStore((s) => s.aberto)
  const cenarios = useProjetosStore((s) => s.cenarios)
  const selecionarOrcamento = useProjetosStore((s) => s.selecionarOrcamento)
  const [tipo, setTipo] = useState<'cenario' | 'orcamento'>('cenario')
  const [gerando, setGerando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null)

  useEffect(() => {
    if (aberto) void selecionarOrcamento(aberto.orcamento.id)
  }, [aberto, selecionarOrcamento])

  const modelo = useMemo(
    () => (aberto ? montarModeloCenario(cenario, aberto.cenario.nome, aberto.cenario) : null),
    [cenario, aberto],
  )
  if (!aberto || !modelo) return null
  const { projeto, orcamento } = aberto

  return (
    <div className="tela tela--duas-colunas">
      <header className="tela__cabecalho">
        <span className="tela__numero">6</span>
        <div>
          <h2>Relatório</h2>
          <p>O PDF para o engenheiro responsável validar e assinar, e para entregar ao cliente.</p>
        </div>
      </header>

      <div className="tela__corpo">
        <div className="tela__formulario">
          <section className="tela__cartao previa" aria-label="Prévia do relatório">
            <h3 className="tela__secao">Prévia — {tipo === 'cenario' ? 'cenário' : 'orçamento'}</h3>
            <table className="previa__cabecalho">
              <tbody>
                <tr><th scope="row">Cliente</th><td>{projeto.cliente}</td></tr>
                <tr><th scope="row">Obra</th><td>{projeto.obra}</td></tr>
                <tr><th scope="row">Local</th><td>{projeto.local || '—'}</td></tr>
                <tr><th scope="row">Responsável técnico</th><td>{projeto.responsavel || '—'}</td></tr>
                <tr><th scope="row">Orçamento</th><td>{orcamento.nome}</td></tr>
              </tbody>
            </table>

            {tipo === 'cenario' ? (
              <>
                <h4 className="previa__titulo">Cenário: {modelo.nome}</h4>
                <p className="previa__guindaste">
                  {modelo.guindaste.nome} ({modelo.guindaste.fabricante})
                </p>
                <div className={`previa__status previa__status--${modelo.status.codigo}`}>{modelo.status.rotulo}</div>
                {modelo.tarja && <div className="previa__tarja">{modelo.tarja}</div>}
                <table className="resultado__valores">
                  <tbody>
                    {modelo.resumo.map(([rotulo, valor]) => (
                      <tr key={rotulo}>
                        <th scope="row">{rotulo}</th>
                        <td>{valor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {modelo.avisos.length > 0 && (
                  <ul className="previa__avisos">
                    {modelo.avisos.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <h4 className="previa__titulo">Comparativo de {cenarios.length} cenário(s)</h4>
                <ul className="tela__lista">
                  {cenarios.map((c) => (
                    <li key={c.id}>
                      <strong>{c.nome}</strong>
                      <span className={`selo-status selo-status--${c.resultado.status}`}>{ROTULO_STATUS_CURTO[c.resultado.status]}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="tela__nota">
              O PDF traz ainda todos os parâmetros, o somatório item a item, a capacidade com os pontos da tabela usados, as
              verificações, as vistas lateral e superior, as versões dos dados e o bloco de assinatura (engenheiro, CREA/ART,
              data).
            </p>
          </section>
        </div>

        <aside className="tela__resumo" aria-label="Emitir relatório">
          <section className="tela__cartao">
            <h3 className="tela__secao">Emitir</h3>
            <div className="tela__opcoes" role="radiogroup" aria-label="Tipo de relatório">
              <label className="checkbox">
                <input type="radio" name="tipo" checked={tipo === 'cenario'} onChange={() => setTipo('cenario')} />
                Relatório do cenário “{aberto.cenario.nome}”
              </label>
              <label className="checkbox">
                <input type="radio" name="tipo" checked={tipo === 'orcamento'} onChange={() => setTipo('orcamento')} />
                Relatório do orçamento “{orcamento.nome}” (comparativo + um capítulo por cenário)
              </label>
            </div>
            <button
              type="button"
              className="comando comando--destaque tela__principal"
              disabled={gerando}
              onClick={async () => {
                setGerando(true)
                setResultado(null)
                try {
                  if (tipo === 'orcamento') await emitirRelatorioDoOrcamento(orcamento.id)
                  else await emitirRelatorioDoCenarioAtual()
                  setResultado({ ok: true, texto: 'PDF gerado. Confira, assine e entregue ao cliente.' })
                } catch (falha) {
                  setResultado({ ok: false, texto: falha instanceof Error ? falha.message : 'Não foi possível gerar o relatório.' })
                } finally {
                  setGerando(false)
                }
              }}
            >
              <FileDown size={15} aria-hidden="true" /> {gerando ? 'Gerando…' : 'Gerar PDF'}
            </button>
            {resultado && (
              <div className={`projetos__mensagem projetos__mensagem--${resultado.ok ? 'ok' : 'erro'}`} role="status">
                {resultado.texto}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
