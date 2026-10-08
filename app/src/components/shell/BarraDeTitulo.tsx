import { ChevronDown, Construction, FileDown, FilePlus, FolderOpen, Save, SaveAll, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CATALOGO } from '../../data/catalogo'
import { useInterfaceStore } from '../../store/useInterfaceStore'
import { useProjetosStore } from '../../store/useProjetosStore'
import { useSimulacaoStore } from '../../store/useSimulacaoStore'
import { useComandos, type Comando } from './useComandos'

/** Botão só com ícone da barra de acesso rápido; o nome acessível é o rótulo do comando. */
function BotaoRapido({ comando, Icone, marcado = false }: { comando: Comando; Icone: LucideIcon; marcado?: boolean }) {
  return (
    <button
      type="button"
      className="acesso-rapido__botao"
      aria-label={comando.rotulo}
      title={comando.desabilitadoPorque ?? comando.dica}
      disabled={!!comando.desabilitadoPorque}
      onClick={comando.executar}
    >
      <Icone size={17} aria-hidden="true" />
      {marcado && <span className="acesso-rapido__marca" aria-hidden="true" />}
    </button>
  )
}

/** Menu "Arquivo" (dropdown), como o menu do SolidWorks. Fecha com Esc ou clique fora. */
function MenuArquivo({ comandos }: { comandos: Comando[] }) {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('pointerdown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  return (
    <div className="menu" ref={raiz}>
      <button
        type="button"
        className="menu__botao"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto(!aberto)}
      >
        Arquivo <ChevronDown size={14} aria-hidden="true" />
      </button>
      {aberto && (
        <ul className="menu__lista" role="menu" aria-label="Arquivo">
          {comandos.map((c) => (
            <li key={c.rotulo} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={!!c.desabilitadoPorque}
                title={c.desabilitadoPorque ?? c.dica}
                onClick={() => {
                  setAberto(false)
                  c.executar()
                }}
              >
                {c.rotulo}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Barra de título (Épico 17, RF23) no padrão do SolidWorks: marca, menu
 * Arquivo, barra de acesso rápido, o documento aberto no centro (projeto ›
 * orçamento › cenário, com ● quando há alterações não salvas) e a unidade
 * de exibição da massa (RF14) à direita.
 */
export function BarraDeTitulo() {
  const entradaArquivo = useRef<HTMLInputElement>(null)
  const comandos = useComandos(() => entradaArquivo.current?.click())
  const importarTexto = useProjetosStore((s) => s.importarTexto)
  const aberto = useProjetosStore((s) => s.aberto)
  const guindasteId = useSimulacaoStore((s) => s.cenario.guindasteId)
  const unidadeMassa = useInterfaceStore((s) => s.unidadeMassa)
  const definirUnidadeMassa = useInterfaceStore((s) => s.definirUnidadeMassa)
  const abrirDialogo = useInterfaceStore((s) => s.abrirDialogo)

  return (
    <header className="barra-titulo">
      <div className="barra-titulo__marca">
        <span className="barra-titulo__logo" aria-hidden="true">
          <Construction size={18} />
        </span>
        <div>
          <h1>Guindastes Ribas</h1>
          <span>Simulador de Tabela de Carga</span>
        </div>
      </div>

      <MenuArquivo
        comandos={[
          comandos.novo,
          comandos.abrir,
          comandos.salvar,
          comandos.salvarComo,
          comandos.importar,
          comandos.exportarJson,
          comandos.exportarPdf,
        ]}
      />

      <div className="acesso-rapido" role="toolbar" aria-label="Acesso rápido">
        <BotaoRapido comando={comandos.novo} Icone={FilePlus} />
        <BotaoRapido comando={comandos.abrir} Icone={FolderOpen} />
        <BotaoRapido comando={comandos.salvar} Icone={Save} marcado={comandos.alterado} />
        <BotaoRapido comando={comandos.salvarComo} Icone={SaveAll} />
        <BotaoRapido comando={comandos.exportarPdf} Icone={FileDown} />
      </div>
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

      <div className="barra-titulo__documento" title="Documento aberto">
        {aberto ? (
          <>
            <span className="barra-titulo__caminho">
              {aberto.projeto.cliente} › {aberto.orcamento.nome} ›{' '}
            </span>
            <strong>{aberto.cenario.nome}</strong>
          </>
        ) : (
          <>
            <strong>Cenário não salvo</strong>
            <span className="barra-titulo__caminho"> — {CATALOGO[guindasteId].guindaste.nome}</span>
          </>
        )}
        {comandos.alterado && <span className="barra-titulo__alterado"> ● alterações não salvas</span>}
      </div>

      <div className="barra-titulo__direita" role="group" aria-label="Unidade de massa (RF14)">
        <span className="barra-titulo__rotulo">Massa</span>
        <div className="segmentado">
          {(['kg', 't'] as const).map((u) => (
            <button
              key={u}
              type="button"
              className="segmentado__opcao"
              aria-pressed={unidadeMassa === u}
              onClick={() => definirUnidadeMassa(u)}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
