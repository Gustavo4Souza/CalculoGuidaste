import type { ReactNode } from 'react'
import './App.css'
import { BarraDeStatus } from './components/BarraDeStatus'
import { DialogoBuscaReversa } from './components/DialogoBuscaReversa'
import { BarraDeEtapas } from './components/fluxo/BarraDeEtapas'
import { TelaCarga } from './components/fluxo/TelaCarga'
import { TelaGuindaste } from './components/fluxo/TelaGuindaste'
import { TelaInicio } from './components/fluxo/TelaInicio'
import { TelaProjeto } from './components/fluxo/TelaProjeto'
import { TelaRelatorio } from './components/fluxo/TelaRelatorio'
import { TelaVerificacao } from './components/fluxo/TelaVerificacao'
import { useSincronizarUrl } from './components/fluxo/useSincronizarUrl'
import { useSituacaoDasEtapas } from './components/fluxo/useSituacaoDasEtapas'
import { DialogoComparar } from './components/projetos/DialogoComparar'
import { DialogoExportarPdf } from './components/projetos/DialogoExportarPdf'
import { DialogoProjetos } from './components/projetos/DialogoProjetos'
import { DialogoSalvarCenario } from './components/projetos/DialogoSalvarCenario'
import { BarraDeTitulo } from './components/shell/BarraDeTitulo'
import { CommandManager } from './components/shell/CommandManager'
import { Simulador } from './components/Simulador'
import type { Etapa } from './store/etapas'
import { useFluxoStore } from './store/useFluxoStore'

const TELAS: Record<Exclude<Etapa, 'simulacao'>, () => ReactNode> = {
  inicio: () => <TelaInicio />,
  projeto: () => <TelaProjeto />,
  carga: () => <TelaCarga />,
  guindaste: () => <TelaGuindaste />,
  verificacao: () => <TelaVerificacao />,
  relatorio: () => <TelaRelatorio />,
}

/**
 * Shell da aplicação (Épicos 17 e 18): barra de título, barra de etapas do
 * fluxo (Início → Projeto → Carga → Guindaste → Simulação → Verificação →
 * Relatório) e a tela da etapa atual.
 *
 * A área de simulação (CommandManager + gerenciador | cena 3D | resultado)
 * fica montada desde que a etapa ④ é liberada, só escondida nas outras
 * etapas: a cena precisa existir para o relatório capturar as vistas, e a
 * câmera fica onde o engenheiro a deixou — como um documento aberto.
 */
function App() {
  useSincronizarUrl()
  const etapa = useFluxoStore((s) => s.etapa)
  const situacao = useSituacaoDasEtapas()
  const naSimulacao = etapa === 'simulacao'

  return (
    <div className="app">
      <BarraDeTitulo />
      {etapa !== 'inicio' && <BarraDeEtapas />}
      <main className="app-main">
        {situacao.simulacao.liberada && (
          <div
            className={`area-simulacao ${naSimulacao ? '' : 'area-simulacao--oculta'}`}
            aria-hidden={naSimulacao ? undefined : true}
            inert={!naSimulacao}
          >
            <CommandManager />
            <div className="area-simulacao__trabalho">
              <Simulador />
            </div>
          </div>
        )}
        {!naSimulacao && <div className="area-tela">{TELAS[etapa]()}</div>}
      </main>
      {naSimulacao && <BarraDeStatus />}
      <DialogoBuscaReversa />
      <DialogoProjetos />
      <DialogoSalvarCenario />
      <DialogoComparar />
      <DialogoExportarPdf />
    </div>
  )
}

export default App
