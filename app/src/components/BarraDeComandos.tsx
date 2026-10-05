import { useInterfaceStore } from '../store/useInterfaceStore'
import { useSimulacaoStore } from '../store/useSimulacaoStore'

/** Comandos que dependem dos próximos épicos: aparecem desabilitados, com o motivo. */
const COMANDOS_FUTUROS: { rotulo: string; motivo: string }[] = [
  { rotulo: 'Abrir', motivo: 'Projetos e cenários salvos — Épico 15' },
  { rotulo: 'Salvar', motivo: 'Projetos e cenários salvos — Épico 15' },
  { rotulo: 'Salvar como cenário', motivo: 'Projetos e cenários salvos — Épico 15' },
  { rotulo: 'Comparar', motivo: 'Comparação de cenários — Épico 15' },
  { rotulo: 'Importar JSON', motivo: 'Importar/exportar projeto — Épico 15' },
  { rotulo: 'Exportar JSON', motivo: 'Importar/exportar projeto — Épico 15' },
  { rotulo: 'Exportar PDF', motivo: 'Relatório PDF — Épico 16' },
]

/**
 * Barra de comandos superior (Épico 12, RF23) — no estilo do
 * CommandManager do SolidWorks: identificação, comandos de arquivo,
 * ferramentas (busca por peso) e a unidade de exibição de massa (RF14).
 */
export function BarraDeComandos() {
  const cenario = useSimulacaoStore((s) => s.cenario)
  const selecionarGuindaste = useSimulacaoStore((s) => s.selecionarGuindaste)
  const unidadeMassa = useInterfaceStore((s) => s.unidadeMassa)
  const definirUnidadeMassa = useInterfaceStore((s) => s.definirUnidadeMassa)
  const abrirBusca = useInterfaceStore((s) => s.abrirBusca)

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
          title="Recomeça o cenário do guindaste atual com os valores iniciais"
          onClick={() => selecionarGuindaste(cenario.guindasteId)}
        >
          Novo
        </button>
        {COMANDOS_FUTUROS.map((c) => (
          <button key={c.rotulo} type="button" className="comando" disabled title={c.motivo}>
            {c.rotulo}
          </button>
        ))}
      </div>

      <div className="barra-comandos__grupo" role="toolbar" aria-label="Ferramentas">
        <button type="button" className="comando comando--destaque" onClick={() => abrirBusca(true)}>
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
