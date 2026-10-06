import { useRef } from 'react'
import { useInterfaceStore } from '../store/useInterfaceStore'
import { useProjetosStore } from '../store/useProjetosStore'
import { useSimulacaoStore } from '../store/useSimulacaoStore'
import { baixarArquivoDeProjeto } from './projetos/arquivos'
import { useAlteracoesNaoSalvas } from './projetos/CenarioAberto'

/**
 * Barra de comandos superior (Épico 12, RF23) — no estilo do CommandManager
 * do SolidWorks. Épico 15: os comandos de arquivo (projetos, orçamentos e
 * cenários salvos no navegador, importar/exportar JSON) passam a funcionar;
 * só o relatório PDF segue para o Épico 16.
 */
export function BarraDeComandos() {
  const cenario = useSimulacaoStore((s) => s.cenario)
  const selecionarGuindaste = useSimulacaoStore((s) => s.selecionarGuindaste)
  const unidadeMassa = useInterfaceStore((s) => s.unidadeMassa)
  const definirUnidadeMassa = useInterfaceStore((s) => s.definirUnidadeMassa)
  const abrirDialogo = useInterfaceStore((s) => s.abrirDialogo)
  const aberto = useProjetosStore((s) => s.aberto)
  const salvar = useProjetosStore((s) => s.salvar)
  const desvincular = useProjetosStore((s) => s.desvincular)
  const exportarProjeto = useProjetosStore((s) => s.exportarProjeto)
  const importarTexto = useProjetosStore((s) => s.importarTexto)
  const projetoSelecionadoId = useProjetosStore((s) => s.projetoId)
  const alterado = useAlteracoesNaoSalvas()
  const entradaArquivo = useRef<HTMLInputElement>(null)

  const projetoParaExportar = aberto?.projeto.id ?? projetoSelecionadoId

  return (
    <header className="barra-comandos">
      <div className="barra-comandos__marca">
        <h1>Guindastes Ribas</h1>
        <span>Simulador de Tabela de Carga</span>
      </div>

      <div className="barra-comandos__grupo" role="toolbar" aria-label="Arquivo">
        <button
          type="button"
          className="comando"
          title="Recomeça o cenário do guindaste atual com os valores iniciais (sem vínculo com cenário salvo)"
          onClick={() => {
            if (alterado && !window.confirm('Há alterações não salvas no cenário aberto. Descartar?')) return
            desvincular()
            selecionarGuindaste(cenario.guindasteId)
          }}
        >
          Novo
        </button>
        <button type="button" className="comando" onClick={() => abrirDialogo('projetos')} title="Projetos, orçamentos e cenários salvos">
          Abrir
        </button>
        <button
          type="button"
          className="comando"
          title={aberto ? `Sobrescreve o cenário "${aberto.cenario.nome}"` : 'Salva a simulação como um cenário novo'}
          onClick={() => (aberto ? void salvar() : abrirDialogo('salvar'))}
        >
          Salvar{alterado ? ' ●' : ''}
        </button>
        <button type="button" className="comando" onClick={() => abrirDialogo('salvar')}>
          Salvar como cenário
        </button>
        <button
          type="button"
          className="comando"
          title="Escolha os cenários em Abrir → marque 2 ou mais → Comparar selecionados"
          onClick={() => abrirDialogo('projetos')}
        >
          Comparar
        </button>
        <button type="button" className="comando" onClick={() => entradaArquivo.current?.click()}>
          Importar JSON
        </button>
        <input
          ref={entradaArquivo}
          type="file"
          accept="application/json,.json"
          hidden
          data-testid="importar-json"
          onChange={async (e) => {
            const arquivo = e.target.files?.[0]
            e.target.value = ''
            if (!arquivo) return
            await importarTexto(await arquivo.text())
            abrirDialogo('projetos')
          }}
        />
        <button
          type="button"
          className="comando"
          disabled={!projetoParaExportar}
          title={projetoParaExportar ? 'Exporta o projeto (todos os orçamentos e cenários) em JSON' : 'Abra ou selecione um projeto'}
          onClick={async () => projetoParaExportar && baixarArquivoDeProjeto(await exportarProjeto(projetoParaExportar))}
        >
          Exportar JSON
        </button>
        <button type="button" className="comando" disabled title="Relatório PDF — Épico 16">
          Exportar PDF
        </button>
      </div>

      <div className="barra-comandos__grupo" role="toolbar" aria-label="Ferramentas">
        <button type="button" className="comando comando--destaque" onClick={() => abrirDialogo('busca')}>
          Buscar por peso
        </button>
      </div>

      <div className="barra-comandos__grupo barra-comandos__grupo--direita" role="group" aria-label="Unidade de massa (RF14)">
        <span className="barra-comandos__rotulo">Massa</span>
        {(['kg', 't'] as const).map((u) => (
          <button
            key={u}
            type="button"
            className={`segmento ${unidadeMassa === u ? 'segmento--ativo' : ''}`}
            aria-pressed={unidadeMassa === u}
            onClick={() => definirUnidadeMassa(u)}
          >
            {u}
          </button>
        ))}
        <a
          className="barra-comandos__link"
          href="https://app.notion.com/p/3da034f53a1280df8666fc97c0590e38"
          target="_blank"
          rel="noreferrer"
        >
          Documentação ↗
        </a>
      </div>
    </header>
  )
}
