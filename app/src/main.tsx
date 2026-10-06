import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { PROBLEMAS_DE_DADOS } from './data/catalogo'
import { LimiteDeErro } from './components/LimiteDeErro'

/**
 * Entrada da aplicação. Os dados são conferidos ANTES de carregar o resto:
 * a store da simulação monta o cenário inicial na importação do módulo, e um
 * dado quebrado ali derrubaria tudo antes de qualquer limite de erro do
 * React existir — a tela ficava em branco (bug de 05/10/2026).
 */
const raiz = createRoot(document.getElementById('root')!)

function TelaDeErro({ titulo, itens }: { titulo: string; itens: string[] }): ReactNode {
  return (
    <div className="limite-de-erro limite-de-erro--tela" role="alert">
      <strong>{titulo}</strong>
      <ul>
        {itens.map((i) => (
          <li key={i}>
            <code>{i}</code>
          </li>
        ))}
      </ul>
      <p>
        Recarregue a página sem cache (Ctrl+Shift+R). Se continuar, reinicie o servidor (<code>npm run dev</code>) — e, se
        algum arquivo de dados foi editado à mão, confira-o contra as fichas em <code>docs/</code>.
      </p>
    </div>
  )
}

if (PROBLEMAS_DE_DADOS.length > 0) {
  raiz.render(<TelaDeErro titulo="Os dados do simulador estão incompletos ou desatualizados" itens={PROBLEMAS_DE_DADOS} />)
} else {
  import('./App.tsx')
    .then(({ default: App }) =>
      raiz.render(
        <StrictMode>
          <LimiteDeErro onde="o simulador">
            <App />
          </LimiteDeErro>
        </StrictMode>,
      ),
    )
    .catch((erro: unknown) =>
      raiz.render(
        <TelaDeErro
          titulo="Não foi possível carregar o simulador"
          itens={[erro instanceof Error ? erro.message : String(erro)]}
        />,
      ),
    )
}
