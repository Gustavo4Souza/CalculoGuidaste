/**
 * Giro → quadrante/zona (RF18). O critério em si (os ângulos) vem de
 * config/criteriosDeGiro.ts, passado como argumento — esta função só aplica.
 */
import type { CriterioDeGiro } from '../config/criteriosDeGiro'
import type { RegiaoDeGiro } from '../types/cenario'

/** Tolerância angular para considerar "exatamente na fronteira", em graus. */
const TOLERANCIA_FRONTEIRA_GRAUS = 1e-6

/** Normaliza qualquer ângulo para o intervalo (-180°, 180°]. */
export function normalizarGiro(giroGraus: number): number {
  let g = giroGraus % 360
  if (g <= -180) g += 360
  if (g > 180) g -= 360
  return g
}

export interface ClassificacaoDeGiro {
  normalizadoGraus: number
  /** Vazio quando |giro| passa do último setor (além do limite coberto). */
  regioes: RegiaoDeGiro[]
}

export function classificarGiro(criterio: CriterioDeGiro, giroGraus: number): ClassificacaoDeGiro {
  const normalizadoGraus = normalizarGiro(giroGraus)
  const absoluto = Math.abs(normalizadoGraus)

  // Setores em ordem crescente de `ateGraus`: o primeiro que contém |giro| é o dele.
  for (let i = 0; i < criterio.setores.length; i++) {
    const setor = criterio.setores[i]
    if (absoluto <= setor.ateGraus + TOLERANCIA_FRONTEIRA_GRAUS) {
      const proximo = criterio.setores[i + 1]
      const naFronteira = proximo !== undefined && Math.abs(absoluto - setor.ateGraus) <= TOLERANCIA_FRONTEIRA_GRAUS
      return { normalizadoGraus, regioes: naFronteira ? [setor.regiao, proximo.regiao] : [setor.regiao] }
    }
  }
  return { normalizadoGraus, regioes: [] }
}
