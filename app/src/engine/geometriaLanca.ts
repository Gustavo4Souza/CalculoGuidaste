/**
 * Correção geométrica da lança (RF11 / RT-MC03 / Task 2.2).
 *
 * O "raio de trabalho" (raioM) publicado nas tabelas de carga do fabricante
 * é medido horizontalmente a partir do centro de giro do guindaste, ao nível
 * do solo. Mas a posição visual da lança — o que o usuário manipula no
 * canvas (Épico 3): comprimento de lança + ângulo de elevação a partir do
 * pé da lança — não parte desse centro de giro: o pé da lança fica elevado
 * do solo (`alturaPeDaLancaM`) e recuado em relação ao centro de giro
 * (`recuoPeDaLancaM`).
 *
 * A altura não entra na conta do raio (é uma distância puramente
 * horizontal, independente da altura do pé da lança) — ela é usada para
 * calcular a altura do gancho, útil para o desenho do canvas (Épico 3).
 * Já o recuo desloca horizontalmente a origem da lança em relação ao centro
 * de giro, então precisa ser subtraído do alcance horizontal da lança.
 */

interface GeometriaDoPeDaLanca {
  alturaPeDaLancaM: number
  recuoPeDaLancaM: number
}

/**
 * Converte comprimento de lança + ângulo de elevação (posição visual, a
 * partir do pé da lança) no raio real de tabela (RF11).
 *
 * `anguloGraus`: ângulo de elevação da lança em relação à horizontal
 * (0° = lança na horizontal, 90° = lança na vertical) — mesma convenção
 * usada na tabela do TM-130 e no gráfico de carga do MD-300L.
 */
export function calcularRaioReal(
  guindaste: GeometriaDoPeDaLanca,
  comprimentoLancaM: number,
  anguloGraus: number,
): number {
  const anguloRad = (anguloGraus * Math.PI) / 180
  const alcanceHorizontalDaLanca = comprimentoLancaM * Math.cos(anguloRad)
  return alcanceHorizontalDaLanca - guindaste.recuoPeDaLancaM
}

/**
 * Altura do gancho a partir do solo, dada a posição visual da lança —
 * não é usada hoje pelo motor de cálculo (que só valida raio × capacidade),
 * mas é geometria que o canvas do Épico 3 vai precisar para desenhar a
 * lança corretamente a partir do pé real (elevado do solo).
 */
export function calcularAlturaDoGancho(
  guindaste: GeometriaDoPeDaLanca,
  comprimentoLancaM: number,
  anguloGraus: number,
): number {
  const anguloRad = (anguloGraus * Math.PI) / 180
  return guindaste.alturaPeDaLancaM + comprimentoLancaM * Math.sin(anguloRad)
}
