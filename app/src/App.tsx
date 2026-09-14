import { useState } from 'react'
import './App.css'
import { Simulador } from './components/Simulador'
import { BuscaReversa } from './components/BuscaReversa'

type Aba = 'simulacao' | 'busca'

/**
 * App shell em tela cheia, sem scroll de página (pedido do usuário): um
 * cabeçalho compacto + um sistema de abas — "Simulação" (fluxo principal,
 * RF01-RF04/RF06-RF12) sempre visível de uma vez, e "Buscar por Peso"
 * (RF05/RF15) numa aba separada, já que os dois fluxos não precisam
 * aparecer ao mesmo tempo.
 */
function App() {
  const [aba, setAba] = useState<Aba>('simulacao')

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__titulo">
          <h1>Guindastes Ribas</h1>
          <span className="app-header__subtitulo">Simulador de Tabela de Carga</span>
        </div>

        <nav className="app-tabs" role="tablist" aria-label="Navegação principal">
          <button
            type="button"
            role="tab"
            aria-selected={aba === 'simulacao'}
            className={`app-tabs__botao ${aba === 'simulacao' ? 'app-tabs__botao--ativo' : ''}`}
            onClick={() => setAba('simulacao')}
          >
            Simulação
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={aba === 'busca'}
            className={`app-tabs__botao ${aba === 'busca' ? 'app-tabs__botao--ativo' : ''}`}
            onClick={() => setAba('busca')}
          >
            Buscar por peso
          </button>
        </nav>

        <a
          className="app-header__link"
          href="https://app.notion.com/p/3da034f53a1280df8666fc97c0590e38"
          target="_blank"
          rel="noreferrer"
        >
          Documentação (Notion) ↗
        </a>
      </header>

      <main className="app-main">
        {aba === 'simulacao' ? <Simulador /> : <BuscaReversa tela />}
      </main>
    </div>
  )
}

export default App
