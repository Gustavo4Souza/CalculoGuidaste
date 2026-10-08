import { useInterfaceStore } from '../store/useInterfaceStore'
import { useSimulacaoStore } from '../store/useSimulacaoStore'
import { CenaGuindaste3D } from './CenaGuindaste3D'
import { LimiteDeErro } from './LimiteDeErro'
import { BarraDeVista } from './cena/BarraDeVista'
import { LegendaMapa } from './cena/LegendaMapa'
import { useMapaAreaOperacao } from './cena/useMapaAreaOperacao'
import { PainelGerenciador } from './gerenciador/PainelGerenciador'
import { PainelResultado } from './PainelResultado'
import { CenarioAberto } from './projetos/CenarioAberto'

// Mesmas cores de --ok/--atencao/--nok/--semdado (index.css) — repetidas
// aqui em hex porque a cena 3D (WebGL) não lê variáveis CSS.
const CORES_STATUS: Record<string, string> = {
  ok: '#1e8e3e',
  atencao: '#c77700',
  nok: '#c62828',
  sem_dado: '#6b7680',
}

/**
 * Área de trabalho (Épico 17, RF23) no padrão do SolidWorks: gerenciador à
 * esquerda (FeatureManager / PropertyManager), viewport 3D no centro com a
 * barra de vista e o cubo de orientação, e o painel de tarefas à direita
 * com o resultado. Tudo lê e escreve no estado único da store (Épico 11).
 */
export function Simulador() {
  const avaliacao = useSimulacaoStore((s) => s.avaliacao)
  const cenario = useSimulacaoStore((s) => s.cenario)
  const vista = useInterfaceStore((s) => s.vista)
  const mostrarMapa = useInterfaceStore((s) => s.mostrarMapa)
  const mapa = useMapaAreaOperacao(cenario)

  return (
    <div className="area-trabalho">
      <PainelGerenciador />

      <section className="viewport" aria-label="Visualização 3D do guindaste">
        <BarraDeVista />
        {/* Um erro na cena 3D não derruba o gerenciador nem o resultado. */}
        <LimiteDeErro onde="a cena 3D" compacto>
          <CenaGuindaste3D corDestaque={CORES_STATUS[avaliacao.status]} vista={vista} mapa={mostrarMapa ? mapa : null} />
        </LimiteDeErro>
      </section>

      <aside className="painel-tarefas">
        <CenarioAberto />
        <PainelResultado />
        {/* Legenda do mapa fora da viewport: sobre a cena ela cobria peças arrastáveis (gancho, anel de giro). */}
        {mostrarMapa && <LegendaMapa mapa={mapa} />}
      </aside>
    </div>
  )
}
