import { Box, Map as IconeMapa, PanelTop, Ruler, Square, SquareStack, type LucideIcon } from 'lucide-react'
import { useInterfaceStore, type VistaPadrao } from '../../store/useInterfaceStore'

const VISTAS: { nome: VistaPadrao; rotulo: string; Icone: LucideIcon }[] = [
  { nome: 'frontal', rotulo: 'Frontal', Icone: Square },
  { nome: 'lateral', rotulo: 'Lateral', Icone: SquareStack },
  { nome: 'superior', rotulo: 'Superior', Icone: PanelTop },
  { nome: 'isometrica', rotulo: 'Isométrica', Icone: Box },
]

/**
 * Barra de vista sobre a cena (Épico 17) — a "heads-up view toolbar" do
 * SolidWorks: vistas padrão, mapa da área de operação (RF22) e cotas. Fica
 * no topo, no centro, onde não cobre nenhuma peça arrastável.
 */
export function BarraDeVista() {
  const vista = useInterfaceStore((s) => s.vista)
  const pedirVista = useInterfaceStore((s) => s.pedirVista)
  const mostrarMapa = useInterfaceStore((s) => s.mostrarMapa)
  const alternarMapa = useInterfaceStore((s) => s.alternarMapa)
  const mostrarCotas = useInterfaceStore((s) => s.mostrarCotas)
  const alternarCotas = useInterfaceStore((s) => s.alternarCotas)

  return (
    <div className="barra-vista">
      <div className="barra-vista__grupo" role="toolbar" aria-label="Vistas padrão">
        {VISTAS.map(({ nome, rotulo, Icone }) => (
          <button
            key={nome}
            type="button"
            className="barra-vista__botao"
            aria-pressed={vista.nome === nome && vista.pedido > 0}
            title={`Vista ${rotulo.toLowerCase()}`}
            onClick={() => pedirVista(nome)}
          >
            <Icone size={15} aria-hidden="true" />
            {rotulo}
          </button>
        ))}
      </div>
      <div className="barra-vista__grupo" role="toolbar" aria-label="Exibição">
        <button
          type="button"
          className="barra-vista__botao"
          aria-pressed={mostrarMapa}
          title="Mapa da área de operação no chão (RF22): OK, atenção, NOK e sem dado em cada posição"
          onClick={alternarMapa}
        >
          <IconeMapa size={15} aria-hidden="true" />
          Área de operação
        </button>
        <button
          type="button"
          className="barra-vista__botao"
          aria-pressed={mostrarCotas}
          title="Cotas na cena: raio, altura da ponta, ângulo, comprimento e giro"
          onClick={alternarCotas}
        >
          <Ruler size={15} aria-hidden="true" />
          Cotas
        </button>
      </div>
    </div>
  )
}
