import { useEffect, useRef, type ReactNode } from 'react'
import { useInterfaceStore, type Dialogo as NomeDialogo } from '../store/useInterfaceStore'

/**
 * Diálogo modal genérico (Épicos 12/15), aberto/fechado pela store de
 * interface. Usa o <dialog> nativo (foco preso, Esc fecha, fundo escurecido).
 */
export function Dialogo({
  nome,
  titulo,
  largura = 560,
  children,
}: {
  nome: NomeDialogo
  titulo: string
  largura?: number
  children: ReactNode
}) {
  const aberto = useInterfaceStore((s) => s.dialogo === nome)
  const abrirDialogo = useInterfaceStore((s) => s.abrirDialogo)
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (aberto && !d.open) d.showModal()
    if (!aberto && d.open) d.close()
  }, [aberto])

  return (
    <dialog
      ref={ref}
      className="dialogo"
      style={{ width: `min(${largura}px, 94vw)` }}
      aria-label={titulo}
      onClose={() => aberto && abrirDialogo(null)}
    >
      <div className="dialogo__cabecalho">
        <span>{titulo}</span>
        <button type="button" className="comando" onClick={() => abrirDialogo(null)} aria-label="Fechar">
          ✕
        </button>
      </div>
      {aberto && <div className="dialogo__corpo">{children}</div>}
    </dialog>
  )
}
