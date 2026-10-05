import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { VistaPadrao } from '../../store/useInterfaceStore'

type V3 = [number, number, number]

/** Extensão do que precisa caber na tela (coordenadas da cena, metros). */
export interface Enquadramento {
  xMin: number
  xMax: number
  yMax: number
}

/**
 * Câmera isométrica inicial — FIXA: é a mesma que os testes e2e usam para
 * projetar pontos 3D em pixels (CAMERA_POSICAO/CAMERA_ALVO em
 * CenaGuindaste3D), por isso o pedido inicial (número 0) não reposiciona nada.
 */
export const VISTA_ISOMETRICA = { posicao: [40, 32, 40] as V3, alvo: [14, 14, 0] as V3 }

const FOLGA = 1.25

/** Campo de visão vertical da câmera da cena, em graus. */
export const CAMERA_FOV = 42

/**
 * Vistas padrão (Épico 12, RF23), enquadrando o guindaste ATUAL (alcance e
 * altura reais), como o "zoom para ajustar" de um CAD — com distância fixa,
 * uma lança curta ficava minúscula e os rótulos das cotas ilegíveis.
 *
 * Convenção: "lateral" olha o plano de operação da lança de frente (plano
 * XY — a elevação, como no gráfico de alcance da ficha); "frontal" olha ao
 * longo do alcance, de frente para o guindaste; "superior" é a planta.
 */
export function calcularVista(nome: VistaPadrao, e: Enquadramento, fovGraus: number, aspecto: number) {
  if (nome === 'isometrica') return VISTA_ISOMETRICA
  const tan = Math.tan(((fovGraus / 2) * Math.PI) / 180)
  const largura = e.xMax - e.xMin
  const xMeio = (e.xMin + e.xMax) / 2
  /** Distância para caber `altura` (vertical) e `larg` (horizontal) na tela. */
  const distancia = (altura: number, larg: number) => (FOLGA * Math.max(altura, larg / aspecto)) / (2 * tan)

  switch (nome) {
    case 'lateral':
      return { posicao: [xMeio, e.yMax / 2, distancia(e.yMax, largura)] as V3, alvo: [xMeio, e.yMax / 2, 0] as V3 }
    case 'frontal':
      return {
        posicao: [e.xMax + distancia(e.yMax, 14), e.yMax / 2, 0.01] as V3,
        alvo: [xMeio, e.yMax / 2, 0] as V3,
      }
    case 'superior':
      // Acima da ponta: em perspectiva, o que sobe em direção à câmera também precisa caber.
      return { posicao: [xMeio, e.yMax + distancia(14, largura), 0.01] as V3, alvo: [xMeio, 0, 0] as V3 }
  }
}

export function ControladorDeVista({
  vista,
  enquadramento,
}: {
  vista: { nome: VistaPadrao; pedido: number }
  enquadramento: Enquadramento
}) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  const invalidate = useThree((s) => s.invalidate)
  // O enquadramento muda a cada arrasto; só a mudança de PEDIDO reposiciona a câmera.
  const enquadramentoRef = useRef(enquadramento)
  enquadramentoRef.current = enquadramento

  useEffect(() => {
    if (vista.pedido === 0 || !controls) return
    const fov = 'fov' in camera ? (camera as { fov: number }).fov : 42
    const { posicao, alvo } = calcularVista(vista.nome, enquadramentoRef.current, fov, size.width / size.height)
    camera.position.set(...posicao)
    controls.target.set(...alvo)
    controls.update()
    invalidate()
    // `size` fora das dependências de propósito: redimensionar a janela não deve "pular" a câmera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, camera, controls, invalidate])

  return null
}
