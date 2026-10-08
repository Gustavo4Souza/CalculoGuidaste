import { Box, FilePlus, FileUp, FolderOpen, Search, type LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useFluxoStore } from '../../store/useFluxoStore'
import { useInterfaceStore } from '../../store/useInterfaceStore'
import { useProjetosStore } from '../../store/useProjetosStore'

function Acao({ Icone, titulo, descricao, aoClicar, destaque = false }: {
  Icone: LucideIcon
  titulo: string
  descricao: string
  aoClicar: () => void
  destaque?: boolean
}) {
  return (
    <button type="button" className={`inicio__acao ${destaque ? 'inicio__acao--destaque' : ''}`} onClick={aoClicar}>
      <Icone size={26} aria-hidden="true" />
      <span>
        <strong>{titulo}</strong>
        <small>{descricao}</small>
      </span>
    </button>
  )
}

const data = (iso: string) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '')

/**
 * Início (Épico 18) — a tela de boas-vindas, como a do SolidWorks: começar
 * um projeto novo (o caminho principal), continuar um recente, abrir ou
 * importar, a consulta rápida por peso e a simulação livre (sem projeto).
 */
export function TelaInicio() {
  const projetos = useProjetosStore((s) => s.projetos)
  const carregarProjetos = useProjetosStore((s) => s.carregarProjetos)
  const selecionarProjeto = useProjetosStore((s) => s.selecionarProjeto)
  const importarTexto = useProjetosStore((s) => s.importarTexto)
  const abrirDialogo = useInterfaceStore((s) => s.abrirDialogo)
  const reiniciar = useFluxoStore((s) => s.reiniciar)
  const irPara = useFluxoStore((s) => s.irPara)
  const iniciarSimulacaoLivre = useFluxoStore((s) => s.iniciarSimulacaoLivre)
  const entradaArquivo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void carregarProjetos('')
  }, [carregarProjetos])

  return (
    <div className="tela tela--inicio">
      <header className="inicio__cabecalho">
        <h2>Bem-vindo ao simulador de içamento</h2>
        <p>
          Comece pelo projeto: o caminho é Projeto → Carga → Guindaste → Simulação → Verificação → Relatório. Dá para voltar
          a qualquer etapa já liberada.
        </p>
      </header>

      <div className="inicio__colunas">
        <section aria-label="Começar">
          <h3 className="tela__secao">Começar</h3>
          <div className="inicio__acoes">
            <Acao
              Icone={FilePlus}
              titulo="Novo projeto"
              descricao="Cliente, obra e orçamento; depois a carga e o guindaste."
              destaque
              aoClicar={() => {
                reiniciar()
                void selecionarProjeto(null)
                irPara('projeto')
              }}
            />
            <Acao Icone={FolderOpen} titulo="Abrir projeto" descricao="Projetos, orçamentos e cenários salvos." aoClicar={() => abrirDialogo('projetos')} />
            <Acao
              Icone={FileUp}
              titulo="Importar projeto (JSON)"
              descricao="Arquivo exportado de outra máquina; entra como cópia."
              aoClicar={() => entradaArquivo.current?.click()}
            />
            <Acao
              Icone={Search}
              titulo="Consulta rápida por peso"
              descricao="Quais guindastes da frota içam um peso, sem abrir projeto."
              aoClicar={() => abrirDialogo('busca')}
            />
            <Acao
              Icone={Box}
              titulo="Simulação livre"
              descricao="Direto na área de trabalho; o projeto é criado ao salvar."
              aoClicar={iniciarSimulacaoLivre}
            />
          </div>
          <input
            ref={entradaArquivo}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const arquivo = e.target.files?.[0]
              e.target.value = ''
              if (!arquivo) return
              await importarTexto(await arquivo.text())
              abrirDialogo('projetos')
            }}
          />
        </section>

        <section aria-label="Projetos recentes">
          <h3 className="tela__secao">Projetos recentes</h3>
          {projetos.length === 0 ? (
            <p className="tela__vazio">Nenhum projeto salvo neste navegador ainda.</p>
          ) : (
            <ul className="inicio__recentes">
              {projetos.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="inicio__recente"
                    onClick={async () => {
                      reiniciar()
                      await selecionarProjeto(p.id)
                      irPara('projeto')
                    }}
                  >
                    <strong>
                      {p.cliente} — {p.obra}
                    </strong>
                    <small>
                      {[p.local, p.responsavel].filter(Boolean).join(' · ')}
                      {p.atualizadoEm && ` · atualizado em ${data(p.atualizadoEm)}`}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
