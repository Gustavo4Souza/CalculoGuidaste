/**
 * Câmeras das capturas do relatório (Épico 16) — puras, sem React.
 *
 * Diferente das vistas padrão da tela (que supõem a lança no eixo do
 * caminhão, giro ≈ 0°), aqui:
 * - a vista LATERAL olha o plano de operação da lança DE FRENTE, qualquer que
 *   seja o giro (é a elevação, como no gráfico de alcance da ficha);
 * - a vista SUPERIOR enquadra juntos o caminhão com as sapatas, o mapa da área
 *   de operação em volta e a carga, onde quer que a lança esteja apontando.
 */
import { calcularVista } from '../components/cena/ControladorDeVista'
import { rotacaoDoGiro } from '../components/cena/geometriaCena'

type V3 = [number, number, number]
const FOLGA = 1.2

/** Gira um ponto em torno do eixo Y como a superestrutura gira (mesma convenção da cena). */
function girarComASuperestrutura([x, y, z]: V3, giroGraus: number): V3 {
  const t = rotacaoDoGiro(giroGraus)
  return [x * Math.cos(t) + z * Math.sin(t), y, -x * Math.sin(t) + z * Math.cos(t)]
}

export function cameraLateral(e: {
  giroGraus: number
  raioM: number
  alturaPontaM: number
  raioTraseiroM: number
  fovGraus: number
  aspecto: number
}): { posicao: V3; alvo: V3 } {
  // No referencial da superestrutura a lança está sempre ao longo de +X local.
  const local = calcularVista(
    'lateral',
    { xMin: -(e.raioTraseiroM + 2), xMax: e.raioM + 4, yMax: e.alturaPontaM + 2 },
    e.fovGraus,
    e.aspecto,
  )
  return { posicao: girarComASuperestrutura(local.posicao, e.giroGraus), alvo: girarComASuperestrutura(local.alvo, e.giroGraus) }
}

/** Planta: enquadra todos os pontos (x, z) do chão pedidos, olhando de cima. */
export function cameraSuperior(e: {
  pontosXZ: [number, number][]
  alturaMaximaM: number
  fovGraus: number
  aspecto: number
}): { posicao: V3; alvo: V3 } {
  const xs = e.pontosXZ.map(([x]) => x)
  const zs = e.pontosXZ.map(([, z]) => z)
  const [xMin, xMax, zMin, zMax] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]
  const cx = (xMin + xMax) / 2
  const cz = (zMin + zMax) / 2
  const tan = Math.tan(((e.fovGraus / 2) * Math.PI) / 180)
  // Na planta a tela mostra X na horizontal e Z na vertical.
  const distancia = (FOLGA * Math.max(zMax - zMin, (xMax - xMin) / e.aspecto)) / (2 * tan)
  return { posicao: [cx, e.alturaMaximaM + distancia, cz + 0.01], alvo: [cx, 0, cz] }
}
