/**
 * Ponto de encontro entre a cena 3D e o relatório (Épico 16): a cena
 * registra aqui uma função que renderiza a vista pedida fora da tela e
 * devolve a imagem; o relatório só chama `capturarVista`, sem conhecer o
 * three.js nem o React.
 */
export type VistaDeCaptura = 'lateral' | 'superior'
type Capturador = (vista: VistaDeCaptura) => string

let capturador: Capturador | null = null

/** Chamado pela cena ao montar (e com null ao desmontar). */
export function registrarCapturador(fn: Capturador | null): void {
  capturador = fn
}

/** Imagem (data URL JPEG) da vista pedida do cenário que está na cena; null se a cena não estiver disponível. */
export function capturarVista(vista: VistaDeCaptura): string | null {
  try {
    return capturador ? capturador(vista) : null
  } catch {
    return null
  }
}

/** Espera o React aplicar a mudança de estado e a cena (frameloop "demand") redesenhar. */
export function esperarCenaAtualizar(): Promise<void> {
  return new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(ok, 60))))
}
