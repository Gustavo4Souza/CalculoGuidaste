import type { ThreeEvent } from '@react-three/fiber'
import { Vector3 } from 'three'

/**
 * Peças compartilhadas da cena 3D (Épico 13): paleta e planos invisíveis de
 * arrasto. Cada plano só capta o ponteiro enquanto um arrasto está ativo e
 * devolve a posição já convertida para o referencial que interessa.
 */

// Paleta técnica (Épico 9), clareada para o tema claro do Épico 12.
export const COR_LANCA = '#f2c11d'
export const COR_JIB = '#e0a019'
export const COR_SUPERESTRUTURA = '#4a5561'
export const COR_CHASSI = '#5b6672'
export const COR_CABINE = '#3d4752'
export const COR_RODA = '#1c2228'
export const COR_FAIXA = '#111417'
export const COR_SAPATA = '#2f3a45'
export const COR_CARGA = '#7f93a8'
export const COR_CABO = '#59636e'
export const COR_DESTAQUE_ARRASTO = '#1f5fbf'

export function cursor(tipo: string) {
  document.body.style.cursor = tipo
}

/** Captura o ponteiro no objeto clicado, para continuar recebendo os eventos fora dele. */
export function capturarPonteiro(e: ThreeEvent<PointerEvent>) {
  ;(e.target as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture(e.pointerId)
}

/**
 * Plano VERTICAL de arrasto no plano de operação da lança. Deve ficar DENTRO
 * do grupo da superestrutura (que gira): o ponto do ponteiro é convertido
 * para o referencial local desse grupo antes de chegar em `aoMover`.
 */
export function PlanoDeArrastoVertical({
  aoMover,
  aoSoltar,
}: {
  aoMover: (xLocal: number, yLocal: number) => void
  aoSoltar: () => void
}) {
  return (
    <mesh
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        const local = e.eventObject.parent!.worldToLocal(new Vector3().copy(e.point))
        aoMover(local.x, local.y)
      }}
      onPointerUp={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        aoSoltar()
      }}
      onPointerLeave={aoSoltar}
    >
      <planeGeometry args={[220, 140]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

/** Plano HORIZONTAL de arrasto (coordenadas do mundo), na altura `y` — giro e sapatas. */
export function PlanoDeArrastoHorizontal({
  y,
  aoMover,
  aoSoltar,
}: {
  y: number
  aoMover: (x: number, z: number) => void
  aoSoltar: () => void
}) {
  return (
    <mesh
      position={[0, y, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        aoMover(e.point.x, e.point.z)
      }}
      onPointerUp={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        aoSoltar()
      }}
      onPointerLeave={aoSoltar}
    >
      <planeGeometry args={[240, 240]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

/**
 * Estilo para <Html> que é SÓ rótulo (cotas, CG, setores): sem isso, o
 * contêiner que o drei cria em volta do rótulo intercepta o clique e
 * bloqueia o arrasto das peças que ficam por baixo dele na tela. (A prop
 * `pointerEvents` do <Html> só vale no modo `transform`, que não usamos.)
 */
export const SEM_PONTEIRO = { pointerEvents: 'none' } as const
