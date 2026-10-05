import './App.css'
import { BarraDeComandos } from './components/BarraDeComandos'
import { BarraDeStatus } from './components/BarraDeStatus'
import { DialogoBuscaReversa } from './components/DialogoBuscaReversa'
import { Simulador } from './components/Simulador'

/**
 * Shell da aplicação (Épico 12, RF23) — tela inteira sem scroll, no estilo
 * SolidWorks: barra de comandos no topo, área de trabalho (árvore de
 * parâmetros | viewport 3D | resultado) e barra de status embaixo. A busca
 * reversa por peso (RF05/RF15) abre num diálogo pela barra de comandos.
 */
function App() {
  return (
    <div className="app">
      <BarraDeComandos />
      <main className="app-main">
        <Simulador />
      </main>
      <BarraDeStatus />
      <DialogoBuscaReversa />
    </div>
  )
}

export default App
