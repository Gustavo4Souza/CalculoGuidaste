import { BuscaReversa } from './BuscaReversa'
import { Dialogo } from './Dialogo'

/** Busca reversa por peso (RF05/RF15) num diálogo modal aberto pela barra de comandos (Épico 12). */
export function DialogoBuscaReversa() {
  return (
    <Dialogo nome="busca" titulo="Buscar por peso">
      <BuscaReversa />
    </Dialogo>
  )
}
