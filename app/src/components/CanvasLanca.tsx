import type Konva from 'konva'
import type { Vector2d } from 'konva/lib/types'
import { Circle, Layer, Line, Rect, Stage, Text } from 'react-konva'

/**
 * Canvas arrastável da lança (Task 3.1 / RT-UI02 / RF02 / UC02) — migração
 * do desenho SVG do POC (`prototipo/poc-simulador.html`) para react-konva.
 *
 * Só o ÂNGULO de elevação da lança é manipulado pelo arrasto — o
 * comprimento de lança é um controle numérico/discreto à parte (Task 3.4).
 * O gancho fica preso a um arco de raio fixo (`comprimentoLancaM`) ao redor
 * do pé da lança: a cada arrasto, `dragBoundFunc` recalcula o ângulo a
 * partir da posição do ponteiro e devolve a posição já "encaixada" no arco.
 */

const LARGURA = 520
const ALTURA = 320
const ESCALA_PX_POR_M = 8 // px por metro
const PIVOT = { x: 64, y: ALTURA - 40 }
const ANGULO_MIN_GRAUS = 5
const ANGULO_MAX_GRAUS = 85

interface CanvasLancaProps {
  comprimentoLancaM: number
  anguloGraus: number
  raioM: number
  onAnguloChange: (anguloGraus: number) => void
  /** Cor do gancho/traço da lança conforme o status do resultado (opcional). */
  corDestaque?: string
}

function anguloDoPonteiro(pos: Vector2d): number {
  const dx = Math.max(pos.x - PIVOT.x, 1)
  const dy = Math.max(PIVOT.y - pos.y, 1)
  const anguloRad = Math.atan2(dy, dx)
  const anguloGraus = (anguloRad * 180) / Math.PI
  return Math.min(ANGULO_MAX_GRAUS, Math.max(ANGULO_MIN_GRAUS, anguloGraus))
}

function pontaDaLanca(comprimentoLancaM: number, anguloGraus: number) {
  const anguloRad = (anguloGraus * Math.PI) / 180
  const comprimentoPx = comprimentoLancaM * ESCALA_PX_POR_M
  return {
    x: PIVOT.x + comprimentoPx * Math.cos(anguloRad),
    y: PIVOT.y - comprimentoPx * Math.sin(anguloRad),
  }
}

export function CanvasLanca({
  comprimentoLancaM,
  anguloGraus,
  raioM,
  onAnguloChange,
  corDestaque = '#2a78d6',
}: CanvasLancaProps) {
  const ponta = pontaDaLanca(comprimentoLancaM, anguloGraus)

  const dragBoundFunc = function (this: Konva.Node, pos: Vector2d): Vector2d {
    const anguloArrastado = anguloDoPonteiro(pos)
    return pontaDaLanca(comprimentoLancaM, anguloArrastado)
  }

  const handleDragMove = (evt: Konva.KonvaEventObject<DragEvent>) => {
    const node = evt.target
    const anguloAtual = anguloDoPonteiro({ x: node.x(), y: node.y() })
    onAnguloChange(anguloAtual)
  }

  return (
    <div className="canvas-lanca">
      <Stage width={LARGURA} height={ALTURA}>
        <Layer>
          {/* chão */}
          <Rect x={0} y={PIVOT.y} width={LARGURA} height={ALTURA - PIVOT.y} fill="#eef1f0" />
          <Line points={[0, PIVOT.y, LARGURA, PIVOT.y]} stroke="#c3c2b7" strokeWidth={2} />

          {/* base do guindaste */}
          <Rect x={PIVOT.x - 40} y={PIVOT.y - 14} width={56} height={14} cornerRadius={3} fill="#26313d" />
          <Rect x={PIVOT.x - 26} y={PIVOT.y - 32} width={40} height={20} cornerRadius={3} fill="#3b4a5a" />

          {/* linha guia do raio (chão) */}
          <Line
            points={[PIVOT.x, PIVOT.y + 1, ponta.x, PIVOT.y + 1]}
            stroke="#c3c2b7"
            strokeWidth={1.5}
            dash={[4, 3]}
          />
          {/* linha guia vertical (queda até o chão) */}
          <Line points={[ponta.x, ponta.y, ponta.x, PIVOT.y + 1]} stroke="#c3c2b7" strokeWidth={1.5} dash={[4, 3]} />

          {/* lança */}
          <Line
            points={[PIVOT.x, PIVOT.y - 28, ponta.x, ponta.y]}
            stroke="#26313d"
            strokeWidth={6}
            lineCap="round"
          />
          {/* cabo até o chão */}
          <Line points={[ponta.x, ponta.y, ponta.x, PIVOT.y - 6]} stroke="#8a8a8a" strokeWidth={1.5} />

          {/* gancho arrastável */}
          <Circle
            x={ponta.x}
            y={ponta.y}
            radius={11}
            fill="#fff"
            stroke={corDestaque}
            strokeWidth={3}
            draggable
            dragBoundFunc={dragBoundFunc}
            onDragMove={handleDragMove}
          />
          <Circle x={ponta.x} y={ponta.y} radius={3} fill={corDestaque} listening={false} />

          <Text
            x={PIVOT.x}
            y={ALTURA - 18}
            text={`raio ${raioM.toFixed(1)} m · ângulo ${anguloGraus.toFixed(0)}°`}
            fontSize={12}
            fill="#52514e"
          />
        </Layer>
      </Stage>
      <p className="canvas-hint">Arraste o gancho para ajustar o ângulo da lança.</p>
    </div>
  )
}
