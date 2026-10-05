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

export interface GeometriaDoPeDaLanca {
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

/** Lança (e JIB opcional) no plano vertical do giro — Épico 10. */
export interface PosicaoDaLanca {
  comprimentoLancaM: number
  anguloLancaGraus: number
  /** JIB montado na ponta: comprimento e offset (para baixo) em relação à lança principal. */
  jib?: { comprimentoM: number; anguloGraus: number } | null
}

/**
 * Ponta da lança (ou do JIB, se montado): `raioM` horizontal a partir do
 * centro de giro (já com o recuo do pé descontado — RF11) e `alturaM` do
 * solo. O gancho pende verticalmente dessa ponta, então o raio de trabalho é
 * o raio da ponta.
 */
export function calcularPonta(pe: GeometriaDoPeDaLanca, posicao: PosicaoDaLanca): { raioM: number; alturaM: number } {
  const theta = (posicao.anguloLancaGraus * Math.PI) / 180
  let raioM = calcularRaioReal(pe, posicao.comprimentoLancaM, posicao.anguloLancaGraus)
  let alturaM = pe.alturaPeDaLancaM + posicao.comprimentoLancaM * Math.sin(theta)
  if (posicao.jib) {
    const phi = theta - (posicao.jib.anguloGraus * Math.PI) / 180
    raioM += posicao.jib.comprimentoM * Math.cos(phi)
    alturaM += posicao.jib.comprimentoM * Math.sin(phi)
  }
  return { raioM, alturaM }
}

/**
 * Inversa de `calcularPonta` no ângulo da lança principal: qual ângulo, dentro
 * de [anguloMinGraus, anguloMaxGraus], põe a ponta no raio pedido (mantendo
 * comprimentos e offset do JIB). O raio cai conforme o ângulo sobe nessa
 * faixa, então basta uma bisseção. null = raio inalcançável com essa lança.
 */
export function resolverAnguloParaRaio(
  pe: GeometriaDoPeDaLanca,
  posicao: Omit<PosicaoDaLanca, 'anguloLancaGraus'>,
  raioAlvoM: number,
  anguloMinGraus: number,
  anguloMaxGraus: number,
): number | null {
  const raio = (a: number) => calcularPonta(pe, { ...posicao, anguloLancaGraus: a }).raioM
  let lo = anguloMinGraus
  let hi = anguloMaxGraus
  // raio(lo) é o maior alcance, raio(hi) o menor.
  if (raioAlvoM > raio(lo) + 1e-9 || raioAlvoM < raio(hi) - 1e-9) return null
  for (let i = 0; i < 100; i++) {
    const meio = (lo + hi) / 2
    if (raio(meio) > raioAlvoM) lo = meio
    else hi = meio
  }
  return (lo + hi) / 2
}
