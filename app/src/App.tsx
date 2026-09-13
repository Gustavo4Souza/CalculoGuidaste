import './App.css'
import { Simulador } from './components/Simulador'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Guindastes Ribas — Simulador de Tabela de Carga</h1>
        <p>
          Disciplina Jornada · fonte de verdade das decisões:{' '}
          <a
            href="https://app.notion.com/p/3da034f53a1280df8666fc97c0590e38"
            target="_blank"
            rel="noreferrer"
          >
            documentação no Notion
          </a>
        </p>
      </header>
      <Simulador />
    </div>
  )
}

export default App
