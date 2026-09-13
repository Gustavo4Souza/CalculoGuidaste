/**
 * Geometria pura do canvas da lança (Task 3.1) — separada de CanvasLanca.tsx
 * para não quebrar o Fast Refresh (um arquivo de componente só pode
 * exportar componentes) e para os testes e2e (UC02) reaproveitarem o mesmo
 * cálculo de posição do gancho na tela, em vez de duplicar a fórmula.
 */

export const ESCALA_PX_POR_M = 8 // px por metro
export const PIVOT = { x: 64, y: 320 - 40 }

/** Posição (x, y) em pixels do gancho na ponta da lança, dado o ângulo de elevação. */
export function pontaDaLanca(comprimentoLancaM: number, anguloGraus: number) {
  const anguloRad = (anguloGraus * Math.PI) / 180
  const comprimentoPx = comprimentoLancaM * ESCALA_PX_POR_M
  return {
    x: PIVOT.x + comprimentoPx * Math.cos(anguloRad),
    y: PIVOT.y - comprimentoPx * Math.sin(anguloRad),
  }
}
