import { useEffect, useRef } from 'react'
import { useInterfaceStore } from '../store/useInterfaceStore'
import { BuscaReversa } from './BuscaReversa'

/** Busca reversa por peso (RF05/RF15) num diálogo modal aberto pela barra de comandos (Épico 12). */
export function DialogoBuscaReversa() {
  const aberta = useInterfaceStore((s) => s.buscaAberta)
  const abrirBusca = useInterfaceStore((s) => s.abrirBusca)
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (aberta && !d.open) d.showModal()
    if (!aberta && d.open) d.close()
  }, [aberta])

  return (
    <dialog ref={ref} className="dialogo" aria-label="Buscar por peso" onClose={() => abrirBusca(false)}>
      <div className="dialogo__cabecalho">
        <span>Buscar por peso</span>
        <button type="button" className="comando" onClick={() => abrirBusca(false)} aria-label="Fechar">
          ✕
        </button>
      </div>
      {aberta && <BuscaReversa />}
    </dialog>
  )
}
