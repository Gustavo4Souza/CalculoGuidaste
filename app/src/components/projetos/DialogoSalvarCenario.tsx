import { useEffect, useState } from 'react'
import { useInterfaceStore } from '../../store/useInterfaceStore'
import { useProjetosStore } from '../../store/useProjetosStore'
import { useSimulacaoStore } from '../../store/useSimulacaoStore'
import { Dialogo } from '../Dialogo'

const NOVO = '__novo__'

/**
 * "Salvar como cenário" (Épico 15, RF24): grava a simulação atual como um
 * cenário NOVO, escolhendo (ou criando na hora) o projeto e o orçamento.
 */
export function DialogoSalvarCenario() {
  return (
    <Dialogo nome="salvar" titulo="Salvar como cenário" largura={520}>
      <FormularioSalvar />
    </Dialogo>
  )
}

function FormularioSalvar() {
  const s = useProjetosStore()
  const abrirDialogo = useInterfaceStore((st) => st.abrirDialogo)
  const cenario = useSimulacaoStore((st) => st.cenario)
  const [projetoId, setProjetoId] = useState<string>(s.aberto?.projeto.id ?? s.projetoId ?? NOVO)
  const [orcamentoId, setOrcamentoId] = useState<string>(s.aberto?.orcamento.id ?? s.orcamentoId ?? NOVO)
  const [novoProjeto, setNovoProjeto] = useState({ cliente: '', obra: '', local: '', responsavel: '' })
  const [novoOrcamento, setNovoOrcamento] = useState('Orçamento 1')
  const [nome, setNome] = useState(
    s.aberto ? `${s.aberto.cenario.nome} (cópia)` : `${cenario.guindasteId} — ${cenario.lanca.comprimentoM.toFixed(2)} m`,
  )
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    void s.carregarProjetos('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (projetoId !== NOVO) void s.selecionarProjeto(projetoId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projetoId])

  const valido =
    nome.trim() !== '' &&
    (projetoId !== NOVO || (novoProjeto.cliente.trim() !== '' && novoProjeto.obra.trim() !== '')) &&
    (orcamentoId !== NOVO || novoOrcamento.trim() !== '')

  return (
    <form
      className="salvar-cenario"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!valido || salvando) return
        setSalvando(true)
        // Em qualquer falha o diálogo fica aberto, com a mensagem de erro — nunca "fecha como se tivesse salvo".
        let pid: string | undefined = projetoId
        if (pid === NOVO) pid = (await s.criarProjeto(novoProjeto))?.id
        let oid: string | undefined = orcamentoId
        if (pid && (oid === NOVO || projetoId === NOVO)) oid = (await s.criarOrcamento(pid, novoOrcamento.trim()))?.id
        const salvou = pid !== undefined && oid !== undefined && (await s.salvarComoNovo(oid, nome.trim()))
        setSalvando(false)
        if (salvou) abrirDialogo(null)
      }}
    >
      <label className="campo-simples">
        Projeto
        <select value={projetoId} onChange={(e) => {
            setProjetoId(e.target.value)
            setOrcamentoId(NOVO)
          }}>
          <option value={NOVO}>+ Novo projeto…</option>
          {s.projetos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.cliente} — {p.obra}
            </option>
          ))}
        </select>
      </label>
      {projetoId === NOVO && (
        <div className="salvar-cenario__grupo">
          {(['cliente', 'obra', 'local', 'responsavel'] as const).map((c) => (
            <label key={c} className="campo-simples">
              {{ cliente: 'Cliente', obra: 'Obra', local: 'Local', responsavel: 'Responsável técnico' }[c]}
              <input value={novoProjeto[c]} onChange={(e) => setNovoProjeto({ ...novoProjeto, [c]: e.target.value })} />
            </label>
          ))}
        </div>
      )}

      <label className="campo-simples">
        Orçamento
        <select value={projetoId === NOVO ? NOVO : orcamentoId} onChange={(e) => setOrcamentoId(e.target.value)} disabled={projetoId === NOVO}>
          <option value={NOVO}>+ Novo orçamento…</option>
          {projetoId !== NOVO &&
            s.orcamentos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
        </select>
      </label>
      {(orcamentoId === NOVO || projetoId === NOVO) && (
        <label className="campo-simples">
          Nome do novo orçamento
          <input value={novoOrcamento} onChange={(e) => setNovoOrcamento(e.target.value)} />
        </label>
      )}

      <label className="campo-simples">
        Nome do cenário
        <input value={nome} onChange={(e) => setNome(e.target.value)} />
      </label>

      {s.mensagem?.tipo === 'erro' && (
        <div className="projetos__mensagem projetos__mensagem--erro" role="alert">
          {s.mensagem.texto}
        </div>
      )}
      <p className="rf-note">
        O cenário guarda todos os parâmetros, o resultado de agora e as versões das tabelas e do critério de giro.
      </p>
      <div className="projetos__acoes">
        <button type="submit" className="comando comando--destaque" disabled={!valido || salvando}>
          Salvar cenário
        </button>
        <button type="button" className="comando" onClick={() => abrirDialogo(null)}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
