import { describe, expect, it } from 'vitest'
import { cameraLateral, cameraSuperior } from './camerasDeCaptura'

const base = { raioM: 8, alturaPontaM: 18, raioTraseiroM: 3.016, fovGraus: 42, aspecto: 1.5 }

describe('câmeras das capturas do relatório (Épico 16)', () => {
  it('lateral com giro 0°: olha o plano XY de frente (câmera em +Z, alvo no plano z = 0)', () => {
    const { posicao, alvo } = cameraLateral({ ...base, giroGraus: 0 })
    expect(alvo[2]).toBeCloseTo(0, 9)
    expect(posicao[2]).toBeGreaterThan(20)
    expect(posicao[0]).toBeCloseTo(alvo[0], 9)
  })

  it('lateral com giro 90° (lança para +Z): a câmera gira junto e continua perpendicular à lança', () => {
    const zero = cameraLateral({ ...base, giroGraus: 0 })
    const noventa = cameraLateral({ ...base, giroGraus: 90 })
    // o alvo (meio da lança) passa de +X para +Z
    expect(noventa.alvo[0]).toBeCloseTo(0, 6)
    expect(noventa.alvo[2]).toBeCloseTo(zero.alvo[0], 6)
    // a câmera fica de lado: a direção câmera→alvo é perpendicular à lança (+Z)
    expect(noventa.posicao[2]).toBeCloseTo(noventa.alvo[2], 6)
    expect(Math.abs(noventa.posicao[0])).toBeGreaterThan(20)
  })

  it('superior: centraliza os pontos e fica acima da altura máxima', () => {
    const { posicao, alvo } = cameraSuperior({
      pontosXZ: [
        [-3, -4],
        [10, 4],
        [0, 12],
      ],
      alturaMaximaM: 18,
      fovGraus: 42,
      aspecto: 1.5,
    })
    expect(alvo).toEqual([3.5, 0, 4])
    expect(posicao[1]).toBeGreaterThan(18)
  })
})
