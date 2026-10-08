import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFluxoStore } from '../../store/useFluxoStore'
import { useProjetosStore } from '../../store/useProjetosStore'
import { ROTULO_STATUS_CURTO } from '../projetos/rotulos'

const NOVO = '__novo__'

function CampoTexto({ rotulo, valor, aoMudar, obrigatorio = false }: {
  rotulo: string
  valor: string
  aoMudar: (v: string) => void
  obrigatorio?: boolean
}) {
  return (
    <label className="campo-simples">
      <span>
        {rotulo}
        {obrigatorio && <span className="obrigatorio" aria-hidden="true"> *</span>}
      </span>
      <input type="text" value={valor} required={obrigatorio} onChange={(e) => aoMudar(e.target.value)} />
    </label>
  )
}

/**
 * ① Projeto (Épico 18): para quem é o trabalho (cliente, obra, local,
 * responsável) e em qual orçamento os cenários vão ficar. Projeto novo ou
 * um existente — neste caso dá para reabrir um cenário já salvo.
 */
export function TelaProjeto() {
  const projetos = useProjetosStore((s) => s.projetos)
  const projetoId = useProjetosStore((s) => s.projetoId)
  const orcamentos = useProjetosStore((s) => s.orcamentos)
  const cenarios = useProjetosStore((s) => s.cenarios)
  const mensagem = useProjetosStore((s) => s.mensagem)
  const carregarProjetos = useProjetosStore((s) => s.carregarProjetos)
  const selecionarProjeto = useProjetosStore((s) => s.selecionarProjeto)
  const selecionarOrcamento = useProjetosStore((s) => s.selecionarOrcamento)
  const criarProjeto = useProjetosStore((s) => s.criarProjeto)
  const criarOrcamento = useProjetosStore((s) => s.criarOrcamento)
  const abrirCenario = useProjetosStore((s) => s.abrirCenario)
  const orcamentoAtivo = useFluxoStore((s) => s.orcamentoAtivo)
  const definirOrcamentoAtivo = useFluxoStore((s) => s.definirOrcamentoAtivo)
  const irPara = useFluxoStore((s) => s.irPara)

  const [modo, setModo] = useState<'novo' | 'existente'>(projetoId || orcamentoAtivo ? 'existente' : 'novo')
  const [novo, setNovo] = useState({ cliente: '', obra: '', local: '', responsavel: '' })
  const [nomeOrcamento, setNomeOrcamento] = useState('Orçamento 1')
  const [orcamentoId, setOrcamentoId] = useState<string>(orcamentoAtivo?.orcamento.id ?? NOVO)
  const [trabalhando, setTrabalhando] = useState(false)

  useEffect(() => {
    void carregarProjetos('')
    if (orcamentoAtivo && !projetoId) void selecionarProjeto(orcamentoAtivo.projeto.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    void selecionarOrcamento(orcamentoId === NOVO ? null : orcamentoId)
  }, [orcamentoId, selecionarOrcamento])

  const projeto = projetos.find((p) => p.id === projetoId) ?? null
  const novoValido = novo.cliente.trim() !== '' && novo.obra.trim() !== '' && nomeOrcamento.trim() !== ''
  const existenteValido = projeto !== null && (orcamentoId !== NOVO || nomeOrcamento.trim() !== '')

  async function continuar() {
    setTrabalhando(true)
    try {
      const p = modo === 'novo' ? await criarProjeto(novo) : projeto
      if (!p) return
      const o =
        modo === 'existente' && orcamentoId !== NOVO
          ? orcamentos.find((x) => x.id === orcamentoId) ?? null
          : await criarOrcamento(p.id, nomeOrcamento.trim())
      if (!o) return
      definirOrcamentoAtivo({ projeto: p, orcamento: o })
      irPara('carga')
    } finally {
      setTrabalhando(false)
    }
  }

  return (
    <form
      className="tela"
      onSubmit={(e) => {
        e.preventDefault()
        if (modo === 'novo' ? novoValido : existenteValido) void continuar()
      }}
    >
      <header className="tela__cabecalho">
        <span className="tela__numero">1</span>
        <div>
          <h2>Projeto</h2>
          <p>Para quem é o trabalho e em qual orçamento os cenários vão ficar.</p>
        </div>
      </header>

      <div className="segmentado tela__modo" role="group" aria-label="Tipo de projeto">
        <button type="button" className="segmentado__opcao" aria-pressed={modo === 'novo'} onClick={() => setModo('novo')}>
          Novo projeto
        </button>
        <button
          type="button"
          className="segmentado__opcao"
          aria-pressed={modo === 'existente'}
          disabled={projetos.length === 0}
          title={projetos.length === 0 ? 'Nenhum projeto salvo ainda' : undefined}
          onClick={() => setModo('existente')}
        >
          Projeto existente
        </button>
      </div>

      {mensagem?.tipo === 'erro' && (
        <div className="projetos__mensagem projetos__mensagem--erro" role="alert">
          {mensagem.texto}
        </div>
      )}

      {modo === 'novo' ? (
        <section className="tela__cartao" aria-label="Dados do projeto">
          <h3 className="tela__secao">Dados do projeto</h3>
          <div className="tela__grade2">
            <CampoTexto rotulo="Cliente" obrigatorio valor={novo.cliente} aoMudar={(cliente) => setNovo({ ...novo, cliente })} />
            <CampoTexto rotulo="Obra" obrigatorio valor={novo.obra} aoMudar={(obra) => setNovo({ ...novo, obra })} />
            <CampoTexto rotulo="Local" valor={novo.local} aoMudar={(local) => setNovo({ ...novo, local })} />
            <CampoTexto
              rotulo="Responsável técnico"
              valor={novo.responsavel}
              aoMudar={(responsavel) => setNovo({ ...novo, responsavel })}
            />
          </div>
          <h3 className="tela__secao">Orçamento</h3>
          <CampoTexto rotulo="Nome do orçamento" obrigatorio valor={nomeOrcamento} aoMudar={setNomeOrcamento} />
          <p className="tela__nota">* obrigatório. O orçamento reúne os cenários técnicos comparados no relatório.</p>
        </section>
      ) : (
        <section className="tela__cartao" aria-label="Projeto existente">
          <label className="campo-simples">
            Projeto
            <select
              value={projetoId ?? ''}
              onChange={(e) => {
                setOrcamentoId(NOVO)
                void selecionarProjeto(e.target.value || null)
              }}
            >
              <option value="">Escolha um projeto…</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.cliente} — {p.obra}
                </option>
              ))}
            </select>
          </label>
          {projeto && (
            <>
              <p className="tela__nota">
                {[projeto.local, projeto.responsavel && `responsável: ${projeto.responsavel}`].filter(Boolean).join(' · ')}
              </p>
              <h3 className="tela__secao">Orçamento</h3>
              <div className="tela__opcoes" role="radiogroup" aria-label="Orçamento">
                {orcamentos.map((o) => (
                  <label key={o.id} className="checkbox">
                    <input type="radio" name="orcamento" checked={orcamentoId === o.id} onChange={() => setOrcamentoId(o.id)} />
                    {o.nome}
                  </label>
                ))}
                <label className="checkbox">
                  <input type="radio" name="orcamento" checked={orcamentoId === NOVO} onChange={() => setOrcamentoId(NOVO)} />
                  Novo orçamento
                </label>
              </div>
              {orcamentoId === NOVO && <CampoTexto rotulo="Nome do orçamento" obrigatorio valor={nomeOrcamento} aoMudar={setNomeOrcamento} />}
              {orcamentoId !== NOVO && cenarios.length > 0 && (
                <>
                  <h3 className="tela__secao">Cenários deste orçamento</h3>
                  <ul className="tela__lista">
                    {cenarios.map((c) => (
                      <li key={c.id}>
                        <span>
                          <strong>{c.nome}</strong> · {c.parametros.guindasteId}
                        </span>
                        <span className={`selo-status selo-status--${c.resultado.status}`}>
                          {ROTULO_STATUS_CURTO[c.resultado.status]}
                        </span>
                        <button type="button" className="comando" onClick={() => void abrirCenario(c.id)}>
                          Abrir na simulação
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </section>
      )}

      <div className="tela__acoes">
        <button
          type="submit"
          className="comando comando--destaque"
          disabled={trabalhando || !(modo === 'novo' ? novoValido : existenteValido)}
        >
          {modo === 'novo' ? 'Criar projeto e continuar' : 'Continuar com este orçamento'} <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}
