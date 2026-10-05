import { Html, Line } from '@react-three/drei'
import { useMemo } from 'react'
import { SEM_PONTEIRO } from './primitivas'

/**
 * Cotas desenhadas na própria cena (Épico 12, RF23) — estilo desenho técnico:
 * linha de cota com traços nas pontas e o valor no meio. Os valores vêm do
 * MOTOR (avaliação do cenário), não da geometria da cena, para que a cota e
 * o resultado nunca divirjam.
 *
 * Coordenadas: referencial LOCAL da superestrutura (Épico 13 — gira junto
 * com ela): centro de giro em X = 0, pé da lança em X = -recuo (RF11), plano
 * de operação Z = 0. O raio de trabalho é medido a partir do centro de giro.
 * (O giro tem a própria cota, no chão — ver AnelDeGiro.tsx.)
 */
const COR_COTA = '#1f5fbf'
const COR_COTA_ICAMENTO = '#7a3db8'

type V3 = [number, number, number]

function fmt(v: number, casas = 2): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

/** Uma cota linear entre dois pontos, com traços perpendiculares nas pontas. */
function CotaLinear({
  de,
  ate,
  texto,
  traco,
  cor = COR_COTA,
  tracejada = false,
  classe,
}: {
  de: V3
  ate: V3
  texto: string
  /** Vetor do traço de extremidade (meio comprimento). */
  traco: V3
  cor?: string
  tracejada?: boolean
  classe?: string
}) {
  const meio = useMemo<V3>(() => [(de[0] + ate[0]) / 2, (de[1] + ate[1]) / 2, (de[2] + ate[2]) / 2], [de, ate])
  const tracoDe = useMemo<V3[]>(
    () => [
      [de[0] - traco[0], de[1] - traco[1], de[2] - traco[2]],
      [de[0] + traco[0], de[1] + traco[1], de[2] + traco[2]],
    ],
    [de, traco],
  )
  const tracoAte = useMemo<V3[]>(
    () => [
      [ate[0] - traco[0], ate[1] - traco[1], ate[2] - traco[2]],
      [ate[0] + traco[0], ate[1] + traco[1], ate[2] + traco[2]],
    ],
    [ate, traco],
  )
  return (
    <group>
      <Line points={[de, ate]} color={cor} lineWidth={1.5} dashed={tracejada} dashSize={0.5} gapSize={0.3} />
      <Line points={tracoDe} color={cor} lineWidth={1.5} />
      <Line points={tracoAte} color={cor} lineWidth={1.5} />
      <Html style={SEM_PONTEIRO} position={meio} center distanceFactor={22} zIndexRange={[20, 0]}>
        <div className={`cena-3d__cota ${classe ?? ''}`}>{texto}</div>
      </Html>
    </group>
  )
}

export function Cotas({
  recuoPeM,
  alturaPeM,
  raioM,
  alturaPontaM,
  anguloGraus,
  alturaIcamentoM,
}: {
  recuoPeM: number
  alturaPeM: number
  raioM: number
  alturaPontaM: number
  anguloGraus: number
  alturaIcamentoM: number | null
}) {
  const xCentroGiro = 0
  const xGancho = raioM
  const xPe = -recuoPeM

  // Os pontos são memoizados por VALOR (não por referência): ver nota da
  // Task 9.2 sobre <Html> reancorando a cada render com arrays literais.
  const raioDe = useMemo<V3>(() => [xCentroGiro, 0.05, 3], [xCentroGiro])
  const raioAte = useMemo<V3>(() => [xGancho, 0.05, 3], [xGancho])
  const tracoHorizontal = useMemo<V3>(() => [0, 0, 0.5], [])

  const xCotaAltura = xGancho + 2
  const alturaDe = useMemo<V3>(() => [xCotaAltura, 0, 0], [xCotaAltura])
  const alturaAte = useMemo<V3>(() => [xCotaAltura, alturaPontaM, 0], [xCotaAltura, alturaPontaM])
  const tracoVertical = useMemo<V3>(() => [0.5, 0, 0], [])

  const icamentoDe = useMemo<V3>(() => [xCentroGiro, alturaIcamentoM ?? 0, 0], [xCentroGiro, alturaIcamentoM])
  const icamentoAte = useMemo<V3>(() => [xGancho + 4, alturaIcamentoM ?? 0, 0], [xGancho, alturaIcamentoM])
  const tracoIcamento = useMemo<V3>(() => [0, 0.4, 0], [])

  const raioArco = 4
  const arco = useMemo<V3[]>(() => {
    const pontos: V3[] = []
    const passos = Math.max(2, Math.ceil(anguloGraus / 3))
    for (let i = 0; i <= passos; i++) {
      const a = ((anguloGraus * i) / passos) * (Math.PI / 180)
      pontos.push([xPe + raioArco * Math.cos(a), alturaPeM + raioArco * Math.sin(a), 0])
    }
    return pontos
  }, [anguloGraus, alturaPeM, xPe])
  const referenciaHorizontal = useMemo<V3[]>(
    () => [
      [xPe, alturaPeM, 0],
      [xPe + raioArco + 1, alturaPeM, 0],
    ],
    [alturaPeM, xPe],
  )
  const metadeAngulo = (anguloGraus / 2) * (Math.PI / 180)
  const posicaoRotuloAngulo = useMemo<V3>(
    () => [xPe + (raioArco + 1.4) * Math.cos(metadeAngulo), alturaPeM + (raioArco + 1.4) * Math.sin(metadeAngulo), 0],
    [metadeAngulo, alturaPeM, xPe],
  )

  return (
    <group>
      <CotaLinear de={raioDe} ate={raioAte} traco={tracoHorizontal} texto={`R = ${fmt(raioM)} m`} classe="cena-3d__cota--raio" />
      <CotaLinear
        de={alturaDe}
        ate={alturaAte}
        traco={tracoVertical}
        texto={`H ponta = ${fmt(alturaPontaM)} m`}
        classe="cena-3d__cota--altura"
      />
      <Line points={referenciaHorizontal} color={COR_COTA} lineWidth={1} dashed dashSize={0.3} gapSize={0.2} />
      <Line points={arco} color={COR_COTA} lineWidth={1.5} />
      <Html style={SEM_PONTEIRO} position={posicaoRotuloAngulo} center distanceFactor={22} zIndexRange={[20, 0]}>
        <div className="cena-3d__cota cena-3d__cota--angulo">α = {fmt(anguloGraus, 1)}°</div>
      </Html>
      {alturaIcamentoM !== null && (
        <CotaLinear
          de={icamentoDe}
          ate={icamentoAte}
          traco={tracoIcamento}
          cor={COR_COTA_ICAMENTO}
          tracejada
          texto={`içamento ${fmt(alturaIcamentoM)} m`}
          classe="cena-3d__cota--icamento"
        />
      )}
    </group>
  )
}
