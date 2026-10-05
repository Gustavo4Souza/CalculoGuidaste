import { Edges, Html, Line } from '@react-three/drei'
import { useMemo } from 'react'
import type { ParametrosDoCenario } from '../../types/cenario'
import { COR_CABO, COR_CARGA, SEM_PONTEIRO } from './primitivas'

type V3 = [number, number, number]

/**
 * Carga pendurada no gancho (Épico 13, RF19), desenhada em ESCALA REAL no
 * referencial da superestrutura (gira junto com ela): cabo de içamento da
 * ponta até o moitão, lingada (e balancim, se usado), a carga C × L × A
 * (C ao longo do alcance, L na transversal) e o centro de gravidade.
 *
 * Posição vertical: com altura de içamento informada, a base da carga fica
 * nessa altura (e o plano dela aparece); sem ela, a carga está apoiada no
 * solo — o mesmo pior caso de cabo pendente usado pelo motor no somatório.
 */
export function CargaSuspensa({
  raioM,
  alturaPontaM,
  cenario,
  corStatus,
}: {
  raioM: number
  alturaPontaM: number
  cenario: ParametrosDoCenario
  corStatus: string
}) {
  const { carga, acessorios } = cenario
  const C = Math.max(0.05, carga.comprimentoM)
  const L = Math.max(0.05, carga.larguraM)
  const A = Math.max(0.05, carga.alturaM)
  const baseY = cenario.alturaIcamentoNecessariaM ?? 0
  const topoY = baseY + A
  const ganchoY = topoY + acessorios.alturaLingadaM
  const cg = carga.centroDeGravidade

  const cabo = useMemo<V3[]>(
    () => [
      [raioM, alturaPontaM - 1.65, 0],
      [raioM, ganchoY + 0.55, 0],
    ],
    [raioM, alturaPontaM, ganchoY],
  )

  const cantos = useMemo<V3[]>(
    () => [
      [raioM - C / 2, topoY, -L / 2],
      [raioM + C / 2, topoY, -L / 2],
      [raioM + C / 2, topoY, L / 2],
      [raioM - C / 2, topoY, L / 2],
    ],
    [raioM, C, L, topoY],
  )
  const gancho: V3 = [raioM, ganchoY, 0]
  const yBalancim = topoY + acessorios.alturaLingadaM * 0.45
  const pontasBalancim: V3[] = [
    [raioM - C / 2, yBalancim, 0],
    [raioM + C / 2, yBalancim, 0],
  ]
  const posicaoCG = useMemo<V3>(() => [raioM + cg.dx, baseY + A / 2 + cg.dy, cg.dz], [raioM, cg.dx, cg.dy, cg.dz, baseY, A])

  return (
    <group>
      {alturaPontaM - 1.65 > ganchoY + 0.55 && <Line points={cabo} color={COR_CABO} lineWidth={1.5} />}

      {/* moitão */}
      <mesh position={[raioM, ganchoY + 0.3, 0]}>
        <boxGeometry args={[0.45, 0.6, 0.35]} />
        <meshStandardMaterial color="#e6b800" emissive={corStatus} emissiveIntensity={0.25} />
      </mesh>

      {/* lingada: direto do gancho aos cantos, ou via balancim */}
      {acessorios.usaBalancim ? (
        <>
          {pontasBalancim.map((p, i) => (
            <Line key={`s${i}`} points={[gancho, p]} color="#8a5a2b" lineWidth={1.5} />
          ))}
          <mesh position={[raioM, yBalancim, 0]}>
            <boxGeometry args={[C, 0.18, 0.18]} />
            <meshStandardMaterial color="#e8d36a" />
          </mesh>
          {cantos.map((c, i) => (
            <Line key={`b${i}`} points={[pontasBalancim[c[0] < raioM ? 0 : 1], c]} color="#8a5a2b" lineWidth={1.5} />
          ))}
        </>
      ) : (
        cantos.map((c, i) => <Line key={i} points={[gancho, c]} color="#8a5a2b" lineWidth={1.5} />)
      )}

      {/* a carga, em escala */}
      <mesh position={[raioM, baseY + A / 2, 0]}>
        <boxGeometry args={[C, A, L]} />
        <meshStandardMaterial color={COR_CARGA} transparent opacity={0.85} />
        <Edges color="#2b3540" />
      </mesh>

      {/* centro de gravidade */}
      <mesh position={posicaoCG}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshBasicMaterial color="#c62828" depthTest={false} />
      </mesh>
      <Html style={SEM_PONTEIRO} position={posicaoCG} center distanceFactor={22} zIndexRange={[20, 0]}>
        <div className="cena-3d__cota cena-3d__cota--cg">CG</div>
      </Html>

      {cenario.alturaIcamentoNecessariaM !== null && (
        <mesh position={[raioM, baseY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[Math.max(6, C + 3), Math.max(6, L + 3)]} />
          <meshBasicMaterial color="#7a3db8" transparent opacity={0.15} depthWrite={false} side={2} />
        </mesh>
      )}
    </group>
  )
}
