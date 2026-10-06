import { useEffect, useState } from 'react'
import { useInterfaceStore } from '../../store/useInterfaceStore'
import { useProjetosStore } from '../../store/useProjetosStore'
import type { DadosProjeto, Projeto } from '../../types/projeto'
import { Dialogo } from '../Dialogo'
import { baixarArquivoDeProjeto } from './arquivos'
import { ROTULO_STATUS_CURTO } from './rotulos'

const PROJETO_VAZIO: DadosProjeto = { cliente: '', obra: '', local: '', responsavel: '' }

function confirmar(mensagem: string): boolean {
  return window.confirm(mensagem)
}

/** Formulário de projeto (novo ou edição). */
function FormularioProjeto({
  inicial,
  aoSalvar,
  aoCancelar,
}: {
  inicial: DadosProjeto
  aoSalvar: (dados: DadosProjeto) => void
  aoCancelar: () => void
}) {
  const [dados, setDados] = useState(inicial)
  const campo = (chave: keyof DadosProjeto, rotulo: string) => (
    <label className="campo-simples">
      {rotulo}
      <input value={dados[chave]} onChange={(e) => setDados({ ...dados, [chave]: e.target.value })} />
    </label>
  )
  return (
    <form
      className="projetos__formulario"
      onSubmit={(e) => {
        e.preventDefault()
        if (dados.cliente.trim() && dados.obra.trim()) aoSalvar(dados)
      }}
    >
      {campo('cliente', 'Cliente')}
      {campo('obra', 'Obra')}
      {campo('local', 'Local')}
      {campo('responsavel', 'Responsável técnico')}
      <div className="projetos__acoes">
        <button type="submit" className="comando comando--destaque" disabled={!dados.cliente.trim() || !dados.obra.trim()}>
          Salvar projeto
        </button>
        <button type="button" className="comando" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

/**
 * Gerenciador de projetos, orçamentos e cenários (Épico 15, RF24):
 * Projeto → Orçamento → Cenários, com criar / buscar / editar / duplicar /
 * excluir / abrir, exportar o projeto em JSON e escolher cenários para
 * comparar lado a lado.
 */
export function DialogoProjetos() {
  return (
    <Dialogo nome="projetos" titulo="Projetos e cenários" largura={1100}>
      <GerenciadorDeProjetos />
    </Dialogo>
  )
}

function GerenciadorDeProjetos() {
  const s = useProjetosStore()
  const abrirDialogo = useInterfaceStore((st) => st.abrirDialogo)
  const [editando, setEditando] = useState<Projeto | 'novo' | null>(null)
  const [novoOrcamento, setNovoOrcamento] = useState('')
  const [paraComparar, setParaComparar] = useState<string[]>([])

  useEffect(() => {
    void s.carregarProjetos()
    // Só ao abrir o diálogo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const projetoSelecionado = s.projetos.find((p) => p.id === s.projetoId) ?? null

  return (
    <div className="projetos">
      {s.mensagem && (
        <div className={`projetos__mensagem projetos__mensagem--${s.mensagem.tipo}`} role="status">
          {s.mensagem.texto}
          <button type="button" className="comando" onClick={s.limparMensagem} aria-label="Fechar mensagem">
            ✕
          </button>
        </div>
      )}

      <div className="projetos__colunas">
        {/* ------------------------------------------------ projetos */}
        <section className="projetos__coluna" aria-label="Projetos">
          <h3>Projetos</h3>
          <input
            type="search"
            className="projetos__busca"
            placeholder="Buscar cliente, obra, local, responsável…"
            aria-label="Buscar projetos"
            value={s.busca}
            onChange={(e) => void s.carregarProjetos(e.target.value)}
          />
          {editando ? (
            <FormularioProjeto
              inicial={editando === 'novo' ? PROJETO_VAZIO : editando}
              aoCancelar={() => setEditando(null)}
              aoSalvar={async (dados) => {
                if (editando === 'novo') await s.criarProjeto(dados)
                else await s.atualizarProjeto(editando.id, dados)
                setEditando(null)
              }}
            />
          ) : (
            <button type="button" className="comando comando--destaque" onClick={() => setEditando('novo')}>
              + Novo projeto
            </button>
          )}
          <ul className="projetos__lista">
            {s.projetos.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`projetos__item ${p.id === s.projetoId ? 'projetos__item--ativo' : ''}`}
                  onClick={() => void s.selecionarProjeto(p.id)}
                >
                  <strong>{p.cliente}</strong>
                  <span>{p.obra}</span>
                  <small>
                    {p.local}
                    {p.responsavel && ` · ${p.responsavel}`}
                  </small>
                </button>
              </li>
            ))}
            {s.projetos.length === 0 && <li className="projetos__vazio">Nenhum projeto{s.busca && ' encontrado'}.</li>}
          </ul>
          {projetoSelecionado && !editando && (
            <div className="projetos__acoes">
              <button type="button" className="comando" onClick={() => setEditando(projetoSelecionado)}>
                Editar
              </button>
              <button
                type="button"
                className="comando"
                onClick={async () => baixarArquivoDeProjeto(await s.exportarProjeto(projetoSelecionado.id))}
              >
                Exportar JSON
              </button>
              <button
                type="button"
                className="comando comando--perigo"
                onClick={() =>
                  confirmar(`Excluir o projeto "${projetoSelecionado.cliente} — ${projetoSelecionado.obra}" com todos os orçamentos e cenários?`) &&
                  void s.excluirProjeto(projetoSelecionado.id)
                }
              >
                Excluir
              </button>
            </div>
          )}
        </section>

        {/* ---------------------------------------------- orçamentos */}
        <section className="projetos__coluna" aria-label="Orçamentos">
          <h3>Orçamentos</h3>
          {!s.projetoId ? (
            <p className="projetos__vazio">Selecione um projeto.</p>
          ) : (
            <>
              <form
                className="projetos__inline"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!novoOrcamento.trim() || !s.projetoId) return
                  const o = await s.criarOrcamento(s.projetoId, novoOrcamento.trim())
                  setNovoOrcamento('')
                  await s.selecionarOrcamento(o.id)
                }}
              >
                <input
                  placeholder="Nome do novo orçamento"
                  aria-label="Nome do novo orçamento"
                  value={novoOrcamento}
                  onChange={(e) => setNovoOrcamento(e.target.value)}
                />
                <button type="submit" className="comando comando--destaque" disabled={!novoOrcamento.trim()}>
                  + Criar
                </button>
              </form>
              <ul className="projetos__lista">
                {s.orcamentos.map((o) => (
                  <li key={o.id} className="projetos__linha">
                    <button
                      type="button"
                      className={`projetos__item ${o.id === s.orcamentoId ? 'projetos__item--ativo' : ''}`}
                      onClick={() => {
                        setParaComparar([])
                        void s.selecionarOrcamento(o.id)
                      }}
                    >
                      <strong>{o.nome}</strong>
                    </button>
                    <button
                      type="button"
                      className="comando"
                      title="Renomear orçamento"
                      onClick={() => {
                        const nome = window.prompt('Novo nome do orçamento', o.nome)
                        if (nome?.trim()) void s.renomearOrcamento(o.id, nome.trim())
                      }}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="comando comando--perigo"
                      title="Excluir orçamento"
                      onClick={() => confirmar(`Excluir o orçamento "${o.nome}" e todos os seus cenários?`) && void s.excluirOrcamento(o.id)}
                    >
                      🗑
                    </button>
                  </li>
                ))}
                {s.orcamentos.length === 0 && <li className="projetos__vazio">Nenhum orçamento neste projeto.</li>}
              </ul>
            </>
          )}
        </section>

        {/* ------------------------------------------------ cenários */}
        <section className="projetos__coluna projetos__coluna--larga" aria-label="Cenários">
          <h3>Cenários</h3>
          {!s.orcamentoId ? (
            <p className="projetos__vazio">Selecione um orçamento.</p>
          ) : (
            <>
              <table className="projetos__tabela">
                <thead>
                  <tr>
                    <th aria-label="Comparar" />
                    <th>Cenário</th>
                    <th>Guindaste</th>
                    <th>Utilização</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {s.cenarios.map((c) => (
                    <tr key={c.id} className={s.aberto?.cenario.id === c.id ? 'projetos__tabela-aberto' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Comparar ${c.nome}`}
                          checked={paraComparar.includes(c.id)}
                          onChange={(e) =>
                            setParaComparar(e.target.checked ? [...paraComparar, c.id] : paraComparar.filter((x) => x !== c.id))
                          }
                        />
                      </td>
                      <td>{c.nome}</td>
                      <td>{c.parametros.guindasteId}</td>
                      <td>{c.resultado.percentualUtilizacao === null ? '—' : `${c.resultado.percentualUtilizacao.toFixed(1)}%`}</td>
                      <td>
                        <span className={`selo-status selo-status--${c.resultado.status}`}>{ROTULO_STATUS_CURTO[c.resultado.status]}</span>
                      </td>
                      <td className="projetos__tabela-acoes">
                        <button
                          type="button"
                          className="comando comando--destaque"
                          onClick={async () => {
                            await s.abrirCenario(c.id)
                            abrirDialogo(null)
                          }}
                        >
                          Abrir
                        </button>
                        <button
                          type="button"
                          className="comando"
                          title="Duplicar cenário"
                          onClick={() => {
                            const nome = window.prompt('Nome do novo cenário', `${c.nome} (cópia)`)
                            if (nome?.trim()) void s.duplicarCenario(c.id, nome.trim())
                          }}
                        >
                          Duplicar
                        </button>
                        <button
                          type="button"
                          className="comando"
                          title="Renomear cenário"
                          onClick={() => {
                            const nome = window.prompt('Novo nome do cenário', c.nome)
                            if (nome?.trim()) void s.renomearCenario(c.id, nome.trim())
                          }}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="comando comando--perigo"
                          title="Excluir cenário"
                          onClick={() => confirmar(`Excluir o cenário "${c.nome}"?`) && void s.excluirCenario(c.id)}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                  {s.cenarios.length === 0 && (
                    <tr>
                      <td colSpan={6} className="projetos__vazio">
                        Nenhum cenário. Use "Salvar como cenário" na barra de comandos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="projetos__acoes">
                <button
                  type="button"
                  className="comando comando--destaque"
                  disabled={paraComparar.length < 2}
                  title="Marque 2 ou mais cenários"
                  onClick={() => {
                    useInterfaceStore.getState().definirComparacao(paraComparar)
                    abrirDialogo('comparar')
                  }}
                >
                  Comparar selecionados ({paraComparar.length})
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
