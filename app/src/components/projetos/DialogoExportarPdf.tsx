import { useState } from 'react'
import { emitirRelatorioDoCenarioAtual, emitirRelatorioDoOrcamento } from '../../relatorio/emitirRelatorio'
import { useInterfaceStore } from '../../store/useInterfaceStore'
import { useProjetosStore } from '../../store/useProjetosStore'
import { Dialogo } from '../Dialogo'

/** "Exportar PDF" (Épico 16, RF26): relatório do cenário atual ou do orçamento inteiro. */
export function DialogoExportarPdf() {
  return (
    <Dialogo nome="pdf" titulo="Exportar relatório PDF" largura={520}>
      <FormularioPdf />
    </Dialogo>
  )
}

function FormularioPdf() {
  const aberto = useProjetosStore((s) => s.aberto)
  const orcamentoSelecionadoId = useProjetosStore((s) => s.orcamentoId)
  const orcamentos = useProjetosStore((s) => s.orcamentos)
  const abrirDialogo = useInterfaceStore((s) => s.abrirDialogo)
  const orcamentoId = aberto?.orcamento.id ?? orcamentoSelecionadoId
  const nomeOrcamento = aberto?.orcamento.nome ?? orcamentos.find((o) => o.id === orcamentoId)?.nome
  const [tipo, setTipo] = useState<'cenario' | 'orcamento'>('cenario')
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  return (
    <form
      className="salvar-cenario"
      onSubmit={async (e) => {
        e.preventDefault()
        setGerando(true)
        setErro(null)
        try {
          if (tipo === 'orcamento' && orcamentoId) await emitirRelatorioDoOrcamento(orcamentoId)
          else await emitirRelatorioDoCenarioAtual()
          abrirDialogo(null)
        } catch (falha) {
          setErro(falha instanceof Error ? falha.message : 'Não foi possível gerar o relatório.')
        } finally {
          setGerando(false)
        }
      }}
    >
      <label className="checkbox">
        <input type="radio" name="tipo-relatorio" checked={tipo === 'cenario'} onChange={() => setTipo('cenario')} />
        Cenário atual{aberto ? ` — "${aberto.cenario.nome}"` : ' (não salvo)'}
      </label>
      <label className="checkbox">
        <input
          type="radio"
          name="tipo-relatorio"
          checked={tipo === 'orcamento'}
          disabled={!orcamentoId}
          onChange={() => setTipo('orcamento')}
        />
        Orçamento completo{nomeOrcamento ? ` — "${nomeOrcamento}" (comparativo + um capítulo por cenário)` : ' (abra ou selecione um orçamento)'}
      </label>
      <p className="rf-note">
        O relatório traz os dados do projeto, todos os parâmetros, o somatório detalhado, a capacidade da tabela (exata ou
        interpolada, com os pontos usados), as verificações, as vistas lateral e superior com a área de operação, as
        versões das tabelas e do critério de giro e o campo de assinatura do engenheiro responsável. Os cenários são
        recalculados com as tabelas atuais.
      </p>
      {erro && (
        <div className="projetos__mensagem projetos__mensagem--erro" role="alert">
          {erro}
        </div>
      )}
      <div className="projetos__acoes">
        <button type="submit" className="comando comando--destaque" disabled={gerando}>
          {gerando ? 'Gerando…' : 'Gerar PDF'}
        </button>
        <button type="button" className="comando" onClick={() => abrirDialogo(null)}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
