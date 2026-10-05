import { useEffect, useMemo } from 'react'
import { BufferAttribute, BufferGeometry, CanvasTexture, Color, RepeatWrapping } from 'three'
import type { MapaAreaOperacao, StatusNoMapa } from '../../engine/mapaAreaOperacao'

/** Cores do mapa — as mesmas do status no resto da interface (index.css). */
export const CORES_MAPA: Record<Exclude<StatusNoMapa, 'sem_dado' | 'fora_de_alcance'>, string> = {
  ok: '#1e8e3e',
  atencao: '#c77700',
  nok: '#c62828',
}

const Y_MAPA = 0.02

/** Ponto do chão (mundo) para um raio e um giro — mesma convenção de cena/geometriaCena.ts. */
function noChao(raio: number, giroGraus: number): [number, number] {
  const g = (giroGraus * Math.PI) / 180
  return [raio * Math.cos(g), raio * Math.sin(g)]
}

/** Monta os triângulos (setores de coroa) das células com os status pedidos. */
function montarGeometria(mapa: MapaAreaOperacao, incluir: (s: StatusNoMapa) => boolean, comCor: boolean) {
  const posicoes: number[] = []
  const cores: number[] = []
  const uvs: number[] = []
  const cor = new Color()
  mapa.celulas.forEach((linha, i) =>
    linha.forEach((status, j) => {
      if (!incluir(status)) return
      const g0 = mapa.giros[i]
      const g1 = mapa.giros[i + 1]
      const r0 = mapa.raios[j]
      const r1 = mapa.raios[j + 1]
      const cantos = [noChao(r0, g0), noChao(r1, g0), noChao(r1, g1), noChao(r0, g1)]
      for (const k of [0, 1, 2, 0, 2, 3]) {
        const [x, z] = cantos[k]
        posicoes.push(x, Y_MAPA, z)
        // Hachura em coordenadas do mundo: listras contínuas entre células vizinhas.
        uvs.push(x / 1.5, z / 1.5)
        if (comCor) {
          cor.set(CORES_MAPA[status as keyof typeof CORES_MAPA])
          cores.push(cor.r, cor.g, cor.b)
        }
      }
    }),
  )
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(new Float32Array(posicoes), 3))
  geo.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))
  if (comCor) geo.setAttribute('color', new BufferAttribute(new Float32Array(cores), 3))
  geo.computeVertexNormals()
  return geo
}

/** Textura de listras diagonais para "sem dado do fabricante" (cinza hachurado, como no resto da interface). */
function criarHachura(): CanvasTexture {
  const tamanho = 32
  const canvas = document.createElement('canvas')
  canvas.width = tamanho
  canvas.height = tamanho
  const c = canvas.getContext('2d')!
  c.fillStyle = 'rgba(107,118,128,0.25)'
  c.fillRect(0, 0, tamanho, tamanho)
  c.strokeStyle = 'rgba(60,70,80,0.5)'
  c.lineWidth = 4
  for (const d of [-tamanho, 0, tamanho]) {
    c.beginPath()
    c.moveTo(d, tamanho)
    c.lineTo(d + tamanho, 0)
    c.stroke()
  }
  const t = new CanvasTexture(canvas)
  t.wrapS = RepeatWrapping
  t.wrapT = RepeatWrapping
  return t
}

/**
 * Mapa da área de operação desenhado no chão (Épico 14, RF22): verde (OK),
 * âmbar (acima do limite do engenheiro), vermelho (NOK) e cinza hachurado
 * (sem dado do fabricante). O que a lança atual não alcança fica sem cor.
 * O mapa vem pronto do motor (engine/mapaAreaOperacao.ts).
 */
export function MapaNoChao({ mapa }: { mapa: MapaAreaOperacao }) {
  const geometriaCores = useMemo(() => montarGeometria(mapa, (s) => s in CORES_MAPA, true), [mapa])
  const geometriaSemDado = useMemo(() => montarGeometria(mapa, (s) => s === 'sem_dado', false), [mapa])
  const hachura = useMemo(criarHachura, [])

  // Libera a memória de GPU das geometrias antigas a cada recálculo.
  useEffect(() => () => geometriaCores.dispose(), [geometriaCores])
  useEffect(() => () => geometriaSemDado.dispose(), [geometriaSemDado])
  useEffect(() => () => hachura.dispose(), [hachura])

  return (
    <group renderOrder={-1}>
      <mesh geometry={geometriaCores}>
        <meshBasicMaterial vertexColors transparent opacity={0.38} depthWrite={false} side={2} />
      </mesh>
      <mesh geometry={geometriaSemDado}>
        <meshBasicMaterial map={hachura} transparent depthWrite={false} side={2} />
      </mesh>
    </group>
  )
}
