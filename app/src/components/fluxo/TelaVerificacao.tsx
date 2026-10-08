import { ChevronRight, Columns2, Plus, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CATALOGO } from '../../data/catalogo'
import { rotuloRegiao } from '../../engine/capacidadeDetalhada'
import { useFluxoStore } from '../../store/useFluxoStore'
import { useInterfaceStore } from '../../store/useInterfaceStore'
import { useProjetosStore } from '../../store/useProjetosStore'
import { useSimulacaoStore } from '../../store/useSimulacaoStore'
import { PainelResultado } from '../PainelResultado'
import { useAlteracoesNaoSalvas } from '../projetos/CenarioAberto'
import { ROTULO_STATUS_CURTO } from '../projetos/rotulos'

/**
 * ⑤ Verificação (Épico 18): o resultado completo do cenário (o mesmo painel
 * da simulação: veredito, valores, verificações), salvar no orçamento, os
 * outros cenários do orçamento, comparar e começar outro cenário.
 */
export function TelaVerificacao() {
  const cenario = useSimulacaoStore((s) => s.cenario)
  const avaliacao = useSimulacaoStore((s) => s.avaliacao)
  const aberto = useProjetosStore((s) => s.aberto)
  const cenarios = useProjetosStore((s) => s.cenarios)
  const mensagem = useProjetosStore((s) => s.mensagem)
  const selecionarOrcamento = useProjetosStore((s) => s.selecionarOrcamento)
  const salvarComoNovo = useProjetosStore((s) => s.salvarComoNovo)
  const salvar = useProjetosStore((s) => s.salvar)
  const orcamentoAtivo = useFluxoStore((s) => s.orcamentoAtivo)
  const irPara = useFluxoStore((s) => s.irPara)
  const novoCenarioNoOrcamento = useFluxoStore((s) => s.novoCenarioNoOrcamento)
  const abrirDialogo = useInterfaceStore((s) => s.abrirDialogo)
  const definirComparacao = useInterfaceStore((s) => s.definirComparacao)
  const alterado = useAlteracoesNaoSalvas()

  const area = avaliacao.giro.regioes.map(rotuloRegiao).join(' / ')
  const [nome, setNome] = useState(
    `${CATALOGO[cenario.guindasteId].guindaste.nome} ${cenario.lanca.comprimentoM.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m${area ? ` ${area}` : ''}`,
  )
  const [salvando, setSalvando] = useState(false)
  const [marcados, setMarcados] = useState<string[]>([])
  const orcamentoId = aberto?.orcamento.id ?? orcamentoAtivo?.orcamento.id ?? null

  useEffect(() => {
    if (orcamentoId) void selecionarOrcamento(orcamentoId)
  }, [orcamentoId, aberto?.cenario.id, aberto?.cenario.atualizadoEm, selecionarOrcamento])

  return (
    <div className="tela tela--duas-colunas">
      <header className="tela__cabecalho">
        <span className="tela__numero">5</span>
        <div>
          <h2>Verificação</h2>
          <p>Confira o resultado, salve o cenário no orçamento e compare com outras configurações.</p>
        </div>
      </header>

      <div className="tela__corpo">
        <div className="tela__formulario tela__resultado">
          <PainelResultado />
        </div>

        <aside className="tela__resumo" aria-label="Salvar e comparar">
          <section className="tela__cartao">
            <h3 className="tela__secao">
              <Save size={15} aria-hidden="true" /> Salvar cenário
            </h3>
            {avaliacao.status === 'sem_dado' && (
              <p className="tela__pendencia">
                Este cenário está <strong>não validado</strong>: ele pode ser salvo, mas sai no relatório com a tarja
                &quot;OPERAÇÃO NÃO VALIDADA&quot;.
              </p>
            )}
            {mensagem?.tipo === 'erro' && (
              <div className="projetos__mensagem projetos__mensagem--erro" role="alert">
                {mensagem.texto}
              </div>
            )}
            {aberto ? (
              <>
                <p className="tela__nota" data-testid="cenario-salvo">
                  Salvo como <strong>{aberto.cenario.nome}</strong> em {aberto.projeto.cliente} › {aberto.orcamento.nome}
                  {alterado ? ' — há alterações não salvas.' : '.'}
                </p>
                <div className="tela__acoes tela__acoes--esquerda">
                  <button type="button" className="comando comando--destaque" disabled={!alterado} onClick={() => void salvar()}>
                    Salvar alterações
                  </button>
                  <button type="button" className="comando" onClick={() => abrirDialogo('salvar')}>
                    Salvar como novo cenário…
                  </button>
                </div>
              </>
            ) : orcamentoAtivo ? (
              <form
                className="tela__salvar"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!nome.trim() || salvando) return
                  setSalvando(true)
                  await salvarComoNovo(orcamentoAtivo.orcamento.id, nome.trim())
                  setSalvando(false)
                }}
              >
                <label className="campo-simples">
                  Nome do cenário
                  <input type="text" value={nome} required onChange={(e) => setNome(e.target.value)} />
                </label>
                <button type="submit" className="comando comando--destaque" disabled={salvando || !nome.trim()}>
                  Salvar no orçamento “{orcamentoAtivo.orcamento.nome}”
                </button>
              </form>
            ) : (
              <>
                <p className="tela__nota">Simulação livre: escolha ou crie o projeto e o orçamento ao salvar.</p>
                <button type="button" className="comando comando--destaque" onClick={() => abrirDialogo('salvar')}>
                  Salvar como cenário…
                </button>
              </>
            )}
          </section>

          {orcamentoId && (
            <section className="tela__cartao" aria-label="Cenários do orçamento">
              <h3 className="tela__secao">Cenários do orçamento</h3>
              {cenarios.length === 0 ? (
                <p className="tela__vazio">Nenhum cenário salvo neste orçamento ainda.</p>
              ) : (
                <ul className="tela__lista">
                  {cenarios.map((c) => (
                    <li key={c.id} className={c.id === aberto?.cenario.id ? 'tela__lista-atual' : ''}>
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          aria-label={`Comparar ${c.nome}`}
                          checked={marcados.includes(c.id)}
                          onChange={(e) => setMarcados(e.target.checked ? [...marcados, c.id] : marcados.filter((id) => id !== c.id))}
                        />
                        <strong>{c.nome}</strong>
                      </label>
                      <span className={`selo-status selo-status--${c.resultado.status}`}>{ROTULO_STATUS_CURTO[c.resultado.status]}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="tela__acoes tela__acoes--esquerda">
                <button
                  type="button"
                  className="comando"
                  disabled={marcados.length < 2}
                  title={marcados.length < 2 ? 'Marque 2 ou mais cenários' : undefined}
                  onClick={() => {
                    definirComparacao(marcados)
                    abrirDialogo('comparar')
                  }}
                >
                  <Columns2 size={14} aria-hidden="true" /> Comparar marcados ({marcados.length})
                </button>
                <button type="button" className="comando" onClick={novoCenarioNoOrcamento}>
                  <Plus size={14} aria-hidden="true" /> Adicionar outro cenário
                </button>
              </div>
            </section>
          )}

          <button
            type="button"
            className="comando comando--destaque tela__principal"
            disabled={!aberto}
            title={aberto ? undefined : 'Salve o cenário para emitir o relatório'}
            onClick={() => irPara('relatorio')}
          >
            Ir para o relatório <ChevronRight size={14} aria-hidden="true" />
          </button>
        </aside>
      </div>
    </div>
  )
}
