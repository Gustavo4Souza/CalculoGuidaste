import type { ThreeEvent } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { useMemo } from 'react'
import type { CriterioDeGiro } from '../../config/criteriosDeGiro'
import { rotuloRegiao } from '../../engine/capacidadeDetalhada'
import { cursor, SEM_PONTEIRO } from './primitivas'

type V3 = [number, number, number]

const COR_GIRO = '#1f5fbf'
const COR_SETOR = '#8b97a5'

function pontoNoChao(raio: number, grausGiro: number, y = 0.04): V3 {
  const g = (grausGiro * Math.PI) / 180
  return [raio * Math.cos(g), y, raio * Math.sin(g)]
}

/**
 * Giro no chão (Épico 13, RF18): anel arrastável em volta do centro de giro
 * (arrastar = girar a superestrutura), cota em arco do 0° até o giro atual e
 * as fronteiras dos setores do critério de giro (config/criteriosDeGiro.ts)
 * desenhadas no chão — o engenheiro vê onde a área de operação muda.
 */
export function AnelDeGiro({
  raioM,
  giroGraus,
  limiteMecanicoGraus,
  criterio,
  ativo,
  aoIniciarArrasto,
}: {
  raioM: number
  giroGraus: number
  limiteMecanicoGraus: number | null
  criterio: CriterioDeGiro
  ativo: boolean
  aoIniciarArrasto: (e: ThreeEvent<PointerEvent>) => void
}) {
  const arcoGiro = useMemo<V3[]>(() => {
    const passos = Math.max(2, Math.ceil(Math.abs(giroGraus) / 3))
    return Array.from({ length: passos + 1 }, (_, i) => pontoNoChao(raioM + 0.7, (giroGraus * i) / passos, 0.05))
  }, [raioM, giroGraus])
  const referencia = useMemo<V3[]>(() => [pontoNoChao(0, 0), pontoNoChao(raioM + 1.6, 0)], [raioM])
  const posicaoRotulo = useMemo<V3>(() => pontoNoChao(raioM + 1.9, giroGraus / 2, 0.05), [raioM, giroGraus])

  // Fronteiras dos setores (dos dois lados, simétricas), sem a de 180°.
  const fronteiras = useMemo(
    () =>
      criterio.setores
        .slice(0, -1)
        .flatMap((s, i) => [
          { angulo: s.ateGraus, rotulo: `${rotuloRegiao(s.regiao)} | ${rotuloRegiao(criterio.setores[i + 1].regiao)}` },
          { angulo: -s.ateGraus, rotulo: '' },
        ]),
    [criterio],
  )
  const limites = limiteMecanicoGraus === null ? [] : [limiteMecanicoGraus, -limiteMecanicoGraus]

  return (
    <group>
      {/* anel visível */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[raioM - 0.12, raioM + 0.12, 72]} />
        <meshBasicMaterial color={COR_GIRO} transparent opacity={ativo ? 0.9 : 0.45} />
      </mesh>
      {/* alça de arrasto invisível, bem mais larga que o anel */}
      <mesh
        position={[0, 0.06, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={aoIniciarArrasto}
        onPointerOver={() => cursor('grab')}
        onPointerOut={() => cursor('auto')}
      >
        <ringGeometry args={[raioM - 0.7, raioM + 0.7, 72]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <Line points={referencia} color={COR_GIRO} lineWidth={1} dashed dashSize={0.3} gapSize={0.2} />
      {Math.abs(giroGraus) > 0.05 && <Line points={arcoGiro} color={COR_GIRO} lineWidth={1.5} />}
      <Html style={SEM_PONTEIRO} position={posicaoRotulo} center distanceFactor={22} zIndexRange={[20, 0]}>
        <div className="cena-3d__cota cena-3d__cota--giro">giro {giroGraus.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}°</div>
      </Html>

      {fronteiras.map((f) => (
        <group key={f.angulo}>
          <Line
            points={[pontoNoChao(raioM - 0.6, f.angulo), pontoNoChao(raioM + 4, f.angulo)]}
            color={COR_SETOR}
            lineWidth={1}
            dashed
            dashSize={0.25}
            gapSize={0.2}
          />
          {f.rotulo && (
            <Html style={SEM_PONTEIRO} position={pontoNoChao(raioM + 4.6, f.angulo)} center distanceFactor={22} zIndexRange={[20, 0]}>
              <div className="cena-3d__cota cena-3d__cota--setor">
                {f.angulo}° · {f.rotulo}
              </div>
            </Html>
          )}
        </group>
      ))}
      {limites.map((a) => (
        <Line key={a} points={[pontoNoChao(0, a), pontoNoChao(raioM + 4, a)]} color="#c62828" lineWidth={1.5} />
      ))}
    </group>
  )
}
