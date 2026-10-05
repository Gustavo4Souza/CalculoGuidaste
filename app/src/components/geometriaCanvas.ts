/**
 * Geometria pura da cena 3D do guindaste (Épico 3 → layout 3D) — separada
 * do componente React para não quebrar o Fast Refresh e para os testes
 * (unitários e e2e) reaproveitarem o mesmo cálculo de posição do gancho,
 * em vez de duplicar a trigonometria.
 *
 * Tudo aqui é em METROS, no plano vertical de operação da lança (x = alcance
 * horizontal a partir do pé da lança, y = altura acima do pé da lança) — é
 * o mesmo plano usado pelo motor de cálculo (engine/geometriaLanca.ts),
 * só que devolvido como coordenadas para desenhar, não para validar carga.
 */

/** Deslocamento local da esfera de arrasto em relação à ponta da lança (antes da rotação) — ver cena/SegmentoLanca. */
export const GANCHO_OFFSET_Y = -1.1

export const ANGULO_MIN_GRAUS = 5
export const ANGULO_MAX_GRAUS = 85

/** Posição (x, y), em metros, do gancho na ponta da lança a partir do pé da lança (pivot), dado o ângulo de elevação. */
export function pontaDaLanca(comprimentoLancaM: number, anguloGraus: number): { x: number; y: number } {
  const anguloRad = (anguloGraus * Math.PI) / 180
  return {
    x: comprimentoLancaM * Math.cos(anguloRad),
    y: comprimentoLancaM * Math.sin(anguloRad),
  }
}

/** Ângulo de elevação (graus), a partir de um ponto (x, y) em metros relativo ao pivot — usado ao arrastar o gancho. */
export function anguloDoPonto(x: number, y: number): number {
  const anguloRad = Math.atan2(Math.max(y, 0.001), Math.max(x, 0.001))
  const anguloGraus = (anguloRad * 180) / Math.PI
  return Math.min(ANGULO_MAX_GRAUS, Math.max(ANGULO_MIN_GRAUS, anguloGraus))
}

/**
 * Comprimento projetado ao longo da direção atual da lança (Task 8.2) —
 * usado ao arrastar a própria estrutura da lança (não o gancho) para
 * estender/recolher o comprimento. O ângulo fica travado durante esse
 * arrasto: projeta o ponto (dx, dy) relativo ao pivot no vetor unitário da
 * direção da lança (produto escalar), limitado aos extremos reais da
 * tabela do fabricante — nunca extrapola.
 */
export function projetarComprimento(dx: number, dy: number, anguloGraus: number, min: number, max: number): number {
  const anguloRad = (anguloGraus * Math.PI) / 180
  const projecao = dx * Math.cos(anguloRad) + dy * Math.sin(anguloRad)
  return Math.min(max, Math.max(min, projecao))
}

/**
 * Task 9.2 — "ímã" para os comprimentos reais da tabela do fabricante,
 * marcados como encaixes visuais na lança: se o valor arrastado cai perto
 * de um dos comprimentos reais (dentro da tolerância), gruda exatamente
 * nele; caso contrário, mantém o valor contínuo/livre (decisão do Épico 8
 * — arrastar longe de uma marca continua dando um valor livre, não fica
 * preso só aos 7 pontos).
 */
export function aplicarSnapComprimento(
  valorM: number,
  comprimentosReaisM: ReadonlyArray<number>,
  toleranciaM = 0.35,
): number {
  let maisProximo: number | null = null
  let menorDistancia = Infinity
  for (const real of comprimentosReaisM) {
    const distancia = Math.abs(valorM - real)
    if (distancia < menorDistancia) {
      menorDistancia = distancia
      maisProximo = real
    }
  }
  return maisProximo !== null && menorDistancia <= toleranciaM ? maisProximo : valorM
}
