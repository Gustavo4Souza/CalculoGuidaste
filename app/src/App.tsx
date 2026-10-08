import './App.css'
import { BarraDeStatus } from './components/BarraDeStatus'
import { DialogoBuscaReversa } from './components/DialogoBuscaReversa'
import { DialogoComparar } from './components/projetos/DialogoComparar'
import { DialogoExportarPdf } from './components/projetos/DialogoExportarPdf'
import { DialogoProjetos } from './components/projetos/DialogoProjetos'
import { DialogoSalvarCenario } from './components/projetos/DialogoSalvarCenario'
import { BarraDeTitulo } from './components/shell/BarraDeTitulo'
import { CommandManager } from './components/shell/CommandManager'
import { Simulador } from './components/Simulador'

/**
 * Shell da aplicação (Épico 17, RF23) — tela inteira sem rolagem, no padrão
 * do SolidWorks: barra de título (menu Arquivo, acesso rápido, documento
 * aberto), CommandManager com abas, área de trabalho (gerenciador | viewport
 * 3D | painel de tarefas) e barra de status embaixo.
 */
function App() {
  return (
    <div className="app">
      <BarraDeTitulo />
      <CommandManager />
      <main className="app-main">
        <Simulador />
      </main>
      <BarraDeStatus />
      <DialogoBuscaReversa />
      <DialogoProjetos />
      <DialogoSalvarCenario />
      <DialogoComparar />
      <DialogoExportarPdf />
    </div>
  )
}

export default App
