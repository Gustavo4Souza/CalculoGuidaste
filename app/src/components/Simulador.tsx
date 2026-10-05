import { useInterfaceStore, type VistaPadrao } from '../store/useInterfaceStore'
import { useSimulacaoStore } from '../store/useSimulacaoStore'
import { ArvoreParametros } from './ArvoreParametros'
import { CenaGuindaste3D } from './CenaGuindaste3D'
import { PainelResultado } from './PainelResultado'

// Mesmas cores de --ok/--atencao/--nok/--semdado (index.css) — repetidas
// aqui em hex porque a cena 3D (WebGL) não lê variáveis CSS.
const CORES_STATUS: Record<string, string> = {
  ok: '#1e8e3e',
  atencao: '#c77700',
  nok: '#c62828',
  sem_dado: '#6b7680',
}

const VISTAS: { nome: VistaPadrao; rotulo: string }[] = [
  { nome: 'frontal', rotulo: 'Frontal' },
  { nome: 'lateral', rotulo: 'Lateral' },
  { nome: 'superior', rotulo: 'Superior' },
  { nome: 'isometrica', rotulo: 'Isométrica' },
]

/**
 * Área de trabalho (Épico 12, RF23) no estilo SolidWorks: árvore de
 * parâmetros à esquerda, viewport 3D no centro (barra de vistas padrão,
 * cubo de orientação e cotas) e o painel de resultado à direita. Tudo lê e
 * escreve no estado único da store (Épico 11).
 */
export function Simulador() {
  const avaliacao = useSimulacaoStore((s) => s.avaliacao)
  const vista = useInterfaceStore((s) => s.vista)
  const pedirVista = useInterfaceStore((s) => s.pedirVista)

  return (
    <div className="area-trabalho">
      <ArvoreParametros />

      <section className="viewport" aria-label="Visualização 3D do guindaste">
        <div className="viewport__vistas" role="toolbar" aria-label="Vistas padrão">
          {VISTAS.map((v) => (
            <button
              key={v.nome}
              type="button"
              className={`segmento ${vista.nome === v.nome && vista.pedido > 0 ? 'segmento--ativo' : ''}`}
              onClick={() => pedirVista(v.nome)}
            >
              {v.rotulo}
            </button>
          ))}
        </div>
        <CenaGuindaste3D corDestaque={CORES_STATUS[avaliacao.status]} vista={vista} />
      </section>

      <aside className="painel-direito">
        <PainelResultado />
      </aside>
    </div>
  )
}
