import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Limite de erro (error boundary) — sem ele, QUALQUER erro de renderização
 * desmonta a aplicação inteira e a tela fica em branco (bug relatado em
 * 05/10/2026: um JSON de especificação desatualizado servido pelo dev server
 * derrubava a cena 3D e, junto, a árvore de parâmetros e o resultado).
 *
 * Usado em dois níveis: em volta da cena 3D (a árvore e o resultado
 * continuam utilizáveis) e em volta da aplicação inteira (última defesa).
 */
export class LimiteDeErro extends Component<
  { onde: string; children: ReactNode; compacto?: boolean },
  { erro: Error | null }
> {
  state: { erro: Error | null } = { erro: null }

  static getDerivedStateFromError(erro: Error) {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error(`[${this.props.onde}]`, erro, info.componentStack)
  }

  render() {
    const { erro } = this.state
    if (!erro) return this.props.children
    return (
      <div className={`limite-de-erro ${this.props.compacto ? 'limite-de-erro--compacto' : ''}`} role="alert">
        <strong>Não foi possível exibir {this.props.onde}.</strong>
        <code>{erro.message}</code>
        <p>
          Se o simulador acabou de ser atualizado, recarregue a página sem cache (Ctrl+Shift+R). Se o problema continuar,
          reinicie o servidor (<code>npm run dev</code>).
        </p>
        <div className="limite-de-erro__acoes">
          <button type="button" className="comando comando--destaque" onClick={() => this.setState({ erro: null })}>
            Tentar de novo
          </button>
          <button type="button" className="comando" onClick={() => window.location.reload()}>
            Recarregar a página
          </button>
        </div>
      </div>
    )
  }
}
